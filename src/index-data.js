import { DEFAULTS } from './model.js';
import { validateGrowthForecast } from './growth-data.js';
import { canCompareHistory, sourceExitPE, eligibleTTMReference } from './valuation-policy.js';
import { metricHealth } from './update-status.js';

export const CATALOGUE = Object.freeze({sp500:'S&P 500',nasdaq100:'Nasdaq-100',russell2000:'Russell 2000',tsx:'S&P/TSX Composite','msci-canada':'MSCI Canada',acwi:'MSCI ACWI',world:'MSCI World',eafe:'MSCI EAFE',em:'MSCI Emerging Markets',europe:'MSCI Europe',uk:'MSCI United Kingdom',ftse100:'FTSE 100',stoxx600:'STOXX Europe 600',japan:'MSCI Japan',nikkei225:'Nikkei 225',china:'MSCI China',hangseng:'Hang Seng',csi300:'CSI 300',india:'MSCI India','asia-ex-japan':'MSCI AC Asia Pacific ex Japan',australia:'MSCI Australia'});
const DAY = 86400000;
const safeText = value => typeof value === 'string' && value.trim().length > 0 && value.length <= 2000;
const httpsURL = value => {
  try { const url = new URL(value); return url.protocol === 'https:' && !!url.hostname && !url.username && !url.password; } catch { return false; }
};
export function validDate(value, now = new Date(), timestamp = false) {
  if (typeof value !== 'string' || !(timestamp ? /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/ : /^\d{4}-\d{2}-\d{2}$/).test(value)) return false;
  const parsed = new Date(timestamp ? value : value + 'T00:00:00Z');
  return Number.isFinite(+parsed) && parsed.toISOString().slice(0,10) === value.slice(0,10) && +parsed <= +now + (timestamp ? 300000 : 0) && parsed.getUTCFullYear() >= 2000;
}
function evidence(source, now) {
  if (!source || !safeText(source.publisher) || !httpsURL(source.url)) throw new Error('Missing or malformed metric provenance.');
  if (source.discoveryUrl != null && !httpsURL(source.discoveryUrl)) throw new Error('Invalid evidence discovery URL.');
  if (source.sha256 != null && !/^[a-f0-9]{64}$/.test(source.sha256)) throw new Error('Malformed source content hash.');
  for (const key of ['checkedAt','lastAttempt','lastSuccess']) if (source[key] != null && !validDate(source[key], now, true)) throw new Error('Invalid source validation timestamp.');
}
function metricDefinitions(row, now) {
  if (row.metricDefinitions == null) return; // Schema-1 migration accepts the previous complete feed.
  for (const metric of ['forwardPE','mean10YearForwardPE','dividendYield','growthForecast']) {
    const definition = row.metricDefinitions[metric];
    if (!definition || !safeText(definition.definitionId) || !safeText(definition.definitionVersion) || !['numeric','published-forecast','unavailable','not-meaningful','withdrawn','unknown'].includes(definition.state)) throw new Error('Malformed metric definition.');
    if (definition.observationDate != null && !validDate(definition.observationDate, now)) throw new Error('Invalid metric observation date.');
    if (definition.evidence?.url != null) evidence(definition.evidence, now);
    if (definition.economic?.identity != null && definition.economic.identity !== row.id) throw new Error('Metric definition benchmark mismatch.');
    if (definition.evidence?.observationDate != null && definition.evidence.observationDate !== definition.observationDate) throw new Error('Conflicting metric evidence dates.');
    if (definition.state === 'numeric' && (!Number.isFinite(row[metric]) || definition.rawReportedValue !== row[metric])) throw new Error('Metric value does not match accepted provenance.');
    if (['unavailable','not-meaningful','withdrawn'].includes(definition.state) && row[metric] != null) throw new Error('Non-numeric metric state conflicts with value.');
  }
}
export function validateFeed(feed, now = new Date()) {
  if (feed?.schemaVersion !== 1 || !Array.isArray(feed.indices) || feed.indices.length !== Object.keys(CATALOGUE).length) throw new Error('Unsupported or incomplete index snapshot.');
  if (!validDate(feed.publishedAt, now, true)) throw new Error('Missing or invalid snapshot publication timestamp.');
  if ((feed.snapshotVersion == null) !== (feed.snapshotId == null) || (feed.snapshotVersion != null && (!Number.isSafeInteger(feed.snapshotVersion) || feed.snapshotVersion < 1 || !/^[a-f0-9]{64}$/.test(feed.snapshotId)))) throw new Error('Invalid semantic snapshot version.');
  for (const key of ['sourceCheckAt','growthCheckAt','browserSourceCheckAt','lastScheduledCheckAt']) if (feed[key] != null && !validDate(feed[key], now, true)) throw new Error('Invalid publisher check timestamp.');
  const ids = new Set();
  for (const row of feed.indices) {
    if (!Object.hasOwn(CATALOGUE,row.id) || ids.has(row.id) || row.name !== CATALOGUE[row.id]) throw new Error('Invalid index identity.');
    ids.add(row.id);
    if(row.trailingValuation!=null && (!eligibleTTMReference(row) || !validDate(row.trailingValuation.currentAsOf,now) || !validDate(row.trailingValuation.meanAsOf,now))) throw new Error('Unverified or mismatched trailing valuation fallback.');
    validateGrowthForecast(row.growthForecast);
    if (row.growthForecast != null) {
      if (!validDate(row.growthForecast.asOf, now)) throw new Error('Invalid EPS observation date.');
      evidence(row.growthForecast.source, now);
      const years = row.growthForecast.estimates.map(point => point.year);
      if (!years.length || years.some((year,i) => i && year <= years[i-1])) throw new Error('Unordered EPS forecast years.');
    }
    for (const key of ['forwardPE', 'mean10YearForwardPE']) if (row[key] !== null && (!Number.isFinite(row[key]) || Math.abs(row[key]) > 1e6)) throw new Error('Invalid valuation metric.');
    if (row.dividendYield !== null && (!Number.isFinite(row.dividendYield) || row.dividendYield < 0 || row.dividendYield > 1000)) throw new Error('Invalid dividend yield.');
    if (row.forwardPE !== null) { if (!validDate(row.asOf, now)) throw new Error('Missing observation date.'); evidence(row.source, now); }
    if (row.mean10YearForwardPE !== null) { if (!validDate(row.meanAsOf, now) || !safeText(row.meanMethod)) throw new Error('Missing historical-average provenance.'); evidence(row.meanSource || row.source, now); }
    if (row.dividendYield !== null) { if (!validDate(row.yieldAsOf || row.asOf, now)) throw new Error('Missing dividend observation date.'); evidence(row.yieldSource || row.source, now); }
    for (const key of ['asOf','meanAsOf','yieldAsOf']) if (row[key] != null && !validDate(row[key], now)) throw new Error('Invalid observation date.');
    for (const key of ['sync','meanSync','yieldSync','growthSync']) {
      const status = row[key];
      if (!status) continue;
      if (!['ok','retained','unavailable','not-connected','not-meaningful','withdrawn','definition-review-required','superseded'].includes(status.status)) throw new Error('Invalid metric update state.');
      for (const time of ['lastAttempt','lastSuccess']) if (status[time] != null && !validDate(status[time],now,true)) throw new Error('Invalid metric update timestamp.');
    }
    if (row.historicalCompatibility != null && (!['compatible','qualified','incompatible','insufficient'].includes(row.historicalCompatibility.outcome) || typeof row.historicalCompatibility.allowComparison !== 'boolean' || typeof row.historicalCompatibility.allowExitDefault !== 'boolean' || !Array.isArray(row.historicalCompatibility.reasons) || row.historicalCompatibility.reasons.some(reason=>!safeText(reason)))) throw new Error('Malformed historical compatibility assessment.');
    metricDefinitions(row, now);
  }
  return feed;
}

export function sourceInputs(row, current = DEFAULTS, locked = {}) {
  const next = { ...DEFAULTS, ...current };
  if (row?.forwardPE == null) return next;
  if (!locked.entryPE) next.entryPE = row.forwardPE;
  if (!locked.exitPE) next.exitPE = sourceExitPE(row, next.entryPE,next);
  if (!locked.dividendMode) next.dividendMode = row.dividendYield == null ? 'payout' : 'yield';
  if (row.dividendYield != null && !locked.dividendYield) next.dividendYield = row.dividendYield;
  return next;
}

export function isStale(row, now = new Date()) {
  if (!row?.asOf) return false;
  const health=metricHealth(row,'forwardPE',now);
  return health.observationStale || health.checkOverdue || health.sourceFailure || health.definitionReview || health.superseded || browserCheckOverdue(row.source,now);
}

export function browserCheckOverdue(source, now = new Date()) {
  if (source?.transport !== 'scheduled-browser') return false;
  const age = now - new Date(source.checkedAt || '');
  return !Number.isFinite(age) || age > 48 * 3600000 || age < -5 * 60000;
}

export function premium(row) {
  return canCompareHistory(row) ? row.forwardPE / row.mean10YearForwardPE - 1 : null;
}

export function isDatedMean(row, now = new Date()) {
  if (row?.mean10YearForwardPE == null) return false;
  return row.meanSource?.syncMode === 'dated-reference' || (now - new Date(row.meanAsOf + 'T00:00:00Z')) / 86400000 > 90;
}

export function historyCoverage(feed) {
  const rows = feed.indices.filter(row => row.mean10YearForwardPE != null);
  const dated = rows.filter(row => isDatedMean(row)).length;
  return `${rows.length} of ${feed.indices.length} benchmarks have a sourced 10-year forward-P/E reference${dated ? `, including ${dated} older dated references` : ''}. Each mean keeps its own date and source. Older references are not the latest rolling 10-year average; unavailable metrics remain blank.`;
}
