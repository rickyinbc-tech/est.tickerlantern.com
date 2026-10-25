export const commitmentDefinitions={
  jointLoan:{title:'Explore a joint-loan payment takeover',fields:[
    ['balance','Original joint-loan principal (CAD)',24000,0,200000,1000],['apr','Fixed nominal annual interest (%)',8,0,24,.25],
    ['loanMonths','Original repayment term (months)',48,12,60,1],['takeoverMonth','First month you fund the scheduled payment',13,1,61,1],
    ['surplus','Monthly cash available after your other costs (CAD)',250,0,3000,50],['cash','Opening cash allocated when payments start (CAD)',3000,0,100000,500]
  ]},
  subscriptionPlan:{title:'Explore annual prepayment versus monthly flexibility',fields:[
    ['monthlyPrice','All-in monthly-plan price (CAD)',30,1,500,1],['annualPrice','All-in annual price paid upfront (CAD)',300,1,6000,10],
    ['useMonths','Consecutive months of use within one year',8,1,12,1],['refundPct','Assumed refund of unused annual price (%)',0,0,100,5]
  ]},
  saleCash:{title:'Explore investment-sale proceeds and a cash goal',fields:[
    ['market','Current value of the one modeled holding (CAD)',100000,10000,1000000,5000],['basis','Total adjusted cost base of that holding (CAD)',60000,0,1500000,5000],
    ['target','Cash needed after fees and tax earmark (CAD)',20000,0,1000000,1000],['fee','Flat selling cost for one positive sale (CAD)',100,0,1000,10],
    ['gainTax','Assumed tax earmark as % of the full positive gain',25,0,50,1]
  ]}
};

// Everyone remains jointly responsible. The takeover changes only who supplies cash.
// No missed payment, acceleration, change of rate, legal recovery or debt forgiveness.
export function jointLoanPath(d){
  const r=d.apr/1200,n=d.loanMonths;
  const payment=d.balance===0?0:r===0?d.balance/n:d.balance*r/(-Math.expm1(-n*Math.log1p(r)));
  let balance=d.balance,cash=d.cash,lowest=d.cash,ownPaid=0,ownPrincipal=0,ownInterest=0,takeoverBalance=0;
  const rows=[{x:0,balance,cash,ownPaid:0,otherPaid:0}];
  let otherPaid=0;
  for(let month=1;month<=n;month++){
    if(month===d.takeoverMonth)takeoverBalance=balance;
    const charge=balance*r,actual=Math.min(payment,balance+charge),principal=actual-charge;
    if(month>=d.takeoverMonth){cash+=(actual>0?d.surplus:0)-actual;ownPaid+=actual;ownPrincipal+=principal;ownInterest+=charge;lowest=Math.min(lowest,cash);}
    else otherPaid+=actual;
    balance=Math.max(0,balance-principal);if(balance<1e-7)balance=0;
    rows.push({x:month,balance,cash,ownPaid,otherPaid});
  }
  return {rows,payment,takeoverBalance,ownPaid,ownPrincipal,ownInterest,otherPaid,extra:Math.max(0,-lowest),ending:cash};
}

// Stop use at the end of M, stop the cancelable monthly plan, and receive the
// explicitly assumed pro-rata annual refund at that same month's end.
export function subscriptionPath(d){
  const refund=d.annualPrice*(12-d.useMonths)/12*d.refundPct/100;
  const rows=[{x:0,monthly:0,annual:d.annualPrice}];
  for(let m=1;m<=12;m++)rows.push({x:m,monthly:Math.min(m,d.useMonths)*d.monthlyPrice,annual:d.annualPrice-(m>=d.useMonths?refund:0)});
  return {rows,refund,annualNet:d.annualPrice-refund,monthlyNet:d.monthlyPrice*d.useMonths,unused:d.annualPrice*(12-d.useMonths)/12,used:d.annualPrice*d.useMonths/12};
}

export function saleAtGross(d,gross){
  gross=Math.max(0,Math.min(gross,d.market));
  const fee=gross>0?Math.min(gross,d.fee):0,basisSold=d.basis*gross/d.market;
  const gain=gross-fee-basisSold,tax=Math.max(0,gain)*d.gainTax/100;
  return {gross,fee,basisSold,gain,tax,net:Math.max(0,gross-fee-tax),retained:d.market-gross,remainingBasis:d.basis-basisSold};
}
export function saleCashPlan(d){
  if(d.target===0)return {...saleAtGross(d,0),needed:0,shortfall:0,fraction:0};
  const rate=d.gainTax/100,alpha=1-d.basis/d.market,grossNoTax=d.target+d.fee;
  const needed=grossNoTax*alpha-d.fee>0?(d.target+d.fee*(1-rate))/(1-rate*alpha):grossNoTax;
  const p=saleAtGross(d,needed);
  return {...p,needed,shortfall:Math.max(0,d.target-p.net),fraction:p.gross/d.market};
}

const series=(name,rows,key,extra={})=>({name,rows:rows.map(r=>({x:r.x,value:r[key]})),...extra});
export function commitmentResult(kind,d){
  if(kind==='jointLoan'){
    const p=jointLoanPath(d),starts=[1,13,25,37];
    return {metrics:[['Scheduled monthly payment',p.payment,'money'],['Debt before your first assumed payment',p.takeoverBalance,'money'],['Additional opening cash needed',p.extra,'money']],note:'Hypothetical fixed-rate joint loan with monthly interest on opening principal and unrounded month-end payments. The other borrower funds payments before the selected month; you fund all scheduled payments from that month. Joint responsibility already exists from signing. Your surplus becomes available before each payment only during your funding period; opening cash is held unchanged beforehand. Negative cash is an unfunded need. No default probability, missed instalment, accelerated demand, fees, recovery, tax or actual lender agreement is modeled. A start after maturity means no payment takeover.',charts:[
      {id:'joint-loan-balance',type:'line',title:'The liability declines only when the loan is repaid',unit:'money',xLabel:'Completed loan months',series:[series('Debt remaining',p.rows,'balance')],note:'Changing who supplies the scheduled payment does not change the debt path. The remaining principal is separate from future payments, which also include interest.'},
      {id:'joint-loan-cash',type:'line',title:'Cash allocated to your assumed payment period',unit:'money',xLabel:'Completed loan months',series:[series('Cash after available surplus and payment',p.rows,'cash')],note:'No surplus is accumulated before your selected funding month. In each later month, available surplus arrives before the payment. There is no interest on cash or credit facility to fund a negative point.'},
      {id:'joint-loan-takeover-cost',type:'stackbar',title:'Your remaining payments at alternative takeover dates',unit:'money',seriesNames:['Principal repaid by you','Interest paid by you'],rows:starts.map(takeoverMonth=>{const q=jointLoanPath({...d,takeoverMonth});return {label:'Start in loan month '+takeoverMonth,values:[q.ownPrincipal,q.ownInterest]};}),note:'Each bar is a separate assumption in which earlier payments were made by the other borrower. Later starts after the selected loan term have zero payments. No recovery from the other borrower is assumed.'},
      {id:'joint-loan-reserve-matrix',type:'heatmap',title:'Extra opening cash beyond your selected allocation',unit:'money',columns:['$0 surplus','$100','$300','$500'],rows:starts.map(takeoverMonth=>({label:'Start month '+takeoverMonth,values:[0,100,300,500].map(surplus=>jointLoanPath({...d,takeoverMonth,surplus}).extra)})),note:'Rows replace the first month you fund payments; columns replace available monthly surplus during that period. Opening allocated cash, original principal, rate and term stay selected. These are funding stresses, not legal limits or probabilities.'}
    ]};
  }
  if(kind==='subscriptionPlan'){
    const p=subscriptionPath(d),netDifference=p.monthlyNet-p.annualNet;
    return {metrics:[['Monthly plan: total paid for selected use',p.monthlyNet,'money'],['Annual plan: cost after assumed refund',p.annualNet,'money'],['Annual cost advantage; negative means dearer',netDifference,'money']],note:'Hypothetical all-in prices for the same service and one twelve-month contract, with no renewal. Annual price is paid before use. Monthly payments are made at the start of each used month; chart points show completed months. Use ends after the selected month, monthly billing stops without a fee, and any assumed pro-rata refund arrives then. Refund % is a sensitivity input, not a legal entitlement. No interest, borrowing, tax credit, service failure or value of features is modeled. Verify actual contract terms and applicable consumer rights.',charts:[
      {id:'subscription-cost-duration',type:'line',title:'Cost if you stop after each possible month',unit:'money',xLabel:'Consecutive months used',xMin:1,series:[{name:'Cancelable monthly plan',rows:Array.from({length:12},(_,i)=>({x:i+1,value:(i+1)*d.monthlyPrice}))},{name:'Annual plan after assumed refund',dash:true,rows:Array.from({length:12},(_,i)=>({x:i+1,value:subscriptionPath({...d,useMonths:i+1}).annualNet}))}],note:'Each point is a separate decision to stop after that duration. The annual price stays fully payable unless the entered refund assumption returns a portion of unused time.'},
      {id:'subscription-cash-timing',type:'line',title:'Cumulative cash outlay for the selected stopping month',unit:'money',xLabel:'Completed months since annual prepayment',series:[series('Monthly plan',p.rows,'monthly'),series('Annual plan, net of any refund',p.rows,'annual',{step:true,dash:true})],note:'Index zero is after annual prepayment and before the first monthly-plan charge. Monthly charges occur at each used month’s start; points 1–12 show totals after completed months. The annual refund, if any, arrives only at the selected stopping month.'},
      {id:'subscription-used-unused',type:'stackbar',title:'Allocate the annual price across time used and unused',unit:'money',seriesNames:['Price allocated to used months','Unused price retained by provider','Assumed unused-price refund'],rows:[{label:'One prepaid year',values:[p.used,p.unused-p.refund,p.refund]}],note:'The three parts reconcile to the upfront annual price. The allocation is linear by calendar month; it is not a measure of enjoyment, usage intensity or an accounting valuation.'},
      {id:'subscription-flexibility-matrix',type:'heatmap',title:'Annual cost advantage compared with monthly billing',unit:'money',columns:['0% refund','25%','50%','100%'],rows:[3,6,9,12].map(useMonths=>({label:useMonths+' months used',values:[0,25,50,100].map(refundPct=>{const q=subscriptionPath({...d,useMonths,refundPct});return q.monthlyNet-q.annualNet;})})),note:'Positive cells favour the annual price in this cost comparison; negative cells favour monthly billing. Rows replace use duration and columns replace the assumed unused-price refund. Prices stay selected. No cell predicts how long you will use the service.'}
    ]};
  }
  if(kind==='saleCash'){
    const p=saleCashPlan(d),shocks=[-.4,-.2,0,.2];
    return {metrics:[['Gross sale, capped at the holding value',p.gross,'money'],['Cash earmarked for assumed tax',p.tax,'money'],['Cash-goal shortfall after selling',p.shortfall,'money']],note:'One hypothetical CAD holding in a non-registered account, sold proportionately with fractional units allowed. Gain equals proceeds minus proportionate adjusted cost base minus a flat selling cost. The entered percentage applies to the full positive gain as a cash earmark; it is neither a statutory inclusion rate nor a personal marginal rate or tax-return calculation. A loss generates no assumed refund. The sale is capped at the holding value, so an unaffordable target remains a visible shortfall. Tax cash is retained separately and unavailable for the goal. No other income, losses, account rules, settlement delay, FX or price movement during execution.',charts:[
      {id:'sale-cash-waterfall',type:'waterfall',title:'From gross sale proceeds to cash available for the goal',unit:'money',rows:[{label:'Gross proceeds',value:p.gross},{label:'Selling cost',value:-p.fee},{label:'Cash earmarked for assumed tax',value:-p.tax}],totalLabel:'Cash available for the goal',note:'Adjusted cost base is used to calculate the gain but is not another cash deduction at sale. This bridge therefore subtracts only the selling cost and the separate tax earmark.'},
      {id:'sale-proceeds-curve',type:'line',title:'Selling more of the holding versus obtaining usable cash',unit:'money',xLabel:'Gross sale proceeds (CAD)',xUnit:'money',series:[{name:'Cash after cost and tax earmark',rows:Array.from({length:21},(_,i)=>{const gross=d.market*i/20;return {x:gross,value:saleAtGross(d,gross).net};})},{name:'Selected cash goal',dash:true,rows:[{x:0,value:d.target},{x:d.market,value:d.target}]}],note:'The horizontal goal can sit above all achievable points. A zero sale has no fee; a positive sale incurs the flat cost up to available proceeds. Unrounded fractional sales are a mathematical simplification.'},
      {id:'sale-price-stress',type:'groupbar',title:'Recheck the same holding after a hypothetical price change',unit:'money',seriesNames:['Gross sale actually available','Remaining cash-goal shortfall'],rows:shocks.map(change=>{const q=saleCashPlan({...d,market:d.market*(1+change)});return {label:(change>=0?'+':'')+Math.round(change*100)+'% price change',values:[q.gross,q.shortfall]};}),note:'Keep unit count and total adjusted cost base fixed while changing market value. Re-solve the same goal at each price. Lower tax on a smaller gain does not replace lost market value. These price stresses have no assigned probability.'},
      {id:'sale-basis-tax-matrix',type:'heatmap',title:'Gross sale needed if the goal can be fully funded',unit:'money',columns:['0% earmark','15%','25%','40%'],rows:[0,.3,.6,1].map(ratio=>({label:'ACB / value '+Math.round(ratio*100)+'%',values:[0,15,25,40].map(gainTax=>{const q=saleCashPlan({...d,basis:d.market*ratio,gainTax});return q.shortfall>1e-7?null:q.gross;})})),note:'Rows replace total cost base as a share of the selected market value; columns replace the assumed effective tax earmark on the full positive gain. Target, fee and market value stay selected. Unavailable means the entire holding cannot fund the goal after these deductions.'}
    ]};
  }
  throw Error('Unknown commitment planning topic.');
}
