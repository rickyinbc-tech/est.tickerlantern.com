// Dated public corporate evidence only. CAD amounts are millions unless per share.
export const sources = Object.freeze({
  strategic: {label:'RBC 2025 Strategic Update',url:'https://www.rbc.com/investor-relations/_assets-custom/pdf/2025q4strategicupdate.pdf',observed:'2026-10-18',pages:'PDF9:medium-term return,payout and capital objectives'},
  morningstar: {label:'Morningstar:Royal Bank quote and research',url:'https://www.morningstar.com/stocks/xtse/ry/quote',observed:'2026-10-18',pages:'Dated provider snapshot;fair-value widget8 Sep/research article22 Sep2026'},
  quarter: {label:'RBC Q3 2026 Report to Shareholders',url:'https://www.rbc.com/investor-relations/_assets-custom/pdf/2026q3_report.pdf',published:'2026-08-27',pages:'PDF4,8,13–14,22,40–42,49,54'},
  annual: {label:'RBC 2025 Annual Report',url:'https://www.rbc.com/investor-relations/_assets-custom/pdf/ar_2025_e.pdf',published:'2025-12-03',pages:'Printed23,34,148,242 (PDF25,36,150,244)'},
  slides: {label:'RBC Q3 2026 Results Slides',url:'https://www.rbc.com/investor-relations/_assets-custom/pdf/2026q3slides.pdf',published:'2026-08-27',pages:'PDF4,8,18–19,22–23,25,27,32–33,36,49'},
  release: {label:'RBC Q3 2026 Earnings Release',url:'https://www.rbc.com/investor-relations/_assets-custom/pdf/2026q3release.pdf',published:'2026-08-27',pages:'1–5'},
  market: {label:'StockAnalysis: TSX RY price and statistics',url:'https://stockanalysis.com/quote/tsx/RY/statistics/',observed:'2026-10-17',priceDate:'2026-10-16'},
  estimates: {label:'MarketScreener: Royal Bank financial estimates',url:'https://ca.marketscreener.com/quote/stock/ROYAL-BANK-OF-CANADA-1411559/finances/',observed:'2026-10-17'},
  forwardHistory: {label:'GuruFocus: TSX RY forward-P/E history',url:'https://www.gurufocus.com/term/forward-pe-ratio/TSX:RY',observed:'2026-10-18'},
  totalReturns: {label:'Yahoo Finance: TSX RY closes and dividends',url:'https://finance.yahoo.com/quote/RY.TO/history/',observed:'2026-10-18'},
  forecastArchive: {label:'Archived original Yahoo RY.TO statistics',url:'https://web.archive.org/web/20101129085430/http://finance.yahoo.com:80/q/ks?s=RY.TO',observed:'2026-10-18'},
  dividends: {label:'RBC common-share dividend declaration',url:'https://www.rbc.com/investor-relations/share-information.html',observed:'2026-10-17'},
  calendar: {label:'RBC reporting dates',url:'https://www.rbc.com/investor-relations/financial-information.html',observed:'2026-10-17'},
  osfi: {label:'OSFI: Domestic Stability Buffer',url:'https://www.osfi-bsif.gc.ca/en/supervision/financial-institutions/banks/domestic-stability-buffer',observed:'2026-10-17'},
  boc: {label:'Bank of Canada: September 2, 2026 decision',url:'https://www.bankofcanada.ca/2026/09/fad-press-release-2026-09-02/',published:'2026-09-02'},
  pandemic: {label:'RBC Q4 2020 Financial Supplement',url:'https://www.rbc.com/investor-relations/_assets-custom/pdf/20q4supp.pdf',pages:'3 (PDF 5)'},
  crisis: {label:'RBC Q2 2010 Financial Supplement',url:'https://www.rbc.com/investor-relations/_assets-custom/pdf/supp_q210.pdf',pages:'5 (PDF 7)'},
  framework: {label:'Aswath Damodaran, NYU Stern: financial-service firms',url:'https://pages.stern.nyu.edu/~adamodar/New_Home_Page/littlebook/financialsvccompanies.htm'},
  tax: {label:'Income Tax Act, section 38',url:'https://laws-lois.justice.gc.ca/eng/acts/I-3.3/section-38.html',observed:'2026-10-17',consolidation:'2026-09-30'},
});

export const evidence = Object.freeze({
  researchDate:'2026-10-17',priceDate:'2026-10-16',period:'2026-07-31',currency:'CAD',price:280.01,
  shares:1384.554,commonEquity:133922,totalEquity:145094,goodwill:19489,intangibles:7334,
  annualEPS:14.07,ytdEPS:12.10,priorYtdEPS:10.31,
  annualAdjustedEPS:14.43,ytdAdjustedEPS:12.26,priorYtdAdjustedEPS:10.58,
  annualRevenue:66605,ytdRevenue:53951,priorYtdRevenue:49396,
  annualOCF:55220,ytdOCF:94275,priorYtdOCF:70005,
  annualDeposits:106085,ytdDeposits:128957,priorYtdDeposits:71946,
  annualLoans:-62098,ytdLoans:-66644,priorYtdLoans:-47070,
  quarterlyDividend:1.76,eps2027:17.71,eps2028:19.96,book2027:105,screenForwardPE:16.12,
  quarterlyNetIncome:6024,wealthIncome:1442,capitalMarketsIncome:1544,
  roe:17.9,adjustedRoe:18.1,cet1:13.5,impairedPcl:35,totalPcl:36,gil:.91,priorGil:.85,
});

// Fiscal year-end closes paired with full-year results; descriptive, not a backtest.
export const annualInputs = [
  [2016,83.80,6.78,43.32,124476,38795],
  [2017,100.87,7.56,46.41,146554,40669],
  [2018,95.92,8.36,51.12,138009,42576],
  [2019,106.24,8.75,54.41,151933,46002],
  [2020,93.16,7.82,56.75,132518,47181],
  [2021,128.82,11.06,64.57,183507,49693],
  [2022,126.05,11.06,72.85,174316,48985],
  [2023,110.76,10.32,76.92,155121,51464],
  [2024,168.39,11.25,83.46,238188,57344],
  [2025,205.47,14.07,91.00,287681,66605],
].map(([year,price,eps,book,marketCap,revenue])=>({year,price,eps,book,marketCap,revenue}));

export function derive(e=evidence){
  const ttm=(annual,ytd,prior)=>annual+ytd-prior;
  const eps=ttm(e.annualEPS,e.ytdEPS,e.priorYtdEPS);
  const adjustedEPS=ttm(e.annualAdjustedEPS,e.ytdAdjustedEPS,e.priorYtdAdjustedEPS);
  const revenue=ttm(e.annualRevenue,e.ytdRevenue,e.priorYtdRevenue);
  const ocf=ttm(e.annualOCF,e.ytdOCF,e.priorYtdOCF);
  const marketCap=e.price*e.shares,book=e.commonEquity/e.shares;
  const tangibleBook=(e.commonEquity-e.goodwill-e.intangibles)/e.shares;
  return {eps,adjustedEPS,revenue,ocf,marketCap,book,tangibleBook,
    forwardPE:e.price/e.eps2027,trailingPE:e.price/eps,adjustedPE:e.price/adjustedEPS,
    pb:e.price/book,ptbv:e.price/tangibleBook,ps:marketCap/revenue,pcf:marketCap/ocf,
    dividend:e.quarterlyDividend*4,yield:e.quarterlyDividend*4/e.price,
    deposits:ttm(e.annualDeposits,e.ytdDeposits,e.priorYtdDeposits),
    loans:ttm(e.annualLoans,e.ytdLoans,e.priorYtdLoans),
    marketSensitiveShare:(e.wealthIncome+e.capitalMarketsIncome)/e.quarterlyNetIncome};
}
export const history = annualInputs.map(x=>({...x,pe:x.price/x.eps,pb:x.price/x.book,ps:x.marketCap/x.revenue}));
export function median(values){const v=[...values].sort((a,b)=>a-b);const i=Math.floor(v.length/2);return v.length%2?v[i]:(v[i-1]+v[i])/2;}
export const peers = [['RY',16.12],['TD',15.59],['BMO',14.73],['NA',14.60],['CM',14.44],['BNS',13.99]].map(([ticker,forwardPE])=>({ticker,forwardPE,url:`https://stockanalysis.com/quote/tsx/${ticker}/statistics/`}));
export const scenarios=[
  {name:'Growth / premium expands',eps:19.96,pe:17},
  {name:'Growth / premium retained',eps:19.96,pe:16},
  {name:'Growth / partial normalization',eps:19.96,pe:15},
  {name:'Growth / lower multiple',eps:19.96,pe:14},
  {name:'Estimate cut 10% / rerating',eps:19.96*.9,pe:13},
  {name:'Severe stress illustration',eps:14,pe:11},
];
export function scenarioReturn(price,eps,pe,dividend){
  const exitPrice=eps*pe;
  return {exitPrice,priceReturn:exitPrice/price-1,totalReturn:(exitPrice+dividend)/price-1};
}
export const defaults=Object.freeze({price:280.01,eps:17.71,book:133922/1384.554,exitEPS:19.96,exitPE:14,dividend:7.04,hurdle:10,roe:18,requiredReturn:10,growth:4});
export function calculate(raw){
  const v={};
  for(const key of Object.keys(defaults)){
    const value=raw[key];
    if(value==null||String(value).trim()===''||!Number.isFinite(Number(value)))return {error:'Complete every assumption with a finite number.'};
    v[key]=Number(value);
    if(Math.abs(v[key])>1e7)return {error:'An assumption is outside the supported calculation range.'};
  }
  if(['price','eps','book','exitEPS','exitPE'].some(k=>v[k]<=0)||v.dividend<0||v.hurdle<=-100||v.roe<0||v.growth<0)
    return {error:'Use positive price, EPS, book and P/E; non-negative dividends, ROE and growth; and a hurdle above −100%.'};
  if(v.requiredReturn<=v.growth)return {error:'The required equity return must exceed perpetual growth.'};
  if(v.roe<v.growth)return {error:'Sustainable ROE must cover growth in this retained-earnings model.'};
  const returns=scenarioReturn(v.price,v.exitEPS,v.exitPE,v.dividend);
  const justifiedPB=(v.roe-v.growth)/(v.requiredReturn-v.growth);
  const result={...returns,inputs:v,forwardPE:v.price/v.eps,pb:v.price/v.book,
    justifiedPB,stableBookValue:justifiedPB*v.book,
    requiredExitPrice:v.price*(1+v.hurdle/100)-v.dividend,
    requiredEPSAt14:(v.price*(1+v.hurdle/100)-v.dividend)/14,
    impliedRoe:(v.growth/100+(v.price/v.book)*(v.requiredReturn-v.growth)/100)*100};
  if(Object.values(result).some(x=>typeof x==='number'&&!Number.isFinite(x)))return {error:'These assumptions produce a result outside the supported numerical range.'};
  return result;
}
