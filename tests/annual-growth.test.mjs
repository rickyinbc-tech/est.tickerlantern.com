import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULTS, project, validate, sensitivity, annualCSV } from '../src/model.js';
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);
const input = { ...DEFAULTS, years: 3, entryPE: 20, exitPE: 20, growthMode: 'annual', annualGrowth: [10, -5, 20] };

test('each annual EPS rate compounds from the preceding year and drives dividends', () => {
  const model = project(input);
  close(model.points[1].eps, 5.5);
  close(model.points[2].eps, 5.225);
  close(model.points[3].eps, 6.27);
  close(model.last.price, 125.4);
  close(model.points[2].dividend, 1.65);
  close(model.points[3].dividend, 1.5675);
  close(model.epsCAGR, 1.254 ** (1 / 3) - 1);
  close(model.cashflows.reduce((sum, cash, year) => sum + cash / (1 + model.cashIRR) ** year, 0), 0);
  close(100 + model.epsGain + model.multipleImpact + model.last.cumulativeDividend, model.last.cashWealth);
});

test('yield convention grows its initial dividend with the actual prior EPS path', () => {
  const model = project({ ...input, dividendMode: 'yield', dividendYield: 2 });
  close(model.points[1].dividend, 2);
  close(model.points[2].dividend, 2.2);
  close(model.points[3].dividend, 2.09);
});

test('a constant annual path matches the single-rate model', () => {
  const yearly = project({ ...DEFAULTS, growthMode: 'annual', annualGrowth: Array(5).fill(6) });
  const flat = project(DEFAULTS);
  close(yearly.last.price, flat.last.price);
  close(yearly.cashIRR, flat.cashIRR);
  close(yearly.reinvestedCAGR, flat.reinvestedCAGR);
});

test('blank, missing, infinite and out-of-bounds active annual rates fail validation', () => {
  for (const rate of ['', null, undefined, Infinity, -16, 21]) {
    const bad = { ...input, annualGrowth: [10, rate, 20] };
    assert.ok(validate(bad).annualGrowth);
    assert.throws(() => project(bad));
  }
  assert.ok(validate({ ...input, annualGrowth: [10] }).annualGrowth);
  assert.deepEqual(validate({ ...input, annualGrowth: [10, -5, 20, ''] }), {});
});

test('flat sensitivity alternatives replace the complete yearly path', () => {
  const grid = sensitivity(input);
  for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
    close(grid.rows[i][j], project({ ...input, growthMode: 'constant', growth: grid.growths[i], exitPE: grid.multiples[j] }).cashIRR);
  }
});

test('sensitivity supports twenty annual rates at either supported bound', () => {
  for (const growth of [-15, 20]) {
    const grid = sensitivity({ ...DEFAULTS, years: 20, growthMode: 'annual', annualGrowth: Array(20).fill(growth) });
    assert.equal(grid.rows.length, 5);
    assert.ok(grid.rows.flat().every(Number.isFinite));
    assert.ok(grid.growths.includes(growth));
  }
});

test('CSV includes the actual rate used in every year alongside matching calculated EPS', () => {
  const rows = annualCSV(project(input)).split('\n').map(row => row.split(','));
  assert.equal(rows[0].at(-1), 'EPS growth percent');
  assert.deepEqual(rows.slice(2).map(row => +row.at(-1)), [10, -5, 20]);
  close(+rows[3][1], 5.225);
});
