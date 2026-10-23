import { DEFAULTS, BOUNDS } from './model.js';

export const SOURCE_FIELDS = ['entryPE', 'exitPE', 'dividendMode', 'dividendYield'];

// Resolve every benchmark independently, including when a source disappears.
export function scenarioInputs(row, current = DEFAULTS, locked = {}, following = true) {
  const next = { ...DEFAULTS, ...current };
  if (!following) return next;
  if (!locked.entryPE) next.entryPE = row?.forwardPE ?? DEFAULTS.entryPE;
  if (!locked.exitPE) next.exitPE = row?.forwardPE == null ? DEFAULTS.exitPE : row.mean10YearForwardPE ?? row.forwardPE;
  if (!locked.dividendMode) next.dividendMode = row?.dividendYield == null ? 'payout' : 'yield';
  if (!locked.dividendYield) next.dividendYield = row?.dividendYield ?? DEFAULTS.dividendYield;
  return next;
}

export function switchScenario(row, saved, shared, locked = {}, following = true) {
  return scenarioInputs(row, { ...DEFAULTS, ...saved, ...shared }, locked, following);
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

export function fieldBasis(key, row, locked = {}, following = true, sharedEdited = {}) {
  if (locked[key] || sharedEdited[key]) return 'custom';
  if (['growth', 'years', 'payout'].includes(key)) return 'default';
  if (!following) return 'manual';
  if (key === 'entryPE') return row?.forwardPE != null ? 'source' : 'default';
  if (key === 'exitPE') return row?.mean10YearForwardPE != null && row?.forwardPE != null ? 'reference' : row?.forwardPE != null ? 'fallback' : 'default';
  if (key === 'dividendYield') return row?.dividendYield != null ? 'source' : 'default';
  return 'default';
}
