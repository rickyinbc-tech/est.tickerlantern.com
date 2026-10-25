import { mortgageMonthlyRate, mortgagePayment } from './planning-more-models.js';
export const accountUseDefinitions={
  tfsaCalendar:{title:'Explore a TFSA withdrawal and recontribution calendar',fields:[
    ['room','Unused room at start of year 1, across all TFSAs (CAD)',7000,0,200000,1000],['balance','Combined TFSA value at that starting date (CAD)',40000,0,1000000,5000],
    ['first','First contribution requested in year 1 (CAD)',5000,0,200000,1000],['withdrawal','Ordinary withdrawal requested later in year 1 (CAD)',10000,0,200000,1000],
    ['later','Subsequent contribution requested in year 1 (CAD)',10000,0,200000,1000],['newRoom','Year 2 new dollar-room assumption, not a forecast (CAD)',7000,0,15000,500],
    ['next','Contribution requested after year 2 begins (CAD)',15000,0,200000,1000]
  ]},
  respWithdrawals:{title:'Explore RESP sources for an education budget',fields:[
    ['contributions','Contribution amount confirmed available for this budget (CAD)',20000,0,100000,1000],['eapCapacity','Gross EAP amount confirmed available by promoter (CAD)',15000,0,50000,1000],
    ['request','Gross EAP amount requested in the model (CAD)',10000,0,50000,1000],['costs','Education costs in the selected budget (CAD)',24000,0,100000,1000],
    ['outside','Confirmed outside funding for this budget (CAD)',4000,0,50000,1000],['allowance','Assumed tax budget allowance / gross EAP (%)',10,0,50,1]
  ]},
  mortgagePrepay:{title:'Explore a lump-sum prepayment versus liquid savings',fields:[
    ['balance','Mortgage balance before the choice (CAD)',300000,0,1500000,10000],['mortgageRate','Quoted nominal annual mortgage rate (%)',4.5,0,12,.25],
    ['amortYears','Remaining amortization before the choice (years)',25,5,30,1],['lump','Cash available for either choice (CAD)',20000,0,300000,5000],
    ['cashRate','Assumed annual savings return after tax and costs (%)',2,-5,8,.5],['years','Years over which to compare the choices',5,1,10,1]
  ]}
};
export function tfsaTimeline(input){
  let room=input.room,balance=input.balance;const states=[{label:'Start of year 1',room,balance}];
  const first=Math.min(input.first,room);room-=first;balance+=first;states.push({label:'After first contribution',room,balance});
  const withdrawal=Math.min(input.withdrawal,balance);balance-=withdrawal;states.push({label:'After ordinary withdrawal',room,balance});
  const later=Math.min(input.later,room);room-=later;balance+=later;states.push({label:'After later contribution',room,balance});
  const unused=room;room+=withdrawal+input.newRoom;const nextRoom=room;states.push({label:'Start of year 2',room,balance});
  const next=Math.min(input.next,room);room-=next;balance+=next;states.push({label:'After year 2 contribution',room,balance});
  const blockedFirst=input.first-first,blockedLater=input.later-later,blockedNext=input.next-next;
  return {states,first,later,next,withdrawal,unused,nextRoom,room,balance,blockedFirst,blockedLater,blockedNext,unplaced:blockedFirst+blockedLater+blockedNext};
}
export function respBudget(input){
  const need=Math.max(0,input.costs-input.outside),tax=input.allowance/100;
  // The last cap is a voluntary budget convention, not a legal EAP limit.
  const eap=Math.min(input.request,input.eapCapacity,need),allowance=eap*tax,netEap=eap-allowance;
  const contribution=Math.min(input.contributions,Math.max(0,need-netEap)),cash=input.outside+netEap+contribution-input.costs;
  return {eap,allowance,netEap,contribution,cash,gap:Math.max(0,-cash),remainingContributions:input.contributions-contribution,remainingEap:input.eapCapacity-eap};
}
export function mortgageCashChoice(input,prepay){
  const applied=prepay?Math.min(input.lump,input.balance):0,payment=mortgagePayment(input.balance,input.mortgageRate,input.amortYears*12);
  const loanRate=mortgageMonthlyRate(input.mortgageRate),cashRate=Math.expm1(Math.log1p(input.cashRate/100)/12);
  let debt=input.balance-applied,cash=input.lump-applied,interest=0,growth=0,paid=0,unusedPayments=0;
  const rows=[{x:0,debt,cash,value:cash-debt}];
  for(let month=1;month<=input.years*12;month++){
    const gain=cash*cashRate;cash+=gain;growth+=gain;
    const charge=debt*loanRate,actual=Math.min(payment,debt+charge);interest+=charge;paid+=actual;
    debt=Math.max(0,debt+charge-actual);if(debt<1e-7)debt=0;
    const unused=Math.max(0,payment-actual);cash+=unused;unusedPayments+=unused;
    if(month%12===0)rows.push({x:month/12,debt,cash,value:cash-debt});
  }
  return {rows,applied,payment,debt,cash,interest,growth,paid,unusedPayments,net:cash-debt};
}
export function prepayComparison(input){
  const prepay=mortgageCashChoice(input,true),liquid=mortgageCashChoice(input,false);
  return {prepay,liquid,interestAvoided:liquid.interest-prepay.interest,growthDifference:prepay.growth-liquid.growth,advantage:prepay.net-liquid.net};
}
export function accountUseResult(kind,input){
  if(kind==='tfsaCalendar'){
    const p=tfsaTimeline(input);
    return {metrics:[['Contribution requests not placed',p.unplaced,'money'],['Room before the year 2 contribution',p.nextRoom,'money'],['Account value after the selected events',p.balance,'money']],note:'Ordinary hypothetical two-calendar-year TFSA ledger. Starting unused room is assumed already reconciled across all of the holder’s TFSAs, with Canadian residency and eligibility throughout. Contributions are capped at modeled available room; unplaced requests never enter an account. Withdrawal is capped at modeled value and does not restore same-year room. Year 2 adds unused room, the actual ordinary year-1 withdrawal and the entered new-dollar-room assumption. That assumption is not an official future-year limit or forecast. No investment returns, other transactions, direct transfers, specified distributions, non-resident periods, excess history or tax on excesses are calculated.',charts:[
      {id:'tfsa-calendar',type:'groupbar',title:'Account value and available room follow different ledgers',unit:'money',seriesNames:['Combined TFSA value','Available contribution room'],rows:p.states.map(s=>({label:s.label,values:[s.balance,s.room]})),note:'Rows follow the selected event order. The withdrawal reduces account value immediately while leaving available room unchanged. The year-2 room increase occurs at the new calendar year, before its selected contribution. Account value is not a measure of contribution room.'},
      {id:'tfsa-requests',type:'stackbar',title:'A requested contribution is not automatically placed',unit:'money',seriesNames:['Contribution placed in the model','Request not placed'],rows:[{label:'First contribution · year 1',values:[p.first,p.blockedFirst]},{label:'Later contribution · year 1',values:[p.later,p.blockedLater]},{label:'Contribution · year 2',values:[p.next,p.blockedNext]}],note:'The total bar is the requested amount. The model stops each deposit at available room; it does not intentionally create an excess and does not calculate excess-contribution tax. Unplaced money has no investment destination in this account ledger.'},
      {id:'tfsa-new-year',type:'waterfall',title:'Reconcile the room available when the new year begins',unit:'money',rows:[{label:'Unused room carried from year 1',value:p.unused},{label:'Ordinary withdrawal restored',value:p.withdrawal},{label:'Year 2 new-room assumption',value:input.newRoom}],totalLabel:'Room before year 2 deposit',note:'Restoration uses the withdrawal actually made in the model, not a request above available account value. The new-room field is a separate hypothetical addition. Confirm the applicable published limit and actual transaction history before using a real contribution figure.'},
      {id:'tfsa-matrix',type:'heatmap',title:'Same-year requests depend on unused room, not the withdrawal',unit:'money',columns:['$0','$5k','$10k','$20k'],rows:[5000,10000,15000,20000].map(later=>({label:'$'+later/1000+'k ask',values:[0,5000,10000,20000].map(room=>tfsaTimeline({...input,room,later}).blockedLater)})),note:'Rows change the later year-1 request; columns supply starting unused room before the first selected contribution. Cells show that later request’s unplaced amount. The ordinary withdrawal has no effect on this same-year room calculation. Other requests remain selected.'}
    ]};
  }
  if(kind==='respWithdrawals'){
    const p=respBudget(input),points=[...new Set(Array.from({length:11},(_,i)=>input.eapCapacity*i/10))];
    return {metrics:[['Gross EAP used in the model',p.eap,'money'],['Contribution withdrawal toward the budget',p.contribution,'money'],['Additional funding needed',p.gap,'money']],note:'Hypothetical education-budget ledger after promoter verification. Assume a Canadian-resident beneficiary remains eligible in a qualifying full-time program beyond the first 13 consecutive weeks, with the entered contribution and EAP amounts confirmed available after all applicable plan, grant, beneficiary and expense checks. No eligibility, EAP approval, CESG allocation/lifetime limit, administrative threshold, tax return or grant repayment is calculated. Gross EAP is capped at the request, confirmed capacity and the remaining education budget after outside funding, before the allowance; the last cap is a voluntary budgeting convention. Contribution withdrawals fill the remaining net need up to the entered available amount. The allowance is hypothetical, not withholding or final student tax. No account return or payment-date schedule is modeled.',charts:[
      {id:'resp-sources',type:'groupbar',title:'Track available contribution and EAP amounts separately',unit:'money',seriesNames:['Contribution amount','Gross EAP capacity'],rows:[{label:'Confirmed amounts before this budget',values:[input.contributions,input.eapCapacity]},{label:'Amounts remaining after modeled use',values:[p.remainingContributions,p.remainingEap]}],note:'EAP capacity is the gross amount assumed available for this scenario after promoter checks, not an independently verified total of grants and earnings. Money unavailable for these withdrawals is outside the chart. Remaining capacity is not a promise that the same amount will qualify later.'},
      {id:'resp-budget',type:'waterfall',title:'Connect education funding to the net budget',unit:'money',rows:[{label:'Confirmed outside funding',value:input.outside},{label:'Gross modeled EAP',value:p.eap},{label:'Contribution withdrawal',value:p.contribution},{label:'Assumed EAP tax allowance',value:-p.allowance},{label:'Education budget',value:-input.costs}],totalLabel:'Cash left / extra funding needed',note:'Gross EAP and contribution refunds are different payment types. The ledger deducts only the entered budget allowance from EAP, without calculating a student’s tax. Positive cash can arise from outside funding above the budget; negative cash is an unfunded need.'},
      {id:'resp-mix',type:'line',title:'Changing the EAP request changes which source remains',unit:'money',xUnit:'money',xLabel:'Gross EAP requested in the comparison (CAD)',series:[{name:'Contribution amount remaining',rows:points.map(x=>({x,value:respBudget({...input,request:x}).remainingContributions}))},{name:'EAP capacity remaining',rows:points.map(x=>({x,value:respBudget({...input,request:x}).remainingEap})),dash:true}],note:'The grid varies the request from zero to the entered EAP capacity, with the same costs, outside funding, contribution capacity and allowance. Requests also face the model’s voluntary budget cap. The curves are source-use arithmetic, not tax optimization or a recommendation to choose a particular withdrawal mix.'},
      {id:'resp-matrix',type:'heatmap',title:'Unfunded education costs across budget and outside support',unit:'money',columns:['$0','$5k','$10k','$15k'],rows:[20000,30000,40000,50000].map(costs=>({label:'$'+costs/1000+'k cost',values:[0,5000,10000,15000].map(outside=>respBudget({...input,costs,outside}).gap)})),note:'Rows are education budgets; columns are confirmed outside funding. Available contribution amounts, EAP capacity, selected request and hypothetical allowance stay fixed. Cells show extra funding needed after the model’s two withdrawal sources, not an estimate of actual tuition or an EAP entitlement.'}
    ]};
  }
  if(kind==='mortgagePrepay'){
    const p=prepayComparison(input);
    return {metrics:[['Cash actually applied to mortgage at the start',p.prepay.applied,'money'],['Mortgage interest avoided over selected years',p.interestAvoided,'money'],['Prepay minus keep-cash net financial position',p.advantage,'money']],note:'Hypothetical penalty-free permitted lump sum applied at time zero. Mortgage rate is nominal annual compounded semi-annually, converted to a monthly rate, and held fixed through the selected horizon. Both choices retain the original monthly payment computed before prepayment. Savings earn the entered constant effective annual return after tax/costs, converted monthly. Each month savings earn interest, mortgage payments occur, and any unused part of the identical payment budget is deposited into savings. Prepayment is capped at debt; excess starting cash stays liquid. Home value is identical and excluded. No prepayment charge, actual privilege, mortgage interest deduction, renewal, account restriction or investment risk distribution is calculated.',charts:[
      {id:'prepay-debt',type:'line',title:'The same scheduled payment reduces a smaller opening debt',unit:'money',xLabel:'Years after the initial choice',series:[{name:'Mortgage after the lump-sum prepayment',rows:p.prepay.rows.map(r=>({x:r.x,value:r.debt}))},{name:'Mortgage while keeping the cash',rows:p.liquid.rows.map(r=>({x:r.x,value:r.debt})),dash:true}],note:'The comparison preserves the original payment rather than automatically lowering it after the lump sum. Rates stay fixed within the illustration. Once a mortgage is cleared, its debt remains zero and its unused payment budget moves to savings.'},
      {id:'prepay-cash',type:'line',title:'Compare accessible savings as well as outstanding debt',unit:'money',xLabel:'Years after the initial choice',series:[{name:'Liquid savings · prepayment choice',rows:p.prepay.rows.map(r=>({x:r.x,value:r.cash}))},{name:'Liquid savings · keep-cash choice',rows:p.liquid.rows.map(r=>({x:r.x,value:r.cash})),dash:true}],note:'Both choices begin with the same total cash before allocating it. The prepayment choice removes only the amount applied to debt. Home equity is not treated as cash on demand. No borrowing facility or cash release from the property is assumed.'},
      {id:'prepay-bridge',type:'waterfall',title:'Reconcile the difference in cash minus mortgage debt',unit:'money',rows:[{label:'Mortgage interest avoided',value:p.interestAvoided},{label:'Difference in savings growth',value:p.growthDifference}],totalLabel:'Difference in net position',note:'The endpoint equals (prepayment cash − prepayment debt) minus (keep-cash cash − keep-cash debt). Initial resources and monthly payment budgets are identical. Positive favors prepayment in this arithmetic; negative favors keeping cash. It does not value liquidity, taxes beyond the entered net return, penalties or uncertainty.'},
      {id:'prepay-matrix',type:'heatmap',title:'Net-position differences across cash amounts and savings returns',unit:'money',signed:true,columns:['0% cash','2% cash','4% cash','6% cash'],rows:[5000,10000,20000,40000].map(lump=>({label:'$'+lump/1000+'k cash',values:[0,2,4,6].map(cashRate=>prepayComparison({...input,lump,cashRate}).advantage)})),note:'Rows change cash available to either choice; columns change its effective annual return after tax/costs. The mortgage, scheduled payment and horizon stay selected. Each pair starts with equal cash and uses the same monthly budget. These are deterministic scenarios, not offered deposit rates or a recommendation to spend a reserve.'}
    ]};
  }
  throw Error('Unknown account-use planning topic.');
}
