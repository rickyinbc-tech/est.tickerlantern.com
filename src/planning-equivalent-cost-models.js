export const equivalentCostDefinitions={equivalentCost:{title:'Compare repeated service cycles with equivalent annual costs',fields:[
 ['eacCostA','Option A: price paid at the start of each cycle (CAD)',1200,0,10000,100],
 ['eacYearsA','Option A: complete service years per cycle',4,1,8,1],
 ['eacRunA','Option A: running cost at every completed year-end (CAD)',80,0,1000,20],
 ['eacCostB','Option B: price paid at the start of each cycle (CAD)',2000,0,10000,100],
 ['eacYearsB','Option B: complete service years per cycle',8,1,8,1],
 ['eacRunB','Option B: running cost at every completed year-end (CAD)',50,0,1000,20],
 ['eacDiscount','Effective annual discount assumption (%)',4,0,12,.5]
]}};
export const equivalentAnnuityFactor=(ratePercent,years)=>Array.from({length:years},(_,j)=>(1+ratePercent/100)**(-j-1)).reduce((a,b)=>a+b,0);
export function equivalentCycleCost(price,running,years,ratePercent){
 const factor=equivalentAnnuityFactor(ratePercent,years),pv=price+running*factor;
 return {price,running,years,factor,pv,annual:pv/factor};
}
const gcd=(a,b)=>{while(b){const r=a%b;a=b;b=r;}return a;};
export function equivalentCostComparison(i){
 const a=equivalentCycleCost(i.eacCostA,i.eacRunA,i.eacYearsA,i.eacDiscount),b=equivalentCycleCost(i.eacCostB,i.eacRunB,i.eacYearsB,i.eacDiscount),horizon=i.eacYearsA/gcd(i.eacYearsA,i.eacYearsB)*i.eacYearsB;
 let cumulativeA=0,cumulativeB=0,pvA=0,pvB=0;
 const rows=[];
 for(let year=0;year<=horizon;year++){
  const purchaseA=year<horizon&&year%i.eacYearsA===0?i.eacCostA:0,purchaseB=year<horizon&&year%i.eacYearsB===0?i.eacCostB:0;
  const runningA=year>0?i.eacRunA:0,runningB=year>0?i.eacRunB:0,costA=purchaseA+runningA,costB=purchaseB+runningB;
  cumulativeA+=costA;cumulativeB+=costB;pvA+=costA/(1+i.eacDiscount/100)**year;pvB+=costB/(1+i.eacDiscount/100)**year;
  rows.push({x:year,purchaseA,purchaseB,runningA,runningB,costA,costB,cumulativeA,cumulativeB});
 }
 return {a,b,horizon,rows,pvA,pvB};
}
export function equivalentCostResult(kind,i){
 if(kind!=='equivalentCost')throw Error('Unknown equivalent-cost topic.');
 const p=equivalentCostComparison(i),series=(name,key,dash=false)=>({name,step:true,dash,rows:p.rows.map(r=>({x:r.x,value:r[key]}))});
 return {metrics:[['Common service horizon · whole repeated cycles',p.horizon,'integer'],['Option A · equivalent annual cost',p.a.annual,'money'],['Option B · equivalent annual cost',p.b.annual,'money']],note:'Original hypothetical equal-service comparison, not a product quote, lifespan forecast or personal purchase recommendation. Both options deliver the same required service continuously. Each cycle’s purchase is paid at its start; running cost is paid at every completed year-end for the year just used, including the final service year. Both have zero salvage value. Every later cycle repeats the same purchase price, life and running cost in unchanged nominal CAD; no inflation, technological change, quality difference, downtime, tax, fee, grant or financing is modeled. The entered discount assumption is effective annual and applied to that same unchanging nominal price basis. A cycle’s present cost equals its immediate price plus discounted year-end running costs. Dividing by its own year-end annuity factor gives an equivalent annual cost: a valuation transformation, not a bill, depreciation charge or required saving contribution. The common horizon is the least common multiple of the two whole service lives, at most 56 years under these controls. Each option is replaced at its cycle boundaries before that horizon, with no new purchase at the final endpoint; final service costs still apply. Long repeated horizons make a conditional arithmetic comparison and are not a forecast that today’s prices or technology will persist. No bank balance, affordability, available replacement cash or future commitment is calculated.',charts:[
  {id:'equivalent-cost-cash-calendar',type:'line',title:'Annualizing cost does not remove the purchase and replacement dates',unit:'money',unitLabel:'Cumulative nominal CAD outflows · repeated equal-service cycles',xLabel:'Service years · purchase at 0',series:[series('Option A · cumulative actual modeled outflows','cumulativeA'),series('Option B · cumulative actual modeled outflows','cumulativeB',true)],note:'Steps occur at the defined annual transaction dates. At a replacement date, the completed year’s running cost and the next purchase share that instant. The final horizon includes running cost for the service year just completed but no purchase for an unused next cycle. These cumulative outflows are not discounted values or account balances.'},
  {id:'equivalent-cost-annual-comparison',type:'bar',axisRight:36,title:'Convert each complete cycle into a comparable year-end annual equivalent',unit:'money',unitLabel:'Equivalent CAD per service year · paid at year-end in the valuation',rows:[{label:'Option A · equivalent annual cost',value:p.a.annual},{label:'Option B · equivalent annual cost',value:p.b.annual}],note:'Each cycle’s present cost is divided by the annuity factor for that option’s own service life at the selected discount assumption. This is not simply price divided by years when discounting is positive. The annual equivalent includes all selected running costs, but it does not move the actual purchase outflow from time zero.'},
  {id:'equivalent-cost-common-horizon',type:'bar',axisRight:36,title:'Recheck the comparison by pricing both options over the same service horizon',unit:'money',unitLabel:'Time-zero CAD present cost · '+p.horizon+' complete service years',rows:[{label:'Option A · repeated-cycle present cost',value:p.pvA},{label:'Option B · repeated-cycle present cost',value:p.pvB}],note:'Both rows provide the same number of service years, using identical repeat cycles for each option. Each equals its option’s annual equivalent multiplied by the common-horizon annuity factor. A single four-year present cost and a single eight-year present cost would cover different service periods and are not the comparison shown.'},
  {id:'equivalent-cost-price-life-grid',type:'heatmap',signed:true,title:'Test the longer-life assumption beside the purchase price it is meant to justify',unit:'money',unitLabel:'Annual-equivalent CAD difference · option B minus selected option A',columns:['2 yrs','4 yrs','6 yrs','8 yrs'],rows:[1000,1500,2000,2500].map(price=>({label:'$'+(price/1000).toFixed(1)+'k B',values:[2,4,6,8].map(years=>equivalentCycleCost(price,i.eacRunB,years,i.eacDiscount).annual-p.a.annual)})),note:'Rows replace option B’s price and columns replace B’s complete service life. B’s running cost, the common discount assumption and all selected A assumptions remain fixed. Negative is a lower annual-equivalent cost for B; positive is higher. The cells assign no probability to lifespan and do not establish equivalent service quality or cash affordability.'}
 ]};
}
