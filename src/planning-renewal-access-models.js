export const renewalAccessDefinitions={
  termPremiumReserve:{title:'Explore two equal premium periods and a dedicated cash reserve',fields:[
    ['currentTermPremium','Monthly premium during the first period (CAD)',50,0,500,10],
    ['nextTermPremium','Independently entered monthly premium during the second period (CAD)',250,0,1000,10],
    ['premiumPeriodYears','Whole years in each of the two periods',10,1,20,1],
    ['premiumAssignment','Household cash assigned to premiums each month (CAD)',150,0,1000,10],
    ['premiumOpening','Cash already reserved at the beginning (CAD)',0,0,50000,1000]
  ]},
  depositEarlyBill:{title:'Compare two hypothetical deposit contracts at the same end date',fields:[
    ['accessPrincipal','Initial deposit in either route (CAD)',20000,1000,100000,1000],
    ['accessBillPercent','Earlier bill as a share of the initial deposit (%)',25,0,90,5],
    ['accessBillDay','Completed days before the bill and permitted principal withdrawal',90,30,364,1],
    ['cashableYield','Hypothetical cashable simple annual rate (%)',3,0,8,.25],
    ['lockedYield','Hypothetical locked simple annual rate (%)',4.5,0,8,.25],
    ['accessLoanRate','Simple annual rate on a separately assumed available bridge loan (%)',8,0,20,1]
  ]}
};

export function premiumRenewalLedger(input){
  const blockMonths=12*input.premiumPeriodYears,totalMonths=2*blockMonths;
  let net=0,lowestNet=0,totalPremium=0,peak={x:0,value:input.premiumOpening};
  const rows=[{x:0,value:input.premiumOpening,premium:0,assigned:0}];
  for(let month=1;month<=totalMonths;month++){
    const premium=month<=blockMonths?input.currentTermPremium:input.nextTermPremium;
    net+=input.premiumAssignment-premium;totalPremium+=premium;lowestNet=Math.min(lowestNet,net);
    const row={x:month,value:input.premiumOpening+net,premium,assigned:input.premiumAssignment};rows.push(row);if(row.value>peak.value)peak=row;
  }
  return {rows,blockMonths,totalMonths,totalPremium,firstPremiums:blockMonths*input.currentTermPremium,nextPremiums:blockMonths*input.nextTermPremium,totalAssigned:totalMonths*input.premiumAssignment,ending:input.premiumOpening+net,requiredOpening:Math.max(0,-lowestNet),extra:Math.max(0,-lowestNet-input.premiumOpening),peak};
}

export function depositAccessLedger(input){
  const principal=input.accessPrincipal,bill=principal*input.accessBillPercent/100,firstDays=input.accessBillDay,remainingDays=365-firstDays;
  const cashableInterest=principal*input.cashableYield/100*firstDays/365+(principal-bill)*input.cashableYield/100*remainingDays/365;
  const lockedInterest=principal*input.lockedYield/100,loanInterest=bill*input.accessLoanRate/100*remainingDays/365;
  const cashableEnding=principal-bill+cashableInterest,lockedEnding=principal+lockedInterest-bill-loanInterest;
  return {principal,bill,firstDays,remainingDays,cashableInterest,lockedInterest,loanInterest,cashableEnding,lockedEnding,difference:lockedEnding-cashableEnding,interestAdvantage:lockedInterest-cashableInterest};
}

export function renewalAccessResult(kind,input){
  if(kind==='termPremiumReserve'){
    const p=premiumRenewalLedger(input);
    const quotedRows=[{x:1,value:input.currentTermPremium},{x:p.blockMonths,value:input.currentTermPremium},{x:p.blockMonths+1,value:input.nextTermPremium},{x:p.totalMonths,value:input.nextTermPremium}];
    return {metrics:[['Premiums across both selected periods',p.totalPremium,'money'],['Largest modeled dedicated cash reserve',p.peak.value,'money'],['Additional opening cash required to fund every selected premium',p.extra,'money']],note:'Original cash-budget illustration with two equally long periods, each containing twelve months per selected year. Both monthly premium amounts are independently entered assumptions; they do not establish an available policy, guaranteed renewal, conversion right, underwriting result or coverage amount. Each month the selected household assignment arrives before that month’s premium. Unspent cash stays in a separate household reserve earning zero. The second premium starts in month '+(p.blockMonths+1)+'. No death event, claim, cancellation, lapse, policy cash value, tax, premium refund, inflation or further renewal is simulated. Negative balances are unfunded premiums, not automatic borrowing. The same household assignment continues throughout both periods and must be affordable outside this sub-budget.',charts:[
      {id:'term-premium-two-periods',type:'line',title:'Put the future premium beside the cash assigned each month',unit:'money',unitLabel:'CAD per month · independently entered premiums and household funding',xMin:1,xLabel:'Month',series:[{name:'Selected monthly premium',rows:quotedRows,step:true},{name:'Monthly household assignment',rows:[{x:1,value:input.premiumAssignment},{x:p.totalMonths,value:input.premiumAssignment}],dash:true}],note:'The table records the phase-boundary months; the second amount applies from month '+(p.blockMonths+1)+' through month '+p.totalMonths+'. The two blocks have equal duration only by assumption. This is not an insurer’s premium schedule or a comparison of policies with different benefits.'},
      {id:'term-premium-household-reserve',type:'line',title:'Follow dedicated household cash through both premium periods',unit:'money',xLabel:'Month',series:[{name:'Reserve after monthly funding and premium',rows:p.rows,step:true}],note:'The first highest modeled balance occurs at month '+p.peak.x+'. A lower early premium can leave cash for a later period only if the household actually keeps that difference. The reserve is an independently held household asset; it is not a term policy’s cash value or a refund of premiums already paid.'},
      {id:'term-premium-full-reconciliation',type:'waterfall',title:'Reconcile the household reserve without turning premiums into an asset',unit:'money',rows:[{label:'Opening dedicated cash',value:input.premiumOpening},{label:'Household assignments in both periods',value:p.totalAssigned},{label:'First-period premiums paid',value:-p.firstPremiums},{label:'Second-period premiums paid',value:-p.nextPremiums}],totalLabel:'Cash remaining after both periods',note:'The endpoint reconciles the dedicated budget, not the value of insurance protection. Premium totals are outflows. No surrender value, claim probability, death benefit or return on premiums is calculated. A final positive balance does not replace the separate check of earlier funding needs.'},
      {id:'term-premium-renewal-matrix',type:'heatmap',title:'Additional opening cash across future premiums and monthly assignments',unit:'money',columns:['$100','$150','$200','$250'],rows:[150,250,350,450].map(nextTermPremium=>({label:'$'+nextTermPremium+' new',values:[100,150,200,250].map(premiumAssignment=>premiumRenewalLedger({...input,nextTermPremium,premiumAssignment}).extra)})),note:'Rows replace the second-period monthly premium; columns replace monthly household cash assigned across both periods. The first premium, equal period lengths and opening reserve stay selected. Cells show extra cash needed at the beginning, not a new premium quote or an assessment of coverage suitability.'}
    ]};
  }
  if(kind==='depositEarlyBill'){
    const p=depositAccessLedger(input);
    return {metrics:[['Cashable route · cash at day 365 after the common bill',p.cashableEnding,'money'],['Locked deposit plus bridge · cash or shortfall at day 365',p.lockedEnding,'money'],['Locked-plus-bridge ending cash minus cashable ending cash',p.difference,'money']],note:'Original equal-end-date comparison, with the same initial deposit and same earlier bill. Hypothetical cashable terms permit principal-only partial withdrawal after thirty completed days; the remaining principal and accrued interest stay until day365, when all interest is paid. Simple daily interest uses a365-day year: full principal for the selected completed days, then remaining principal for365 minus those days. The locked deposit releases nothing before day365 and earns simple annual interest for the full year. Its bill is funded only by an independently assumed available bridge advance equal to that bill; simple bridge interest and principal are paid together at day365. Credit availability is a prerequisite, not an automatic response to a cash gap. No fees, minimum remaining-balance rule, taxes, compounding, rollover, changing rates or additional borrowing is modeled. A negative settlement endpoint requires outside cash. No actual issuer’s withdrawal terms, credit approval or product offer is established.',charts:[
      {id:'deposit-access-common-endpoint',type:'signedbar',title:'Compare net cash only after the same bill and complete settlement',unit:'money',rows:[{label:'Cashable route',value:p.cashableEnding},{label:'Locked plus bridge',value:p.lockedEnding}],note:'Both routes fund the same selected bill at the same earlier day. Endpoints are at day365 after all modeled interest and loan settlement. The locked route’s value is conditional on the separate bridge being available. A negative endpoint is a funding requirement, not permission to overdraw.'},
      {id:'deposit-access-bridge-reconciliation',type:'waterfall',title:'The locked maturity must repay the bridge before cash is free to spend',unit:'money',rows:[{label:'Original locked principal returned',value:p.principal},{label:'Locked deposit interest',value:p.lockedInterest},{label:'Bridge principal repaid',value:-p.bill},{label:'Bridge interest paid',value:-p.loanInterest}],totalLabel:'Net cash after bridge settlement',note:'The bridge advance funded the earlier bill. This reconciliation begins with maturity proceeds and repays that advance; it does not deduct the same bill again. Loan principal is a liability to settle, while loan interest is a cost of retaining the locked deposit until maturity.'},
      {id:'deposit-access-interest-difference',type:'waterfall',title:'Explain the ending difference through interest earned and paid',unit:'money',rows:[{label:'Locked deposit interest',value:p.lockedInterest},{label:'Cashable deposit interest',value:-p.cashableInterest},{label:'Bridge interest',value:-p.loanInterest}],totalLabel:'Locked-plus-bridge advantage or gap',note:'The common initial principal and common bill cancel in this difference. The cashable route earns interest on a smaller principal after its withdrawal. The remaining interest advantage must cover the bridge cost before the locked route ends ahead. This is a before-tax arithmetic comparison, not a recommendation to borrow.'},
      {id:'deposit-access-bill-rate-matrix',type:'heatmap',title:'Ending difference across bill dates and bridge interest rates',unit:'money',signed:true,columns:['Day 30','90','180','300'],rows:[0,5,10,15].map(accessLoanRate=>({label:accessLoanRate+'% loan',values:[30,90,180,300].map(accessBillDay=>depositAccessLedger({...input,accessLoanRate,accessBillDay}).difference)})),note:'Rows replace the simple bridge-loan rate; columns replace completed days before the bill. Initial principal, bill percentage and both deposit rates stay selected. Signed cells are locked-plus-bridge ending cash minus cashable ending cash. Rate and credit availability are assumed independently; color does not identify an available or suitable product.'}
    ]};
  }
  throw Error('Unknown renewal or deposit-access topic.');
}
