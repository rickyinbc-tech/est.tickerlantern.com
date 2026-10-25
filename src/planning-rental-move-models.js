export const rentalMoveDefinitions={
  rentalMoveBridge:{title:'Put the rental move and the assumed refund on a cash calendar',fields:[
    ['moveCash','Cash allocated before model day 1 (CAD)',4000,0,30000,500],
    ['movePay','Each net pay deposit on days 10, 25, 40 and 55 (CAD)',2000,0,10000,100],
    ['oldRentCash','Final old-home rent paid on day 1 (CAD)',1800,0,6000,100],
    ['newRentCash','Each new-home rent paid on days 15 and 45 (CAD)',2000,0,6000,100],
    ['newDepositCash','New-home deposit cash paid on day 1 (CAD)',1000,0,6000,100],
    ['moveCostCash','Moving cost paid on day 14 (CAD)',600,0,10000,100],
    ['moveLiving','Each living-cost payment on days 7, 22, 37 and 52 (CAD)',900,0,5000,100],
    ['oldRefundCash','Assumed old-home deposit refund actually received (CAD)',900,0,6000,100],
    ['refundArrival','Assumed refund arrival day; days 61–90 are outside the window',35,1,90,1]
  ]}
};
export function rentalMoveCalendar(input){
  let cumulative=0,receipts=0,outflows=0,refundReceived=0;
  const rows=[{x:0,cumulative:0,balance:input.moveCash,receipt:0,outflow:0}],periods=[{label:'Days 1–30',receipt:0,outflow:0},{label:'Days 31–60',receipt:0,outflow:0}];
  for(let day=1;day<=60;day++){
    const pay=[10,25,40,55].includes(day)?input.movePay:0,refund=day===input.refundArrival?input.oldRefundCash:0;
    const oldRent=day===1?input.oldRentCash:0,newRent=[15,45].includes(day)?input.newRentCash:0;
    const deposit=day===1?input.newDepositCash:0,moving=day===14?input.moveCostCash:0,living=[7,22,37,52].includes(day)?input.moveLiving:0;
    const receipt=pay+refund,outflow=oldRent+newRent+deposit+moving+living;cumulative+=receipt-outflow;receipts+=receipt;outflows+=outflow;refundReceived+=refund;
    const period=periods[day<=30?0:1];period.receipt+=receipt;period.outflow+=outflow;
    rows.push({x:day,cumulative,balance:input.moveCash+cumulative,receipt,outflow});
  }
  const required=Math.max(0,-Math.min(...rows.map(r=>r.cumulative))),additional=Math.max(0,required-input.moveCash);
  return {rows,periods,receipts,outflows,refundReceived,pendingRefund:input.oldRefundCash-refundReceived,required,additional,minimum:Math.min(...rows.map(r=>r.balance)),ending:rows.at(-1).balance};
}
export function rentalMoveResult(kind,input){
  if(kind!=='rentalMoveBridge')throw Error('Unknown rental-move cash topic.');
  const p=rentalMoveCalendar(input);
  return {metrics:[['Cash required before day 1 to fund every modeled day',p.required,'money'],['Additional opening cash needed beyond the allocation',p.additional,'money'],['Allocated cash balance at day 60',p.ending,'money']],note:'A fictional 60-day cash calendar, not a rent-proration calculation, lawful-deposit test or refund entitlement decision. Receipts are available before outflows on the same day. Four pay deposits, four living-cost payments and the stated rent/deposit/moving dates are fixed teaching assumptions. Rent payments can cover occupancy beyond this window; the charts measure cash paid, not accrued housing expense. The old refund is counted only on its entered arrival day; days 61–90 mean it has not arrived within the window. No interest, borrowing, deposit interest, disputed deductions, tax or unlisted bills are calculated. A negative bank balance is unfunded cash need, not approved credit. The fully funded line requires the identified opening cash to come from a separate source.',charts:[
    {id:'rental-move-daily-cash',type:'line',title:'Later receipts cannot fund earlier moving-day obligations',unit:'money',unitLabel:'CAD cash balance after the modeled events on each day',xLabel:'Day in the hypothetical 60-day window',series:[{name:'Currently allocated opening cash',step:true,rows:p.rows.map(r=>({x:r.x,value:r.balance}))},{name:'Opening cash sufficient for every listed day',dash:true,step:true,rows:p.rows.map(r=>({x:r.x,value:p.required+r.cumulative}))}],note:'The second line changes only opening cash; every receipt and payment date remains the same. Negative values on the allocated line identify a funding gap before a later pay or refund arrives. The assumed refund date is not derived from a legal deadline or guaranteed bank processing.'},
    {id:'rental-move-period-cash',type:'groupbar',title:'Thirty-day summaries do not reveal every daily low point',unit:'money',unitLabel:'CAD cash received and paid in each stated window',seriesNames:['Pay and refund actually received','Rent, deposits, moving and living paid'],rows:p.periods.map(r=>({label:r.label,values:[r.receipt,r.outflow]})),note:'Opening cash is excluded from these receipt/outflow bars and included in the balance line. A thirty-day endpoint can remain positive even if a bill within that period was unfunded. The refund appears only in the period in which the model assumes it is actually received.'},
    {id:'rental-move-cash-bridge',type:'waterfall',title:'Reconcile day-60 cash without spending a pending refund',unit:'money',unitLabel:'CAD over the 60-day cash window',rows:[{label:'Cash allocated before day 1',value:input.moveCash},{label:'Four net pay deposits',value:input.movePay*4},{label:'Old deposit refund received',value:p.refundReceived},{label:'Old and new rent paid',value:-input.oldRentCash-input.newRentCash*2},{label:'New deposit cash paid',value:-input.newDepositCash},{label:'Moving cost paid',value:-input.moveCostCash},{label:'Four living-cost payments',value:-input.moveLiving*4}],totalLabel:'Day-60 cash / unfunded gap',note:'The new deposit is a cash outflow; it is not automatically a permanently lost expense. An expected old refund that has not arrived is excluded from cash. The bridge does not value deposit claims, determine deductions or add them to liquid funds. The day-60 endpoint does not replace the daily funding check.'},
    {id:'rental-move-refund-buffer-grid',type:'heatmap',title:'Opening cash and assumed refund arrival change the additional fund',unit:'money',unitLabel:'Columns: refund arrival. Rows: opening cash. Cells: extra opening cash required (CAD)',columns:['Day 10','Day 20','Day 35','Day 61'],rows:[0,2000,4000,6000].map(moveCash=>({label:moveCash?'$'+moveCash/1000+'k cash':'No cash',values:[10,20,35,61].map(refundArrival=>rentalMoveCalendar({...input,moveCash,refundArrival}).additional)})),note:'Each cell reruns the daily ledger with a different opening allocation and assumed arrival of the same entered refund. Day 61 means no refund during the 60-day window. These are funding scenarios, not probabilities, statutory payment dates or an assumption that a disputed refund must arrive.'}
  ]};
}
