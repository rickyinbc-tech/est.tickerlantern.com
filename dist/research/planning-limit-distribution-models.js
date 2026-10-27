export const limitDistributionDefinitions={
  tfsaLimitIndex:{title:'Follow the TFSA dollar limit as it is indexed to inflation in CAD 500 steps',fields:[
    ['tlAge','Your age at the end of 2026 (resident in Canada since age 18)',40,18,100,1],
    ['tlInflation','Yearly CPI inflation assumed after 2027 (%)',2,0,8,.1],
    ['tlHorizon','Years projected after 2026',14,2,34,1]
  ]},
  preDistribution:{title:'Buy a non-registered fund just before its distribution, or just after?',fields:[
    ['pdAmount','Amount invested (CAD)',20000,1000,2000000,500],
    ['pdDist','Distribution as a share of the unit price (%)',8,0,30,.5],
    ['pdGainShare','Part of the distribution that is capital gains (%)',75,0,100,5],
    ['pdRate','Combined federal and provincial marginal tax rate (%)',29.65,0,60,.05],
    ['pdYears','Years until the units are sold',10,1,40,1],
    ['pdGrowth','Unit price growth per year after the purchase (%)',5,-5,12,.25],
    ['pdCash','After-tax return on the cash used to pay the tax (%)',2.5,0,8,.25]
  ]}
};
export const limitDistributionWholeKeys=['tlAge','tlHorizon','pdYears'];

// CRA's published TFSA dollar limits, 2009–2026 (Income Tax Act s. 207.01, "TFSA dollar limit").
export const tfsaLimits={2009:5000,2010:5000,2011:5000,2012:5000,2013:5500,2014:5500,2015:10000,2016:5500,2017:5500,2018:5500,2019:6000,2020:6000,2021:6000,2022:6000,2023:6500,2024:7000,2025:7000,2026:7000};
// Section 117.1 indexation factors: average CPI for the 12 months to 30 September before the year, divided by the
// same average a year earlier, minus 1, rounded to 0.001. Recomputed from Statistics Canada CPI (v41690973, via the
// Bank of Canada Valet API, retrieved 26 October 2026); 2023–2026 match CRA's published 6.3%, 4.7%, 2.7% and 2.0%.
// 2027 uses CPI to September 2026 and had not been published by CRA when retrieved.
export const tfsaFactors={2010:.006,2011:.014,2012:.028,2013:.020,2014:.009,2015:.017,2016:.013,2017:.014,2018:.015,2019:.022,2020:.019,2021:.010,2022:.024,2023:.063,2024:.047,2025:.027,2026:.020,2027:.026};
// All-items CPI (2002=100), not seasonally adjusted: January of each year, and September 2026.
export const cpiJanuary={2009:113.0,2010:115.1,2011:117.8,2012:120.7,2013:121.3,2014:123.1,2015:124.3,2016:126.8,2017:129.5,2018:131.7,2019:133.6,2020:136.8,2021:138.2,2022:145.3,2023:153.9,2024:158.3,2025:161.3,2026:165.0};
export const cpiLatest={label:'September 2026',value:170.0};

// Nearest multiple of 500, with a tie going to the higher multiple. The tiny allowance stops float error from turning
// an exact tie (e.g. 6,250.0000001 or 6,249.9999999) into the wrong side.
export const roundTo500=v=>Math.floor(v/500+.5+1e-9)*500;
const round3=f=>Math.floor(f*1000+.5+1e-9)/1000;

export function tfsaLimitPath(input,overrides={}){
  const i={...input,...overrides},f=round3(i.tlInflation/100),end=2026+i.tlHorizon,rows=[];
  let indexed=5000;
  for(let y=2009;y<=end;y++){
    if(y>2009)indexed*=1+(tfsaFactors[y]??f);
    const kind=y<=2026?'published':y===2027?'calculated':'projected';
    rows.push({year:y,indexed,limit:y<=2026?tfsaLimits[y]:roundTo500(indexed),kind});
  }
  return rows;
}
// First year (after 2026) in which the limit reaches the target, searching to 2100; null if not reached.
export function tfsaLimitReaches(target,inflation){
  const rows=tfsaLimitPath({tlInflation:inflation,tlHorizon:74});
  return rows.find(r=>r.year>2026&&r.limit>=target)?.year??null;
}

const capitalGainsInclusion=.5;
// Buying before: the units are bought at the pre-distribution price, the distribution is reinvested at the lower
// post-distribution price, so the investor ends with exactly the same units as someone who buys just after. The
// reinvested distribution is added to the adjusted cost base. Tax on it is paid this year from outside cash, which would
// otherwise have earned the entered after-tax cash return. Capital-gains parts are half included; the rest is taxed at
// the full marginal rate. A sale below cost is treated as a capital loss usable at the same rate.
export function preDistributionPlan(input,overrides={}){
  const i={...input,...overrides},A=i.pdAmount,D=A*i.pdDist/100,g=i.pdGainShare/100,t=i.pdRate/100,r=i.pdGrowth/100,c=i.pdCash/100;
  const taxGain=D*g*capitalGainsInclusion*t,taxIncome=D*(1-g)*t,taxNow=taxGain+taxIncome,saleSaving=D*capitalGainsInclusion*t;
  const rows=[];
  for(let k=0;k<=i.pdYears;k++){
    const value=A*Math.pow(1+r,k),saleBefore=(value-A-D)*capitalGainsInclusion*t,saleAfter=(value-A)*capitalGainsInclusion*t,forgone=taxNow*Math.pow(1+c,k);
    rows.push({x:k,value,before:value-saleBefore-forgone,after:value-saleAfter,cost:forgone-saleSaving,costToday:taxNow-saleSaving/Math.pow(1+c,k)});
  }
  const end=rows.at(-1);
  return {D,taxGain,taxIncome,taxNow,saleSaving,rows,end,growthForgone:taxNow*(Math.pow(1+c,i.pdYears)-1),rate:t};
}

const money=n=>n.toLocaleString('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0});
const pct=(n,d=1)=>(n*100).toFixed(d)+'%';

export function limitDistributionResult(kind,input){
  if(kind==='tfsaLimitIndex'){
    const rows=tfsaLimitPath(input),first=Math.max(2009,2044-input.tlAge);
    const pub=rows.filter(r=>r.year>=first&&r.year<=2026),room=pub.reduce((a,r)=>a+r.limit,0);
    const real=pub.reduce((a,r)=>a+r.limit*cpiLatest.value/cpiJanuary[r.year],0);
    const y27=rows.find(r=>r.year===2027),last=rows.at(-1),future=rows.filter(r=>r.year>=2027).reduce((a,r)=>a+r.limit,0);
    const steps=rows.filter((r,k)=>r.year>2027&&r.limit!==rows[k-1].limit).length;
    const targets=[7500,8000,8500,9000,10000],rates=[.5,1,1.5,2,2.5,3,4];
    const span=rows.filter(r=>r.year>=2016&&r.year<=Math.min(2026+input.tlHorizon,2045));
    return {metrics:[[`Total dollar limits from ${first} to 2026 (CRA)`,room,'money'],['The same room in September 2026 prices',real,'money'],['2026 limit before rounding ($5,000 indexed)',rows.find(r=>r.year===2026).indexed,'money'],['2027 indexation factor from CPI to September 2026',tfsaFactors[2027],'percent'],['2027 limit implied by that factor (not yet published by CRA)',y27.limit,'money'],[`Projected limit in ${last.year}`,last.limit,'money'],[`New room from 2027 to ${last.year}, projected`,future,'money']],
    note:`Limits for 2009 to 2026 are CRA’s published figures. Since 2016 the law sets the limit at $5,000 indexed for each year after 2009 by the section 117.1 CPI factor and rounded to the nearest $500 (a tie rounds up). The 2027 factor of ${pct(tfsaFactors[2027])} is this page’s calculation from Statistics Canada CPI to September 2026; CRA had not published the 2027 limit when it was checked on 26 October 2026. From 2028 the chart applies the ${input.tlInflation}% inflation you enter every year (rounded to 0.1 percentage point, as the factor is), which is an assumption, not a forecast, and Parliament can change the limit. Room is counted from the year you turned 18, assuming Canadian residence in every year since. Contribution room also depends on your own history: unused room carries forward, withdrawals are added back the following year, and over-contributions are taxed.`,
    charts:[
      {id:'tfsa-limit-steps',type:'line',evidence:'CRA limits, CPI-derived calculation and a projection',title:'The TFSA dollar limit moves in CAD 500 steps behind a smoothly indexed amount',unit:'money',xLabel:'Calendar year',xMin:2009,series:[{name:'Annual TFSA dollar limit',rows:rows.map(r=>({x:r.year,value:r.limit}))},{name:'$5,000 indexed from 2009, before rounding',dash:true,rows:rows.map(r=>({x:r.year,value:r.indexed}))}],note:`To 2026 the solid line is CRA’s published limit; 2027 is calculated from published CPI; later years assume ${input.tlInflation}% inflation. The 2015 limit of $10,000 and the 2013–2014 limit of $5,500 were set directly in the law rather than by indexing. ${steps?`The projection contains ${steps} further $500 step${steps===1?'':'s'} after 2027.`:'The projection contains no further $500 step after 2027.'}`},
      {id:'tfsa-limit-rounding',type:'signedbar',evidence:'CRA limits, CPI-derived calculation and a projection',title:'Rounding gives a little more or a little less room than the indexed amount each year',unit:'money',rows:span.map(r=>({label:`${r.year}${r.kind==='published'?'':r.kind==='calculated'?' (calculated)':' (projected)'}`,value:r.limit-r.indexed})),note:'Each bar is the limit minus the unrounded indexed amount. A bar can be as large as $250 either way. Because the unrounded amount keeps compounding, rounding in one year does not carry into the next: the gaps do not accumulate.'},
      {id:'tfsa-limit-real',type:'bar',evidence:'Derived from official statistics',title:`Each year’s new TFSA room, valued in ${cpiLatest.label} prices`,unit:'money',rows:rows.filter(r=>r.year<=2026).map(r=>({label:String(r.year),value:r.limit*cpiLatest.value/cpiJanuary[r.year]})),source:'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1810000401',sourceLabel:'Statistics Canada · Table 18-10-0004-01, Consumer Price Index',note:`Each limit is multiplied by CPI for ${cpiLatest.label} (${cpiLatest.value}) divided by CPI for January of its own year, the month the room arrives. The $5,000 of 2009 is worth about ${money(5000*cpiLatest.value/cpiJanuary[2009])} in ${cpiLatest.label} prices, so the $7,000 limit of 2026 is not a large real increase. This values the room only; it says nothing about the return on anything held in the account.`},
      {id:'tfsa-limit-reach',type:'heatmap',evidence:'Projection from the indexation rule',title:'Years after 2026 until the limit first reaches each amount, by assumed inflation',unit:'integer',unitLabel:'Years after 2026 · first year the limit is at least the column amount',rowLabel:'Inflation from 2028',unavailableLabel:'Not by 2100',columns:targets.map(t=>money(t)),rows:rates.map(rate=>({label:`${rate}% a year`,values:targets.map(t=>{const y=tfsaLimitReaches(t,rate);return y==null?null:y-2026;})})),note:'Every row keeps the calculated 2027 limit of $7,500 (so the first column is 1 in every row) and then applies a constant inflation rate. Real inflation varies from year to year; a single bad year moves the steps earlier and a run of low inflation delays them.'}
    ]};
  }
  if(kind==='preDistribution'){
    const p=preDistributionPlan(input),N=input.pdYears,e=p.end,per=input.pdAmount>0?10000/input.pdAmount:0;
    const dists=[2,4,6,8,12,16],years=[1,5,10,20,30];
    return {metrics:[['Distribution paid on the new units',p.D,'money'],['Tax due this year if you buy just before',p.taxNow,'money'],['Higher cost base from the reinvested distribution',p.D,'money'],[`Capital-gains tax saved at the sale in year ${N}`,p.saleSaving,'money'],[`Net cost of buying before, in year-${N} dollars`,e.cost,'money'],['Same net cost in today’s dollars',e.costToday,'money'],['Share of this year’s tax won back at the sale (today’s dollars)',p.taxNow>0?p.saleSaving/Math.pow(1+input.pdCash/100,N)/p.taxNow:0,'percent']],
    note:`${money(input.pdAmount)} buys units in a non-registered account either just before or just after a distribution of ${input.pdDist}% of the unit price. Bought before, the ${money(p.D)} distribution is reinvested, so both buyers end up with the same units and the same market value; the difference is tax. ${input.pdGainShare}% of the distribution is treated as capital gains (half taxed) and the rest as income taxed in full at ${input.pdRate}%, a conservative simplification: eligible dividends would be taxed less and return of capital is not taxed now. That tax is paid from cash that would otherwise earn ${input.pdCash}% after tax. Units grow ${input.pdGrowth}% a year and are all sold in year ${N}. In a TFSA, RRSP or other registered plan none of this tax arises. Figures are hypothetical, not a forecast or a personal tax calculation.`,
    charts:[
      {id:'pre-distribution-day',type:'groupbar',title:'The day after the distribution: same units and value, different cost base and tax',unit:'money',seriesNames:['Bought just before','Bought just after'],rows:[{label:'Market value of units',values:[input.pdAmount,input.pdAmount]},{label:'Adjusted cost base',values:[input.pdAmount+p.D,input.pdAmount]},{label:'Tax due for this year',values:[p.taxNow,0]}],note:`The early buyer’s ${money(input.pdAmount)} became ${money(input.pdAmount-p.D)} of units plus a ${money(p.D)} distribution that was reinvested, so both hold ${money(input.pdAmount)}. The distribution handed part of the purchase money back as taxable income; the higher cost base is the record of that.`},
      {id:'pre-distribution-years',type:'line',title:'Net cost of buying before, by the year the units are sold',unit:'money',xLabel:'Years after the purchase',series:[{name:'Net cost in the dollars of the sale year',rows:p.rows.map(r=>({x:r.x,value:r.cost}))},{name:'Net cost in today’s dollars',dash:true,rows:p.rows.map(r=>({x:r.x,value:r.costToday}))}],note:`Year 0 is a sale immediately after the distribution: the higher cost base creates a capital loss that offsets ${money(p.saleSaving)} of tax. The later the sale, the longer the tax cash has been missing and the less a dollar of future tax saving is worth today. ${p.taxIncome>0?'Because part of the distribution is taxed as income in full but recovered only as a half-included capital loss or smaller gain, the cost never falls to zero.':'With an all-capital-gains distribution the only lasting cost is the growth forgone on the tax cash.'}`},
      {id:'pre-distribution-parts',type:'waterfall',title:`Where the cost of buying before comes from, for a sale in year ${N}`,unit:'money',unitLabel:`Canadian dollars (CAD) of year ${N}`,totalLabel:'Net cost of buying before',rows:[{label:'Tax now on the capital-gains part',value:p.taxGain},{label:'Tax now on the income part',value:p.taxIncome},{label:'Growth forgone on the tax cash',value:p.growthForgone},{label:'Lower capital-gains tax at the sale',value:-p.saleSaving}],note:'The first two steps are paid this year. The growth forgone is what that cash would have earned by the sale. The last step is the higher cost base doing its work when the units are sold. The result is a cost of timing, not a loss of investment value.'},
      {id:'pre-distribution-grid',type:'heatmap',title:'Net cost in today’s dollars per CAD 10,000 bought just before, by distribution size and holding period',unit:'money',rowLabel:'Distribution',columns:years.map(y=>`Sold after ${y} yr`),rows:dists.map(d=>({label:`${d}% of unit price`,values:years.map(y=>preDistributionPlan(input,{pdDist:d,pdYears:y}).end.costToday*per)})),note:`Each cell reruns the model with the entered capital-gains share (${input.pdGainShare}%), tax rate, growth and cash return, changing only the distribution size and the year of sale, and scales the result to CAD 10,000 invested.`}
    ]};
  }
  throw Error('Unknown limit-distribution topic');
}
