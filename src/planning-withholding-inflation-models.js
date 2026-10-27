export const withholdingInflationDefinitions={
  usWithholding:{title:'Where US dividend withholding tax sticks: RRSP, TFSA or taxable account, US-listed ETF or Canadian fund',fields:[
    ['fwAmount','Amount invested in US stocks (CAD)',100000,1000,5000000,1000],
    ['fwYield','Dividend yield of the US stocks (% a year)',1.5,0,6,.1],
    ['fwGrowth','Price growth before dividends (% a year)',5,-5,12,.25],
    ['fwWithholding','US withholding rate on the dividends (%)',15,0,30,.5],
    ['fwRate','Your combined marginal tax rate for a taxable account (%)',29.65,0,60,.05],
    ['fwFx','Currency conversion cost each way for a US-listed ETF (%)',1,0,3,.05],
    ['fwYears','Years held',25,1,50,1]
  ]},
  inflationGainTax:{title:'How much of your capital gain is only inflation, and what the tax on it does to your real return',fields:[
    ['igAmount','Amount invested in the fund (CAD)',10000,500,5000000,500],
    ['igReal','Real growth of the fund, after inflation (% a year)',4,-3,10,.25],
    ['igInflation','Inflation (% a year)',2.5,0,10,.1],
    ['igYears','Years until the units are sold',20,1,50,1],
    ['igRate','Combined marginal tax rate in the year of sale (%)',29.65,0,60,.05]
  ]}
};
export const withholdingInflationWholeKeys=['fwYears','igYears'];

// Four ways to hold the same US stocks. Dividends are reinvested once a year. "Unrecovered" withholding is lost inside
// the account. A US-listed ETF pays the conversion cost when CAD goes in and again when it comes out.
// Canada–US Convention Art. X(2)(b): 15% cap on portfolio dividends; Art. XXI(2): dividends and interest of a resident
// arrangement operated exclusively to provide pension or retirement benefits are exempt (RRSPs and RRIFs in practice).
export function usWithholdingPlan(input,overrides={}){
  const i={...input,...overrides},A=i.fwAmount,y=i.fwYield/100,g=i.fwGrowth/100,w=i.fwWithholding/100,t=i.fwRate/100,f=i.fwFx/100;
  const full=1+g+y,net=1+g+y*(1-w),fx=(1-f)*(1-f),rows=[];
  for(let k=0;k<=i.fwYears;k++){
    const bench=A*Math.pow(full,k),fund=A*Math.pow(net,k);
    rows.push({x:k,bench,fund,tfsaUs:fx*fund,rrspUs:fx*bench});
  }
  const D=A*y;
  return {D,lost:D*w,credited:D*Math.min(w,t),extra:D*Math.max(t-w,0),lostNonReg:D*Math.max(w-t,0),rows,end:rows.at(-1),breakEven:withholdingBreakEven(y,f,g,w)};
}
// First whole year in which a US-listed ETF in an RRSP (conversion cost both ways, no withholding) is worth at least a
// Canadian-listed fund holding the same stocks (no conversion, withholding lost every year); null if not within 100 years.
export function withholdingBreakEven(y,f,g,w){
  const full=1+g+y,net=1+g+y*(1-w),fx=(1-f)*(1-f);
  for(let k=0;k<=100;k++)if(fx*Math.pow(full,k)>=Math.pow(net,k)*(1-1e-12))return k;
  return null;
}

// Canada taxes the nominal gain: the adjusted cost base is not indexed for inflation. Half the gain is included in income.
const inclusion=.5;
export function inflationGainPlan(input,overrides={}){
  const i={...input,...overrides},A=i.igAmount,r=i.igReal/100,p=i.igInflation/100,t=i.igRate/100,N=i.igYears;
  const n=(1+r)*(1+p)-1,rows=[];
  for(let k=0;k<=N;k++){
    // A loss gives negative tax: valued as if usable against other gains at the same rate.
    const P=Math.pow(1+p,k),V=A*Math.pow(1+n,k),tax=inclusion*t*(V-A);
    rows.push({x:k,tfsa:A*Math.pow(1+r,k),fund:(V-tax)/P,interest:A*Math.pow(1+n*(1-t),k)/P});
  }
  const P=Math.pow(1+p,N),V=A*Math.pow(1+n,N),G=V-A,infl=A*(P-1),realPart=G-infl,tax=inclusion*t*G;
  const realPre=A*Math.pow(1+r,N)-A,realAfter=(V-tax)/P-A,interestAfter=A*Math.pow(1+n*(1-t),N)/P-A;
  const eff=realPre>0?1-realAfter/realPre:null,effInterest=realPre>0?1-interestAfter/realPre:null;
  return {n,V,G,infl,realPart,tax,taxInfl:inclusion*t*infl,taxReal:inclusion*t*realPart,realPre,realAfter,interestAfter,eff,effInterest,statutory:inclusion*t,rows};
}

// September all-items CPI, Canada, not seasonally adjusted (2002=100): Statistics Canada table 18-10-0004-01, vector
// v41690973, retrieved through the Bank of Canada Valet API on 26 October 2026.
export const cpiSeptember={2006:109.2,2007:111.9,2008:115.7,2009:114.7,2010:116.9,2011:120.6,2012:122.0,2013:123.3,2014:125.8,2015:127.1,2016:128.8,2017:130.8,2018:133.7,2019:136.2,2020:136.9,2021:142.9,2022:152.7,2023:158.5,2024:161.1,2025:164.9,2026:170.0};

const money=n=>n.toLocaleString('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0});
const pct=(n,d=1)=>(n*100).toFixed(d)+'%';

export function withholdingInflationResult(kind,input){
  if(kind==='usWithholding'){
    const p=usWithholdingPlan(input),N=input.fwYears,e=p.end,per=input.fwAmount>0?100000/input.fwAmount:0;
    const yields=[.5,1,1.5,2,3,4],fxs=[.1,.25,.5,1,1.5,2],years=[5,10,20,30,40];
    return {metrics:[['US dividends in the first year',p.D,'money'],['Withholding lost each year in a TFSA, or in an RRSP through a Canadian-listed fund',p.lost,'money'],['The same loss as a yearly cost on the whole holding',input.fwYield/100*input.fwWithholding/100,'percent'],[`Shortfall after ${N} years: Canadian-listed fund in an RRSP or TFSA`,e.bench-e.fund,'money'],[`Shortfall after ${N} years: US-listed ETF in a TFSA`,e.bench-e.tfsaUs,'money'],[`Shortfall after ${N} years: US-listed ETF in an RRSP (conversion only)`,e.bench-e.rrspUs,'money'],['Years before the US-listed ETF in an RRSP pulls ahead of the Canadian-listed fund',p.breakEven,'integer',p.breakEven==null?'Not within 100 years':undefined]],
    note:`${money(input.fwAmount)} of US stocks yielding ${input.fwYield}% a year, with prices rising ${input.fwGrowth}% a year and dividends reinvested yearly. US tax is withheld at ${input.fwWithholding}% unless the holder is an RRSP or RRIF that owns US-listed securities directly, which the Canada–US tax treaty exempts. Inside a TFSA, FHSA or RESP, and inside any Canadian-listed fund, the withholding is not recovered. In a taxable account it is credited against Canadian tax on the same dividend, assumed here to be enough to absorb it. Shortfalls are measured against the same stocks with no withholding and no conversion cost, inside the account and before any tax on RRSP withdrawals. A US-listed ETF pays ${input.fwFx}% to convert dollars in and again to convert them out. Fund fees, currency movements and tracking differences are left out; returns are hypothetical, not a forecast.`,
    charts:[
      {id:'withholding-first-year',type:'stackbar',title:'Where one year of US dividends goes, by account and way of holding',unit:'money',seriesNames:['Stays invested','US tax withheld and not recovered','US tax withheld, then credited against Canadian tax','Further Canadian tax on the dividend'],rows:[{label:'RRSP or RRIF · US-listed ETF',values:[p.D,0,0,0]},{label:'RRSP or RRIF · Canadian-listed fund',values:[p.D-p.lost,p.lost,0,0]},{label:'TFSA, FHSA or RESP · either route',values:[p.D-p.lost,p.lost,0,0]},{label:'Taxable account · either route',values:[p.D-p.credited-p.extra-p.lostNonReg,p.lostNonReg,p.credited,p.extra]}],note:`Each bar is the ${money(p.D)} of dividends in the first year. In a taxable account the withholding counts toward the ${input.fwRate}% Canadian tax on the dividend through the foreign tax credit, so it is not an extra cost there; the dividend is still fully taxed as foreign income. RRSP amounts are taxed later, when withdrawn, whichever route is used.`},
      {id:'withholding-shortfall',type:'line',title:'Value lost against the same stocks with no withholding and no conversion cost',unit:'money',xLabel:'Years held',series:[{name:'Canadian-listed fund in an RRSP or TFSA',rows:p.rows.map(r=>({x:r.x,value:r.bench-r.fund}))},{name:'US-listed ETF in a TFSA',rows:p.rows.map(r=>({x:r.x,value:r.bench-r.tfsaUs}))},{name:'US-listed ETF in an RRSP',dash:true,rows:p.rows.map(r=>({x:r.x,value:r.bench-r.rrspUs}))}],note:`The withholding drag compounds: it takes ${pct(input.fwYield/100*input.fwWithholding/100,3)} of the holding every year and the lost amount never grows. Currency conversion for a US-listed ETF is a fixed share of the money moved, paid twice. ${p.breakEven==null?'With these inputs the conversion cost is not recovered within 100 years.':`In an RRSP the US-listed route catches up with the Canadian-listed fund after ${p.breakEven} year${p.breakEven===1?'':'s'}.`} In a TFSA the US-listed route pays both costs.`},
      {id:'withholding-break-even',type:'heatmap',title:'Years before a US-listed ETF in an RRSP overtakes a Canadian-listed fund, by dividend yield and conversion cost',unit:'integer',unitLabel:'Years held · first year the US-listed route is worth at least as much',rowLabel:'Dividend yield',unavailableLabel:'Not within 100 years',columns:fxs.map(f=>`${f}% each way`),rows:yields.map(y=>({label:`${y}% yield`,values:fxs.map(f=>withholdingBreakEven(y/100,f/100,input.fwGrowth/100,input.fwWithholding/100))})),note:`Uses the entered price growth (${input.fwGrowth}%) and withholding rate (${input.fwWithholding}%). Both routes are assumed to hold the same stocks at the same fee. A difference in management fees of even 0.05% a year can change the answer, as can currency-conversion methods that cost far less than a retail spread.`},
      {id:'withholding-grid',type:'heatmap',title:'Value lost to unrecovered withholding per CAD 100,000, by dividend yield and holding period',unit:'money',rowLabel:'Dividend yield',columns:years.map(y=>`${y} years`),rows:yields.map(y=>({label:`${y}% yield`,values:years.map(n=>{const q=usWithholdingPlan(input,{fwYield:y,fwYears:n}).end;return (q.bench-q.fund)*per;})})),note:`Each cell compares a Canadian-listed fund held in an RRSP, TFSA, FHSA or RESP with the same stocks free of withholding, at the entered growth and withholding rate, scaled to CAD 100,000. The loss rises with the yield and, because it compounds, faster than in proportion to time.`}
    ]};
  }
  if(kind==='inflationGainTax'){
    const p=inflationGainPlan(input),N=input.igYears,cols=[0,1,2,3,4,6],reals=[1,2,3,4,5,6];
    const effOf=(r,pi)=>inflationGainPlan(input,{igReal:r,igInflation:pi}).eff;
    const years=Object.keys(cpiSeptember).map(Number).filter(y=>y<2026);
    return {metrics:[[`Value of the units when sold in year ${N}`,p.V,'money'],['Capital gain reported',p.G,'money'],['Part of that gain that only keeps up with inflation',p.infl,'money'],['Tax on the whole gain at the sale',p.tax,'money'],['Of which tax on the inflation part',p.taxInfl,'money'],['Tax as a share of the real gain (taxable account)',p.eff,'percent',p.eff==null?'Not defined: no real gain':undefined],['Same pre-tax return taxed as interest every year',p.effInterest,'percent',p.effInterest==null?'Not defined: no real gain':undefined],['Inside a TFSA',0,'percent']],
    note:`${money(input.igAmount)} grows ${input.igReal}% a year in real terms while prices rise ${input.igInflation}% a year, a nominal return of ${pct(p.n,2)}. In a taxable account the units are sold in year ${N}; half of the nominal gain is taxed at ${input.igRate}%, so the statutory rate on a gain is ${pct(p.statutory,3)}. Canada does not index the cost base for inflation, so the part of the gain that only restores purchasing power is taxed too. The interest comparison taxes the same nominal return in full every year, which is how GIC or bond-fund interest is taxed. The model ignores yearly fund distributions, fees and changes in tax law; returns are hypothetical, not a forecast. A capital loss is valued as if it could be used at the same rate.`,
    charts:[
      {id:'inflation-gain-parts',type:'waterfall',title:`What the reported gain is made of, for a sale in year ${N}`,unit:'money',unitLabel:`Canadian dollars (CAD) of year ${N}`,totalLabel:'Gain kept after tax',rows:[{label:'Real gain',value:p.realPart},{label:'Gain that only matches inflation',value:p.infl},{label:'Tax on the real gain',value:-p.taxReal},{label:'Tax on the inflation part',value:-p.taxInfl}],note:`Amounts are in the dollars of the sale year. The inflation part is what ${money(input.igAmount)} would need to grow to just to buy the same as at the start: ${money(input.igAmount*Math.pow(1+input.igInflation/100,N))}. It is ${p.G>0?pct(p.infl/p.G):'none'} of the reported gain, and it is taxed exactly like the rest.`},
      {id:'inflation-gain-grid',type:'heatmap',title:`Tax as a share of the real gain, by real growth and inflation, for a ${N}-year holding`,unit:'percent',rowLabel:'Real growth',unavailableLabel:'No real gain',columns:cols.map(c=>`${c}% inflation`),rows:reals.map(r=>({label:`${r}% real`,values:cols.map(c=>effOf(r,c))})),note:`With no inflation every cell equals the statutory ${pct(p.statutory,3)}. Inflation raises the rate most when the real return is low, because the taxed inflation part is then large compared with the real gain. Above 100% the tax would take more than the whole real gain.`},
      {id:'inflation-gain-cpi',type:'groupbar',evidence:'Derived from official statistics',title:'Per CAD 10,000 invested in September of each year: the rise needed by September 2026 just to keep purchasing power, and the tax if that rise were realized',unit:'money',seriesNames:['Rise needed to match the CPI','Tax on that rise alone at the entered rate'],rows:years.map(y=>{const need=10000*(cpiSeptember[2026]/cpiSeptember[y]-1);return {label:String(y),values:[need,need*p.statutory]};}),source:'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1810000401',sourceLabel:'Statistics Canada · Table 18-10-0004-01, Consumer Price Index',note:`Uses the all-items CPI for September of each year and September 2026 (${cpiSeptember[2026]}). A fund bought for $10,000 in September 2006 had to be worth about ${money(10000*(cpiSeptember[2026]/cpiSeptember[2006]-1)+10000)} in September 2026 just to buy the same; selling it at that price in a taxable account would have produced a reported gain, and tax, with no gain in purchasing power. The CPI figures are dated observations; the tax column applies the rate entered above.`},
      {id:'inflation-gain-real-paths',type:'line',title:'Real value after tax in today’s dollars, by the year the units are sold',unit:'money',xLabel:'Years after the purchase',series:[{name:'Inside a TFSA',rows:p.rows.map(r=>({x:r.x,value:r.tfsa}))},{name:'Taxable account, gain taxed at the sale',rows:p.rows.map(r=>({x:r.x,value:r.fund}))},{name:'Taxable account, same return taxed as interest yearly',dash:true,rows:p.rows.map(r=>({x:r.x,value:r.interest}))}],note:`All three lines start from the same ${money(input.igAmount)} and earn the same pre-tax return; only the tax treatment differs. Deferring the gain until the sale already beats paying tax every year by a wide margin; the TFSA removes the tax on both the real and the inflation parts. These are account and income-type rules, not properties of a particular fund.`}
    ]};
  }
  throw Error('Unknown withholding-inflation topic');
}
