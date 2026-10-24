import { nextForecastYear } from './growth-data.js';

export const HOLDING_YEARS = 5;
export const GROWTH_POLICY = Object.freeze({
  version: 'tickerlantern-forecast-long-term-v5',
  reviewedAt: '2026-10-23',
  methodologyUrl: 'https://www.invesco.com/content/dam/invesco/apac/en/pdf/insights/2026/april/2026-invesco-capital-market-assumptions-usd-q1-2026.pdf#page=7',
  method: 'For every benchmark, use each published forecast only in its named year. Use a sourced long-term nominal EPS projection for missing years. Preserve consensus, house, calendar, publisher and forecast-date labels. Applying these published rates to synthetic forward earnings is a scenario mapping, not a matched rolling-NTM forecast. Do not cap, fade or carry forward a near-term forecast. Buybacks enter EPS once; dividends and the selected exit P/E remain separate.'
});

export const LONG_TERM_SOURCE = Object.freeze({
  publisher:'Invesco Solutions', title:'2026 Capital Market Assumptions, Q1 update',
  url:GROWTH_POLICY.methodologyUrl, asOf:'2025-12-31', checkedAt:'2026-10-23', horizonYears:10,
  pdfPages:Object.freeze([7,11]),
  sha256:'28faab4574d491474f4eac99fc734e5c4615ec320793bcc2f0c264dc5b70ee7b',
  application:'Derived nominal EPS proxy: real earnings growth + inflation + buyback effect, using the additive building-block approximation. Exclude source dividends, valuation and FX components; they are not extra returns in this model.'
});

// Figure 4a, p. 7. The earnings component is real; buyback effects are separate.
// No source-published total-return forecast is put into an EPS growth field.
export const LONG_TERM_REGIONS = Object.freeze(Object.fromEntries([
  ['us-large','US large cap',4.01,2.19,1.84],
  ['us-small','US small cap',2.43,2.19,0.99],
  ['canada','Canada equity',2.99,1.95,0.73],
  ['global','Global equity',3.92,2.14,1.01],
  ['global-ex-us','Global ex-US equity',3.82,1.97,0.13],
  ['europe','Europe equity',4.24,1.79,0.54],
  ['uk','UK equity',6.06,2.24,0.82],
  ['japan','Japan equity',4.30,2.00,0.89],
  ['em','EM equity',3.73,2.24,-0.31],
  ['china','China equity',1.40,1.75,-0.55]
].map(([id,benchmark,realEarningsGrowth,inflation,buybackYield])=>{
  const growth=+(realEarningsGrowth+inflation+buybackYield).toFixed(2);
  return [id,Object.freeze({benchmark,growth,components:Object.freeze({realEarningsGrowth,inflation,buybackYield}),
    formula:`${realEarningsGrowth.toFixed(2)}% real earnings growth + ${inflation.toFixed(2)}% inflation ${buybackYield<0?'-':'+'} ${Math.abs(buybackYield).toFixed(2)}% ${buybackYield<0?'dilution':'buyback'} effect = ${growth.toFixed(2)}% nominal EPS projection (additive approximation)`})];
})));

// Each target keeps its own published forecast. Only missing years use this
// explicitly named market/region proxy, with no unsupported index premium.
export const INDEX_LONG_TERM_MAP = Object.freeze(Object.fromEntries([
  ['sp500','us-large','US large-cap assumption for the S&P 500.'],
  ['nasdaq100','us-large','US large-cap proxy for Nasdaq-100; no technology premium added.'],
  ['russell2000','us-small','US small-cap proxy for Russell 2000; source return table uses S&P 600.'],
  ['tsx','canada','Canadian broad-equity assumption for the S&P/TSX Composite.'],
  ['msci-canada','canada','Canadian broad-equity proxy for MSCI Canada.'],
  ['acwi','global','Global equity assumption for MSCI ACWI.'],
  ['world','global','Global all-country equity proxy for developed-market MSCI World.'],
  ['eafe','global-ex-us','Global ex-US equity proxy for EAFE; includes markets outside EAFE.'],
  ['em','em','Emerging-market equity assumption for MSCI Emerging Markets.'],
  ['europe','europe','European equity assumption for MSCI Europe.'],
  ['uk','uk','UK equity assumption for MSCI United Kingdom.'],
  ['ftse100','uk','UK broad-equity proxy for FTSE 100.'],
  ['stoxx600','europe','European broad-equity proxy for STOXX Europe 600.'],
  ['japan','japan','Japanese equity assumption for MSCI Japan.'],
  ['nikkei225','japan','Japanese broad-equity proxy for Nikkei 225.'],
  ['china','china','Chinese equity assumption for MSCI China.'],
  ['hangseng','china','Chinese broad-equity proxy for Hang Seng; no Hong Kong-specific premium added.'],
  ['csi300','china','Chinese broad-equity proxy for CSI 300; no A-share premium added.'],
  ['india','em','Broad emerging-market proxy for MSCI India; no unsupported country premium added.'],
  ['asia-ex-japan','em','Broad emerging-market proxy for MSCI Asia ex Japan; no regional premium added.'],
  ['australia','global-ex-us','Global ex-US equity proxy for Australia; no Australia-specific building block is published in this table.']
].map(([id,region,rationale])=>[id,Object.freeze({region,rationale})])));

export function longTermGrowth(id) {
  const mapping=INDEX_LONG_TERM_MAP[id];
  return mapping ? {...LONG_TERM_SOURCE,...LONG_TERM_REGIONS[mapping.region],region:mapping.region,targetId:id,rationale:mapping.rationale} : null;
}
export const NASDAQ_LONG_TERM = Object.freeze(longTermGrowth('nasdaq100'));
export const GROWTH_ANCHORS = Object.freeze(Object.fromEntries(Object.keys(INDEX_LONG_TERM_MAP).map(id=>{
  const value=longTermGrowth(id);return [id,Object.freeze({growth:value.growth,rationale:value.rationale})];
})));

// Retained research utility; the default paths below do not apply this bridge.
// Six calendar growth rates create seven relative annual EPS levels and six
// forward anchors: F0 through F5. Exactly five investment years elapse.
export function calendarToForwardRates(calendarRates, elapsedFraction) {
  if (calendarRates.length !== 6 || !Number.isFinite(elapsedFraction) || elapsedFraction<0 || elapsedFraction>1 || calendarRates.some(g=>!Number.isFinite(g)||g<=-100)) throw new Error('Invalid calendar earnings bridge.');
  const levels=[1];
  for (const g of calendarRates) levels.push(levels.at(-1)*(1+g/100));
  const forward=Array.from({length:6},(_,i)=>(1-elapsedFraction)*levels[i]+elapsedFraction*levels[i+1]);
  return {rates:forward.slice(1).map((f,i)=>(f/forward[i]-1)*100),levels,forward};
}


export function fiveYearGrowthPath(row, now = new Date(), overrides = {}) {
  const anchor=GROWTH_ANCHORS[row?.id],longTerm=longTermGrowth(row?.id);
  const recorded=/^20\d{2}-\d{2}-\d{2}$/.test(row?.asOf||'') ? row.asOf : null;
  const startYear=recorded ? +recorded.slice(0,4)+1 : nextForecastYear(now);
  const forecast=row?.growthForecast;
  const allowed=row?.metricDefinitions?.growthForecast?.permittedUse;
  const eligible=!!(recorded && ['calendar-year','publisher-year','fiscal-year','forecast-horizon'].includes(forecast?.periodBasis)
    && (!allowed || allowed.includes('approximate-scenario-growth')));
  const estimates=new Map((eligible ? forecast.estimates : []).map(p=>[p.year,p]));
  const points=Array.from({length:HOLDING_YEARS},(_,i)=>{
    const year=startYear+i,published=estimates.get(year),custom=Object.hasOwn(overrides,year);
    const growth=custom ? overrides[year] : published ? published.growth : longTerm?.growth ?? '';
    return {year,growth,basis:custom?'custom assumption':published?forecast.forecastType==='house'?'published-house scenario':'published-growth scenario':longTerm?'long-term EPS projection':'unavailable',
      periodLabel:published?.periodLabel || `Holding year ${i+1}`,policyVersion:GROWTH_POLICY.version,reviewedAt:GROWTH_POLICY.reviewedAt,
      scenarioDate:recorded,terminalGrowth:longTerm?.growth,method:GROWTH_POLICY.method,
      sourceEvidence:published
        ? {publisher:forecast.source.publisher,url:forecast.source.url,asOf:forecast.asOf,periodBasis:forecast.periodBasis,forecastType:forecast.forecastType,periodLabel:published.periodLabel??null,referenceYear:published.year,referenceGrowth:published.growth,publishedForYear:true,application:'Use this named-year published rate as a synthetic forward-earnings scenario input; retain its original source period.'}
        : longTerm ? {...longTerm,publishedForYear:false,derived:true} : {publishedForYear:false}};
  });
  return {startYear,coveredYears:points.filter(p=>p.sourceEvidence.publishedForYear).length,rates:points.map(p=>p.growth),points,
    anchor,longTerm,bridge:false,sourceLinked:!!longTerm,scenarioDate:recorded,
    mappingReason:longTerm ? `Published forecasts apply only to their named years and retain their original period labels. Missing years use a ${longTerm.growth}% long-term EPS projection based on Invesco’s ${longTerm.benchmark} market/region proxy.` : 'No sourced long-term EPS projection is connected for this benchmark.',
    missingYears:points.filter(p=>p.growth==='').map(p=>p.year)};
}
