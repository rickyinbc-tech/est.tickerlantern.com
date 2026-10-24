import { nextForecastYear } from './growth-data.js';

export const HOLDING_YEARS = 5;
export const GROWTH_POLICY = Object.freeze({
  version: 'tickerlantern-forward-bridge-long-term-v6',
  reviewedAt: '2026-10-23',
  methodologyUrl: 'https://www.invesco.com/content/dam/invesco/apac/en/pdf/insights/2026/april/2026-invesco-capital-market-assumptions-usd-q1-2026.pdf#page=7',
  method: 'Preserve all published forecasts uncapped as reference observations. Annual calendar/publisher-year forecasts can inform a uniform-accrual calendar-to-forward bridge. Publisher-year calendar alignment and unspecified forward horizons are separate disclosed model assumptions. Six calendar growth inputs produce five forward-anchor transitions. Missing calendar years and unbridgeable publisher/fiscal/horizon series use a derived sourced long-term nominal EPS scenario. The bridge, regional mappings and long-term projections are model assumptions, not publisher forecasts for holding years. Buybacks enter EPS once; dividends and exit P/E remain separate.'
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

// Six calendar growth inputs create seven annual EPS levels and six NTM
// anchors. Uniform accrual is an explicit model assumption, not reported EPS.
export function calendarToForwardRates(calendarRates, elapsedFraction) {
  if (calendarRates.length !== 6 || !Number.isFinite(elapsedFraction) || elapsedFraction<0 || elapsedFraction>1 || calendarRates.some(g=>!Number.isFinite(g)||g<=-100)) throw new Error('Invalid calendar earnings bridge.');
  const levels=[1];
  for (const g of calendarRates) levels.push(levels.at(-1)*(1+g/100));
  const forward=Array.from({length:6},(_,i)=>(1-elapsedFraction)*levels[i]+elapsedFraction*levels[i+1]);
  return {rates:forward.slice(1).map((f,i)=>(f/forward[i]-1)*100),levels,forward};
}

export const growthPathLabel = path => path.bridge ? path.bridgeQuality==='explicit-calendar-ntm' ? 'Modeled NTM bridge + long-term projection' : 'Assumed-period NTM bridge + long-term projection' : path.sourceLinked ? 'Long-term EPS scenario' : 'Growth assumptions unavailable';

export function fiveYearGrowthPath(row, now = new Date(), overrides = {}) {
  const anchor=GROWTH_ANCHORS[row?.id],longTerm=longTermGrowth(row?.id);
  const recorded=/^20\d{2}-\d{2}-\d{2}$/.test(row?.asOf||'') ? row.asOf : null;
  const startYear=recorded ? +recorded.slice(0,4)+1 : nextForecastYear(now);
  const forecast=row?.growthForecast,allowed=row?.metricDefinitions?.growthForecast?.permittedUse;
  const estimates=new Map((forecast?.estimates || []).map(p=>[p.year,p]));
  const forwardHorizon=row?.metricDefinitions?.forwardPE?.economic?.horizon;
  const bridgeEligible=!!(recorded && ['calendar-year','publisher-year'].includes(forecast?.periodBasis)
    && ['rolling-12m','forward-unspecified'].includes(forwardHorizon)
    && allowed?.includes('approximate-scenario-growth')
    && Array.from({length:6},(_,i)=>startYear+i).some(year=>estimates.has(year)));
  const bridgeAssumptions=bridgeEligible ? [
    'Uniform earnings accrual within every modeled calendar year.',
    ...(forecast.periodBasis==='publisher-year' ? ['Treat publisher annual year labels as calendar years; the source does not establish calendar/fiscal aggregation.'] : []),
    ...(forwardHorizon==='forward-unspecified' ? ['Treat the source forward earnings denominator as rolling NTM for this scenario; the publisher does not disclose its horizon.'] : [])
  ] : [];
  const bridgeQuality=bridgeEligible ? bridgeAssumptions.length===1 ? 'explicit-calendar-ntm' : 'assumed-period-alignment' : null;
  const calendarInputs=bridgeEligible ? Array.from({length:6},(_,i)=>{
    const year=startYear+i,published=estimates.get(year);
    return {year,growth:published?.growth ?? longTerm?.growth,published:!!published,
      periodLabel:published?.periodLabel || `Calendar year ${year} long-term extension`,
      source:published ? {publisher:forecast.source.publisher,url:forecast.source.url,asOf:forecast.asOf,forecastType:forecast.forecastType,periodBasis:forecast.periodBasis} : longTerm};
  }) : [];
  const date=recorded ? new Date(recorded+'T00:00:00Z') : null;
  const yearStart=date ? Date.UTC(date.getUTCFullYear(),0,1) : null;
  const elapsedFraction=date ? (+date-yearStart)/(Date.UTC(date.getUTCFullYear()+1,0,1)-yearStart) : null;
  let bridge=null,bridgeError=null;
  if(bridgeEligible)try {bridge=calendarToForwardRates(calendarInputs.map(p=>p.growth),elapsedFraction);}catch(error){bridgeError=error.message;}
  const points=Array.from({length:HOLDING_YEARS},(_,i)=>{
    const year=startYear+i,custom=Object.hasOwn(overrides,year);
    const informed=!!bridge && (calendarInputs[i].published || calendarInputs[i+1].published);
    const growth=custom ? overrides[year] : bridgeError ? '' : bridge ? bridge.rates[i] : longTerm?.growth ?? '';
    const sourceEvidence=custom ? {publishedForYear:false,application:'Reader-selected forward-anchor growth assumption.'}
      : bridge ? {publisher:informed?forecast.source.publisher:longTerm.publisher,url:informed?forecast.source.url:longTerm.url,
        asOf:informed?forecast.asOf:longTerm.asOf,publishedForYear:false,derived:true,
        periodBasis:'modeled-rolling-12m',elapsedFraction,calendarInputs,bridgeQuality,bridgeAssumptions,
        formula:'F_i=(1-w)*CY_i+w*CY_(i+1); g_i=F_i/F_(i-1)-1. CY levels compound their named annual growth rates.',
        application:'Uniform earnings accrual and a six-calendar-year extension are model assumptions. Raw source rates are not replayed as NTM growth.'}
      : longTerm ? {...longTerm,publishedForYear:false,derived:true} : {publishedForYear:false};
    return {year,growth,basis:custom?'custom assumption':bridgeError?'unavailable':informed?'calendar-to-forward model':longTerm?'long-term EPS projection':'unavailable',
      periodLabel:`Holding year ${i+1}${informed?' · modeled NTM transition':''}`,policyVersion:GROWTH_POLICY.version,reviewedAt:GROWTH_POLICY.reviewedAt,
      scenarioDate:recorded,terminalGrowth:longTerm?.growth,method:GROWTH_POLICY.method,sourceEvidence};
  });
  const mappingReason=bridgeError ? `${bridgeError} No affected return is calculated.` : bridge
    ? `${bridgeQuality==='explicit-calendar-ntm'?'Explicit calendar-year estimates':'Annual source estimates under disclosed period assumptions'} inform a uniform-accrual NTM timing model. Entry forward earnings already include much of next calendar year; six calendar inputs produce five annual transitions. Missing calendar years use the sourced long-term EPS proxy. ${bridgeAssumptions.slice(1).join(' ')}`
    : longTerm ? `Published estimates remain visible with their original periods. Their growth measurement interval cannot support an annual bridge; the default uses a ${longTerm.growth}% derived long-term EPS scenario based on Invesco’s ${longTerm.benchmark} proxy.`
    : 'No sourced long-term EPS projection is connected for this benchmark.';
  return {startYear,coveredYears:calendarInputs.filter(p=>p.published).length,rates:points.map(p=>p.growth),points,
    anchor,longTerm,bridge:!!bridge,bridgeQuality,bridgeAssumptions,bridgeError,calendarInputs,elapsedFraction,sourceLinked:!!longTerm,scenarioDate:recorded,
    mappingReason,missingYears:points.filter(p=>p.growth==='').map(p=>p.year)};
}
