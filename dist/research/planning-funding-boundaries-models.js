const monthlyRate=annual=>Math.expm1(Math.log1p(annual/100)/12);
export const fundingBoundaryDefinitions={
 risingGoal:{title:'Follow a saving balance beside a changing goal price',fields:[
  ['goal','Cost of the goal today (CAD)',50000,0,1000000,5000],['goalGrowth','Assumed effective annual increase in the goal price (%)',5,0,12,.5],
  ['initial','Starting money assigned only to this goal (CAD)',10000,0,1000000,1000],['monthly','Month-end saving contribution (CAD)',500,0,20000,100],
  ['rate','Assumed effective annual saving return (%)',3,0,10,.5],['years','Years until the goal is paid',8,1,20,1]
 ]},
 earmarkedCash:{title:'Check several earmarks against one real cash balance',fields:[
  ['cash','Actual accessible bank balance at the start (CAD)',30000,0,200000,1000],['reserve','Cash floor to keep available throughout (CAD)',12000,0,100000,1000],
  ['taxBill','Independently confirmed tax or other required bill (CAD)',9000,0,100000,500],['taxDue','Month the required bill is paid',4,1,12,1],
  ['trip','Separate planned-purchase cost (CAD)',14000,0,100000,500],['tripDue','Month the planned purchase is paid',8,1,12,1],
  ['monthly','New monthly cash available before that month’s bills (CAD)',500,0,20000,100]
 ]},
 borrowedCapital:{title:'Separate an investment value, its loan and outside interest cash',fields:[
  ['own','Own capital invested at the start (CAD)',20000,0,500000,1000],['loan','Interest-only loan invested alongside own capital (CAD)',30000,0,500000,1000],
  ['assetChange','Cumulative investment-value change over the entire horizon (%)',-20,-100,100,5],['loanRate','Nominal annual loan rate, paid monthly from outside cash (%)',8,0,20,.5],
  ['years','Whole years until the investment is sold and loan repaid',3,1,10,1]
 ]}
};

export function movingGoalPath(d){
 const r=monthlyRate(d.rate),n=12*d.years;
 let balance=d.initial,contributions=d.initial;
 const rows=[{x:0,balance,target:d.goal,contributions}];
 for(let month=1;month<=n;month++){
  balance=balance*(1+r)+d.monthly;contributions+=d.monthly;
  rows.push({x:month/12,balance,target:d.goal*(1+d.goalGrowth/100)**(month/12),contributions});
 }
 const target=rows.at(-1).target,factor=r===0?n:Math.expm1(n*Math.log1p(r))/r;
 const required=Math.max(0,(target-d.initial*(1+r)**n)/factor);
 return {rows,target,balance,contributions,growth:balance-contributions,required,gap:target-balance};
}

export function earmarkCalendar(d){
 const claims=[d.reserve,d.taxBill,d.trip];let remaining=d.cash;
 const allocated=claims.map(claim=>{const value=Math.min(claim,remaining);remaining-=value;return value;});
 const total=claims.reduce((a,b)=>a+b,0),overcommitted=Math.max(0,total-d.cash);
 let cash=d.cash,lowest=cash;
 const rows=[{x:0,cash,saving:0,tax:0,purchase:0}];
 for(let month=1;month<=12;month++){
  const tax=month===d.taxDue?d.taxBill:0,purchase=month===d.tripDue?d.trip:0;
  cash+=d.monthly-tax-purchase;lowest=Math.min(lowest,cash);
  rows.push({x:month,cash,saving:d.monthly,tax,purchase});
 }
 return {claims,allocated,total,overcommitted,unassigned:remaining,rows,ending:cash,extra:Math.max(0,d.reserve-lowest),lowest};
}

export function borrowedCapitalLedger(d){
 const invested=d.own+d.loan,change=invested*d.assetChange/100,asset=invested+change;
 const monthlyInterest=d.loan*d.loanRate/100/12,interest=monthlyInterest*12*d.years;
 const equity=asset-d.loan,result=equity-d.own-interest;
 const noLoanAsset=d.own*(1+d.assetChange/100),noLoanResources=noLoanAsset+interest;
 return {invested,change,asset,monthlyInterest,interest,equity,result,noLoanAsset,noLoanResources,difference:equity-noLoanResources};
}
const series=(name,rows,key,extra={})=>({name,rows:rows.map(r=>({x:r.x,value:r[key]})),...extra});
export function fundingBoundaryResult(kind,d){
 if(kind==='risingGoal'){
  const p=movingGoalPath(d);
  return {metrics:[['Goal price at the selected deadline',p.target,'money'],['Monthly contribution required from now',p.required,'money'],['Unfunded amount at the deadline',Math.max(0,p.gap),'money']],note:'Original hypothetical fixed-quantity goal, priced in nominal CAD. The goal price rises at the entered constant effective annual rate, compounded proportionally across months. The saving account earns its own constant effective annual return converted monthly; contributions arrive at month-end after growth. Starting savings belong exclusively to this goal. The solver uses the same horizon, rates and payment timing and floors the required contribution at zero when starting funds already cover the modeled target. No withdrawals, fees, tax, account contribution limits, uncertain returns, price volatility, credit or changes in the goal quantity are modeled. The goal-price increase is not a forecast for homes, tuition or consumer prices. All alternative deadlines reprice the goal at their own date.',charts:[
   {id:'rising-goal-two-paths',type:'line',title:'Compare the growing account with the goal price on the same date',unit:'money',xLabel:'Completed years from the planning start',series:[series('Account after month-end contributions',p.rows,'balance'),series('Goal price at that date',p.rows,'target',{dash:true})],note:'Both paths are nominal CAD. A rising account can still be short of a faster-moving or initially much larger target. The last point is the selected payment deadline.'},
   {id:'rising-goal-deadlines',type:'bar',title:'A later deadline changes both saving time and the price to be paid',unit:'money',rows:[2,5,8,12].map(years=>({label:years+' years until payment',value:movingGoalPath({...d,years}).required})),note:'Each bar solves its own required month-end contribution. It changes the deadline, reprices the same goal and compounds the same starting balance for that new period. A longer wait does not freeze the goal at its original cost.'},
   {id:'rising-goal-shortfall',type:'waterfall',title:'Reconcile the deadline shortfall without counting contributions as returns',unit:'money',rows:[{label:'Today’s goal price',value:d.goal},{label:'Increase in the goal price',value:p.target-d.goal},{label:'Starting saving balance',value:-d.initial},{label:'New monthly contributions',value:-12*d.years*d.monthly},{label:'Modeled growth in the saving account',value:-p.growth}],totalLabel:'Goal price minus money accumulated',note:'A positive endpoint is a shortfall; a negative endpoint is money above the modeled target. The headline floors a shortfall at zero, while this signed reconciliation retains any surplus. The starting balance and every new contribution are counted once.'},
   {id:'rising-goal-saving-matrix',type:'heatmap',title:'Required monthly saving across goal-price growth and account returns',unit:'money',unitLabel:'CAD required at each month-end',columns:['0% return','2%','4%','6%'],rows:[0,2,5,8].map(goalGrowth=>({label:goalGrowth+'% price',values:[0,2,4,6].map(rate=>movingGoalPath({...d,goalGrowth,rate}).required)})),note:'Rows replace annual goal-price growth; columns replace annual account return. Today’s goal price, starting balance and deadline remain selected. Cells are deterministic funding requirements, not recommended investments, expected returns or probabilities.'}
  ]};
 }
 if(kind==='earmarkedCash'){
  const p=earmarkCalendar(d),labels=['Protected cash floor','Required bill','Planned purchase'];
  return {metrics:[['Opening claims beyond the actual bank balance',p.overcommitted,'money'],['Extra starting cash needed to preserve the floor at every date',p.extra,'money'],['Bank cash remaining after twelve months',p.ending,'money']],note:'Original hypothetical twelve-month cash ledger. There is one starting bank balance, not a separate copy for each earmark. Opening allocations use an illustrative order: protect the selected floor, then assign the required bill, then the planned purchase, each only from remaining cash. This order is not a legal priority or an optimized plan. All bills are nevertheless paid in full on their selected month; negative balances are unfunded needs, not automatic borrowing. New monthly money arrives before that month’s bills, and same-month bills are added. The protected floor is held as cash throughout, not paid away as another bill. Cash earns zero. Required bill and purchase amounts are independently entered, with no tax calculation, credit, fees, refund, return or other household expenses. The additional starting cash covers the lowest cash point relative to the floor, not just the final balance.',charts:[
   {id:'earmark-claims-assigned',type:'groupbar',title:'A purpose label does not create another copy of the money',unit:'money',seriesNames:['Amount requested for that purpose','Opening cash actually assigned'],rows:labels.map((label,i)=>({label,values:[p.claims[i],p.allocated[i]]})),note:'The three assigned amounts together cannot exceed the one actual starting balance. These are labels within the same cash, not three additional assets or three immediate payments.'},
   {id:'earmark-opening-capacity',type:'waterfall',title:'Subtract all opening claims from the same starting balance',unit:'money',rows:[{label:'Actual starting bank balance',value:d.cash},{label:'Selected protected cash floor',value:-d.reserve},{label:'Required bill earmark',value:-d.taxBill},{label:'Planned purchase earmark',value:-d.trip}],totalLabel:'Opening unassigned capacity after full claims',note:'This is an allocation-capacity test, not a bank transaction history. A negative endpoint means that the opening claims cannot all be fully funded today. The bank balance itself has not fallen merely because labels were written down.'},
   {id:'earmark-calendar-floor',type:'line',title:'Future deposits help only if they arrive before the bills',unit:'money',xLabel:'Completed months · cash after the month’s bills',series:[series('Actual cash ledger',p.rows,'cash'),{name:'Selected protected floor',dash:true,rows:[{x:0,value:d.reserve},{x:12,value:d.reserve}]}],note:'The required bill and the purchase are each paid once. The protected floor stays in the account as a reference. Cash below that line has used money intended for the floor, even when the bank balance is still positive.'},
   {id:'earmark-calendar-matrix',type:'heatmap',title:'Extra starting cash across purchase size and monthly new money',unit:'money',columns:['$0 / mo','$250','$500','$1k'],rows:[10000,14000,18000,22000].map(trip=>({label:'$'+trip/1000+'k buy',values:[0,250,500,1000].map(monthly=>earmarkCalendar({...d,trip,monthly}).extra)})),note:'Rows replace the planned-purchase amount; columns replace new monthly money. Actual starting cash, protected floor, required bill and both payment months stay selected. Each cell preserves the floor at every modeled date. Opening allocation shortfalls and calendar funding shortfalls are separate measures.'}
  ]};
 }
 if(kind==='borrowedCapital'){
  const p=borrowedCapitalLedger(d),moves=[-100,-50,-20,0,20,50,100];
  return {metrics:[['Sale proceeds remaining after the loan principal is repaid',p.equity,'money'],['Investment result after all outside interest payments',p.result,'money'],['Monthly interest paid from the household budget',p.monthlyInterest,'money']],note:'Original mathematical illustration of a fixed interest-only loan invested with own capital at time zero. The asset-change input is one cumulative change over the entire selected horizon, not an annual rate. Asset value never falls below zero, but debt is not limited by remaining asset value. Interest is the nominal annual rate divided by twelve on unchanged loan principal, paid monthly from new outside household resources. It is not capitalized. At the common endpoint the investment is sold and the full original loan principal is repaid. The no-loan comparison starts with the same own capital and receives identical outside monthly resources, retaining them in zero-return cash rather than paying interest. No income distributions, taxes, deduction, fee, collateral rule, credit qualification, margin call, forced sale, loan repayment restriction or early cash need is modeled. Negative residuals are arithmetic funding gaps, not determinations of legal liability. No investment or borrowing strategy is recommended.',charts:[
   {id:'borrowed-capital-sale',type:'waterfall',title:'The lender’s principal does not fall with the investment',unit:'money',rows:[{label:'Own money invested',value:d.own},{label:'Borrowed principal invested',value:d.loan},{label:'Cumulative change in the investment value',value:p.change},{label:'Original loan principal repaid at sale',value:-d.loan}],totalLabel:'Sale cash after repaying principal',note:'The opening investment is own capital plus the loan, counted once. This endpoint excludes outside cash already paid as interest. The separate investment-result headline subtracts that interest as well as the original own capital.'},
   {id:'borrowed-capital-common-budget',type:'line',title:'Equal household resources can produce very different ending cash',unit:'money',xMin:-100,xLabel:'Cumulative investment-value change over the whole horizon (%)',xTicks:[-100,-50,0,50,100].map(value=>({value,label:value+'%'})),series:[{name:'Borrow and invest · sale less loan',rows:moves.map(assetChange=>({x:assetChange,value:borrowedCapitalLedger({...d,assetChange}).equity}))},{name:'No loan · own investment plus retained interest budget',dash:true,rows:moves.map(assetChange=>({x:assetChange,value:borrowedCapitalLedger({...d,assetChange}).noLoanResources}))}],note:'Both alternatives receive the same own starting capital and the same new monthly household resources. The loan case pays interest with those receipts; the no-loan case keeps them as zero-return cash. Both sell on the same date. Signed negative loan-case totals remain visible.'},
   {id:'borrowed-capital-interest-budget',type:'bar',title:'The loan needs cash even when the asset earns no cash income',unit:'money',rows:[0,4,8,12,16].map(loanRate=>({label:loanRate+'% nominal annual loan rate',value:d.loan*loanRate/100})),note:'Each bar is one year’s interest at the selected constant loan principal and an alternative assumed rate. Principal is still due separately at sale. No asset distributions are available to pay these bills in this illustration.'},
   {id:'borrowed-capital-loss-matrix',type:'heatmap',title:'Net investment result after outside interest across loan sizes and asset moves',unit:'money',signed:true,columns:['$0 loan','$10k','$30k','$50k'],rows:[-40,-20,0,20].map(assetChange=>({label:assetChange+'% move',values:[0,10000,30000,50000].map(loan=>borrowedCapitalLedger({...d,assetChange,loan}).result)})),note:'Cells equal sale proceeds minus loan principal, own starting capital and all outside interest. Rows replace the cumulative asset move; columns replace the loan. Own capital, interest rate and horizon remain selected. Outside cash commitments grow with borrowing; they are deducted from the result rather than treated as free resources. No tax benefit is assumed.'}
  ]};
 }
 throw Error('Unknown funding-boundary planning topic.');
}
