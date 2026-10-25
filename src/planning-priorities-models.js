export const rrifRules={reviewed:'2026-10-25',url:'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/completing-slips-summaries/t4rsp-t4rif-information-returns/payments/chart-prescribed-factors.html',regulation:'https://laws-lois.justice.gc.ca/eng/regulations/c.r.c.,_c._945/section-7308.html',factors:[.0528,.0540,.0553,.0567,.0582,.0598,.0617,.0636,.0658,.0682,.0708,.0738,.0771,.0808,.0851,.0899,.0955,.1021,.1099,.1192,.1306,.1449,.1634,.1879,.2000]};
export const priorityDefinitions={
  debtOrder:{title:'Explore repayment order with one fixed debt budget',fields:[
    ['balanceA','Debt A starting balance (CAD)',5000,0,100000,500],['rateA','Debt A nominal annual rate (%)',20,0,36,.5],['baseA','Illustrative base payment A (CAD/month)',125,0,2000,25],
    ['balanceB','Debt B starting balance (CAD)',1000,0,100000,500],['rateB','Debt B nominal annual rate (%)',10,0,36,.5],['baseB','Illustrative base payment B (CAD/month)',50,0,2000,25],
    ['balanceC','Debt C starting balance (CAD)',8000,0,100000,500],['rateC','Debt C nominal annual rate (%)',8,0,36,.5],['baseC','Illustrative base payment C (CAD/month)',160,0,2000,10],
    ['extra','Extra monthly amount above initial base payments (CAD)',300,0,3000,50]
  ]},
  multipleGoals:{title:'Explore three goals sharing one monthly budget',fields:[
    ['goalA','Remaining amount to raise for goal A (CAD)',6000,0,100000,1000],['deadlineA','Goal A deadline (month from now)',12,1,120,1],
    ['goalB','Remaining amount to raise for goal B (CAD)',18000,0,100000,1000],['deadlineB','Goal B deadline (month from now)',36,1,120,1],
    ['goalC','Remaining amount to raise for goal C (CAD)',12000,0,100000,1000],['deadlineC','Goal C deadline (month from now)',24,1,120,1],
    ['budget','Shared month-end saving budget (CAD)',900,0,10000,100]
  ]},
  rrifSpending:{title:'Explore one year of RRIF withdrawals and spending',fields:[
    ['balance','RRIF fair market value at start of year (CAD)',500000,0,2000000,10000],['age','Annuitant’s whole age at start of year',72,55,100,1],
    ['requested','Requested gross withdrawal for the year (CAD)',30000,0,500000,1000],['taxAllowance','Assumed budget allowance / gross withdrawal (%)',25,0,50,1],
    ['spending','Net spending assigned to this RRIF cash (CAD/year)',18000,0,100000,1000]
  ]}
};
export function orderedDebt(input,strategy){
  const debts=['A','B','C'].map((name,index)=>({name,index,initial:input['balance'+name],balance:input['balance'+name],rate:input['rate'+name],base:input['base'+name]}));
  const principal=debts.reduce((s,d)=>s+d.balance,0),budget=principal>0?debts.reduce((s,d)=>s+(d.initial>0?d.base:0),input.extra):0;
  let interest=0,paid=0;const rows=[{x:0,value:principal,balances:debts.map(d=>d.balance)}];
  if(!principal)return {rows,principal,budget,interest,paid,months:0,complete:true};
  for(let month=1;month<=120;month++){
    for(const d of debts){const charge=d.balance*d.rate/1200;d.balance+=charge;interest+=charge;}
    let available=budget;
    for(const d of debts){const amount=Math.min(d.balance,d.base);d.balance-=amount;available-=amount;paid+=amount;}
    const active=debts.filter(d=>d.balance>1e-8).sort((a,b)=>strategy==='avalanche'?b.rate-a.rate||a.balance-b.balance||a.index-b.index:a.balance-b.balance||b.rate-a.rate||a.index-b.index);
    for(const d of active){const amount=Math.min(d.balance,Math.max(0,available));d.balance-=amount;available-=amount;paid+=amount;}
    for(const d of debts)if(d.balance<1e-7)d.balance=0;
    const total=debts.reduce((s,d)=>s+d.balance,0);rows.push({x:month,value:total,balances:debts.map(d=>d.balance)});
    if(!total)return {rows,principal,budget,interest,paid,months:month,complete:true};
  }
  return {rows,principal,budget,interest,paid,months:null,complete:false};
}
export function goalList(input){return ['A','B','C'].map((name,index)=>({name,index,target:input['goal'+name],deadline:input['deadline'+name]}));}
export function minimumGoalBudget(input){
  const goals=goalList(input);return Math.max(0,...goals.map(g=>goals.filter(other=>other.deadline<=g.deadline).reduce((s,other)=>s+other.target,0)/g.deadline));
}
export function goalAllocation(input,strategy){
  const goals=goalList(input).map(g=>({...g,funded:0})),horizon=Math.max(...goals.map(g=>g.deadline));
  let unallocated=0;const rows=[{x:0,value:0,unallocated:0}];
  for(let month=1;month<=horizon;month++){
    let available=input.budget,active=goals.filter(g=>g.deadline>=month&&g.target-g.funded>1e-7);
    if(strategy==='deadline'){
      active.sort((a,b)=>a.deadline-b.deadline||a.index-b.index);
      for(const g of active){const amount=Math.min(g.target-g.funded,available);g.funded+=amount;available-=amount;}
    }else{
      while(available>1e-7&&active.length){
        const share=available/active.length;
        for(const g of active){const amount=Math.min(g.target-g.funded,share);g.funded+=amount;available-=amount;}
        active=active.filter(g=>g.target-g.funded>1e-7);
      }
    }
    unallocated+=Math.max(0,available);rows.push({x:month,value:goals.reduce((s,g)=>s+g.funded,0),unallocated});
  }
  return {goals,rows,unallocated,shortfall:goals.reduce((s,g)=>s+Math.max(0,g.target-g.funded),0),horizon};
}
export function rrifFactor(age){return age<=70?1/(90-age):rrifRules.factors[Math.min(age,95)-71];}
export function rrifCash(input){
  const factor=rrifFactor(input.age),minimum=input.balance*factor,gross=Math.min(input.balance,Math.max(minimum,input.requested)),allowance=gross*input.taxAllowance/100;
  return {factor,minimum,gross,allowance,net:gross-allowance,surplus:gross-allowance-input.spending,remaining:input.balance-gross};
}
export function priorityResult(kind,input){
  if(kind==='debtOrder'){
    const a=orderedDebt(input,'avalanche'),s=orderedDebt(input,'snowball'),horizon=Math.max(a.rows.length,s.rows.length)-1;
    const path=p=>Array.from({length:horizon+1},(_,x)=>({x,value:p.rows[Math.min(x,p.rows.length-1)].value}));
    return {metrics:[['Fixed monthly debt budget',a.budget,'money'],['Months · highest rate first',a.months,'months'],['Months · smallest balance first',s.months,'months']],note:'Hypothetical three-debt schedules. Interest is charged monthly at nominal annual rate / 12 before month-end payments. Each active debt first receives its entered fixed base payment, capped at amount owed. The initial active base payments plus extra form one fixed household budget; released or unused base payments roll to the priority debt in the same month. Highest-rate order breaks ties by balance; smallest-balance order uses balances after base payments and breaks ties by rate, then debt letter. Zero starting debts receive no budget allocation. No fees, new borrowing, changing rates, contractual minimum-payment formula, arrears or credit-score effects are modeled. Not repaid means not cleared within 120 months; interest for an incomplete schedule is partial.',charts:[
      {id:'order-start',type:'bar',title:'The smallest balance and the highest rate can be different debts',unit:'money',rows:['A','B','C'].map(name=>({label:'Debt '+name+' · '+input['rate'+name]+'% nominal rate',value:input['balance'+name]})),note:'All strategies start with the same three balances and rates. The rates in the labels are nominal annual assumptions, not monthly rates or lender quotations. Base payments are illustrative inputs and must not replace actual contractual minimums.'},
      {id:'order-balance',type:'line',title:'Keep the same total budget while changing the priority',unit:'money',xLabel:'Months since the first payment cycle',series:[{name:'Highest rate first',rows:path(a)},{name:'Smallest balance first',rows:path(s),dash:true}],note:'Once a strategy clears all debts, its line remains at zero through the longer comparison path. Any subsequent unused budget is not invested. A rising balance means payments do not cover the modeled interest; no debt forgiveness or financing limit is assumed.'},
      {id:'order-interest',type:'bar',title:'Compare interest charged within each shown schedule',unit:'money',rows:[{label:'Highest rate first'+(a.complete?' · repaid':' · 120 months only'),value:a.interest},{label:'Smallest balance first'+(s.complete?' · repaid':' · 120 months only'),value:s.interest}],note:'Interest charged is separate from original principal. If a schedule is incomplete, its amount covers only 120 months and is not a full repayment cost. Totals use each strategy’s complete schedule when available, otherwise the stated limit.'},
      {id:'order-matrix',type:'heatmap',title:'Highest-rate-first interest under other extra payments and rates',unit:'money',columns:['+$0','+$100','+$300','+$600'],rows:[8,12,20,28].map(rateA=>({label:'A '+rateA+'%',values:[0,100,300,600].map(extra=>{const p=orderedDebt({...input,rateA,extra},'avalanche');return p.complete?p.interest:null;})})),note:'Rows change only debt A’s rate; columns change the extra amount above initial active base payments. Other balances, rates and base payments remain selected. NR means not repaid within 120 months, so full-life interest is not reported for that cell.'}
    ]};
  }
  if(kind==='multipleGoals'){
    const d=goalAllocation(input,'deadline'),e=goalAllocation(input,'equal'),goals=goalList(input);
    const obligations=Array.from({length:d.horizon+1},(_,x)=>({x,value:goals.filter(g=>g.deadline<=x).reduce((s,g)=>s+g.target,0)}));
    return {metrics:[['Minimum constant budget for deadline-first funding',minimumGoalBudget(input),'money'],['Unfunded by deadlines · deadline first',d.shortfall,'money'],['Unfunded by deadlines · equal shares',e.shortfall,'money']],note:'Hypothetical remaining nominal CAD targets with no opening earmarked balances, interest, inflation or account restrictions. One shared contribution arrives at each month-end, including a deadline month. Deadline-first funding fills the earliest unfinished goal and spills to the next; equal shares divide each month among all active unfinished goals and redistribute capped shares. Tied deadlines use goal letter. A goal freezes after its deadline and receives no later contribution. Funding earmarks money; actual purchases are not modeled. Unused budget is tracked separately, not assigned twice. These mechanical rules do not rank the personal importance of goals.',charts:[
      {id:'goals-obligations',type:'line',title:'Compare cumulative amounts due with cumulative saving capacity',unit:'money',xLabel:'Month from the starting date',series:[{name:'Cumulative goal amounts due',rows:obligations,step:true},{name:'Cumulative shared budget if retained',rows:obligations.map(r=>({x:r.x,value:input.budget*r.x})),dash:true}],note:'The obligation line steps up at each deadline. This is cumulative funding, not a cash-account balance after purchases. Having enough capacity by the final date does not by itself prove every earlier deadline is covered.'},
      {id:'goals-deadlines',type:'groupbar',title:'Read the amount funded by each goal’s own deadline',unit:'money',seriesNames:['Remaining target','Deadline-first funding','Equal shares with rollover'],rows:goals.map((g,i)=>({label:'Goal '+g.name+' · due month '+g.deadline,values:[g.target,d.goals[i].funded,e.goals[i].funded]})),note:'Each strategy has the same monthly budget and targets. Shares cap at the amount needed, with excess redistributed within that month. A missed deadline remains missed even if cash becomes unallocated later.'},
      {id:'goals-raised',type:'line',title:'The allocation rule can leave a different amount earmarked in time',unit:'money',xLabel:'Month from the starting date',series:[{name:'Cumulative deadline-first funding',rows:d.rows},{name:'Cumulative equal-share funding',rows:e.rows,dash:true}],note:'All funded amounts are committed once to a goal. After a deadline, that goal’s recorded funding is frozen. Monthly capacity left after all still-active goals are filled remains unallocated and is excluded from these lines; it cannot retrospectively repair a missed date.'},
      {id:'goals-matrix',type:'heatmap',title:'Deadline-first shortfalls across budgets and compressed schedules',unit:'money',columns:['$500/mo','$900/mo','$1k/mo','$1.5k/mo'],rows:[.5,.75,1,1.25].map(scale=>({label:Math.round(scale*100)+'% time',values:[500,900,1000,1500].map(budget=>goalAllocation({...input,budget,...Object.fromEntries(['A','B','C'].map(name=>['deadline'+name,Math.max(1,Math.round(input['deadline'+name]*scale))]))},'deadline').shortfall)})),note:'Rows scale every selected deadline, rounding to whole months with a one-month minimum; columns provide their own fixed budgets. Goal amounts are unchanged. Cells total shortfalls at each goal’s deadline, not a probability of success or a recommended monthly contribution.'}
    ]};
  }
  if(kind==='rrifSpending'){
    const p=rrifCash(input);
    return {metrics:[['Minimum for the illustrated year',p.minimum,'money'],['Modeled gross withdrawal',p.gross,'money'],['Cash after allowance and assigned spending',p.surplus,'money']],note:'Single-year ordinary RRIF illustration using the All other RRIFs factors reviewed 25 October 2026. RRIF exists before the year begins; annuitant’s whole age at year-start is used, with no spouse-age election, legacy qualifying/pre-1986 treatment or locked-in annuity contract. Minimum = start-of-year fair market value × prescribed factor. Modeled gross withdrawal is the larger of that minimum and the request, capped at the entered balance; no in-year asset-value change is modeled. The selected percentage is only a budget allowance, not prescribed withholding or final tax. No actual tax, benefit interaction, pension splitting, locked-in plan limits or lifetime sustainability is calculated. Negative remaining cash means assigned spending needs another source.',charts:[
      {id:'rrif-factors',type:'line',title:'The prescribed factor is an age-based minimum rule',unit:'percent',unitLabel:'All other RRIFs · prescribed annual factor (%)',xMin:55,xLabel:'Whole age at the beginning of the year',evidence:'Federal RRIF rules · reviewed October 2026',source:rrifRules.url,sourceLabel:'CRA · All other RRIFs factor column',series:[{name:'Prescribed factor',step:true,rows:Array.from({length:46},(_,i)=>({x:i+55,value:rrifFactor(i+55)}))}],note:'Under age 71 the factor is 1 / (90 − age). The table supplies ages 71–94, with 20% at 95 and older. This graphic applies only to the stated ordinary case and does not show an investment return or a recommended spending rate.'},
      {id:'rrif-amounts',type:'bar',title:'Compare the minimum, the request and the modeled withdrawal',unit:'money',rows:[{label:'Rule-based minimum',value:p.minimum},{label:'Entered gross withdrawal request',value:input.requested},{label:'Modeled gross withdrawal',value:p.gross}],note:'The model lifts a request below the minimum and caps a request above the entered asset balance. This is an educational convention, not a carrier instruction, verification of account liquidity or calculation for a newly established RRIF.'},
      {id:'rrif-spending',type:'waterfall',title:'A required withdrawal and a spending need measure different things',unit:'money',rows:[{label:'Modeled gross RRIF withdrawal',value:p.gross},{label:'Assumed budget allowance',value:-p.allowance},{label:'Assigned net spending',value:-input.spending}],totalLabel:'Cash left / extra funding needed',note:'The allowance is deliberately separate from tax law: it does not calculate withholding, final income tax or a refund. Positive cash remains unassigned in this one-year ledger; no reinvestment or consumption is assumed. Negative cash is a funding gap, not an account overdraft.'},
      {id:'rrif-matrix',type:'heatmap',title:'Cash left across ages and assigned spending amounts',unit:'money',signed:true,columns:['Age 65','Age 72','Age 80','Age 90'],rows:[10000,20000,30000,40000].map(spending=>({label:'$'+spending/1000+'k',values:[65,72,80,90].map(age=>rrifCash({...input,age,spending}).surplus)})),note:'Columns change the year-start age used for the ordinary factor; rows are annual net spending assigned to this cash. Opening assets, gross request and assumed allowance percentage remain selected. Positive values are unassigned cash; negative values require another source. These are single-year scenarios, not forecasts of future tax rules or RRIF balances.'}
    ]};
  }
  throw Error('Unknown priorities planning topic.');
}
