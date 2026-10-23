import { DEFAULTS } from './model.js';
import { validateGrowthForecast } from './growth-data.js';

export function validateFeed(feed) {
  if (feed?.schemaVersion !== 1 || !Array.isArray(feed.indices) || !feed.indices.length || feed.indices.length > 100) throw new Error('Unsupported index snapshot.');
  const ids = new Set();
  for (const row of feed.indices) {
    if (!/^[a-z0-9-]+$/.test(row.id) || ids.has(row.id) || typeof row.name !== 'string') throw new Error('Invalid index identity.');
    ids.add(row.id);
    validateGrowthForecast(row.growthForecast);
    for (const key of ['forwardPE', 'mean10YearForwardPE']) if (row[key] !== null && (!Number.isFinite(row[key]) || row[key] < 1 || row[key] > 100)) throw new Error('Invalid valuation metric.');
    if (row.dividendYield !== null && (!Number.isFinite(row.dividendYield) || row.dividendYield < 0 || row.dividendYield > 15)) throw new Error('Invalid dividend yield.');
    if (row.forwardPE !== null && !/^\d{4}-\d{2}-\d{2}$/.test(row.asOf || '')) throw new Error('Missing observation date.');
    if (row.mean10YearForwardPE !== null && (!/^\d{4}-\d{2}-\d{2}$/.test(row.meanAsOf || '') || !row.meanMethod)) throw new Error('Missing historical-average provenance.');
    if (row.mean10YearForwardPE !== null && (!(row.meanSource || row.source)?.url?.startsWith('https://') || !(row.meanSource || row.source)?.publisher)) throw new Error('Missing historical-average source.');
    if (row.yieldAsOf && !/^\d{4}-\d{2}-\d{2}$/.test(row.yieldAsOf)) throw new Error('Invalid dividend observation date.');
    if (row.forwardPE !== null && (!row.source?.url?.startsWith('https://') || !row.source.publisher)) throw new Error('Missing valuation source.');
  }
  return feed;
}

export function sourceInputs(row, current = DEFAULTS, locked = {}) {
  const next = { ...DEFAULTS, ...current };
  if (row?.forwardPE == null) return next;
  if (!locked.entryPE) next.entryPE = row.forwardPE;
  if (!locked.exitPE) next.exitPE = row.mean10YearForwardPE ?? row.forwardPE;
  if (!locked.dividendMode) next.dividendMode = row.dividendYield == null ? 'payout' : 'yield';
  if (row.dividendYield != null && !locked.dividendYield) next.dividendYield = row.dividendYield;
  return next;
}

export function isStale(row, now = new Date()) {
  if (!row?.asOf) return false;
  const age = (now - new Date(row.asOf + 'T00:00:00Z')) / 86400000;
  return age > (row.source?.publisher === 'FactSet' ? 21 : 65) || browserCheckOverdue(row.source, now) || ['retained', 'unavailable'].includes(row.sync?.status);
}

export function browserCheckOverdue(source, now = new Date()) {
  if (source?.transport !== 'scheduled-browser') return false;
  const age = now - new Date(source.checkedAt || '');
  return !Number.isFinite(age) || age > 48 * 3600000 || age < -5 * 60000;
}

export function premium(row) {
  return row?.forwardPE != null && row?.mean10YearForwardPE != null ? row.forwardPE / row.mean10YearForwardPE - 1 : null;
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
