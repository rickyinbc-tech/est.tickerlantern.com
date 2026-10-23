import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fiveYearGrowthPath, calendarToForwardRates, GROWTH_ANCHORS, GROWTH_POLICY } from '../src/five-year-growth.js';
import { baselineAssessment, baselineForecast, fiveYearCSV } from '../src/five-year-report.js';
import { scenarioInputs, switchScenario, loadScenarios, STORAGE_KEY } from '../src/scenario-state.js';
import { DEFAULTS, project, annualCSV } from '../src/model.js';

const now = new Date('2026-10-23T12:00:00Z');
const feed = JSON.parse(readFileSync(new URL('../data/indices.json', import.meta.url)));
const row = id => feed.indices.find(r => r.id === id);
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);
const closeRates = (actual, expected) => { assert.equal(actual.length, expected.length); actual.forEach((value, i) => close(value, expected[i])); };
function parseCSV(text) {
  return text.split('\n').map(line => {
    const cells = []; let value = '', quoted = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') { if (quoted && line[i + 1] === '"') { value += '"'; i++; } else quoted = !quoted; }
      else if (line[i] === ',' && !quoted) { cells.push(value); value = ''; } else value += line[i];
    }
    cells.push(value); return cells;
  });
}

// Independently build relative annual earnings and date-weighted forward levels.
function bridgeReference(calendarRates, weight) {
  let earnings = 1; const levels = [earnings];
  for (const rate of calendarRates) { earnings *= 1 + rate / 100; levels.push(earnings); }
  const forward = levels.slice(0, -1).map((value, i) => value * (1 - weight) + levels[i + 1] * weight);
  return { forward, rates: forward.slice(1).map((value, i) => 100 * (value / forward[i] - 1)) };
}

test('all 21 benchmarks have five dated growth scenarios; unsupported cash anchors block returns', () => {
  assert.equal(feed.indices.length, 21); assert.equal(Object.keys(GROWTH_ANCHORS).length, 21);
  const bridged = [];
  for (const r of feed.indices) {
    const path = fiveYearGrowthPath(r, now), assessment = baselineAssessment(r, now), m = assessment.model;
    assert.equal(path.rates.length, 5); assert.deepEqual(path.missingYears, []);
    assert.equal(path.scenarioDate, r.asOf); assert.equal(path.startYear, +r.asOf.slice(0, 4) + 1);
    close(path.rates.at(-1), GROWTH_ANCHORS[r.id].growth);
    assert.ok(path.points.every(p => p.scenarioDate === r.asOf && p.policyVersion === GROWTH_POLICY.version));
    if (path.bridge) bridged.push(r.id);
    else { assert.deepEqual(path.rates, Array(5).fill(GROWTH_ANCHORS[r.id].growth)); assert.ok(path.points.every(p => p.basis === 'normalized model')); }
    if (r.id === 'stoxx600') { assert.equal(m, null); assert.match(assessment.reason, /cash-dividend anchor/); continue; }
    assert.equal(m.input.years, 5); assert.equal(m.points.length, 6);
    const factor = path.rates.reduce((value, growth) => value * (1 + growth / 100), 1);
    close(m.last.price, 100 * factor * m.input.exitPE / m.input.entryPE);
    close(m.epsCAGR, factor ** .2 - 1);
    close(m.cashflows.reduce((npv, cash, i) => npv + cash / (1 + m.cashIRR) ** i, 0), 0);
    assert.ok(Number.isFinite(m.reinvestedCAGR));
  }
  assert.deepEqual(bridged, ['sp500', 'japan']);
});

test('calendar-to-forward bridge matches independent high-precision reference values', () => {
  // References independently evaluated using 55-digit Decimal arithmetic.
  closeRates(fiveYearGrowthPath(row('sp500'), now).rates, [13.968278680548798, 11.476626720808161, 8.985277805788041, 6.494248741912293, 6]);
  closeRates(fiveYearGrowthPath(row('japan'), now).rates, [12.520655096553410, 9.943439592285400, 7.451734405619322, 4.960345453602365, 4.5]);
  const path = fiveYearGrowthPath(row('sp500'), now);
  assert.deepEqual(path.points[0].calendarInputs.map(p => p.growth), [16, 13.5, 11, 8.5, 6, 6]);
  assert.equal(path.points[0].calendarInputs.at(-1).year, 2032);
  assert.equal(path.points[0].calendarInputs.at(-1).basis, 'editorial extension');
  assert.ok(path.points.every(p => p.basis === 'calendar-to-forward model'));
  assert.equal(baselineForecast(row('sp500'), now).input.annualGrowth.includes(32.8), false);
});

test('bridge endpoint weights and five transitions prevent an extra investment year', () => {
  const calendar = [10, 20, -5, 7, 4, 3];
  closeRates(calendarToForwardRates(calendar, 0).rates, calendar.slice(0, 5));
  closeRates(calendarToForwardRates(calendar, 1).rates, calendar.slice(1));
  closeRates(calendarToForwardRates(Array(6).fill(8), .83).rates, Array(5).fill(8));
  const calculated = calendarToForwardRates(calendar, .4), independent = bridgeReference(calendar, .4);
  closeRates(calculated.rates, independent.rates);
  assert.equal(calculated.levels.length, 7); assert.equal(calculated.forward.length, 6); assert.equal(calculated.rates.length, 5);
  const m = project({ ...DEFAULTS, growthMode: 'annual', annualGrowth: calculated.rates, entryPE: 20, exitPE: 20, payout: 0 });
  assert.equal(m.points.length, 6); assert.equal(m.last.year, 5);
  close(m.last.price, 100 * independent.forward[5] / independent.forward[0]);
  close(m.cashIRR, (independent.forward[5] / independent.forward[0]) ** .2 - 1);
  for (const rates of [[], Array(5).fill(6), [6, 6, 6, 6, 6, NaN], [6, 6, 6, 6, 6, -100]]) assert.throws(() => calendarToForwardRates(rates, .4));
  for (const weight of [-.1, 1.1, NaN, Infinity]) assert.throws(() => calendarToForwardRates(calendar, weight));
});

test('complete published calendar coverage supports the sixth forward anchor without division by zero', () => {
  const r = row('sp500');
  const full = { ...r, growthForecast: { ...r.growthForecast, estimates: Array.from({ length: 5 }, (_, i) => ({ year: 2027 + i, growth: 10 - i, periodLabel: `CY${2027 + i}` })) } };
  const path = fiveYearGrowthPath(full, now);
  assert.ok(path.rates.every(Number.isFinite)); assert.equal(path.points[0].calendarInputs.length, 6);
  assert.equal(path.points[0].calendarInputs[5].growth, 6);
  const sixth = { ...full, growthForecast: { ...full.growthForecast, estimates: [...full.growthForecast.estimates, { year: 2032, growth: 4, periodLabel: 'CY2032' }] } };
  const withSixth = fiveYearGrowthPath(sixth, now);
  assert.equal(withSixth.points[0].calendarInputs[5].growth, 4);
  closeRates(withSixth.rates, bridgeReference([10, 9, 8, 7, 6, 4], 288 / 365).rates);
});

test('unknown period, horizon or unapproved growth inputs do not receive a calendar bridge', () => {
  const r = row('sp500');
  const variants = [
    { ...r, growthForecast: { ...r.growthForecast, periodBasis: 'fiscal-year' } },
    { ...r, growthForecast: { ...r.growthForecast, periodBasis: 'publisher-year' } },
    { ...r, metricDefinitions: { ...r.metricDefinitions, forwardPE: { ...r.metricDefinitions.forwardPE, economic: { ...r.metricDefinitions.forwardPE.economic, horizon: 'forward-unspecified' } } } },
    { ...r, metricDefinitions: { ...r.metricDefinitions, growthForecast: { ...r.metricDefinitions.growthForecast, permittedUse: ['display'] } } }
  ];
  for (const variant of variants) { const path = fiveYearGrowthPath(variant, now); assert.equal(path.bridge, false); assert.deepEqual(path.rates, [6, 6, 6, 6, 6]); assert.ok(path.points.every(p => p.basis === 'normalized model')); }
  assert.deepEqual(fiveYearGrowthPath({ id: 'unknown' }, now).rates, ['', '', '', '', '']);
});

test('new source coverage updates modeled transitions while a custom holding year remains protected', () => {
  const r = row('sp500'), changed = { ...r, growthForecast: { ...r.growthForecast, estimates: [...r.growthForecast.estimates, { year: 2028, growth: 9, periodLabel: 'CY2028' }] } };
  const original = fiveYearGrowthPath(changed, now), path = fiveYearGrowthPath(changed, now, { 2029: 2 });
  closeRates(original.rates, bridgeReference([16, 9, 8, 7, 6, 6], 288 / 365).rates);
  for (let i = 0; i < 5; i++) close(path.rates[i], i === 2 ? 2 : original.rates[i]);
  assert.equal(path.points[2].basis, 'custom assumption');
  assert.equal(path.points[0].calendarInputs[1].basis, 'consensus');
  assert.equal(changed.growthForecast.estimates.at(-1).growth, 9);
});

test('old browser horizons migrate to five even when paused or explicitly locked', () => {
  const old = { ...DEFAULTS, growthMode: 'annual', years: 2, annualGrowth: [7, 8], growth: 4, entryPE: 17 };
  const data = { version: 1, scenarios: [['sp500', old]], overrides: [['sp500', { growthMode: true, annualGrowth: true, years: true, entryPE: true }]], following: false };
  const loaded = loadScenarios({ getItem: key => key === STORAGE_KEY ? JSON.stringify(data) : null });
  const input = switchScenario(row('sp500'), loaded.scenarios.get('sp500'), loaded.overrides.get('sp500'), loaded.following, now);
  assert.equal(input.years, 5); assert.deepEqual(input.annualGrowth, [7, 8, 4, 4, 4]); assert.equal(input.entryPE, 17);
  const source = scenarioInputs(row('sp500'), { ...DEFAULTS, growthMode: 'source', growthStartYear: 2027, years: 1, annualGrowth: [12] }, {}, false, now);
  closeRates(source.annualGrowth, fiveYearGrowthPath(row('sp500'), now).rates); assert.equal(source.years, 5);
  const custom = scenarioInputs(row('sp500'), { ...DEFAULTS, growthMode: 'source', growthOverrides: { 2027: 12 }, annualGrowth: [12] }, {}, false, now);
  closeRates(custom.annualGrowth, [12, ...fiveYearGrowthPath(row('sp500'), now).rates.slice(1)]);
  const paused = scenarioInputs(row('sp500'), { ...DEFAULTS, growthMode: 'source', growthPolicyVersion: GROWTH_POLICY.version, growthStartYear: 2027, annualGrowth: [12] }, {}, false, now);
  closeRates(paused.annualGrowth, [12, ...fiveYearGrowthPath(row('sp500'), now).rates.slice(1)]);
});

test('calendar rollover does not shift a retained valuation into a new investment date', () => {
  for (const id of ['sp500', 'japan', 'india']) {
    const original = fiveYearGrowthPath(row(id), now), later = fiveYearGrowthPath(row(id), new Date('2029-10-23T12:00:00Z'));
    assert.equal(later.scenarioDate, row(id).asOf); assert.equal(later.startYear, 2027); assert.deepEqual(later.rates, original.rates);
  }
});

test('annual and universe CSVs retain all 126 records and honest model provenance', () => {
  const m = baselineForecast(row('sp500'), now), csv = parseCSV(annualCSV(m, row('sp500').growthForecast));
  assert.equal(csv.length, 7);
  const header = csv[0], basis = header.indexOf('Growth basis'), status = header.indexOf('Model status');
  for (const record of csv.slice(2)) {
    assert.equal(record[basis], 'calendar-to-forward model'); assert.equal(record[10], ''); assert.equal(record[11], '');
    const evidence = JSON.parse(record.at(-2)); assert.equal(evidence.terminalGrowth, 6); assert.equal(evidence.policyVersion, GROWTH_POLICY.version);
    assert.equal(evidence.calendarInputs.length, 6); assert.equal(evidence.scenarioDate, '2026-10-16'); assert.equal(record[status], 'calculated');
  }
  close(+csv.at(-1)[3], m.last.price);
  const all = parseCSV(fiveYearCSV(feed, now)); assert.equal(all.length, 127);
  const id = header.indexOf('Benchmark ID'), years = header.indexOf('Holding years'), reason = header.indexOf('Unavailable reason');
  for (const r of feed.indices) {
    const records = all.slice(1).filter(p => p[id] === r.id); assert.equal(records.length, 6); assert.ok(records.every(p => p[years] === '5'));
    if (r.id === 'stoxx600') {
      assert.ok(records.every(p => p[status] === 'unavailable' && /cash-dividend anchor/.test(p[reason])));
      for (const record of records) for (const column of [1, 2, 3, 4, 5, 6, 7]) assert.equal(record[column], '');
      assert.deepEqual(records.slice(1).map(p => +p.at(-1)), [5, 5, 5, 5, 5]);
    } else { assert.ok(records.every(p => p[status] === 'calculated')); close(+records.at(-1)[6], baselineForecast(r, now).last.cashWealth); }
  }
});

test('a modeled rate numerically equal to a published rate remains a model assumption in CSV', () => {
  const r = row('india'), sameNumber = { ...r, growthForecast: { ...r.growthForecast, estimates: [{ year: 2027, growth: 9, periodLabel: 'CY2027' }] } };
  const m = baselineForecast(sameNumber, now), records = parseCSV(annualCSV(m, sameNumber.growthForecast));
  assert.equal(records[2][9], 'normalized model'); assert.equal(records[2][10], ''); assert.equal(records[2][11], '');
  assert.equal(JSON.parse(records[2].at(-2)).basis, 'normalized model');
});

test('five-year worked example independently reconciles annual cash-flow timing', () => {
  const m = project({ ...DEFAULTS, entryPE: 20, exitPE: 20 });
  close(m.last.price * 2, 267.64511552); close(m.last.cumulativeDividend * 2, 16.91127888);
  close((m.last.cashWealth / 100 - 1) * 100, 42.2781972); close(m.cashIRR, .075);
});

test('invalid published calendar earnings block only the affected baseline and remain explicit in exports',()=>{
  const broken=structuredClone(row('sp500'));
  broken.growthForecast.estimates.find(p=>p.year===2027).growth=-100;
  const path=fiveYearGrowthPath(broken,now);
  assert.deepEqual(path.rates,['','','','','']);
  assert.equal(baselineForecast(broken,now),null);
  const records=parseCSV(fiveYearCSV({...feed,indices:[broken]},now));
  const status=records[0].indexOf('Model status'),reason=records[0].indexOf('Unavailable reason');
  assert.equal(records.length,7);
  assert.ok(records.slice(1).every(r=>r[status]==='unavailable' && r[reason] && r[3]===''));
});
