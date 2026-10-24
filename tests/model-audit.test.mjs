import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DEFAULTS, MODEL_CONVENTION_VERSION, project, solveIRR, irr, annualCSV } from '../src/model.js';

const close = (actual, expected, tolerance = 1e-11) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);
const relativeNPV = (flows, rate) => flows.reduce((sum, value, year) => sum + value / Math.pow(1 + rate, year), 0) / -flows[0];
// CSV reader for quoted JSON provenance, independent of the production encoder.
const readCSV = text => text.split('\n').map(line => {
  const result = []; let cell = '', quoted = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') { if (quoted && line[i + 1] === '"') { cell += '"'; i++; } else quoted = !quoted; }
    else if (line[i] === ',' && !quoted) { result.push(cell); cell = ''; }
    else cell += line[i];
  }
  result.push(cell); return result;
});

test('independently derived published teaching examples retain their exact timing', () => {
  const one = project({ ...DEFAULTS, entryPE: 20, exitPE: 20, growth: 6, payout: 30, years: 1 });
  close(one.initialEPS, 5); close(one.last.eps, 5.3); close(one.last.price, 106);
  close(one.last.dividend, 1.5); close(one.cashIRR, .075); close(one.last.cashWealth, 107.5);
  const five = project(DEFAULTS);
  // Independently evaluated with 60-digit Decimal arithmetic: fifth root for price,
  // bisection of -100 + sum(1.2*1.06^(t-1)/(1+r)^t) + terminal/(1+r)^5.
  close(five.priceCAGR * 100, 1.3733649777439205, 1e-10);
  close(five.cashIRR * 100, 2.6865056300111594, 1e-9);
  close(five.last.price, 100 * 1.06 ** 5 * .8);
  close(five.last.cumulativeDividend, 1.2 * (1 + 1.06 + 1.06 ** 2 + 1.06 ** 3 + 1.06 ** 4));
});

test('declining prices demonstrate cash-held and reinvested results are distinct', () => {
  const model = project({ ...DEFAULTS, entryPE: 20, exitPE: 5, growth: 0, payout: 100, years: 2 });
  assert.deepEqual(model.points.map(p => p.price), [100, 50, 25]);
  assert.deepEqual(model.points.slice(1).map(p => p.dividend), [5, 5]);
  assert.deepEqual(model.cashflows, [-100, 5, 30]);
  close(model.last.cashWealth, 35); close(model.last.shares, 1.32); close(model.last.reinvestedWealth, 33);
  close(model.priceCAGR, -.5);
  // Solve 100*x^2 - 5*x - 30 = 0 for x = 1 + IRR.
  close(model.cashIRR, (5 + Math.sqrt(12025)) / 200 - 1);
  close(model.cashIRR * 100, -42.6707195, 1e-7);
  close(model.reinvestedCAGR, Math.sqrt(.33) - 1);
  close(model.reinvestedCAGR * 100, -42.5543735, 1e-7);
  assert.ok(model.last.reinvestedWealth < model.last.cashWealth);
  assert.ok(model.reinvestedCAGR > model.cashIRR);
  assert.ok(model.cashIRR > model.priceCAGR);
});

test('yield and payout equivalence applies only under the same annual convention', () => {
  const payout = project({ ...DEFAULTS, growthMode: 'annual', annualGrowth: [10, -5, 8, 0, -2] });
  const yieldModel = project({ ...payout.input, dividendMode: 'yield', dividendYield: 1.2 });
  payout.points.forEach((point, i) => {
    close(point.dividend, yieldModel.points[i].dividend);
    close(point.cashWealth, yieldModel.points[i].cashWealth);
    close(point.reinvestedWealth, yieldModel.points[i].reinvestedWealth);
  });
  close(payout.cashIRR, yieldModel.cashIRR);
  assert.equal(yieldModel.input.payout, 30); // Preserved inactive assumption, never inferred as a reported payout.
});

test('synthetic forward earnings timeline has exactly one growth factor per elapsed year', () => {
  const model = project({ ...DEFAULTS, growth: 6, entryPE: 25, exitPE: 25, years: 2 });
  close(model.points[0].eps, 4); close(model.points[1].eps, 4.24); close(model.points[2].eps, 4.4944);
  close(model.last.price, 112.36); close(model.points[2].dividend, 1.272);
  assert.equal(model.conventions.version, MODEL_CONVENTION_VERSION);
  assert.match(model.conventions.earningsTimeline, /F0 covers approximately holding year 1/);
  assert.match(model.conventions.growthMapping, /uniform-accrual calendar-to-forward model/);
});

test('constant multiple and zero-dividend identities cover the full supported domain', () => {
  for (const growth of [-99, -90, -30, 0, 6, 50, 1000]) for (const years of [1, 2, 5, 20]) {
    const flat = project({ ...DEFAULTS, growth, years, entryPE: 25, exitPE: 25 });
    close(flat.priceCAGR, growth / 100, 1e-11);
    for (const [entryPE, exitPE] of [[1, 100], [100, 1], [25, 20]]) {
      const model = project({ ...DEFAULTS, growth, years, entryPE, exitPE, payout: 0 });
      const expected = (1 + growth / 100) * (exitPE / entryPE) ** (1 / years) - 1;
      close(model.priceCAGR, expected, 1e-11); close(model.cashIRR, expected, 1e-10);
      close(model.reinvestedCAGR, expected, 1e-11); close(model.cashWealthCAGR, expected, 1e-11);
    }
  }
});

test('IRR convergence is verified by independently discounted cash flows across extremes', () => {
  let cases = 0;
  for (const growth of [-99, -98, -90, -30, 0, 6, 50, 1000]) for (const entryPE of [1, 5, 25, 100]) for (const exitPE of [1, 5, 25, 100]) for (const years of [1, 2, 5, 20]) for (const payout of [0, 30, 100]) {
    const model = project({ ...DEFAULTS, growth, entryPE, exitPE, years, payout });
    assert.ok(Number.isFinite(model.cashIRR)); assert.ok(model.cashIRR > -1);
    assert.ok(Math.abs(relativeNPV(model.cashflows, model.cashIRR)) < 1e-10);
    assert.equal(model.irrDiagnostics.converged, true);
    assert.ok(Math.abs(model.irrDiagnostics.relativeNPVResidual) < 1e-10);
    cases++;
  }
  assert.equal(cases, 1536);
});

test('IRR rejects invalid or undefined cases and avoids arbitrary high-rate caps', () => {
  for (const flows of [[], [-100], [-100, 0], [-100, 0, 0], [-100, NaN, 100], [-100, Infinity], [-100, , 100], [-100, -1, 110], [100, 110]]) assert.throws(() => irr(flows));
  close(irr([-100, 1e20]) / 1e18, 1, 1e-12);
  assert.throws(() => irr([-1e20, 100]), /representable/); // Never fabricate a negative-rate floor below double precision.
});

test('IRR is invariant to cash-flow units and exposes scale-relative residuals', () => {
  const base = [-100, 5, 30];
  for (const scale of [1e-100, 1, 1e100]) {
    const result = solveIRR(base.map(v => v * scale));
    close(result.rate, (5 + Math.sqrt(12025)) / 200 - 1, 1e-12);
    assert.ok(Math.abs(result.relativeNPVResidual) < 1e-10);
    assert.ok(result.iterations <= 256);
  }
});

test('CSV reproduces full precision assumptions and identifies scenario and source versions', () => {
  const input = { ...DEFAULTS, growth: 6.1234567890123, entryPE: 23.4567890123, exitPE: 19.8765432109 };
  const model = project(input);
  const context = { benchmarkId: 'sp500', snapshotId: 'snapshot-test', snapshotVersion: 9, publishedAt: '2026-10-23T00:00:00Z', sourceFollowing: true, entryMetric: { id: 'pe-ntm', asOf: '2026-10-16' }, locks: { entryPE: true } };
  const rows = readCSV(annualCSV(model, undefined, context));
  assert.equal(rows.length, input.years + 2);
  const named = Object.fromEntries(rows[0].map((name, i) => [name, rows[1][i]]));
  assert.equal(named['Model convention version'], MODEL_CONVENTION_VERSION);
  assert.equal(named['Benchmark ID'], 'sp500'); assert.equal(named['Snapshot ID'], 'snapshot-test');
  assert.equal(named['Snapshot version'], '9'); assert.equal(named['Snapshot published at'], context.publishedAt);
  assert.equal(+named['Entry PE assumption'], input.entryPE); assert.equal(+named['Exit PE assumption'], input.exitPE);
  assert.deepEqual(JSON.parse(named['Entry metric provenance']), context.entryMetric);
  assert.deepEqual(JSON.parse(named['Scenario protection metadata']).locks, context.locks);
  assert.deepEqual(rows.slice(2).map(row => +row.at(-1)), Array(5).fill(input.growth));
  const rebuilt = project({ ...DEFAULTS, entryPE: +named['Entry PE assumption'], exitPE: +named['Exit PE assumption'], years: +named['Holding years'], payout: +named['Payout percent'], growthMode: 'annual', annualGrowth: rows.slice(2).map(row => +row.at(-1)) });
  close(rebuilt.last.price, +rows.at(-1)[3]); close(rebuilt.last.reinvestedWealth, +rows.at(-1)[7]);
});

test('CSV retains tiny non-zero synthetic anchors and source/custom classifications', () => {
  const model = project({ ...DEFAULTS, growthMode: 'source', growthStartYear: 2027, annualGrowth: Array(20).fill(-99), growthOverrides: { 2028: -99 }, years: 20, entryPE: 100, exitPE: 1 });
  const forecast = { asOf: '2026-10-01', forecastType: 'house', source: { url: 'https://example.test/research' }, estimates: [{ year: 2027, growth: -99, periodLabel: 'CY2027' }, { year: 2028, growth: -99, periodLabel: 'FY2028' }] };
  const rows = readCSV(annualCSV(model, forecast));
  assert.ok(+rows.at(-1)[1] > 0); assert.equal(+rows.at(-1)[1], model.last.eps);
  assert.equal(rows[2][9], 'house'); assert.equal(rows[3][9], 'custom assumption');
  assert.equal(rows[3][10], ''); assert.equal(rows[3][11], '');
  assert.match(rows[1][29], /uniform-accrual calendar-to-forward model/);
});

test('CSV cannot attach a newer growth observation to a different accepted rate', () => {
  const model = project({ ...DEFAULTS, growthMode: 'source', growthStartYear: 2027, annualGrowth: [8], years: 1 });
  const laterForecast = { asOf: '2026-10-23', forecastType: 'consensus', source: { publisher: 'Synthetic test source', url: 'https://example.test/revised' }, estimates: [{ year: 2027, growth: 10, periodLabel: 'CY2027' }] };
  const rows = readCSV(annualCSV(model, laterForecast));
  assert.equal(rows[2][9], 'custom assumption'); assert.equal(rows[2][10], ''); assert.equal(rows[2][11], '');
  assert.equal(rows[2].at(-2), ''); assert.equal(+rows[2].at(-1), 8);
});

test('machine-readable convention registry agrees with the executing model version', async () => {
  const registry = JSON.parse(await readFile(new URL('../data/model-conventions.json', import.meta.url), 'utf8'));
  assert.equal(registry.modelConventionVersion, MODEL_CONVENTION_VERSION);
  assert.equal(registry.constants.initialNormalizedWealth, 100);
  assert.equal(registry.constants.cashInterestPercent, 0);
  assert.ok(registry.assumptions.every(row => row.id && row.classification && row.definition && row.permittedUse));
});
