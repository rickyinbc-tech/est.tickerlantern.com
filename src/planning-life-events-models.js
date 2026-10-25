export const lifeEventDefinitions={
  car:{title:'Explore the full cost of owning a car',fields:[
    ['value','Vehicle purchase value before costs (CAD)',35000,5000,150000,1000],['costs','Acquisition taxes and fees (CAD)',4000,0,30000,500],
    ['down','Down payment / total purchase cost (%)',20,0,100,5],['rate','Assumed nominal annual loan rate (%)',6,0,20,.5],
    ['loanYears','Loan repayment term (years)',5,2,8,1],['years','Years you keep the car',5,1,10,1],
    ['depreciation','Annual vehicle-value decline (%)',15,0,35,1],['operating','Initial monthly running costs (CAD)',500,0,3000,50],
    ['inflation','Annual running-cost increase (%)',2,0,10,.5]
  ]},
  deductibles:{title:'Explore premiums, deductibles and cash reserves',fields:[
    ['premiumA','Policy A annual premium (CAD)',1200,0,10000,100],['deductibleA','Policy A per-claim deductible (CAD)',500,0,10000,250],
    ['premiumB','Policy B annual premium (CAD)',900,0,10000,100],['deductibleB','Policy B per-claim deductible (CAD)',1500,0,10000,250],
    ['loss','Covered loss per claim (CAD)',5000,0,50000,500],['claims','Covered claims in the example year',1,0,3,1],
    ['cash','Cash allocated to one claim (CAD)',1000,0,20000,250]
  ]},
  careerBreak:{title:'Explore a planned break from work',fields:[
    ['expenses','Monthly household spending (CAD, net)',4500,0,15000,100],['income','Continuing monthly income (CAD, net)',2500,0,15000,100],
    ['temporary','Temporary monthly income (CAD, net)',1500,0,10000,100],['paidMonths','Months with temporary income',6,0,24,1],
    ['months','Months away from work',12,1,24,1],['upfront','Costs before the first month (CAD)',3000,0,30000,500],
    ['saved','Savings allocated to the break (CAD)',15000,0,150000,1000],['prepareMonths','Months available to prepare',12,1,60,1]
  ]}
};
export function installmentPayment(principal,rate,months){
  const r=rate/1200;return r===0?principal/months:principal*r/-Math.expm1(-months*Math.log1p(r));
}
export function carOwnership(input){
  const purchase=input.value+input.costs,down=purchase*input.down/100,principal=purchase-down,payment=installmentPayment(principal,input.rate,input.loanYears*12),r=input.rate/1200;
  let debt=principal,paid=0,interest=0,running=0;const rows=[{x:0,value:input.value,debt}];
  for(let month=1;month<=input.years*12;month++){
    const charge=debt*r,actual=Math.min(payment,debt+charge);interest+=charge;paid+=actual;debt=Math.max(0,debt+charge-actual);if(debt<1e-6)debt=0;
    running+=input.operating*(1+input.inflation/100)**Math.floor((month-1)/12);
    if(month%12===0)rows.push({x:month/12,value:input.value*(1-input.depreciation/100)**(month/12),debt});
  }
  const end=rows.at(-1),equity=end.value-debt,cost=down+paid+running-equity;
  return {rows,purchase,down,principal,payment,paid,interest,running,end,equity,cost};
}
export function retainedLoss(loss,deductible){return Math.min(loss,deductible);}
export function claimYearCost(premium,deductible,loss,claims){return premium+claims*retainedLoss(loss,deductible);}
export function breakFunding(input){
  let position=-input.upfront;
  const positions=[{x:0,value:position}],budget=[];
  for(let month=1;month<=input.months;month++){
    const income=input.income+(month<=input.paidMonths?input.temporary:0);position+=income-input.expenses;
    positions.push({x:month,value:position});budget.push({x:month,income,expenses:input.expenses});
  }
  const required=Math.max(0,-Math.min(...positions.map(r=>r.value))),gap=Math.max(0,required-input.saved);
  return {positions,budget,required,gap,monthly:gap/input.prepareMonths,temporaryTotal:Math.min(input.months,input.paidMonths)*input.temporary};
}
export function lifeEventResult(kind,input){
  if(kind==='car'){
    const p=carOwnership(input);
    return {metrics:[['Initial monthly cash outflow',p.payment+input.operating,'money'],['Net cost over selected years',p.cost,'money'],['Sale value less remaining loan',p.equity,'money']],note:'Hypothetical financed purchase, not a lease or lender quote. Acquisition taxes and fees are entered separately; down payment applies to the total. Fixed loan rate uses nominal annual rate divided by 12, with month-end payments and no balloon or extra financing charges. Vehicle value declines at a constant annual percentage; running costs rise once a year. Exit assumes sale at modeled value and full repayment of remaining principal, with no sale fees, prepayment costs or taxes at sale. No investment opportunity cost is included.',charts:[
      {id:'car-value-debt',type:'line',title:'The car’s value and the debt follow different paths',unit:'money',xLabel:'Years since purchase',series:[{name:'Modeled vehicle value',rows:p.rows.map(r=>({x:r.x,value:r.value}))},{name:'Loan balance',rows:p.rows.map(r=>({x:r.x,value:r.debt})),dash:true}],note:'The vehicle begins at its purchase value before acquisition taxes and fees. Loan principal may finance those costs. A debt line above the vehicle-value line means negative equity at that date.'},
      {id:'car-monthly',type:'bar',title:'The initial monthly commitment has several parts',unit:'money',rows:[{label:'Scheduled loan payment',value:p.payment},{label:'Initial running-cost budget',value:input.operating}],note:'Add both components for the initial recurring cash requirement; the down payment is separate. Running costs can include fuel or charging, insurance, parking and maintenance. The scheduled loan payment ends when the debt is repaid.'},
      {id:'car-cost',type:'waterfall',title:'Reconcile cash paid with the value recovered at sale',unit:'money',rows:[{label:'Down payment',value:p.down},{label:'Loan payments during ownership',value:p.paid},{label:'Running costs during ownership',value:p.running},{label:'Loan balance repaid at sale',value:p.end.debt},{label:'Vehicle sale proceeds',value:-p.end.value}],totalLabel:'Net ownership cost',note:'Remaining debt is paid from sale proceeds or other cash. The endpoint equals purchase value lost plus acquisition costs, loan interest and running costs. Do not add depreciation again to this cash-flow reconciliation.'},
      {id:'car-matrix',type:'heatmap',title:'Rate and loan term change the cost at your exit date',unit:'money',columns:[3,5,7,8].map(y=>y+' years'),rows:[0,4,8,12].map(rate=>({label:rate+'% rate',values:[3,5,7,8].map(loanYears=>carOwnership({...input,rate,loanYears}).cost)})),note:'Each cell uses the selected ownership horizon and the displayed loan assumptions. Remaining debt is settled at that horizon even if the loan term is longer. These are total modeled ownership costs, not monthly payments or loan offers.'}
    ]};
  }
  if(kind==='deductibles'){
    const ownA=retainedLoss(input.loss,input.deductibleA),ownB=retainedLoss(input.loss,input.deductibleB);
    const losses=[...new Set([0,input.deductibleA,input.deductibleB,input.loss,10000])].sort((a,b)=>a-b);
    return {metrics:[['Annual household cost · A',claimYearCost(input.premiumA,input.deductibleA,input.loss,input.claims),'money'],['Annual household cost · B',claimYearCost(input.premiumB,input.deductibleB,input.loss,input.claims),'money'],['One-claim reserve gap · B',Math.max(0,ownB-input.cash),'money']],note:'Hypothetical policies with identical otherwise-unlimited coverage for the entered eligible loss. Deductible applies separately to each claim; the household pays the smaller of covered loss and deductible. Annual cost metrics use the selected claim count and include premiums plus retained losses. No exclusions, policy limits, co-insurance, annual deductible aggregation, premium changes after claims, settlement delay or claim probabilities are modeled. Premiums and deductibles are assumptions, not quotations or coverage recommendations.',charts:[
      {id:'deductible-loss',type:'line',title:'The household share rises until the deductible is reached',unit:'money',xUnit:'money',xLabel:'Eligible loss per claim (CAD)',series:[{name:'Policy A household share',rows:losses.map(x=>({x,value:retainedLoss(x,input.deductibleA)}))},{name:'Policy B household share',rows:losses.map(x=>({x,value:retainedLoss(x,input.deductibleB)})),dash:true}],note:'A loss below the deductible is paid entirely by the household in this simplified model. The curve does not estimate whether a real loss is covered or when an insurer would pay.'},
      {id:'deductible-year',type:'groupbar',title:'Annual cost depends on how many covered claims occur',unit:'money',seriesNames:['Policy A','Policy B'],rows:[0,1,2,3].map(claims=>({label:claims+' covered claim'+(claims===1?'':'s'),values:[claimYearCost(input.premiumA,input.deductibleA,input.loss,claims),claimYearCost(input.premiumB,input.deductibleB,input.loss,claims)]})),note:'Each claim has the selected loss amount. Premium plus household retained loss is the annual cost shown. The claim counts are separate realized scenarios, without probabilities.'},
      {id:'deductible-split',type:'stackbar',title:'Who pays the selected covered loss?',unit:'money',seriesNames:['Household share','Assumed insurer share'],rows:[{label:'Policy A',values:[ownA,input.loss-ownA]},{label:'Policy B',values:[ownB,input.loss-ownB]}],note:'Both bars sum to the same eligible loss. Premiums are excluded from this per-claim split and included in the annual comparison above. Actual policy limits and settlement conditions can change the insurer’s share.'},
      {id:'deductible-matrix',type:'heatmap',title:'Policy B minus A: annual household-cost difference',unit:'money',signed:true,columns:['$500','$1.5k','$5k','$10k'],rows:[0,1,2,3].map(claims=>({label:claims+' claim'+(claims===1?'':'s'),values:[500,1500,5000,10000].map(loss=>claimYearCost(input.premiumB,input.deductibleB,loss,claims)-claimYearCost(input.premiumA,input.deductibleA,loss,claims))})),note:'Columns are eligible loss amounts for each claim. Negative values mean B costs less in that scenario; positive values mean B costs more. Current selected loss and claim count do not change the fixed matrix alternatives. No likelihood is implied.'}
    ]};
  }
  if(kind==='careerBreak'){
    const p=breakFunding(input),balance=capital=>p.positions.map(r=>({x:r.x,value:capital+r.value}));
    return {metrics:[['Starting fund required',p.required,'money'],['Additional saving needed',p.gap,'money'],['Monthly saving before the break',p.monthly,'money']],note:'Hypothetical planned absence beginning today after a preparation phase. All monthly spending and income inputs are net cash amounts. Upfront costs occur before month 1; income and spending occur at month-end. Temporary income ends after the entered number of months, even if the absence continues. No interest, inflation, program entitlement, pension accrual, job protection, employer conditions or extra return-to-work costs are calculated. This is not an EI, QPIP or employer-benefit estimator.',charts:[
      {id:'break-budget',type:'line',title:'Follow income when temporary payments end',unit:'money',xLabel:'Month away from work',series:[{name:'Net household income',step:true,rows:p.budget.map(r=>({x:r.x,value:r.income}))},{name:'Household spending',rows:p.budget.map(r=>({x:r.x,value:r.expenses})),dash:true}],note:'Continuing income remains in every month; temporary income is added only during its selected duration. Income is assumed received as scheduled. Actual benefit and payroll dates require their own calendar.'},
      {id:'break-reserve',type:'line',title:'Compare allocated cash with the fund needed at every date',unit:'money',xLabel:'Months after the break begins',series:[{name:'Currently allocated savings',rows:balance(input.saved)},{name:'Fully funded starting reserve',rows:balance(p.required),dash:true}],note:'At month 0 the upfront costs have already been paid. A negative balance represents unfunded spending, not approved borrowing. The required reserve covers the worst cumulative position, which may occur before the final month.'},
      {id:'break-bridge',type:'waterfall',title:'Reconcile the full period’s net funding position',unit:'money',rows:[{label:'Upfront costs',value:input.upfront},{label:'Household spending during break',value:input.expenses*input.months},{label:'Continuing household income',value:-input.income*input.months},{label:'Temporary income received',value:-p.temporaryTotal},{label:'Allocated savings',value:-input.saved}],totalLabel:'End-period shortfall / surplus',note:'Positive means a net end-period shortfall; negative means a surplus. This reconciliation does not replace the month-by-month check: later income cannot fund an earlier payment without a bridge.'},
      {id:'break-matrix',type:'heatmap',title:'The additional fund across duration and temporary income',unit:'money',columns:[6,12,18,24].map(months=>months+' months'),rows:[0,1000,2000,3000].map(temporary=>({label:'$'+temporary/1000+'k/mo',values:[6,12,18,24].map(months=>breakFunding({...input,temporary,months}).gap)})),note:'Each cell reruns the timing model with a different absence length and temporary monthly income. The selected duration of temporary payments is held fixed. These income amounts do not represent program rates, eligibility or available employer offers.'}
    ]};
  }
  throw Error('Unknown life-event planning topic.');
}
