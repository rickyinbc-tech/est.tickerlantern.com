import { installmentPayment } from './planning-life-events-models.js';
export const incomeCreditDefinitions={
  employerMatch:{title:'Explore an employer contribution match',fields:[
    ['salary','First-year eligible annual pay (CAD)',60000,0,300000,5000],['employee','Employee contribution / pay (%)',6,0,15,.5],
    ['match','Employer match / eligible contribution (%)',50,0,100,5],['cap','Eligible employee contribution cap (% of pay)',6,0,10,.5],
    ['years','Years contributing',20,1,40,1],['rate','Assumed annual return (%)',4,-5,10,.5],['growth','Annual eligible-pay increase (%)',2,0,5,.5]
  ]},
  consolidation:{title:'Explore debt consolidation and repayment length',fields:[
    ['balanceA','Debt A balance (CAD)',12000,0,100000,1000],['rateA','Debt A nominal annual rate (%)',18,0,30,.5],
    ['balanceB','Debt B balance (CAD)',8000,0,100000,1000],['rateB','Debt B nominal annual rate (%)',12,0,30,.5],
    ['currentYears','Current remaining repayment years',2,1,7,1],['newRate','Proposed nominal annual rate (%)',10,0,30,.5],
    ['newYears','Proposed repayment years',5,1,7,1],['fee','Setup fee financed into new loan (CAD)',300,0,5000,100]
  ]},
  variableIncome:{title:'Explore a buffer for variable income',fields:[
    ['annual','Annual income available to household (CAD, net)',60000,0,240000,5000],['spending','Monthly household spending (CAD)',4000,0,15000,100],
    ['goals','Monthly transfers to other goals (CAD)',500,0,5000,100],['drop','Low-month income reduction from average (%)',50,0,100,5],
    ['lowMonths','Number of low-income months',6,0,11,1],['buffer','Starting income-smoothing cash (CAD)',10000,0,100000,1000]
  ]}
};
export function annualMatch(salary,employee,match,cap){return salary*Math.min(employee,cap)/100*match/100;}
export function employerSavings(input){
  const r=Math.expm1(Math.log1p(input.rate/100)/12);let own=0,employer=0,ownPaid=0,employerPaid=0;
  const rows=[{x:0,own,employer,total:0}];
  for(let month=1;month<=input.years*12;month++){
    const salary=input.salary*(1+input.growth/100)**Math.floor((month-1)/12),employee=salary*input.employee/1200,matched=annualMatch(salary,input.employee,input.match,input.cap)/12;
    own=own*(1+r)+employee;employer=employer*(1+r)+matched;ownPaid+=employee;employerPaid+=matched;
    if(month%12===0)rows.push({x:month/12,own,employer,total:own+employer});
  }
  return {rows,own,employer,total:own+employer,ownPaid,employerPaid};
}
export function fixedLoan(balance,rate,years){
  const payment=installmentPayment(balance,rate,years*12),r=rate/1200;let debt=balance,interest=0,paid=0;
  const rows=[{x:0,value:debt}];
  for(let month=1;month<=years*12;month++){
    const charge=debt*r,actual=Math.min(payment,debt+charge);interest+=charge;paid+=actual;debt=Math.max(0,debt+charge-actual);if(debt<1e-6)debt=0;
    rows.push({x:month,value:debt});
  }
  return {rows,payment,interest,paid};
}
export function consolidationPlan(input){
  const principal=input.balanceA+input.balanceB,fee=principal>0?input.fee:0;
  const a=fixedLoan(input.balanceA,input.rateA,input.currentYears),b=fixedLoan(input.balanceB,input.rateB,input.currentYears),combined=fixedLoan(principal+fee,input.newRate,input.newYears);
  const months=Math.max(input.currentYears,input.newYears)*12,at=(loan,month)=>loan.rows[Math.min(month,loan.rows.length-1)].value;
  const oldRows=Array.from({length:months+1},(_,x)=>({x,value:at(a,x)+at(b,x)})),newRows=Array.from({length:months+1},(_,x)=>({x,value:at(combined,x)}));
  return {principal,fee,a,b,combined,oldRows,newRows,currentPayment:a.payment+b.payment,currentCost:a.interest+b.interest,newCost:combined.interest+fee};
}
export function incomeProfiles(input){
  const average=input.annual/12,low=average*(1-input.drop/100),high=(input.annual-input.lowMonths*low)/(12-input.lowMonths);
  return [
    {name:'Even monthly income',values:Array(12).fill(average)},
    {name:'Low-income months first',values:Array.from({length:12},(_,i)=>i<input.lowMonths?low:high)},
    {name:'High-income months first',values:Array.from({length:12},(_,i)=>i<12-input.lowMonths?high:low)}
  ];
}
export function incomeReserve(input,values){
  let position=0;const positions=[0];for(const income of values){position+=income-input.spending-input.goals;positions.push(position);}
  const required=Math.max(0,-Math.min(...positions));
  return {rows:positions.map((value,x)=>({x,value:value+input.buffer})),required,gap:Math.max(0,required-input.buffer),ending:position+input.buffer};
}
export function incomeCreditResult(kind,input){
  if(kind==='employerMatch'){
    const p=employerSavings(input),points=[...new Set([0,2,4,6,8,10,15,input.cap,input.employee])].sort((a,b)=>a-b);
    return {metrics:[['First-year employee contribution',input.salary*input.employee/100,'money'],['First-year employer contribution',annualMatch(input.salary,input.employee,input.match,input.cap),'money'],['Modeled total ending balance',p.total,'money']],note:'Hypothetical matching formula: employer pays the selected percentage of employee contributions, up to the selected eligible-pay cap. Both deposits arrive at month-end and earn the same constant effective annual return. Eligible pay rises once a year. Sufficient contribution room and full entitlement to modeled employer deposits are assumed. Nominal CAD before tax, fees and inflation. No plan eligibility, vesting, withdrawal, locking-in, pension-income promise or tax adjustment is calculated.',charts:[
      {id:'match-formula',type:'line',title:'The match increases until the eligible contribution cap',unit:'money',xLabel:'Employee contribution (% of eligible pay)',series:[{name:'First-year employer deposit',rows:points.map(x=>({x,value:annualMatch(input.salary,x,input.match,input.cap)}))}],note:'The match rate applies to eligible employee contributions, not to the full salary. Contributions above the cap still add personal savings in this model but receive no additional match.'},
      {id:'match-path',type:'line',title:'The same employee saving, with and without the match',unit:'money',xLabel:'Years contributing',series:[{name:'Employee plus employer deposits',rows:p.rows.map(r=>({x:r.x,value:r.total}))},{name:'Employee deposits alone',rows:p.rows.map(r=>({x:r.x,value:r.own})),dash:true}],note:'Personal contribution rate, pay growth and return are identical in both paths. The difference comes from employer-funded deposits and the modeled return on those deposits; it is not an investment-performance comparison.'},
      {id:'match-bridge',type:'waterfall',title:'Separate contributions from modeled investment growth',unit:'money',rows:[{label:'Employee contributions',value:p.ownPaid},{label:'Employer contributions',value:p.employerPaid},{label:'Modeled investment growth / loss',value:p.total-p.ownPaid-p.employerPaid}],totalLabel:'Total ending balance',note:'Contributions are summed across their actual modeled years. The growth step can be negative. Employer funding is a contribution, rather than an annualized investment return or cash automatically available for withdrawal.'},
      {id:'match-matrix',type:'heatmap',title:'First-year employer deposits under other contribution rates',unit:'money',columns:[2,4,6,8].map(x=>x+'% pay'),rows:[25,50,75,100].map(match=>({label:match+'% match',values:[2,4,6,8].map(employee=>annualMatch(input.salary,employee,match,input.cap))})),note:'Columns change the employee contribution rate; rows change the employer matching percentage. The selected eligible-pay cap remains in force. First-year annual deposits only: return, horizon and pay growth do not affect these cells. No actual employer offer is implied.'}
    ]};
  }
  if(kind==='consolidation'){
    const p=consolidationPlan(input);
    return {metrics:[['Current combined monthly payment',p.currentPayment,'money'],['Proposed monthly payment',p.combined.payment,'money'],['Change in borrowing cost',p.newCost-p.currentCost,'money']],note:'Hypothetical fixed fully amortizing loans. Both current debts use the selected remaining years; the proposed loan refinances their principal plus its setup fee. Rates are nominal annual rates divided by 12, with month-end payments. Borrowing cost means interest plus the financed setup fee, excluding original debt principal. No new spending, prepayment charges, insurance, promotional periods, rate changes, approval criteria or investment of payment savings is modeled. With zero debt, no new loan or setup fee is assumed.',charts:[
      {id:'consolidation-payment',type:'bar',title:'The monthly payment can fall when repayment is extended',unit:'money',rows:[{label:'Current loans · combined',value:p.currentPayment},{label:'Proposed consolidation loan',value:p.combined.payment}],note:'Scheduled monthly amounts while each arrangement is active. A smaller payment releases near-term cash flow but does not establish a smaller total borrowing cost.'},
      {id:'consolidation-balance',type:'line',title:'Compare when the debt actually reaches zero',unit:'money',xLabel:'Months from today',series:[{name:'Current debts combined',rows:p.oldRows},{name:'Proposed loan',rows:p.newRows,dash:true}],note:'Current loans begin with the original principal. The proposed loan also finances the setup fee. After a loan is repaid, its plotted balance stays at zero; payments are not assumed to continue or to be invested elsewhere.'},
      {id:'consolidation-cost',type:'stackbar',title:'Compare interest and fees across the full repayment schedules',unit:'money',seriesNames:['Interest','Financed setup fee'],rows:[{label:'Current loans',values:[p.currentCost,0]},{label:'Proposed loan',values:[p.combined.interest,p.fee]}],note:'These bars exclude the original principal that must be repaid in either case. Interest on the financed fee is already in proposed-loan interest, while the fee principal appears separately once.'},
      {id:'consolidation-matrix',type:'heatmap',title:'Proposed borrowing cost across rate and term',unit:'money',columns:[2,3,5,7].map(y=>y+' years'),rows:[6,10,14,18].map(newRate=>({label:newRate+'% rate',values:[2,3,5,7].map(newYears=>consolidationPlan({...input,newRate,newYears}).newCost)})),note:'Each cell is full-life interest plus the financed setup fee at the displayed new-loan assumptions. Original principal and fee amount stay fixed. The cells are calculations, not available rates or approval outcomes.'}
    ]};
  }
  if(kind==='variableIncome'){
    const profiles=incomeProfiles(input),paths=profiles.map(p=>incomeReserve(input,p.values)),low=paths[1];
    return {metrics:[['Starting cash needed · low months first',low.required,'money'],['Additional buffer needed',low.gap,'money'],['Year-end cash position · all profiles',low.ending,'money']],note:'Hypothetical twelve-month income schedules with identical annual net household income. Low months receive the selected percentage reduction from the annual monthly average; other months are solved to preserve the annual total. All receipts, spending and goal transfers occur at month-end. Goal transfers leave this buffer but remain household assets elsewhere. No interest, income uncertainty, tax estimation, business expenses, payment delays or intra-month bill timing is modeled.',charts:[
      {id:'income-patterns',type:'line',title:'The same annual income can arrive on different dates',unit:'money',xLabel:'Month of the example year',series:profiles.map((p,i)=>({name:p.name,rows:p.values.map((value,j)=>({x:j+1,value})),dash:i===1,step:true})),note:'The low-first and high-first cases reorder the same twelve income amounts. The even case spreads the same total equally. These are deterministic schedules, not a probability distribution or an estimate of future earnings.'},
      {id:'income-buffer',type:'line',title:'The available cash path depends on income timing',unit:'money',xLabel:'Month of the example year',series:paths.map((p,i)=>({name:profiles[i].name,rows:p.rows,dash:i===1})),note:'Every profile uses the same starting buffer, spending and goal transfers. A negative balance means a cash-flow shortfall. All endpoints coincide because annual income and total cash outflows are identical.'},
      {id:'income-starting-cash',type:'bar',title:'The starting buffer needed to avoid a month-end shortage',unit:'money',rows:paths.map((p,i)=>({label:profiles[i].name,value:p.required})),note:'Minimum starting cash for the selected schedule, before counting the selected existing buffer. This timing requirement is separate from a reserve for unrelated unexpected events.'},
      {id:'income-matrix',type:'heatmap',title:'Additional cash across deeper or longer low-income periods',unit:'money',columns:[3,6,9,11].map(m=>m+' mo'),rows:[25,50,75,100].map(drop=>({label:drop+'% drop',values:[3,6,9,11].map(lowMonths=>{const scenario={...input,drop,lowMonths};return incomeReserve(scenario,incomeProfiles(scenario)[1].values).gap;})})),note:'Columns are low-income months occurring first; rows are their reduction from average monthly income. Each scenario raises the remaining months’ receipts to hold annual income fixed. Cells show the additional buffer after selected starting cash, not an income forecast.'}
    ]};
  }
  throw Error('Unknown income or credit planning topic.');
}
