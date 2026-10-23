import { nextForecastYear } from './growth-data.js';

export const HOLDING_YEARS = 5;
export const GROWTH_POLICY = Object.freeze({
  version: 'tickerlantern-forward-timing-v2',
  reviewedAt: '2026-10-23',
  maxExtensionSpread: 10,
  methodologyUrl: 'https://www.invesco.com/apac/en/institutional/insights/multi-asset/long-term-capital-market-assumptions.html',
  method: 'Only explicit calendar-year growth paired with an explicit rolling-12m entry definition receives a modeled calendar-to-forward EPS bridge. Assume uniform earnings accrual and a fixed within-year weight from the recorded valuation date (a date proxy where stated). Extend missing calendar rates toward the editorial anchor, including a sixth calendar rate for five forward transitions. Other period definitions use the editorial normalized anchor in each holding year; published growth remains reference only. All resulting rates are model estimates, not publisher forecasts. No extra buyback yield is added.'
});

// Rounded editorial nominal EPS assumptions, not observed index statistics or
// quantitative estimates attributed to the methodology reference above.
export const GROWTH_ANCHORS = Object.freeze(Object.fromEntries([
  ['sp500', 6, 'Diversified mature US companies; nominal sales growth with modest per-share gains.'],
  ['nasdaq100', 8, 'Technology mix supports a premium to broad US growth; competition and margin normalization limit persistence.'],
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
