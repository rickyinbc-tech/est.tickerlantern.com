import { sourceGrowthPath } from './growth-data.js';

export const HOLDING_YEARS = 5;
export const GROWTH_POLICY = Object.freeze({
  version: 'tickerlantern-five-year-fade-v1',
  reviewedAt: '2026-10-23',
  maxExtensionSpread: 10,
  methodologyUrl: 'https://www.invesco.com/apac/en/institutional/insights/multi-asset/long-term-capital-market-assumptions.html',
  method: 'Keep published future rates. Fill unpublished years by linearly fading the last published rate toward a benchmark-specific nominal EPS anchor at year five. Cap the carried spread at +/-10 percentage points before fading. Anchors and the fade are TickerLantern assumptions, not publisher forecasts. No extra buyback yield is added.'
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

export function fiveYearGrowthPath(row, now = new Date(), overrides = {}) {
  const published = sourceGrowthPath(row, HOLDING_YEARS, now);
  const anchor = GROWTH_ANCHORS[row?.id];
  const covered = Math.min(HOLDING_YEARS, published.coveredYears);
  const last = covered ? published.rates[covered - 1] : anchor?.growth;
  const spread = anchor ? Math.max(-GROWTH_POLICY.maxExtensionSpread, Math.min(GROWTH_POLICY.maxExtensionSpread, last - anchor.growth)) : 0;
  const points = Array.from({ length: HOLDING_YEARS }, (_, i) => {
    const year = published.startYear + i;
    const sourcePoint = row?.growthForecast?.estimates.find(point => point.year === year);
    let growth = published.rates[i], basis = sourcePoint ? row.growthForecast.forecastType : 'unavailable';
    if (!sourcePoint && anchor) {
      growth = Math.round((anchor.growth + spread * (HOLDING_YEARS - i - 1) / (HOLDING_YEARS - covered)) * 10000) / 10000;
      basis = 'model extension';
    }
    if (Object.hasOwn(overrides, year)) { growth = overrides[year]; basis = 'custom assumption'; }
    return { year, growth, basis, periodLabel: sourcePoint?.periodLabel || String(year),
      ...(basis === 'model extension' ? { policyVersion: GROWTH_POLICY.version, reviewedAt: GROWTH_POLICY.reviewedAt, terminalGrowth: anchor.growth, rationale: anchor.rationale, method: GROWTH_POLICY.method, methodologyUrl: GROWTH_POLICY.methodologyUrl } : {}) };
  });
  return { ...published, rates: points.map(point => point.growth), points, anchor,
    missingYears: points.filter(point => point.growth === '').map(point => point.year) };
}
