import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULTS, project, validate, sensitivity, annualCSV, irr } from '../src/model.js';
const close = (actual, expected, tolerance = 1e-10) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} != ${expected}`);

test('one-year discussion example: 6% price gain plus 1.5% dividend equals 7.5%', () => {
  const m = project({ growth: 6, entryPE: 20, exitPE: 20, payout: 30, years: 1 });
  close(m.last.price, 106); close(m.last.dividend, 1.5); close(m.priceCAGR, .06);
  close(m.cashIRR, .075); close(m.reinvestedCAGR, .075);
});
test('EPS and exit multiple independently reproduce terminal price', () => {
  const m = project();
  close(m.last.price, 100 * 1.06 ** 5 * (20 / 25));
  close(1 + m.priceCAGR, 1.06 * (.8 ** .2));
  close(m.last.cumulativeDividend, 1.2 * (1.06 ** 5 - 1) / .06);
  close(m.last.cashWealth, m.last.price + m.last.cumulativeDividend);
  close(100 + m.epsGain + m.multipleImpact + m.last.cumulativeDividend, m.last.cashWealth);
});
test('calculated IRR gives zero NPV and includes each dividend once', () => {
  const m = project();
  close(m.cashflows.reduce((sum, amount, i) => sum + amount / (1 + m.cashIRR) ** i, 0), 0, 1e-9);
  assert.equal(m.cashflows.length, 6);
  close(m.cashflows.at(-1), m.last.dividend + m.last.price);
  close(m.cashflows.slice(1).reduce((a, b) => a + b, 0), m.last.cashWealth);
});
test('zero dividends makes all return measures equal', () => {
  for (const growth of [-15, 0, 20]) {
    const m = project({ ...DEFAULTS, growth, payout: 0 });
    close(m.cashIRR, m.priceCAGR); close(m.reinvestedCAGR, m.priceCAGR); close(m.cashWealthCAGR, m.priceCAGR);
  }
});
test('constant valuation has exact annual reinvested return: growth plus payout / entry PE', () => {
  const m = project({ ...DEFAULTS, exitPE: 25 });
  close(m.cashIRR, .06 + .30 / 25); close(m.reinvestedCAGR, .072);
});
test('reinvestment compounds extra units rather than adding cash twice', () => {
  const m = project({ growth: 0, entryPE: 20, exitPE: 20, payout: 100, years: 10 });
  close(m.last.reinvestedWealth, 100 * 1.05 ** 10); close(m.last.cashWealth, 150);
  close(m.cashIRR, .05); close(m.cashWealthCAGR, 1.5 ** .1 - 1);
});
test('falling earnings and multiple remain finite and IRR is above negative 100%', () => {
  const m = project({ growth: -15, entryPE: 40, exitPE: 8, payout: 100, years: 20 });
  assert.ok(m.cashIRR > -1 && m.cashIRR < 0); assert.ok(m.last.price > 0); assert.ok(Number.isFinite(m.reinvestedCAGR));
});
test('invalid, blank, extreme and fractional holding-period inputs are rejected', () => {
  for (const input of [{ growth: '' }, { growth: NaN }, { entryPE: 0 }, { payout: 101 }, { years: 5.5 }, { exitPE: Infinity }, { years: null }]) {
    assert.ok(Object.keys(validate({ ...DEFAULTS, ...input })).length);
    assert.throws(() => project({ ...DEFAULTS, ...input }));
  }
});
test('sensitivity uses exact model and keeps non-grid assumptions fixed', () => {
  const grid = sensitivity(DEFAULTS);
  close(grid.rows[grid.growths.indexOf(DEFAULTS.growth)][grid.multiples.indexOf(DEFAULTS.exitPE)], project().cashIRR);
  for (let i = 0; i < 5; i++) for (let j = 1; j < 5; j++) assert.ok(grid.rows[i][j] > grid.rows[i][j - 1]);
});
test('export contains entry plus each annual cash flow and terminal wealth', () => {
  const m = project(); const rows = annualCSV(m).split('\n');
  assert.equal(rows.length, 7); assert.equal(rows[1].split(',')[3], '100');
  close(+rows.at(-1).split(',')[6], m.last.cashWealth, 1e-7);
});
test('IRR matches an independent simple cash-flow case', () => {
  close(irr([-100, 10, 110]), .1); close(irr([-100, 0, 121]), .1);
});
