export const feeSlicesDefinitions={feeSlices:{title:'Read a hypothetical annual fee schedule in slices and whole-balance bands',fields:[
 ['feeBase','Constant annual fee base (CAD)',250000,0,1000000,10000],
 ['feeFirst','Annual rate: first CAD 100,000 / lowest band (%)',.8,0,2,.1],
 ['feeMiddle','Annual rate: next CAD 400,000 / middle band (%)',.5,0,2,.1],
 ['feeTop','Annual rate: above CAD 500,000 / highest band (%)',.3,0,2,.1],
 ['feeMinimum','Minimum annual asset charge, before fixed fee (CAD)',300,0,2000,50],
 ['feeFixed','Fixed annual account fee, added after minimum (CAD)',120,0,500,20]
]}};
export function feeSlicesQuote(i,base=i.feeBase){
 const slices=[Math.min(base,100000),Math.min(Math.max(base-100000,0),400000),Math.max(base-500000,0)],rates=[i.feeFirst,i.feeMiddle,i.feeTop].map(r=>r/100);
 const sliceCharges=slices.map((v,j)=>v*rates[j]),progressiveRaw=sliceCharges.reduce((a,b)=>a+b,0);
 const band=base<=100000?0:base<=500000?1:2,wholeRaw=base*rates[band];
 const progressiveUplift=Math.max(0,i.feeMinimum-progressiveRaw),wholeUplift=Math.max(0,i.feeMinimum-wholeRaw);
 const progressive=progressiveRaw+progressiveUplift+i.feeFixed,whole=wholeRaw+wholeUplift+i.feeFixed;
 return {base,slices,rates,sliceCharges,band,progressiveRaw,wholeRaw,progressiveUplift,wholeUplift,progressive,whole,progressiveRate:base>0?progressive/base:null,wholeRate:base>0?whole/base:null};
}
export function feeSlicesResult(kind,i){
 if(kind!=='feeSlices')throw Error('Unknown fee-slices topic.');
 const p=feeSlicesQuote(i),bases=[25000,100000,250000,500000,750000,1000000];
 return {metrics:[['Progressive slices · total annual charge',p.progressive,'money'],['Whole-balance band · total annual charge',p.whole,'money'],['Progressive total / selected fee base',p.progressiveRate,'percent',p.base===0?'N/A · zero fee base':undefined]],note:'Two invented annual fee formulas use the same rates, fixed thresholds, minimum asset charge and fixed annual account fee. Neither is a provider quote, a typical-market estimate or a recommended fee. The fee base is constant for this one-year quote; no average-balance, quarterly, prorated or market-value billing convention is inferred. Progressive charges apply each rate only to its slice. Whole-balance charges apply one rate to the entire fee base: up to and including CAD 100,000 uses the first rate; above CAD 100,000 through CAD 500,000 inclusive uses the middle rate; above CAD 500,000 uses the top rate. The minimum is applied to the asset charge FIRST, and the fixed annual fee is added once afterward. The hypothetical account remains open and both minimum and fixed fee can apply even at a zero base; no zero-balance waiver is assumed. Fees are a quote payable from outside the modeled asset base. No account deduction, investment path, return, tax deduction, sales tax, fund expense, transaction cost or service-quality adjustment is calculated. Rates may be edited in any order; statements about lower higher-band rates refer to the default schedule.',charts:[
  {id:'fee-slices-progressive-bridge',type:'waterfall',title:'Build the progressive annual quote one asset slice at a time',unit:'money',unitLabel:'CAD for the year · constant selected fee base',rows:[
   {label:'First CAD 100,000 slice',value:p.sliceCharges[0]},
   {label:'Next CAD 400,000 slice',value:p.sliceCharges[1]},
   {label:'Above CAD 500,000 slice',value:p.sliceCharges[2]},
   {label:'Minimum asset-charge uplift',value:p.progressiveUplift},
   {label:'Fixed annual account fee',value:i.feeFixed}
  ],totalLabel:'Total progressive annual charge',note:'Each slice is capped before its annual rate is applied. The minimum row adds only the difference needed to reach the selected asset-charge floor; it does not add the full minimum on top of a larger asset charge. The fixed fee is then included once. No slice rate is applied again to the full balance.'},
  {id:'fee-slices-balance-comparison',type:'groupbar',axisRight:36,title:'The same listed rates can produce different annual dollar charges',unit:'money',unitLabel:'Annual CAD · rows replace fee base only',seriesNames:['Progressive slices','Whole-balance band'],rows:bases.map(base=>{const q=feeSlicesQuote(i,base);return {label:'CAD '+base.toLocaleString('en-CA')+' fee base',values:[q.progressive,q.whole]};}),note:'Every row is an independent constant-base annual quote using the entered rates, minimum and fixed fee. The exact thresholds stay in the lower whole-balance band. These six balances are comparisons, not successive years or a forecast of assets. A cost difference alone says nothing about whether two services are equivalent.'},
  {id:'fee-slices-threshold-changes',type:'signedbar',axisRight:36,title:'Crossing a threshold can change the charge on more than the extra CAD 100',unit:'money',unitLabel:'Change in total annual CAD charge · base increases by CAD 100',rows:[100000,500000].flatMap(base=>{const a=feeSlicesQuote(i,base),b=feeSlicesQuote(i,base+100),label=base===100000?'100k → 100,100':'500k → 500,100';return [{label:'Progressive · '+label,value:b.progressive-a.progressive},{label:'Whole balance · '+label,value:b.whole-a.whole}];}),note:'Each pair compares the threshold balance with exactly CAD 100 more. Progressive pricing retains earlier slice charges. Whole-balance pricing can reprice all assets at a new rate; with the default descending rates, the annual bill can fall. An active minimum may mask that change. The fixed fee cancels from these differences. Bars do not interpolate a continuous path across a band jump.'},
  {id:'fee-slices-effective-rates',type:'heatmap',title:'Divide the complete annual charge by the same positive fee base',unit:'percent',unitLabel:'Complete annual fee divided by fee base (%)',compactValues:false,columns:['50k','250k','1m'],rows:[['Progressive','progressiveRate'],['Whole band','wholeRate']].map(([label,key])=>({label,values:[50000,250000,1000000].map(base=>feeSlicesQuote(i,base)[key])})),note:'Columns replace the constant annual fee base in CAD. Each cell includes the minimum adjustment and fixed fee before dividing by that base. This effective charge ratio is not the marginal rate on an additional dollar or a portfolio expense ratio. These comparisons use positive denominators; the selected-base headline reports N/A at zero.'}
 ]};
}
