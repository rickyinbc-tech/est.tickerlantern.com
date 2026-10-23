// Original TickerLantern analysis. Public corporate facts only; CAD billions
// unless per share. Estimates and probabilities below are analyst judgments.
export const seniorDate='2026-10-18';
export const seniorInputs=Object.freeze({
 price:280.01,dividend:7.04,commonEquity:133.922,endShares:1.384554,
 taxRate:.223,baseEPS:18,basePE:15.5,roe:.181,requiredReturn:.095,growth:.05,
 cet1:.135,requiredCET1:.111,rwa:777.987,creditLoans:1170,creditShares:1.3724,
 rateUpPretax:.373,rateDownPretax:-.558,
});
const rows=[
 {year:'2025A',nii:33,fees:33.605,cost:35.937,pcl:4.362,tax:5.436,deduct:.501,shares:1.411589,loans:null},
 {year:'2026E',nii:34.9,fees:37.6,cost:38.1,pcl:4,taxRate:.223,deduct:.55,shares:1.3935,loans:1100},
 {year:'2027E',nii:37,fees:41,cost:41,pcl:4.5,taxRate:.223,deduct:.55,shares:1.3724,loans:1170},
 {year:'2028E',nii:39.2,fees:44.7,cost:43.7,pcl:6,taxRate:.223,deduct:.55,shares:1.35,loans:1240},
];
export const seniorForecast=rows.map(r=>{
 const revenue=r.nii+r.fees,pppt=revenue-r.cost,pretax=pppt-r.pcl;
 const tax=r.tax??pretax*r.taxRate,net=pretax-tax,common=net-r.deduct;
 return {...r,revenue,pppt,pretax,tax,taxRate:tax/pretax,net,common,eps:common/r.shares,efficiency:r.cost/revenue,pclBps:r.loans?r.pcl/r.loans*10000:null};
});
export const seniorCases=[
 {name:'Bear',eps:15,pe:13,weight:.30},
 {name:'Base',eps:18,pe:15.5,weight:.50},
 {name:'Bull',eps:19.5,pe:17,weight:.20},
].map(r=>({...r,price:r.eps*r.pe,priceReturn:r.eps*r.pe/seniorInputs.price-1,totalReturn:(r.eps*r.pe+seniorInputs.dividend)/seniorInputs.price-1}));
export const segmentGrowth=[
 {name:'Wealth Management',now:1.442,prior:1.096},
 {name:'Capital Markets',now:1.544,prior:1.328},
 {name:'Commercial Banking',now:.936,prior:.836},
 {name:'Corporate Support',now:-.018,prior:-.031},
 {name:'Personal Banking',now:1.923,prior:1.938},
 {name:'Insurance',now:.197,prior:.247},
].map(r=>({...r,change:r.now-r.prior}));
export function commonBook(){return seniorInputs.commonEquity/seniorInputs.endShares;}
export function stableValue(roe=.181,requiredReturn=.095,growth=.05){
 if(![roe,requiredReturn,growth].every(Number.isFinite)||requiredReturn<=growth||roe<growth||growth<0)throw Error('Stable-growth assumptions must converge and ROE must fund growth.');
 return commonBook()*(roe-growth)/(requiredReturn-growth);
}
export function fadeValue(){
 let book=commonBook(),pv=0;const r=[.181,.17575,.1705,.16525,.16];
 r.forEach((roe,i)=>{pv+=(roe-.05)*book/1.095**(i+1);book*=1.05;});
 return pv+book*(.16-.05)/(.095-.05)/1.095**5;
}
export function creditRateEPS(extraCreditBps,rateShock=0){
 const v=seniorInputs;
 const rate=rateShock===-100?v.rateDownPretax:rateShock===100?v.rateUpPretax:0;
 return v.baseEPS+(rate-v.creditLoans*extraCreditBps/10000)*(1-v.taxRate)/v.creditShares;
}
export function capitalHeadroom(floor){return (seniorInputs.cet1-floor)*seniorInputs.rwa;}
export function seniorSummary(){
 const v=seniorInputs,base=seniorCases[1];
 const weightedPrice=seniorCases.reduce((s,r)=>s+r.weight*r.price,0);
 return {base,book:commonBook(),weightedPrice,weightedReturn:(weightedPrice+v.dividend)/v.price-1,
  entryFor10pct:(base.price+v.dividend)/1.1,epsFor10pct:(v.price*1.1-v.dividend)/v.basePE,
  impliedROE:v.growth+(v.price/commonBook())*(v.requiredReturn-v.growth),
  steadyValue:stableValue(),fadeValue:fadeValue(),
  growthShare:(segmentGrowth[0].change+segmentGrowth[1].change)/segmentGrowth.reduce((s,r)=>s+r.change,0)};
}
export const seniorPreset=Object.freeze({price:280.01,eps:18,book:commonBook(),exitEPS:18,exitPE:15.5,dividend:7.04,hurdle:10,roe:18.1,requiredReturn:9.5,growth:5});
