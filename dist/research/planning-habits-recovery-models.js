// Original educational scenarios. No issuer terms, salary forecasts or event probabilities.
export const habitsRecoveryDefinitions = {
  cardMinimum: {title:'Compare a shrinking minimum with a maintained payment',fields:[
    ['balance','Existing card balance (CAD)',8000,0,50000,500],['apr','Nominal annual interest assumption (%)',20,0,36,1],
    ['minimumPct','Hypothetical minimum as a share of balance after interest (%)',3,1,10,.5],['paymentFloor','Hypothetical minimum dollar floor (CAD)',25,5,200,5],
    ['fixedPayment','Maintained monthly amount; required minimum takes priority (CAD)',300,25,3000,25]
  ]},
  payRise: {title:'Explore a saving rule for repeated net-pay increases',fields:[
    ['baseSaving','Monthly saving before any raise (CAD)',500,0,5000,50],['netStep','Monthly take-home increase at each annual anniversary (CAD)',150,0,1000,25],
    ['capture','Share of each increase added to saving (%)',50,0,100,5],['initial','Starting savings (CAD)',10000,0,500000,1000],
    ['rate','Effective annual return assumption (%)',4,-5,10,.5],['years','Years in the comparison',20,2,30,1]
  ]},
  reserveRecovery: {title:'Explore reserve rebuilding across two cash shocks',fields:[
    ['cash','Starting emergency reserve (CAD)',5000,0,50000,500],['target','Selected reserve rebuilding target (CAD)',9000,0,50000,500],
    ['monthly','Monthly reserve contribution available after ordinary bills (CAD)',400,0,3000,50],
    ['shockA','First unexpected bill (CAD)',5000,0,30000,500],['shockMonthA','Month of the first bill',3,1,24,1],
    ['shockB','Second unexpected bill (CAD)',4000,0,30000,500],['shockMonthB','Month of the second bill',9,1,24,1]
  ]}
};

export function cardMinimumPath(input,maintained=false) {
  let balance=input.balance,interest=0,paid=0;
  const rows=[{x:0,value:balance,payment:0,interest:0}];
  for(let month=1;month<=600&&balance>0;month++) {
    const charge=balance*input.apr/1200,due=balance+charge;
    const minimum=Math.min(due,Math.max(input.paymentFloor,due*input.minimumPct/100));
    const payment=maintained?Math.min(due,Math.max(input.fixedPayment,minimum)):minimum;
    balance=Math.max(0,due-payment);if(balance<1e-8)balance=0;
    interest+=charge;paid+=payment;rows.push({x:month,value:balance,payment,interest:charge});
  }
  return {rows,interest,paid,remaining:balance,months:balance===0?rows.length-1:null};
}

export function payRisePath(input,capture=input.capture) {
  const m=Math.expm1(Math.log1p(input.rate/100)/12);
  let balance=input.initial,contributions=input.initial,extraContributions=0,extraSpending=0;
  const rows=[{x:0,value:balance,contributions,monthly:input.baseSaving,raise:0}];
  const annual=[];
  for(let year=0;year<input.years;year++) {
    const raise=year*input.netStep,extraSaving=raise*capture/100,extraExpense=raise-extraSaving,monthly=input.baseSaving+extraSaving;
    for(let month=0;month<12;month++){balance=balance*(1+m)+monthly;contributions+=monthly;}
    extraContributions+=12*extraSaving;extraSpending+=12*extraExpense;
    annual.push({label:'Year '+(year+1),values:[12*extraSaving,12*extraExpense]});
    rows.push({x:year+1,value:balance,contributions,monthly,raise});
  }
  return {rows,annual,balance,contributions,extraContributions,extraSpending};
}

export function reserveRecoveryPath(input) {
  let balance=input.cash,deposited=0,funded=0,unfunded=0;
  const rows=[{x:0,before:balance,value:balance}],events=[];
  for(let month=1;month<=24;month++) {
    const bill=(month===input.shockMonthA?input.shockA:0)+(month===input.shockMonthB?input.shockB:0);
    const paid=Math.min(balance,bill),gap=bill-paid;balance-=paid;funded+=paid;unfunded+=gap;
    if(bill>0)events.push({label:'Month '+month,values:[paid,gap]});
    const before=balance,deposit=Math.min(input.monthly,Math.max(0,input.target-balance));balance+=deposit;deposited+=deposit;
    rows.push({x:month,before,value:balance,deposit,bill,gap});
  }
  const lastShock=Math.max(input.shockA>0?input.shockMonthA:0,input.shockB>0?input.shockMonthB:0);
  const recovered=rows.find(row=>row.x>=lastShock&&row.value>=input.target);
  return {rows,events,deposited,funded,unfunded,balance,recovery:recovered?recovered.x-lastShock:null};
}

export function habitsRecoveryResult(kind,input) {
  if(kind==='cardMinimum') {
    const minimum=cardMinimumPath(input),fixed=cardMinimumPath(input,true);
    const label=path=>path.months===null?'Not repaid within 600 months':undefined;
    return {metrics:[['Minimum-only payoff time (months)',minimum.months,'months',label(minimum)],['Maintained-payment payoff time (months)',fixed.months,'months',label(fixed)],['Interest charged in the maintained-payment path',fixed.interest,'money']],note:'Hypothetical one-balance credit-card model with no new purchases. Interest is opening balance × nominal APR ÷ 12, posted before the payment. The modeled minimum is the greater of the dollar floor and the selected percentage of the balance after interest, capped at the full amount owed. The maintained strategy pays at least the selected amount or the modeled minimum, whichever is higher; the final payment is capped. This is not an issuer calculation, a universal Canadian minimum, or a calculation of Quebec requirements. Actual daily interest, grace periods, fees, purchase dates and payment allocation differ. Each schedule stops at payoff or 600 months. NR means not repaid within that limit, not zero cost. All payments are assumed available and timely. Post-payoff cash is not reinvested.',charts:[
      {id:'card-minimum-balances',type:'line',title:'A falling balance can still take many years to disappear',unit:'money',xLabel:'Months from the starting balance',series:[{name:'Shrinking minimum only',rows:minimum.rows},{name:'Maintained amount or required minimum',rows:fixed.rows,dash:true}],note:'Each line stops at payoff or 600 months. A line ending above zero is unfinished. The maintained amount is a payment floor rather than a spending ceiling: a larger required minimum takes priority.'},
      {id:'card-minimum-payments',type:'line',title:'Read the payment path as well as the balance path',unit:'money',xMin:1,xLabel:'Payment month',series:[{name:'Minimum-only payment',rows:minimum.rows.length>1?minimum.rows.slice(1).map(r=>({x:r.x,value:r.payment})):[{x:1,value:0}]},{name:'Maintained-strategy payment',rows:fixed.rows.length>1?fixed.rows.slice(1).map(r=>({x:r.x,value:r.payment})):[{x:1,value:0}],dash:true}],note:'Declining required payments can release monthly cash while leaving debt outstanding. A smaller final payment is a payoff adjustment, not a missed payment. Zero starting debt has no actual payment; the zero points provide a visible baseline.'},
      {id:'card-minimum-paid-remaining',type:'stackbar',title:'Payments already made plus the amount still owed',unit:'money',seriesNames:['Payments made','Balance still owed'],rows:[{label:'Minimum only',values:[minimum.paid,minimum.remaining]},{label:'Maintained amount / minimum',values:[fixed.paid,fixed.remaining]}],note:'For each path, payments plus remaining balance equal starting principal plus interest charged to its own stopping date. An unfinished path is not a lifetime repayment-cost estimate. Paths can end at different months; no investment opportunity-cost comparison is implied.'},
      {id:'card-minimum-rate-payment',type:'heatmap',title:'Months to repay across rates and maintained amounts',unit:'months',columns:['$100','$200','$300','$500'],rows:[0,12,20,30].map(apr=>({label:apr+'% APR',values:[100,200,300,500].map(fixedPayment=>cardMinimumPath({...input,apr,fixedPayment},true).months)})),note:'Rows replace APR and columns replace the maintained amount. Starting debt and the selected minimum rule remain unchanged. Every cell still honours the modeled minimum, even when it exceeds the column amount. NR means a balance remains after 600 months; these are deterministic cases, not probabilities.'}
    ]};
  }
  if(kind==='payRise') {
    const chosen=payRisePath(input),none=payRisePath(input,0),all=payRisePath(input,100),extraWealth=chosen.balance-none.balance;
    return {metrics:[['Monthly saving in the final year',chosen.rows.at(-1).monthly,'money'],['Additional contributions from the saving rule',chosen.extraContributions,'money'],['Additional ending savings versus saving none of the raises',extraWealth,'money']],note:'Hypothetical repeated net-pay increase, not a salary or investment forecast. Year one has only the starting monthly saving. At the start of each later year, monthly take-home pay increases by the same entered dollar step; earlier increases continue. The chosen percentage of all accumulated raises adds to monthly saving and the rest is assigned to additional spending. Ordinary spending and the original saving must already fit the starting household budget. Existing savings grow immediately; deposits arrive at month-end. The return is effective annual, converted to an equivalent monthly rate. No account limits, employer match, taxes, fees, job interruption or inflation adjustment are calculated. Dollar increases are nominal: a household must separately budget higher essential costs before treating a raise as available.',charts:[
      {id:'pay-rise-allocation',type:'stackbar',title:'Repeated raises create an expanding monthly commitment',unit:'money',seriesNames:['Additional annual saving','Additional annual spending'],rows:chosen.annual.filter((_,i)=>i===0||i===input.years-1||(i+1)%5===0),note:'These are annual amounts from accumulated take-home raises, excluding the original saving and original spending. Year one has no raise. By year n, the monthly raise pool is (n − 1) × the entered step. Both segments use the same income assumption; neither includes investment returns.'},
      {id:'pay-rise-savings-path',type:'line',title:'Compare the same income path with three saving rules',unit:'money',xLabel:'Years from the start',series:[{name:'Save none of each raise',rows:none.rows},{name:'Save the selected share',rows:chosen.rows,dash:true},{name:'Save all of each raise',rows:all.rows}],note:'Starting savings, original monthly saving, raise schedule, return and finish date are held constant. The alternatives consume different amounts during the period. Higher ending savings do not represent a free gain or superior investment performance; they require foregoing the additional spending.'},
      {id:'pay-rise-additional-wealth',type:'waterfall',title:'Separate extra deposits from their modeled investment effect',unit:'money',rows:[{label:'Additional contributions',value:chosen.extraContributions},{label:'Growth / loss on those contributions',value:extraWealth-chosen.extraContributions}],totalLabel:'Additional ending savings',note:'This reconciles the selected rule with saving none of the raises. Common starting savings and original deposits cancel. A negative return can make the investment-effect step negative. The result excludes inflation and does not value the consumption forgone.'},
      {id:'pay-rise-rule-horizon',type:'heatmap',title:'Additional ending savings across saving shares and horizons',unit:'money',columns:['10 years','15 years','20 years','30 years'],rows:[25,50,75,100].map(capture=>({label:capture+'% saved',values:[10,15,20,30].map(years=>payRisePath({...input,capture,years}).balance-payRisePath({...input,capture:0,years}).balance)})),note:'Each cell replaces the saving share and horizon while retaining the net-pay step and return. It subtracts a matching zero-capture baseline over that same horizon. Longer cases contain more annual pay increases and more deposits, as well as additional growth time.'}
    ]};
  }
  if(kind==='reserveRecovery') {
    const p=reserveRecoveryPath(input);
    return {metrics:[['Unfunded bills across both shocks',p.unfunded,'money'],['Emergency reserve at month 24',p.balance,'money'],['Months from the last positive bill to target at month-end',p.recovery,'months',p.recovery===null?'Not reached within the 24-month window':undefined]],note:'Hypothetical 24-month reserve ledger, with zero interest. Ordinary household income and bills are outside this ledger; the entered contribution must already be affordable after them. Each unexpected bill arrives at the start of its selected month, before that month’s contribution. Bills sharing a month are combined. A bill can use only cash already in the reserve: any excess is an unfunded need recorded separately, without automatic borrowing or a negative savings account. At month-end the reserve receives the smaller of the contribution and the amount needed to reach the target. Existing cash above target is retained; no contribution is forced out of that balance. Money not transferred is left outside the ledger. Later deposits rebuild the reserve and do not retrospectively pay an earlier unfunded bill. No claim reimbursements, interest, tax, insurance or event probabilities are assumed.',charts:[
      {id:'reserve-recovery-path',type:'line',title:'The next shock can arrive before rebuilding is finished',unit:'money',xLabel:'Months from the starting reserve',series:[{name:'After bills, before contribution',rows:p.rows.map(r=>({x:r.x,value:r.before}))},{name:'After month-end contribution',rows:p.rows,dash:true},{name:'Selected target',rows:[{x:0,value:input.target},{x:24,value:input.target}]}],note:'The two reserve lines show different points within each month, not two independent accounts. The before-contribution line exposes a cash need that a later transfer cannot fund. The target is chosen by the user; it is not an assessed recommendation.'},
      {id:'reserve-recovery-bills',type:'stackbar',title:'Separate bills paid from the reserve from bills still needing funding',unit:'money',seriesNames:['Paid from reserve cash','Unfunded at the bill date'],rows:p.events.length?p.events:[{label:'No positive bills',values:[0,0]}],note:'Every bar totals the unexpected bill or combined bills due that month. An unfunded segment needs a separately workable plan. It is not silently added to debt, charged interest, written off or paid from a future contribution.'},
      {id:'reserve-recovery-reconcile',type:'waterfall',title:'Reconcile the reserve cash that actually moved',unit:'money',rows:[{label:'Starting reserve',value:input.cash},{label:'Actual rebuilding deposits',value:p.deposited},{label:'Bills paid from reserve',value:-p.funded}],totalLabel:'Reserve at month 24',note:'Only amounts actually paid from reserve cash reduce this ledger. Unfunded bill amounts remain visible in the separate metric and bill chart. Contributions stop at the target, so 24 × the monthly contribution can overstate the amount actually deposited.'},
      {id:'reserve-recovery-spacing',type:'heatmap',title:'Unfunded bills across second-bill dates and saving amounts',unit:'money',columns:['Month 3','Month 6','Month 12','Month 18'],rows:[0,200,400,800].map(monthly=>({label:'$'+monthly+'/mo',values:[3,6,12,18].map(shockMonthB=>reserveRecoveryPath({...input,monthly,shockMonthB}).unfunded)})),note:'Rows replace the monthly contribution and columns replace the second bill’s date. All other inputs remain selected. A column may put the second labelled bill before the first, or in the same month. Cells show total unfunded bills at their due dates, not ending reserve balances or event probabilities.'}
    ]};
  }
  throw Error('Unknown saving-habits and recovery topic.');
}
