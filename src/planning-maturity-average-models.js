export const maturityAverageDefinitions={
 maturityCalendar:{title:'Compare two principal calendars with the same face-weighted mean maturity',fields:[
  ['maturityFace','Total promised principal receipts in each calendar (CAD)',20000,1000,500000,1000],
  ['maturityMean','Common face-weighted mean maturity (whole years)',6,4,8,1],
  ['maturitySpacing','Years on either side of the mean for two equal tranches',2,0,3,1],
  ['maturityBill','One planned cash payment (CAD)',20000,1000,500000,1000],
  ['maturityBillYear','Whole year when that payment is due',6,1,12,1],
  ['maturityOpeningCash','Separate opening cash available for the payment (CAD)',2000,0,100000,1000]
 ]}
};
export function maturityCalendarPlan(d){
 const early=d.maturityMean-d.maturitySpacing,late=d.maturityMean+d.maturitySpacing;
 let splitCash=d.maturityOpeningCash,singleCash=d.maturityOpeningCash,splitMin=splitCash,singleMin=singleCash,splitPrincipal=0,singlePrincipal=0;
 const rows=[{x:0,splitCash,singleCash,splitReceipt:0,singleReceipt:0,bill:0,splitPrincipal:0,singlePrincipal:0}];
 for(let year=1;year<=12;year++){
  const splitReceipt=(year===early?d.maturityFace/2:0)+(year===late?d.maturityFace/2:0),singleReceipt=year===d.maturityMean?d.maturityFace:0,bill=year===d.maturityBillYear?d.maturityBill:0;
  splitPrincipal+=splitReceipt;singlePrincipal+=singleReceipt;splitCash+=splitReceipt-bill;singleCash+=singleReceipt-bill;
  splitMin=Math.min(splitMin,splitCash);singleMin=Math.min(singleMin,singleCash);
  rows.push({x:year,splitCash,singleCash,splitReceipt,singleReceipt,bill,splitPrincipal,singlePrincipal});
 }
 const due=rows[d.maturityBillYear];
 return {early,late,mean:(early+late)/2,rows,due,end:rows.at(-1),splitExtra:Math.max(0,-splitMin),singleExtra:Math.max(0,-singleMin)};
}
export function maturityAverageResult(kind,d){
 if(kind!=='maturityCalendar')throw Error('Unknown mean-maturity topic.');
 const p=maturityCalendarPlan(d),dates=[...new Set([p.early,d.maturityMean,p.late])].sort((a,b)=>a-b);
 return {metrics:[['Common face-weighted mean maturity, in years',p.mean,'decimal'],['Additional opening cash needed: two equal tranches',p.splitExtra,'money'],['Additional opening cash needed: one principal receipt',p.singleExtra,'money']],note:'Two original principal-only receipt schedules, already assumed held at time zero. One splits the entered future principal equally between mean year minus spacing and mean year plus spacing. The other receives all principal at the mean year. Face amounts, rather than purchase prices or market values, determine the stated weighting. Purchase costs and pricing are absent, so equal face totals and mean dates do not imply equal investment costs or returns. All principal is assumed paid in full and on time. A single bill is due in the entered whole year; receipts in that same year arrive immediately before the bill. Opening cash and earlier receipts remain available without interest. The fixed twelve-year chart includes every permitted receipt and bill. Negative cash records an unfunded payment requirement; the model supplies no loan, early sale, overdraft or delayed payment. No coupons, reinvestment, taxes, inflation, default, calls, settlement delays, fund redemptions or bond-price sensitivity is modeled. The mean is not modified duration or proof of cash-flow matching.',charts:[
  {id:'maturity-average-receipt-dates',type:'groupbar',title:'Equal principal totals and equal mean maturities still allow different receipt dates',unit:'money',seriesNames:['Two equal principal tranches','One principal receipt at the mean year'],rows:dates.map(year=>({label:'Year '+year,values:[p.rows[year].splitReceipt,p.rows[year].singleReceipt]})),note:'Bars show principal received in each named year. The two schedules each receive the same total face amount. Zero spacing places both equal tranches in the mean year, making the calendars identical. These amounts are future principal receipts, not current purchase prices or investment profits.'},
  {id:'maturity-average-cash-calendar',type:'line',title:'A later principal receipt can repair the endpoint without funding the earlier bill',unit:'money',unitLabel:'CAD cash after each year’s principal receipts and the single planned payment',xLabel:'Completed model years',series:[{name:'Cash with two equal principal tranches',step:true,rows:p.rows.map(r=>({x:r.x,value:r.splitCash}))},{name:'Cash with one receipt at the mean year',dash:true,step:true,rows:p.rows.map(r=>({x:r.x,value:r.singleCash}))}],note:'Within a year, principal arrives before the bill. Each path begins with the same separate opening cash and subtracts the same bill once. The final balances agree after all receipts, but the lowest cash points can differ. A negative segment is a funding gap, not an automatically financed account. Actual dates within a year must be checked before assuming a maturity can fund a bill that year.'},
  {id:'maturity-average-due-bridge',type:'waterfall',title:'Reconcile the two-tranche calendar at the payment deadline',unit:'money',rows:[{label:'Separate opening cash',value:d.maturityOpeningCash},{label:'Principal receipts available by the bill date',value:p.due.splitPrincipal},{label:'The planned payment due then',value:-d.maturityBill}],totalLabel:'Cash position immediately after the bill',note:'Only principal received on or before the stated bill date enters this bridge. Principal scheduled later remains an outstanding claim and is not spendable cash here. A negative endpoint is the additional amount needed at that date under the assumed order of events.'},
  {id:'maturity-average-deadline-matrix',type:'heatmap',title:'A constant mean maturity does not keep deadline funding needs constant',unit:'money',unitLabel:'CAD additional opening cash · rows: bill year; columns: spacing around the selected mean year',columns:['0 years','1 year','2 years','3 years'],rows:[-2,-1,0,1,2].map(offset=>{const maturityBillYear=d.maturityMean+offset;return {label:'Year '+maturityBillYear,values:[0,1,2,3].map(maturitySpacing=>maturityCalendarPlan({...d,maturityBillYear,maturitySpacing}).splitExtra)};}),note:'Every cell retains the selected common mean year, principal total, bill amount and opening cash. It replaces the bill year and the two-tranche spacing. The two equal tranches always preserve the same face-weighted mean. Cells are cash gaps, not price losses, probabilities or market-duration estimates.'}
 ]};
}
