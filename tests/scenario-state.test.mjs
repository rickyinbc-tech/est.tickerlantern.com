import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULTS } from '../src/model.js';
import { scenarioInputs, switchScenario, restoreSourceLocks, loadScenarios, saveScenarios, STORAGE_KEY } from '../src/scenario-state.js';

const row = { forwardPE: 18, mean10YearForwardPE: 16, dividendYield: 2 };
test('a different benchmark starts with its own defaults rather than the previous growth and horizon', () => {
  const next = switchScenario(row, undefined, {});
  assert.equal(next.growth, 6);
  assert.equal(next.years, 5);
  assert.equal(next.entryPE, 18);
});
test('revisiting a benchmark restores its own complete annual schedule and horizon', () => {
  const saved = { ...DEFAULTS, growth: 9, years: 3, growthMode: 'annual', annualGrowth: [10, -5, 20] };
  const next = switchScenario(row, saved, { growthMode: true, annualGrowth: true, years: true });
  assert.deepEqual(next.annualGrowth, [10, -5, 20, 9, 9]);
  assert.equal(next.growthMode, 'annual');
  assert.equal(next.years, 5);
});
test('source refresh and source restore protect the annual schedule and custom payout', () => {
  const saved = { ...DEFAULTS, growthMode: 'annual', annualGrowth: [10, -5, 20], payout: 40 };
  const locks = restoreSourceLocks({ entryPE: true, growth: true, annualGrowth: true, payout: true });
  assert.deepEqual(locks, { growth: true, annualGrowth: true, payout: true });
  const next = scenarioInputs(row, saved, locks);
  assert.deepEqual(next.annualGrowth, [10, -5, 20, 6, 6]);
  assert.equal(next.payout, 40);
  assert.equal(next.entryPE, 18);
});

test('saved browser settings restore distinct benchmark schedules and protected source fields', () => {
  let json;
  const storage = { getItem: key => key === STORAGE_KEY ? json : null, setItem: (key, value) => { assert.equal(key, STORAGE_KEY); json = value; } };
  const state = { scenarios: new Map([['sp500', { ...DEFAULTS, years: 3, growthMode: 'annual', annualGrowth: [10, -5, 20] }], ['nasdaq100', { ...DEFAULTS, growth: 8 }]]), overrides: new Map([['sp500', { annualGrowth: true, entryPE: true }]]), selectedIndexId: 'sp500', following: true };
  assert.equal(saveScenarios(storage, state), true);
  const restored = loadScenarios(storage);
  assert.deepEqual(restored.scenarios.get('sp500').annualGrowth, [10, -5, 20]);
  assert.equal(restored.scenarios.get('nasdaq100').growth, 8);
  assert.deepEqual(restored.overrides.get('sp500'), { annualGrowth: true, entryPE: true });
  const edited = switchScenario(row, restored.scenarios.get('sp500'), restored.overrides.get('sp500'));
  edited.annualGrowth[0] = 99;
  assert.equal(restored.scenarios.get('sp500').annualGrowth[0], 10);
});

test('unavailable and malformed browser storage leave the calculator usable', () => {
  assert.equal(loadScenarios(undefined).scenarios.size, 0);
  assert.equal(loadScenarios({ getItem: () => 'invalid JSON' }).scenarios.size, 0);
  assert.equal(saveScenarios({ setItem: () => { throw new Error('Quota exhausted'); } }, { scenarios: new Map(), overrides: new Map() }), false);
});
