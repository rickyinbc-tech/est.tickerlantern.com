import { nextForecastYear } from './growth-data.js';

export const HOLDING_YEARS = 5;
export const GROWTH_POLICY = Object.freeze({
  version: 'tickerlantern-forward-timing-v4',
  reviewedAt: '2026-10-23',
  maxExtensionSpread: 10,
  methodologyUrl: 'https://www.invesco.com/apac/en/institutional/insights/multi-asset/long-term-capital-market-assumptions.html',
  method: 'Only explicit calendar-year growth paired with an explicit rolling-12m entry definition receives a modeled calendar-to-forward EPS bridge. Assume uniform earnings accrual and a fixed within-year weight from the recorded valuation date (a date proxy where stated). Extend missing calendar rates toward the editorial anchor, including a sixth calendar rate for five forward transitions. Other period definitions use the editorial normalized anchor in each holding year; published growth remains reference only. Nasdaq-100 uses each published annual estimate only for its named year; missing years use a long-term EPS projection derived from Invesco US large-cap building blocks. All resulting holding-year rates are model inputs. No separate buyback return is added.'
});

// Invesco's additive building blocks, converted to a nominal per-share growth
// proxy. Buybacks enter EPS once; dividends and valuation remain in our model.
// This is an application-derived US large-cap proxy, not Nasdaq consensus.
export const NASDAQ_LONG_TERM = Object.freeze({
  growth: 8.04,
  components: Object.freeze({realEarningsGrowth:4.01, inflation:2.19, buybackYield:1.84}),
  formula: '4.01% real earnings growth + 2.19% inflation + 1.84% buyback effect = 8.04% nominal EPS projection (additive approximation)',
  publisher: 'Invesco Solutions',
  title: '2026 Capital Market Assumptions, Q1 update',
  url: 'https://www.invesco.com/content/dam/invesco/apac/en/pdf/insights/2026/april/2026-invesco-capital-market-assumptions-usd-q1-2026.pdf#page=7',
  asOf: '2025-12-31', checkedAt: '2026-10-23', horizonYears:10,
  pdfPages: Object.freeze([7,11]), benchmark:'S&P 500 / US large cap',
  sha256:'28faab4574d491474f4eac99fc734e5c4615ec320793bcc2f0c264dc5b70ee7b',
  application: 'Use a constant long-term US large-cap EPS proxy in missing Nasdaq annual forecast years. Exclude source dividends, valuation and FX components; these are not extra returns in this model.'
});

// Other entries remain rounded editorial nominal EPS assumptions.
export const GROWTH_ANCHORS = Object.freeze(Object.fromEntries([
  ['sp500', 6, 'Diversified mature US companies; nominal sales growth with modest per-share gains.'],
  ['nasdaq100', NASDAQ_LONG_TERM.growth, 'Long-term nominal EPS projection derived from Invesco US large-cap earnings, inflation and buyback building blocks.'],
  ['russell2000', 6, 'Small-company rebound growth normalizes; financing costs and dilution limit long-run gains.'],
  ['tsx', 5, 'Mature financials and resources; commodity cycles do not compound indefinitely.'],
  ['msci-canada', 5, 'Mature Canadian market; separate benchmark from the TSX, with a similar long-run economic anchor.'],
  ['acwi', 5.5, 'Diversified developed and emerging markets; a rounded global nominal EPS anchor.'],
  ['world', 5.5, 'Developed-market nominal growth with modest per-share gains.'],
  ['eafe', 5, 'Mature non-US developed markets with slower structural growth.'],
  ['em', 7, 'Higher structural demand growth, discounted for cyclicality and dilution.'],
  ['europe', 5, 'Mature European companies with global revenues and modest nominal growth.'],
  ['uk', 4.5, 'Mature financial, resource and defensive mix; limited sustained margin expansion.'],
  ['ftse100', 4.5, 'Global mature-company mix; separate from MSCI UK and not its consensus forecast.'],
  ['stoxx600', 5, 'Broad mature European earnings; normalize the near-term recovery.'],
  ['japan', 4.5, 'Low structural growth with some inflation and corporate-efficiency improvement.'],
  ['nikkei225', 5, 'Exporter and technology exposure allows a modest premium to broad Japan.'],
  ['china', 6, 'Normalize the recovery; allow for slower structural growth and policy risk.'],
  ['hangseng', 5, 'Mature financials and China exposure; a cautious normalized earnings anchor.'],
  ['csi300', 6, 'Domestic China exposure; normalize cyclical growth without extending a rebound.'],
  ['india', 9, 'Higher structural nominal demand growth, moderated for dilution and competition.'],
  ['asia-ex-japan', 7, 'Emerging Asia and technology mix; normalize the current semiconductor-led upswing.'],
  ['australia', 5, 'Mature banks and resources; normalize commodity-sensitive earnings.']
].map(([id, growth, rationale]) => [id, Object.freeze({ growth, rationale })])));

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
  const anchor = GROWTH_ANCHORS[row?.id];
  const recorded = /^20\d{2}-\d{2}-\d{2}$/.test(row?.asOf || '') ? row.asOf : null;
  const date = recorded ? new Date(recorded+'T00:00:00Z') : now;
  const baseYear = recorded ? date.getUTCFullYear() : nextForecastYear(now)-1;
  const startYear=baseYear+1, forecast=row?.growthForecast;
  const eligible = row?.metricDefinitions?.forwardPE?.economic?.horizon === 'rolling-12m'
    && forecast?.periodBasis === 'calendar-year'
    && row?.metricDefinitions?.growthForecast?.permittedUse?.includes('approximate-scenario-growth');
  const estimates = new Map((forecast?.estimates || []).map(p=>[p.year,p]));
  // Exact-year annual forecasts take precedence. Never repeat a near-term
  // forecast into an uncovered year, including gaps between published years.
  if (row?.id === 'nasdaq100' && recorded) {
    const annual = ['calendar-year','publisher-year'].includes(forecast?.periodBasis);
    const points = Array.from({length:HOLDING_YEARS}, (_,i) => {
      const year=startYear+i, published=annual ? estimates.get(year) : null, custom=Object.hasOwn(overrides,year);
      return {year,growth:custom?overrides[year]:published?published.growth:NASDAQ_LONG_TERM.growth,
        basis:custom?'custom assumption':published?'published-growth scenario':'long-term EPS projection',
        periodLabel:`Holding year ${i+1}`,policyVersion:GROWTH_POLICY.version,reviewedAt:GROWTH_POLICY.reviewedAt,
        scenarioDate:recorded,terminalGrowth:NASDAQ_LONG_TERM.growth,
        method:'Use a published annual forecast only in its named year. For missing years use the long-term EPS proxy, without fading or extending the near-term forecast.',
        sourceEvidence:published
          ? {publisher:forecast.source.publisher,url:forecast.source.url,asOf:forecast.asOf,periodBasis:forecast.periodBasis,referenceYear:published.year,referenceGrowth:published.growth,publishedForYear:true}
          : {...NASDAQ_LONG_TERM,publishedForYear:false,derived:true}};
    });
    return {startYear,coveredYears:points.filter(p=>p.sourceEvidence.publishedForYear).length,rates:points.map(p=>p.growth),points,
      anchor,longTerm:NASDAQ_LONG_TERM,bridge:false,sourceLinked:true,scenarioDate:recorded,
      mappingReason:`Published annual forecasts apply only to their named years. Missing years use an ${NASDAQ_LONG_TERM.growth}% long-term EPS projection derived from Invesco US large-cap assumptions. This is a regional proxy applied to the scenario's forward earnings.`,
      missingYears:[]};
  }
  let coveredYears=0;
  while(coveredYears<6 && estimates.has(startYear+coveredYears)) coveredYears++;
  const bridge=!!(eligible && recorded && anchor && coveredYears);
  const yearStart=Date.UTC(baseYear,0,1), nextYear=Date.UTC(baseYear+1,0,1);
  const weight=(+date-yearStart)/(nextYear-yearStart);
  const last=coveredYears ? estimates.get(startYear+coveredYears-1).growth : anchor?.growth;
  const spread=anchor ? Math.max(-GROWTH_POLICY.maxExtensionSpread,Math.min(GROWTH_POLICY.maxExtensionSpread,last-anchor.growth)) : 0;
  const calendarInputs=bridge ? Array.from({length:6},(_,i)=>({year:startYear+i,
    growth:i<coveredYears ? estimates.get(startYear+i).growth : i>=4 ? anchor.growth : anchor.growth+spread*(4-i)/(5-coveredYears),
    basis:i<coveredYears ? forecast.forecastType : 'editorial extension',
    ...(i<coveredYears ? {periodLabel:estimates.get(startYear+i).periodLabel,observationDate:forecast.asOf,sourceURL:forecast.source.url} : {})})) : [];
  let calculated=null,bridgeError='';
  if(bridge)try{calculated=calendarToForwardRates(calendarInputs.map(p=>p.growth),weight);}catch(error){bridgeError=error.message;}
  const reason=bridgeError || (bridge ? 'Calendar inputs converted to a synthetic forward earnings path with uniform annual accrual; not a verified rolling consensus series.' : 'No verified calendar-to-forward period bridge. Published estimates remain reference only; each holding year uses the editorial normalized EPS assumption.');
  const points=Array.from({length:5},(_,i)=>{
    const year=startYear+i, custom=Object.hasOwn(overrides,year);
    const growth=custom ? overrides[year] : bridgeError ? '' : calculated ? calculated.rates[i] : anchor?.growth ?? '';
    return {year,growth,basis:custom?'custom assumption':bridgeError?'unavailable':bridge?'calendar-to-forward model':anchor?'normalized model':'unavailable',
      periodLabel:`Holding year ${i+1}`,policyVersion:GROWTH_POLICY.version,reviewedAt:GROWTH_POLICY.reviewedAt,
      scenarioDate:recorded,dateBasis:row?.metricDefinitions?.forwardPE?.evidence?.dateBasis || 'scenario date unavailable',
      terminalGrowth:anchor?.growth,rationale:anchor?.rationale,method:GROWTH_POLICY.method,mappingReason:reason,
      ...(bridge ? {elapsedFraction:weight,calendarInputs,forwardAnchorRatio:calculated ? calculated.forward[i+1]/calculated.forward[i] : null,
        formula:'F_t=(1-w)*E_CY(y+t)+w*E_CY(y+t+1); modeled growth=F_t/F_(t-1)-1',
        sourceEvidence:{publisher:forecast.source.publisher,url:forecast.source.url,asOf:forecast.asOf,periodBasis:forecast.periodBasis}}
        : {})};
  });
  return {startYear,coveredYears,rates:points.map(p=>p.growth),points,anchor,bridge,scenarioDate:recorded,mappingReason:reason,
    missingYears:points.filter(p=>p.growth==='').map(p=>p.year)};
}
