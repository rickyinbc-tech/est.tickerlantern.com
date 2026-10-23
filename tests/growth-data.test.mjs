import test from 'node:test';
import assert from 'node:assert/strict';
import { sourceGrowthPath, validateGrowthForecast, growthIsStale, growthCoverage } from '../src/growth-data.js';
import { DEFAULTS, project, validate } from '../src/model.js';
import { scenarioInputs, switchScenario } from '../src/scenario-state.js';
const now = new Date('2026-10-22T20:00:00Z');
const row = { forwardPE: 20, mean10YearForwardPE: 18, growthForecast: { asOf: '2026-10-15', forecastType: 'consensus', periodBasis: 'calendar-year', source: { url: 'https://example.com/forecasts', publisher: 'Test publisher' }, estimates: [{ year: 2026, growth: 32.8 }, { year: 2027, growth: 28 }, { year: 2028, growth: 12 }] } };

test('published growth begins with the next year and never repeats missing estimates', () => {
  const path = sourceGrowthPath(row, 5, now);
  assert.equal(path.startYear, 2027);
  assert.equal(path.coveredYears, 2);
  assert.deepEqual(path.rates, [28, 12, '', '', '']);
  assert.deepEqual(path.missingYears, [2029, 2030, 2031]);
  assert.equal(sourceGrowthPath(row, 1, new Date('2028-10-01')).coveredYears, 0);
});

test('unlocked source-following scenarios load distinct published rates and their coverage', () => {
  const input = switchScenario(row, undefined, {}, true, now);
  assert.equal(input.growthMode, 'source');
  assert.equal(input.years, 2);
  assert.deepEqual(input.annualGrowth, [28, 12]);
  assert.equal(input.growthStartYear, 2027);
  const model = project(input);
  assert.ok(Math.abs(model.last.price - 100 * 1.28 * 1.12 * .9) < 1e-8);
});

test('a source refresh flows into linked rates while custom growth and horizons stay protected', () => {
  const linked = switchScenario(row, undefined, {}, true, now);
  const changed = { ...row, growthForecast: { ...row.growthForecast, estimates: [{ year: 2027, growth: 30 }, { year: 2028, growth: 10 }] } };
  assert.deepEqual(scenarioInputs(changed, linked, {}, true, now).annualGrowth, [30, 10]);
  const custom = { ...DEFAULTS, growthMode: 'annual', annualGrowth: [7, 8, 9], years: 3 };
  assert.deepEqual(scenarioInputs(changed, custom, { growthMode: true, annualGrowth: true, years: true }, true, now).annualGrowth, [7, 8, 9]);
  const extended = scenarioInputs(row, { ...linked, years: 5 }, { years: true }, true, now);
  assert.deepEqual(extended.annualGrowth, [28, 12, '', '', '']);
  assert.ok(validate(extended).annualGrowth);
});

test('missing growth evidence never becomes a universal 6 percent forecast', () => {
  const input = switchScenario({ ...row, growthForecast: undefined }, undefined, {}, true, now);
  assert.equal(input.growthMode, 'source');
  assert.ok(input.annualGrowth.every(rate => rate === ''));
  assert.throws(() => project(input));
});

test('annual consensus values above 20 percent are supported without clamping', () => {
  const input = { ...DEFAULTS, growthMode: 'source', growthStartYear: 2027, years: 2, annualGrowth: [85, 44] };
  const model = project(input);
  assert.deepEqual(model.input.annualGrowth, [85, 44]);
  assert.ok(Number.isFinite(model.cashIRR));
});

test('growth evidence rejects duplicate years, missing provenance and unsupported rates', () => {
  assert.doesNotThrow(() => validateGrowthForecast(row.growthForecast));
  for (const change of [{ source: null }, { asOf: null }, { periodBasis: 'quarterly' }, { estimates: [{ year: 2027, growth: -100 }] }, { estimates: [{ year: 2027, growth: 12 }, { year: 2027, growth: 13 }] }]) assert.throws(() => validateGrowthForecast({ ...row.growthForecast, ...change }));
  assert.equal(growthIsStale(row, now), false);
  assert.equal(growthIsStale({ ...row, growthForecast: { ...row.growthForecast, asOf: '2026-01-01' } }, now), true);
  assert.equal(growthCoverage({ indices: [row, {}] }, now), '1 of 2 benchmarks have published 2027 growth inputs');
});
