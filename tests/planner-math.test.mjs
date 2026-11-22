import test from 'node:test';
import assert from 'node:assert/strict';
import { CPI, cpiEquivalent, cpiAnnualRate, realValue, growthSchedule, recoveryGain, recoveryYears, normCdf, outcomeBands, equalWeightVolatility, twoAssetMix, regularPurchases, bcMarginalRates, bracketRate, TAX_2026, creditZones, gicVsFund, breakEvenFundReturn, portfolioStats, annualizedRange } from '../src/planner-math.js';

const close = (a, b, tol = 1e-6, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg || ''} expected ${b}, got ${a}`);

test('CPI series are complete, increasing in time keys and match spot values from the StatCan CSV', () => {
  for (const region of ['canada', 'bc']) {
    const years = Object.keys(CPI[region]).map(Number);
    assert.deepEqual(years, Array.from({ length: 36 }, (_, i) => 1990 + i));
    assert.equal(CPI[region][2002], 100);
  }
  assert.equal(CPI.canada[2025], 164.2); assert.equal(CPI.bc[2025], 158.5); assert.equal(CPI.canada[1995], 87.6);
  close(cpiEquivalent(100, 1995, 2025), 187.442922, 1e-5);
  close(cpiAnnualRate(2015, 2025), (164.2 / 126.6) ** (1 / 10) - 1);
  assert.throws(() => cpiEquivalent(100, 1980, 2025));
  assert.throws(() => cpiAnnualRate(2025, 2020));
});

test('real value deflates by compound inflation', () => close(realValue(1000, .02, 10), 1000 / 1.02 ** 10));

test('lump-sum growth equals the closed form and monthly steps compound to the annual rate', () => {
  const s = growthSchedule({ initial: 10000, annualRate: .06, years: 10 });
  close(s.at(-1).value, 10000 * 1.06 ** 10, 1e-6);
  close(s[1].value, 10600, 1e-8);
  assert.equal(s.length, 11); assert.equal(s.at(-1).contributed, 10000);
});

test('monthly contributions match the ordinary-annuity formula; zero return just adds deposits', () => {
  const m = 1.06 ** (1 / 12) - 1;
  close(growthSchedule({ monthly: 100, annualRate: .06, years: 10 }).at(-1).value, 100 * ((1 + m) ** 120 - 1) / m, 1e-6);
  const flat = growthSchedule({ monthly: 100, annualRate: 0, years: 10 }).at(-1);
  close(flat.value, 12000, 1e-9); close(flat.growth, 0, 1e-9);
});

test('growth inputs outside their ranges are rejected', () => {
  assert.throws(() => growthSchedule({ initial: -1, annualRate: .05, years: 5 }));
  assert.throws(() => growthSchedule({ initial: 1, annualRate: .05, years: 2.5 }));
  assert.throws(() => growthSchedule({ initial: 1, annualRate: NaN, years: 5 }));
});

test('recovery arithmetic: a 30% fall needs a 42.86% gain; 50% needs 100%', () => {
  close(recoveryGain(.3), .428571, 1e-6); close(recoveryGain(.5), 1, 1e-12); assert.equal(recoveryGain(0), 0);
  close(recoveryYears(.3, .06), Math.log(1 / .7) / Math.log(1.06));
  assert.equal(recoveryYears(.3, 0), Infinity);
  assert.throws(() => recoveryGain(1));
});

test('normal CDF matches reference values', () => {
  close(normCdf(0), .5, 1e-7); close(normCdf(1.959963985), .975, 1e-6); close(normCdf(-1), .158655254, 1e-6);
});

test('model outcome bands: the median compounds at the median return and the range widens', () => {
  const bands = outcomeBands({ median: .06, sigma: .15, years: 20 });
  close(bands[10].p50, 1.06 ** 10, 1e-9);
  assert.ok(bands[20].p90 - bands[20].p10 > bands[5].p90 - bands[5].p10);
  close(bands[1].lossChance, normCdf(-Math.log(1.06) / .15), 1e-12);
  assert.ok(bands[20].lossChance < bands[1].lossChance);
  assert.ok(bands.every(b => b.p10 <= b.p25 && b.p25 <= b.p50 && b.p50 <= b.p75 && b.p75 <= b.p90));
});

test('diversification: one holding keeps its volatility; many holdings approach the shared-risk floor', () => {
  close(equalWeightVolatility(1, .3, .25), .3, 1e-12);
  close(equalWeightVolatility(100000, .3, .25), .3 * Math.sqrt(.25), 1e-5);
  close(equalWeightVolatility(4, .2, 1), .2, 1e-12);
  assert.throws(() => equalWeightVolatility(0, .2, .3));
});

test('two-asset mix reproduces each asset at the ends and is below the weighted volatility when correlation < 1', () => {
  const a = { ret: .07, vol: .16 }, b = { ret: .035, vol: .06 };
  assert.deepEqual(twoAssetMix(1, a, b, .2), { ret: .07, vol: .16 });
  const mid = twoAssetMix(.5, a, b, .2);
  close(mid.ret, .0525, 1e-12); assert.ok(mid.vol < .11);
  close(twoAssetMix(.5, a, b, 1).vol, .11, 1e-12);
});

test('regular purchases: average cost is the harmonic mean, at or below the average price', () => {
  const r = regularPurchases([10, 5], 100);
  assert.equal(r.totalUnits, 30); close(r.averageCost, 200 / 30, 1e-12); assert.equal(r.averagePrice, 7.5);
  const flat = regularPurchases([8, 8, 8], 50); close(flat.averageCost, flat.averagePrice, 1e-12);
  assert.throws(() => regularPurchases([10, 0], 100));
});

test('2026 brackets: inclusive published upper bounds', () => {
  assert.equal(bracketRate(TAX_2026.federal, 58523), .14); assert.equal(bracketRate(TAX_2026.federal, 58523.01), .205);
  assert.equal(bracketRate(TAX_2026.bc, 50363), .056); assert.equal(bracketRate(TAX_2026.bc, 265546), .205);
});

test('BC 2026 combined top marginal rates reproduce KPMG’s published 2026 table', () => {
  // KPMG, "Combined top marginal tax rates for individuals — 2026": BC 53.50%,
  // eligible dividends 36.54%, non-eligible dividends 48.89%, capital gains 26.75%.
  const top = bcMarginalRates(400000);
  close(top.ordinary, .535, 1e-12);
  close(+(top.eligible * 100).toFixed(2), 36.54, 1e-9);
  close(+(top.other * 100).toFixed(2), 48.89, 1e-9);
  close(top.capitalGains, .2675, 1e-12);
});

test('BC marginal rates at a middle income follow both bracket tables', () => {
  const r = bcMarginalRates(80000);
  close(r.ordinary, .205 + .077, 1e-12);
  close(r.capitalGains, (.205 + .077) / 2, 1e-12);
  assert.ok(r.eligible < r.capitalGains && r.capitalGains < r.ordinary);
  assert.ok(bcMarginalRates(40000).eligible < 0, 'eligible dividend credits exceed bracket tax at low incomes');
});

test('credit zones detect overlap of whole ranges with the BC reduction and federal BPA phase-down', () => {
  assert.deepEqual(creditZones([[60000, 150000]]), []);
  assert.deepEqual(creditZones([[44952, 44952]]), ['low']);
  assert.deepEqual(creditZones([[44953, 60000]]), []);
  assert.deepEqual(creditZones([[181440, 181440]]), []);
  assert.deepEqual(creditZones([[170000, 300000]]), ['bpa']);
  assert.deepEqual(creditZones([[258482, 300000]]), []);
  assert.deepEqual(creditZones([[20000, 300000]]), ['low', 'bpa']);
});

const R100 = bcMarginalRates(100000);
const base = { amount: 50000, years: 10, gicRate: .0325, fund: { interest: .01, dividends: .008, foreign: .006, realized: .01, growth: .016 }, rates: R100 };

test('GIC: non-registered interest compounds at the after-tax rate; TFSA untaxed; RRSP taxed once on withdrawal', () => {
  close(gicVsFund({ ...base, account: 'nonreg' }).gicAfterTax, 50000 * (1 + .0325 * (1 - .282)) ** 10, 1e-6);
  close(gicVsFund({ ...base, account: 'tfsa' }).gicAfterTax, 50000 * 1.0325 ** 10, 1e-6);
  close(gicVsFund({ ...base, account: 'rrsp', withdrawalRate: .3 }).gicAfterTax, 50000 * 1.0325 ** 10 * .7, 1e-6);
  const nr = gicVsFund({ ...base, account: 'nonreg' });
  close(nr.tax.gicInterest, (50000 * (1 + .0325 * .718) ** 10 - 50000) / .718 * .282, 1e-6);
});

test('fund in TFSA and RRSP grows at its total return; registered accounts ignore the income mix', () => {
  const total = .05;
  close(gicVsFund({ ...base, account: 'tfsa' }).fundAfterTax, 50000 * (1 + total) ** 10, 1e-6);
  const mixA = gicVsFund({ ...base, account: 'rrsp', withdrawalRate: .3 }).fundAfterTax;
  const mixB = gicVsFund({ ...base, account: 'rrsp', withdrawalRate: .3, fund: { interest: 0, dividends: 0, foreign: 0, realized: 0, growth: total } }).fundAfterTax;
  close(mixA, 50000 * 1.05 ** 10 * .7, 1e-6); close(mixA, mixB, 1e-6);
});

test('fund, non-registered: pure growth is taxed only at sale; pure distributions compound after tax with no gain left', () => {
  const growthOnly = gicVsFund({ ...base, account: 'nonreg', fund: { interest: 0, dividends: 0, foreign: 0, realized: 0, growth: .05 } });
  const v = 50000 * 1.05 ** 10;
  close(growthOnly.fundAfterTax, v - (v - 50000) * R100.capitalGains, 1e-6);
  close(growthOnly.tax.fundDeferred, (v - 50000) * R100.capitalGains, 1e-6);
  const kept = gicVsFund({ ...base, account: 'nonreg', sellAtEnd: false, fund: { interest: 0, dividends: 0, foreign: 0, realized: 0, growth: .05 } });
  close(kept.fundAfterTax, v, 1e-6); close(kept.unrealized, v - 50000, 1e-6);
  const interestOnly = gicVsFund({ ...base, account: 'nonreg', fund: { interest: .05, dividends: 0, foreign: 0, realized: 0, growth: 0 } });
  close(interestOnly.fundAfterTax, 50000 * (1 + .05 * (1 - R100.ordinary)) ** 10, 1e-6);
  close(interestOnly.acb, interestOnly.fundValue, 1e-6);
  // Same return as a GIC, all paid as interest: identical after tax.
  close(gicVsFund({ ...base, account: 'nonreg', gicRate: .05, fund: { interest: .05, dividends: 0, foreign: 0, realized: 0, growth: 0 } }).gicAfterTax, interestOnly.fundAfterTax, 1e-6);
});

test('fund tax by type uses each rate: dividends below interest, distributed gains at half the ordinary rate', () => {
  const one = gicVsFund({ ...base, account: 'nonreg', years: 1 });
  close(one.tax.fundIncome, 50000 * .016 * .282, 1e-9);
  close(one.tax.fundDividends, 50000 * .008 * R100.eligible, 1e-9);
  close(one.tax.fundRealized, 50000 * .01 * .141, 1e-9);
  // Low incomes: the eligible dividend credit exceeds the tax, so dividends reduce tax (negative).
  assert.ok(gicVsFund({ ...base, rates: bcMarginalRates(40000), account: 'nonreg', years: 1 }).tax.fundDividends < 0);
});

test('break-even fund return equalizes after-tax values, and is below the GIC rate when the fund is tax-efficient', () => {
  const be = breakEvenFundReturn({ ...base, account: 'nonreg' });
  const f = base.fund, growth = be - (f.interest + f.dividends + f.foreign + f.realized);
  const r = gicVsFund({ ...base, account: 'nonreg', fund: { ...f, growth } });
  close(r.fundAfterTax, r.gicAfterTax, 1e-4);
  assert.ok(be < .0325);
  close(breakEvenFundReturn({ ...base, account: 'tfsa' }), .0325, 1e-9);
});

test('portfolio statistics: weighted mean; volatility of perfectly correlated assets is the weighted volatility; uncorrelated adds in quadrature', () => {
  const I = [[1, 0], [0, 1]], J = [[1, 1], [1, 1]];
  close(portfolioStats([.5, .5], [.02, .06], [.1, .2], J).vol, .15, 1e-12);
  close(portfolioStats([.5, .5], [.02, .06], [.1, .2], I).vol, Math.sqrt(.05 ** 2 + .1 ** 2), 1e-12);
  close(portfolioStats([.5, .5], [.02, .06], [.1, .2], I).mean, .04, 1e-12);
  const r = annualizedRange(.05, .1, 4);
  close(r.low, .05 - 1.2815515655 * .05, 1e-9); close(r.high, .05 + 1.2815515655 * .05, 1e-9);
});

test('GIC comparison rejects bad inputs', () => {
  assert.throws(() => gicVsFund({ ...base, years: 0 }));
  assert.throws(() => gicVsFund({ ...base, amount: -1 }));
  assert.throws(() => gicVsFund({ ...base, gicRate: NaN }));
});
