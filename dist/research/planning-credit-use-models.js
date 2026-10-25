export const creditUseDefinitions={
  creditUse:{title:'Explore card-level ratios, combined limits and an illustrative snapshot calendar',fields:[
    ['limitA','Card A stated limit (CAD)',1000,100,50000,100],['balanceA','Card A opening balance (CAD)',900,0,50000,100],
    ['limitB','Card B stated limit (CAD)',9000,100,50000,100],['balanceB','Card B opening balance (CAD)',0,0,50000,100],
    ['payment','Payment requested toward Card A (CAD)',500,0,50000,100],['payDay','Day payment is credited in the 31-day illustration',10,1,31,1],
    ['snapshotDay','Day the separate reference snapshot is captured',15,1,31,1],['newPurchase','New Card A purchase posted on illustration day 20 (CAD)',300,0,10000,50]
  ]}
};
export function creditUseCalendar(input){
  const limits=input.limitA+input.limitB,initial=(input.balanceA+input.balanceB)/limits;
  let balance=input.balanceA,reference=initial,paymentUsed=0;
  const rows=[{x:0,value:initial,reference,balanceA:balance,payment:0,purchase:0}];
  for(let day=1;day<=31;day++){
    const purchase=day===20?input.newPurchase:0;balance+=purchase;
    const payment=day===input.payDay?Math.min(balance,input.payment):0;balance-=payment;paymentUsed+=payment;
    const value=(balance+input.balanceB)/limits;
    if(day===input.snapshotDay)reference=value;
    rows.push({x:day,value,reference,balanceA:balance,payment,purchase});
  }
  return {rows,initial,captured:rows[input.snapshotDay].value,ending:rows.at(-1).value,paymentUsed,limits,openingDebt:input.balanceA+input.balanceB,headroom:limits-input.balanceA-input.balanceB,afterOpeningPayment:(Math.max(0,input.balanceA-input.payment)+input.balanceB)/limits,withoutUnusedB:input.balanceB===0?input.balanceA/input.limitA:null};
}
export function creditUseResult(kind,input){
  if(kind!=='creditUse')throw Error('Unknown credit-utilization topic.');
  const p=creditUseCalendar(input),comparisons=[{label:'Opening selected group',value:p.initial},{label:'After payment on opening A',value:p.afterOpeningPayment}];
  if(p.withoutUnusedB!=null)comparisons.push({label:'After removing unused B limit',value:p.withoutUnusedB});
  return {metrics:[['Opening combined balance-to-limit ratio',p.initial,'percent'],['Combined ratio at the selected snapshot',p.captured,'percent'],['Combined ratio at day 31',p.ending,'percent']],note:'Hypothetical ordinary open-card group with positive stated limits. Ratios are balances divided by limits, not predicted scores or approval odds. A 31-day illustration starts with the entered balances. On each day, the day-20 purchase posts first, any selected Card A payment is credited second, and the selected reference snapshot is captured last. The payment is capped at Card A debt; Card B stays unchanged. Reference snapshots are captured at opening and the selected day only: they are not real bureau data or assumed reporting standards. No interest, fees, due-date compliance, processing lag or new-credit approval is modeled. A balance above a stated limit is displayed without implying permission to exceed it.',charts:[
    {id:'credit-use-starting-ratios',type:'bar',title:'Individual card ratios can differ from the combined ratio',unit:'percent',unitLabel:'Outstanding balance divided by the relevant stated limit',rows:[{label:'Card A',value:input.balanceA/input.limitA},{label:'Card B',value:input.balanceB/input.limitB},{label:'Selected cards combined',value:p.initial}],note:'Combined is total selected debt divided by total selected limits, not the simple mean of card percentages. These are explicit arithmetic definitions, not a reconstruction of a bureau scoring model.'},
    {id:'credit-use-limit-bridge',type:'waterfall',title:'Reconcile unused credit at the opening snapshot',unit:'money',rows:[{label:'Card A stated limit',value:input.limitA},{label:'Card B stated limit',value:input.limitB},{label:'Less Card A opening debt',value:-input.balanceA},{label:'Less Card B opening debt',value:-input.balanceB}],totalLabel:'Unused credit / amount over limits',note:'Unused credit is borrowing headroom under the stated arithmetic. It is not household income, savings or permission to borrow. Actual available credit can differ because of holds, fees, issuer rules or transactions absent from the inputs.'},
    {id:'credit-use-payment-closure-comparison',type:'bar',title:'Different changes to the same opening group',unit:'percent',unitLabel:'Combined selected-card balance-to-limit ratio',rows:comparisons,note:'Each bar starts independently from the opening group. The payment case reduces only opening Card A debt, capped at that debt, without the later purchase. The unused-B closure case appears only when B starts at zero. It removes that limit without changing debt; it does not predict a score effect or recommend closure.'},
    {id:'credit-use-snapshot-calendar',type:'line',title:'Current modeled balances and a separately captured reference',unit:'percent',unitLabel:'Combined selected-card balance-to-limit ratio',xLabel:'Day of a hypothetical 31-day window',series:[{name:'Current modeled combined ratio',step:true,rows:p.rows.map(r=>({x:r.x,value:r.value}))},{name:'Last captured reference snapshot',dash:true,step:true,rows:p.rows.map(r=>({x:r.x,value:r.reference}))}],note:'A payment or purchase changes the current modeled balance on its selected posting day. The separate reference changes only on the chosen capture day. This does not assert that a lender reports on a statement date, due date, or any specific day.'},
    {id:'credit-use-date-matrix',type:'heatmap',title:'Combined ratio at different payment and snapshot dates',unit:'percent',unitLabel:'Combined selected-card balance-to-limit ratio',columns:['Day 7','Day 15','Day 21','Day 30'],rows:[5,10,20,28].map(payDay=>({label:'Pay day '+payDay,values:[7,15,21,30].map(snapshotDay=>creditUseCalendar({...input,payDay,snapshotDay}).captured)})),note:'Rows replace the credited-payment day; columns replace the reference-capture day. The same day-20 purchase and requested payment apply. The actual payment can differ if debt available to repay differs on that day. These dates are teaching assumptions and say nothing about whether a real payment meets its due date.'}
  ]};
}
