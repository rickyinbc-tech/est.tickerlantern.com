export const rentalMoveDefinitions={
  rentalMove:{title:'Explore a hypothetical six-month rental move',fields:[
    ['reserve','Cash already set aside for this move (CAD)',2500,0,30000,100],
    ['monthly','Monthly cash available after the regular household budget (CAD)',400,0,3000,100],
    ['newDeposit','New rental deposit paid at the start of month 1 (CAD)',1200,0,6000,100],
    ['overlap','Extra overlap rent paid at the start of month 2 (CAD)',2000,0,10000,100],
    ['moving','Moving and setup costs paid at the start of month 2 (CAD)',1500,0,10000,100],
    ['oldRefund','Assumed old-deposit cash refund (CAD)',1000,0,10000,100],
    ['refundMonth','Refund at month-end: 3–6; enter 7 for after this window',3,3,7,1],
    ['floor','Selected cash buffer to preserve during the move (CAD)',500,0,20000,100]
  ]}
};
export function rentalMovePath(input){
  let balance=input.reserve,refundReceived=0;
  const rows=[{x:0,before:balance,value:balance,bills:0,refund:0}];
  for(let month=1;month<=6;month++){
    const bills=month===1?input.newDeposit:month===2?input.overlap+input.moving:0;
    const before=balance-bills,refund=month===input.refundMonth?input.oldRefund:0;
    balance=before+input.monthly+refund;refundReceived+=refund;
    rows.push({x:month,before,value:balance,bills,refund});
  }
  const lowest=Math.min(...rows.map(r=>r.before));
  return {rows,lowest,ending:balance,refundReceived,extra:Math.max(0,input.floor-lowest),monthsBelow:rows.slice(1).filter(r=>r.before<input.floor).length};
}
export function rentalMoveResult(kind,input){
  if(kind!=='rentalMove')throw Error('Unknown rental-move topic.');
  const p=rentalMovePath(input);
  return {metrics:[['Additional initial cash to preserve the selected buffer',p.extra,'money'],['Lowest funding position before month-end receipts',p.lowest,'money'],['Funding position after month 6, before adding extra cash',p.ending,'money']],note:'Original hypothetical six-month cash-timing model in nominal CAD. Regular rent and living costs are already covered outside this ledger; the monthly amount is the surplus available afterward. The new deposit is paid at the start of month 1; extra overlap rent and moving/setup costs at the start of month 2. Monthly surplus and any assumed old-deposit refund arrive at month-end. Negative positions identify an unfunded need using the entered resources, not an actual overdraft or an assumed loan. The solved additional initial cash is shown separately and is not silently added to the charts. The refund amount and month are independent assumptions, not a legal entitlement or deadline. Month 7 means no refund within these six months. The new deposit is not returned within the window. No interest, borrowing, tax, deposit eligibility or dispute outcome is calculated. The selected buffer is a personal scenario input, not a recommended minimum.',charts:[
    {id:'rental-move-timing',type:'line',title:'Read the position before the month-end money arrives',unit:'money',unitLabel:'Move funding position using entered resources (CAD)',xLabel:'Model month',series:[{name:'After bills, before receipts',rows:p.rows.map(r=>({x:r.x,value:r.before}))},{name:'After month-end surplus and refund',rows:p.rows.map(r=>({x:r.x,value:r.value})),dash:true},{name:'Selected buffer',rows:[{x:0,value:input.floor},{x:6,value:input.floor}]}],note:'These are two observations of the same ledger within each month. Month 0 is the opening cash. Straight line segments connect monthly observations and do not imply daily payments. The before-receipt points expose a need that later receipts cannot fund retroactively. No solved extra initial cash has been added.'},
    {id:'rental-move-upfront',type:'stackbar',title:'A deposit and consumed moving costs both need upfront cash',unit:'money',unitLabel:'Scheduled payments from the move cash pool (CAD)',seriesNames:['New deposit','Extra overlap rent','Moving and setup'],rows:[{label:'Start of month 1',values:[input.newDeposit,0,0]},{label:'Start of month 2',values:[0,input.overlap,input.moving]}],note:'The new deposit may represent a recoverable amount under the applicable agreement and law, but it still removes spendable cash now. Overlap rent is only the additional rent beyond the regular household budget. Moving/setup is a separate assumed non-refundable cost total. Neither regular rent nor a future return of the new deposit is added here.'},
    {id:'rental-move-reconcile',type:'waterfall',title:'Reconcile the six-month endpoint without hiding the earlier gap',unit:'money',rows:[{label:'Opening move cash',value:input.reserve},{label:'Six monthly surplus transfers',value:6*input.monthly},{label:'Old refund received in this window',value:p.refundReceived},{label:'New deposit paid',value:-input.newDeposit},{label:'Extra overlap rent',value:-input.overlap},{label:'Moving and setup',value:-input.moving}],totalLabel:'Funding position after month 6',note:'The endpoint is opening cash plus receipts less payments. It does not establish that the schedule was fundable at every earlier date. The buffer is a target, not a payment, and is not deducted. An old-deposit refund returns previously tied-up money; it is not pay from work. A refund after month 6 is excluded from this endpoint rather than treated as permanently lost.'},
    {id:'rental-move-delay-grid',type:'heatmap',title:'Compare the duration below your chosen buffer',unit:'integer',unitLabel:'Months 1–6 below buffer; rows: monthly surplus (CAD)',columns:['Month 3','Month 4','Month 5','Later'],rows:[0,400,800,1200].map(monthly=>({label:monthly.toLocaleString('en-CA')+'/mo',values:[3,4,5,7].map(refundMonth=>rentalMovePath({...input,monthly,refundMonth}).monthsBelow)})),note:'Rows replace the monthly surplus; columns replace the old-refund receipt month. Later means after month 6. All other entered amounts stay fixed. Each cell counts before-receipt points strictly below the selected buffer, excluding month 0. It is a duration count, not dollars owed, interest expense or a probability. A month can be counted even when its month-end position recovers.'}
  ]};
}
