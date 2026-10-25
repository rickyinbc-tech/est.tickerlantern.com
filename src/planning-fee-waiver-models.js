// Original equal-resource ledger; waiver qualification is an external assumption.
export const feeWaiverDefinitions={feeWaiverCash:{title:'Compare a retained balance with the same funds earning an assumed yield',fields:[
 ['waiverExtra','Additional balance assigned solely to the waiver strategy (CAD)',5000,0,30000,500],
 ['waiverFee','Common outside monthly fee budget (CAD)',16,0,50,1],
 ['waiverYield','Assumed net effective annual alternative yield (%)',3,0,10,.25],
 ['waiverYears','Whole years in the comparison',5,1,15,1],
 ['waiverMonths','Qualifying months each year, beginning with January',12,0,12,1]
 ]}};
export function feeWaiverLedger(i,overrides={}){
 const p={...i,...overrides},annualLog=Math.log1p(p.waiverYield/100),monthlyRate=Math.expm1(annualLog/12);
 let count=0,savedPrincipal=0,savedGrowth=0;const rows=[{x:0,retain:p.waiverExtra,pay:p.waiverExtra,avoided:0,savedGrowth:0,foregone:0,difference:0}];
 for(let month=1;month<=12*p.waiverYears;month++){
  savedGrowth+=(savedPrincipal+savedGrowth)*monthlyRate;
  if((month-1)%12<p.waiverMonths)count++;
  savedPrincipal=count*p.waiverFee;
  if(month%12===0){const foregone=p.waiverExtra*Math.expm1(annualLog*month/12),retain=p.waiverExtra+savedPrincipal+savedGrowth,pay=p.waiverExtra+foregone;
   rows.push({x:month/12,retain,pay,avoided:savedPrincipal,savedGrowth,foregone,difference:savedPrincipal+savedGrowth-foregone});}
 }
 const last=rows.at(-1),growthFactor=Math.expm1(annualLog*p.waiverYears),breakEven=growthFactor>0?(last.avoided+last.savedGrowth)/growthFactor:null;
 return {...last,rows,monthlyRate,breakEven,tieAtZeroYield:growthFactor===0&&last.avoided===0,feesRetain:(12-p.waiverMonths)*p.waiverYears*p.waiverFee,feesPay:12*p.waiverYears*p.waiverFee,outsideBudget:12*p.waiverYears*p.waiverFee};
}
export function feeWaiverResult(kind,input){
 if(kind!=='feeWaiverCash')throw Error('Unknown fee-waiver comparison');
 const r=feeWaiverLedger(input),monthCases=[...new Set([0,3,6,9,12,input.waiverMonths])].sort((a,b)=>a-b);
 const balances=[...new Set([0,input.waiverExtra,input.waiverExtra*2])],yields=[...new Set([0,1,2,3,4,5,input.waiverYield])].sort((a,b)=>a-b);
 return {metrics:[['Ending resources · A minus B',r.difference,'money'],['Fees avoided and actually saved, before growth',r.avoided,'money'],['Break-even additional balance under these assumptions',r.breakEven,'money',r.breakEven==null?(r.tieAtZeroYield?'All balances tie at 0%':'No finite balance at 0%'):undefined]],
 note:'Original hypothetical CAD comparison with equal initial extra funds and the same outside monthly budget. A retains the additional balance in non-interest chequing; in qualifying months, its unused fee budget is saved at month-end in a separate account earning the assumed net yield. Otherwise that budget pays the fee. B puts the same initial funds in the alternative account; the same outside monthly budget pays every fee. B fees are not also deducted from its investment balance. Common operating cash and all other household flows are excluded equally. Only the first selected number of months in each repeated year qualify; eligibility is independently assumed, never inferred from a monthly average or from the additional balance. No daily account ledger or actual bank threshold is calculated. The alternative yield is a constant effective annual net assumption converted to an equivalent monthly rate, not a quoted or guaranteed return. No separate tax, fee change, inflation, account-access feature or product recommendation is calculated.',
 charts:[
  {id:'waiver-equal-resource-paths',type:'line',unit:'money',unitLabel:'CAD resources from the compared initial funds and unused fee budget',xMin:0,xLabel:'Whole year completed',title:'Follow equal starting funds and the same outside fee budget',series:[{name:'A · Retain balance and save waived fees',rows:r.rows.map(x=>({x:x.x,value:x.retain}))},{name:'B · Earn yield and pay fees from budget',dash:true,rows:r.rows.map(x=>({x:x.x,value:x.pay}))}],note:'Both paths begin with the same additional balance. Each month the same outside budget is either spent on the fee or retained as saving. A includes its unchanged chequing balance plus saved fees and their modeled growth. B includes growth on the alternative balance. These paths do not include the household’s other assets, and fee savings that are spent instead would not build A’s displayed resources.'},
  {id:'waiver-resource-difference',type:'waterfall',unit:'money',unitLabel:'CAD contribution to the selected-horizon resource difference',title:'Reconcile avoided fees, their growth and the interest forgone',rows:[{label:'Fees avoided and saved',value:r.avoided},{label:'Growth on the saved fees',value:r.savedGrowth},{label:'Growth forgone on extra balance',value:-r.foregone}],totalLabel:'A minus B · ending resources',note:'The common initial balance cancels. Avoided-fee principal is counted once; only its subsequent growth is added separately. The final subtraction is the alternative growth on the extra balance. This difference equals A’s ending resources less B’s ending resources. It is not the monthly account fee, an annual yield or an actual bank charge.'},
  {id:'waiver-qualifying-months',type:'signedbar',unit:'money',unitLabel:'CAD ending-resource difference; A minus B',title:'Check how fewer qualifying months change the comparison',rows:monthCases.map(months=>({label:months+' qualifying months / year',value:feeWaiverLedger(input,{waiverMonths:months}).difference})),note:'Each row assumes the first listed number of months qualify every year; the remaining fee budgets are spent. All other inputs stay fixed. Earlier saved deposits earn longer than later ones, so the ordering matters. A positive value means A ends with more resources under these assumptions; a negative value means B does. This does not establish eligibility for an actual account.'},
  {id:'waiver-balance-yield-matrix',type:'heatmap',unit:'money',signed:true,unitLabel:'CAD ending-resource difference; A minus B',title:'Stress the additional balance and the assumed net yield',columns:balances.map(b=>'$'+b.toLocaleString('en-CA',{maximumFractionDigits:2})),rows:yields.map(y=>({label:y+'% net',values:balances.map(balance=>feeWaiverLedger(input,{waiverExtra:balance,waiverYield:y}).difference)})),note:'Columns replace the extra balance; rows replace the net effective annual yield. The fee, horizon and qualifying-month pattern stay fixed. Every cell retains equal starting funds and the same outside budget. A larger positive or negative amount is a scenario outcome, not a probability, a market forecast or evidence that the selected bank services are equivalent.'}
 ]};
}
