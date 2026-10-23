// Forecast years keep the publisher's period labels. Never repeat the last
// published growth rate into years for which the publisher has no estimate.
export function validateGrowthForecast(forecast) {
  if (forecast == null) return;
  if (!['calendar-year', 'fiscal-year', 'publisher-year', 'forecast-horizon'].includes(forecast.periodBasis) || !Array.isArray(forecast.estimates) || forecast.estimates.length > 12 || !['consensus', 'house'].includes(forecast.forecastType)) throw new Error('Invalid EPS forecast periods.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(forecast.asOf || '') || !forecast.source?.url?.startsWith('https://') || !forecast.source.publisher) throw new Error('Missing EPS forecast provenance.');
  const date = new Date(forecast.asOf + 'T00:00:00Z');
  if (!Number.isFinite(+date) || date.toISOString().slice(0, 10) !== forecast.asOf) throw new Error('Invalid growth observation date.');
  const years = new Set();
  for (const point of forecast.estimates) {
    if (!Number.isInteger(point.year) || point.year < 2020 || point.year > 2100 || years.has(point.year) || !Number.isFinite(point.growth) || point.growth <= -100 || point.growth > 1000) throw new Error('Invalid annual EPS growth estimate.');
    if (forecast.periodBasis === 'forecast-horizon' && !point.periodLabel) throw new Error('Missing forecast endpoint label.');
    years.add(point.year);
  }
}

export function nextForecastYear(now = new Date()) {
  return Number(new Intl.DateTimeFormat('en', { year: 'numeric', timeZone: 'America/Vancouver' }).format(now)) + 1;
}

export function sourceGrowthPath(row, years, now = new Date(), overrides = {}) {
  const startYear = nextForecastYear(now), forecast = row?.growthForecast;
  const estimates = new Map((forecast?.estimates || []).map(point => [point.year, point.growth]));
  let coveredYears = 0;
  while (estimates.has(startYear + coveredYears)) coveredYears++;
  const count = Number.isInteger(+years) && +years >= 1 && +years <= 20 ? +years : 0;
  const rates = Array.from({ length: count }, (_, i) => Object.hasOwn(overrides, startYear+i) ? overrides[startYear+i] : estimates.get(startYear + i) ?? '');
  return { startYear, coveredYears, rates, missingYears: rates.flatMap((rate, i) => rate === '' ? [startYear + i] : []) };
}

export function growthIsStale(row, now = new Date()) {
  const forecast = row?.growthForecast;
  if (!forecast?.estimates?.length) return true;
  const age = (+now - +new Date(forecast.asOf + 'T00:00:00Z')) / 86400000;
  return !Number.isFinite(age) || age > 90 || forecast.sync?.status === 'retained';
}

export function growthCoverage(feed, now = new Date()) {
  const covered = feed.indices.filter(row => sourceGrowthPath(row, 1, now).coveredYears > 0).length;
  return `${covered} of ${feed.indices.length} benchmarks have published ${nextForecastYear(now)} growth inputs`;
}
