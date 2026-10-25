export const accruedInterestDefinitions={
 accruedGicCash:{title:'Plan outside cash for hypothetical tax on a locked compound investment',fields:[
  ['principal','Initial non-registered compound investment (CAD)',100000,10000,1000000,5000],['grossRate','Hypothetical effective annual interest rate (%)',4,0,8,.25],
  ['taxRate','Assumed tax on each dollar of interest (%)',30,0,55,5],['years','Whole investment years until maturity',5,2,10,1],
  ['openingReserve','Outside cash assigned to this tax plan (CAD)',2000,0,50000,500],['monthlyReserve','New cash allocated at each month-end (CAD)',50,0,1000,10]
 ]}
};
export function accruedGicPlan(d){
 let locked=d.principal,cash=d.openingReserve,totalInterest=0,totalTax=0,preMaturityTax=0,minPreMaturityCash=cash;
 const n=12*d.years,rows=[{x:0,locked,cash}],annual=[];
 for(let month=1;month<=n;month++){
  cash+=d.monthlyReserve;
  if(month%12===0){
   const interest=locked*d.grossRate/100,tax=interest*d.taxRate/100;locked+=interest;totalInterest+=interest;totalTax+=tax;
   if(month===n){cash+=locked;locked=0;}else preMaturityTax+=tax;
   cash-=tax;annual.push({year:month/12,interest,tax});
  }
  if(month<n)minPreMaturityCash=Math.min(minPreMaturityCash,cash);
  rows.push({x:month,locked,cash});
 }
 const gap=Math.max(0,-minPreMaturityCash),maturity=d.principal+totalInterest;
 return {rows,annual,totalInterest,totalTax,preMaturityTax,maturity,endingCash:cash,minPreMaturityCash,gap,requiredOpening:d.openingReserve+gap,newCash:n*d.monthlyReserve};
}
export function accruedInterestResult(kind,d){
 if(kind!=='accruedGicCash')throw Error('Unknown accrued-interest planning topic.');
 const p=accruedGicPlan(d);
 return {metrics:[['Modeled tax funding before maturity',p.preMaturityTax,'money'],['Additional opening cash needed before maturity',p.gap,'money'],['Arithmetic cash after maturity and all modeled taxes',p.endingCash,'money']],note:'An independent non-registered compound-investment illustration, not a tax return, GIC offer or filing calendar. Interest compounds annually, no principal or interest is accessible before maturity, and maturity occurs after the final investment year. Each year’s interest is multiplied by one constant assumed tax rate. For a deliberately simplified funding exercise, that amount is paid at each investment-year-end after the month’s reserve transfer; the final year’s payment follows receipt of maturity proceeds. These are hypothetical funding dates, not CRA deadlines, tax withholding or actual anniversary reporting dates. Outside cash earns zero interest. New reserve allocations are external household money, not investment return. Negative provisional cash signals an unfunded requirement and is not an authorized overdraft; no extra cash is silently added. The ending cash arithmetic does not establish that earlier payment dates were affordable. No brackets, credits, benefits, instalments, penalties, registered accounts, ownership attribution, fees or early redemption are calculated.',charts:[
  {id:'accrued-gic-cash-paths',type:'line',title:'Outside cash can run short before the locked investment matures',unit:'money',xLabel:'Completed months before maturity',series:[{name:'Provisional outside cash; negative means funding gap',step:true,rows:p.rows.filter(r=>r.x<12*d.years).map(r=>({x:r.x,value:r.cash}))},{name:'Zero outside cash',dash:true,rows:[{x:0,value:0},{x:12*d.years-1,value:0}]}],note:'This chart focuses on outside cash before maturity, so the later large payout cannot compress the earlier funding gap on the same scale. Monthly allocations arrive before each modeled annual tax payment. The investment remains inaccessible throughout these displayed months; its maturity inflow is reconciled separately below and cannot fund an earlier date retroactively.'},
  {id:'accrued-gic-interest-tax',type:'groupbar',title:'Annual interest recognized is different from cash distributed',unit:'money',seriesNames:['Interest added inside the locked investment','Tax funding at the independently assumed rate'],rows:p.annual.map(r=>({label:'Investment year '+r.year,values:[r.interest,r.tax]})),note:'The interest remains invested until maturity; the second bar is a hypothetical outside-cash payment, not interest withheld from the GIC. Investment-year numbers are not calendar tax years or real payment deadlines. Apply actual reporting amounts and dates separately.'},
  {id:'accrued-gic-total-cash',type:'waterfall',title:'Reconcile the maturity endpoint without calling new savings investment profit',unit:'money',rows:[{label:'Original investment principal',value:d.principal},{label:'Opening outside cash reserve',value:d.openingReserve},{label:'New monthly cash allocations',value:p.newCash},{label:'Gross compound interest',value:p.totalInterest},{label:'All modeled tax payments',value:-p.totalTax}],totalLabel:'Arithmetic cash after maturity and modeled tax payments',note:'No locked investment remains at the endpoint, and maturity proceeds are included only once through original principal plus gross interest. The opening reserve and later allocations are separate household resources. A positive endpoint does not cure an earlier funding gap.'},
  {id:'accrued-gic-reserve-matrix',type:'heatmap',title:'Additional opening cash needed before maturity',unit:'money',unitLabel:'CAD funding gap · rows: assumed tax rate; columns: monthly outside allocation',columns:[0,50,100,200].map(n=>'$'+n),rows:[0,20,30,50].map(taxRate=>({label:taxRate+'% tax',values:[0,50,100,200].map(monthlyReserve=>accruedGicPlan({...d,taxRate,monthlyReserve}).gap)})),note:'Each cell keeps the selected initial investment, interest rate, horizon and existing opening reserve. It reruns the provisional cash ledger before maturity. Zero means those entered resources cover the simplified pre-maturity dates; it does not imply zero tax or confirm actual payment compliance.'}
 ]};
}
