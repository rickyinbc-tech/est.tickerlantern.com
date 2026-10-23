import { DEFAULTS, BOUNDS } from './model.js';
import { sourceGrowthPath } from './growth-data.js';
import { fiveYearGrowthPath, HOLDING_YEARS } from './five-year-growth.js';
import { sourceExitPE, eligibleExitMean } from './valuation-policy.js';
import { calibratedPayout, DIVIDEND_POLICY_VERSION } from './dividend-policy.js';

export const SOURCE_FIELDS = ['entryPE', 'exitPE', 'dividendMode', 'dividendYield'];

// Resolve every benchmark independently, including when a source disappears.
export function scenarioInputs(row, current = DEFAULTS, locked = {}, following = true, now = new Date()) {
  const next = { ...DEFAULTS, ...current, years: HOLDING_YEARS };
  // Migrate old one/two-year saved scenarios without discarding custom inputs.
  if (next.growthMode === 'annual') next.annualGrowth = Array.from({length:HOLDING_YEARS}, (_,i) => next.annualGrowth?.[i] ?? next.growth);
  if (!following) {
    if (current.dividendPolicyVersion !== DIVIDEND_POLICY_VERSION && !locked.payout && row?.id) {
      next.payout=calibratedPayout(row,next.entryPE);
      if (!locked.dividendMode) next.dividendMode='payout';
    }
    next.dividendPolicyVersion=DIVIDEND_POLICY_VERSION;
    if (next.growthMode === 'source') {
      const path = fiveYearGrowthPath(row, now, next.growthOverrides);
      next.annualGrowth = Array.from({length:HOLDING_YEARS}, (_,i) => next.annualGrowth?.[i] ?? path.rates[i]);
      next.growthStartYear ??= path.startYear;
      next.growthPlan = [];
    }
    return next;
  }
  if (!locked.entryPE) next.entryPE = row?.forwardPE ?? DEFAULTS.entryPE;
  if (!locked.exitPE) next.exitPE = sourceExitPE(row, next.entryPE);
  if (!locked.dividendMode) next.dividendMode = 'payout';
  if (!locked.dividendYield) next.dividendYield = row?.dividendYield ?? DEFAULTS.dividendYield;
  if (!locked.payout) next.payout = row?.dividendYield != null ? calibratedPayout(row,next.entryPE) : row?.id ? '' : DEFAULTS.payout;
  next.dividendPolicyVersion=DIVIDEND_POLICY_VERSION;
  if (!locked.growthMode && !locked.growth && !locked.annualGrowth) next.growthMode = 'source';
  if (next.growthMode === 'source') {
    const selected = fiveYearGrowthPath(row, now, next.growthOverrides);
    next.annualGrowth = selected.rates;
    next.growthStartYear = selected.startYear;
    next.growthPlan = selected.points;
  }
  return next;
}

export function switchScenario(row, saved, locked = {}, following = true, now = new Date()) {
  const values = scenarioInputs(row, { ...DEFAULTS, ...saved }, locked, following, now);
  return { ...values, annualGrowth: [...(values.annualGrowth || [])] };
}

export function restoreSourceLocks(locked = {}) {
  return Object.fromEntries(Object.entries(locked).filter(([key]) => !SOURCE_FIELDS.includes(key)));
}

export function presetScenario(input, preset) {
  if (preset === 'compression') return { values: { ...input, exitPE: Math.max(BOUNDS.exitPE[0], Math.round(+input.entryPE * .8 * 100) / 100) }, locks: ['exitPE'] };
  if (preset === 'constant') return { values: { ...input, exitPE: input.entryPE }, locks: ['exitPE'] };
  if (preset === 'zero') {
    const key = input.dividendMode === 'yield' ? 'dividendYield' : 'payout';
    return { values: { ...input, [key]: 0 }, locks: [key] };
  }
  throw new Error('Unknown scenario preset');
}

export function fieldBasis(key, row, locked = {}, following = true) {
  if (locked[key]) return 'custom';
  if (key === 'payout' && !following) return 'manual';
  if (key === 'growth' && following && sourceGrowthPath(row, 1).coveredYears) return 'forecast';
  if (key === 'payout' && following && row?.dividendYield != null && calibratedPayout(row,row.forwardPE)!=='') return 'calibrated';
  if (['growth', 'years', 'payout'].includes(key)) return 'default';
  if (!following) return 'manual';
  if (key === 'entryPE') return row?.forwardPE != null ? 'source' : 'default';
  if (key === 'exitPE') return eligibleExitMean(row) ? 'reference' : 'fallback';
  if (key === 'dividendYield') return row?.dividendYield != null ? 'source' : 'default';
  return 'default';
}

export const STORAGE_KEY = 'tickerlantern.est.scenarios.v1';
const SCENARIO_KEYS = [...Object.keys(DEFAULTS)];

export function loadScenarios(storage) {
  const empty = { scenarios: new Map(), overrides: new Map(), selectedIndexId: 'sp500', following: true };
  try {
    const data = JSON.parse(storage.getItem(STORAGE_KEY));
    if (data?.version !== 1 || !Array.isArray(data.scenarios) || !Array.isArray(data.overrides)) return empty;
    for (const [id, values] of data.scenarios) {
      if (typeof id !== 'string' || !values || typeof values !== 'object') continue;
      const clean = Object.fromEntries(SCENARIO_KEYS.filter(key => typeof values[key] === 'number' || typeof values[key] === 'string').map(key => [key, values[key]]));
      if (Array.isArray(values.annualGrowth)) clean.annualGrowth = values.annualGrowth.slice(0, 20).map(value => typeof value === 'number' || typeof value === 'string' ? value : '');
      clean.growthOverrides = Object.fromEntries(Object.entries(values.growthOverrides || {}).filter(([year,value])=>/^20\d{2}$/.test(year) && ['number','string'].includes(typeof value)));
      clean.dividendPolicyVersion=typeof values.dividendPolicyVersion==='string'?values.dividendPolicyVersion:'';
      empty.scenarios.set(id, clean);
    }
    for (const [id, locks] of data.overrides) if (typeof id === 'string' && locks && typeof locks === 'object') empty.overrides.set(id, Object.fromEntries(SCENARIO_KEYS.filter(key => locks[key] === true).map(key => [key, true])));
    if (typeof data.selectedIndexId === 'string') empty.selectedIndexId = data.selectedIndexId;
    empty.following = data.following !== false;
  } catch { /* Storage may be disabled or contain an older, malformed value. */ }
  return empty;
}

export function saveScenarios(storage, state) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, scenarios: [...state.scenarios], overrides: [...state.overrides], selectedIndexId: state.selectedIndexId, following: state.following }));
    return true;
  } catch { return false; }
}
