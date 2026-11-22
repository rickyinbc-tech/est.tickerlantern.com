// Pure calculations for the planner conversation toolkit. Every figure the
// toolkit shows comes from these functions; tests/planner-math.test.mjs pins them.

// Statistics Canada, Table 18-10-0005-01, Consumer Price Index annual average,
// all-items, 2002=100. Retrieved 2026-11-21 from the official CSV download.
export const CPI = {
  source: 'Statistics Canada, Table 18-10-0005-01 (annual average CPI, all-items, 2002=100)',
  url: 'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1810000501',
  retrieved: '2026-11-21',
  canada: {1990:78.4,1991:82.8,1992:84.0,1993:85.6,1994:85.7,1995:87.6,1996:88.9,1997:90.4,1998:91.3,1999:92.9,2000:95.4,2001:97.8,2002:100.0,2003:102.8,2004:104.7,2005:107.0,2006:109.1,2007:111.5,2008:114.1,2009:114.4,2010:116.5,2011:119.9,2012:121.7,2013:122.8,2014:125.2,2015:126.6,2016:128.4,2017:130.4,2018:133.4,2019:136.0,2020:137.0,2021:141.6,2022:151.2,2023:157.1,2024:160.9,2025:164.2},
  bc: {1990:78.4,1991:82.6,1992:84.8,1993:87.8,1994:89.5,1995:91.6,1996:92.4,1997:93.1,1998:93.4,1999:94.4,2000:96.1,2001:97.7,2002:100.0,2003:102.2,2004:104.2,2005:106.3,2006:108.1,2007:110.0,2008:112.3,2009:112.3,2010:113.8,2011:116.5,2012:117.8,2013:117.7,2014:118.9,2015:120.2,2016:122.4,2017:125.0,2018:128.4,2019:131.4,2020:132.4,2021:136.1,2022:145.5,2023:151.2,2024:155.2,2025:158.5}
};

const finite = (value, name) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new RangeError(name + ' must be a finite number');
  return value;
};

/** Dollars needed in `to` to buy what `amount` bought in `from`, from annual CPI. */
export function cpiEquivalent(amount, from, to, region = 'canada') {
  const series = CPI[region];
  if (!series?.[from] || !series?.[to]) throw new RangeError('CPI year outside the recorded series');
  return finite(amount, 'amount') * series[to] / series[from];
}

/** Average annual inflation between two CPI years (geometric). */
export function cpiAnnualRate(from, to, region = 'canada') {
  const series = CPI[region];
  if (!series?.[from] || !series?.[to] || to <= from) throw new RangeError('Choose two recorded years in order');
  return (series[to] / series[from]) ** (1 / (to - from)) - 1;
}

/** Today's-dollar value of a nominal amount after `years` of constant inflation. */
export const realValue = (nominal, inflation, years) => finite(nominal, 'nominal') / (1 + finite(inflation, 'inflation')) ** finite(years, 'years');

/**
 * Year-by-year growth of an initial amount plus level monthly contributions.
 * `annualRate` is an effective annual return; it is converted to the equivalent
 * monthly rate so 12 monthly steps compound to exactly one year. Contributions
 * are made at the end of each month. `annualFee` (e.g. an MER) is charged as a
 * share of assets, so the net growth factor is (1 + gross) × (1 − fee).
 */
export function growthSchedule({ initial = 0, monthly = 0, annualRate, years, annualFee = 0 }) {
  for (const [k, v] of Object.entries({ initial, monthly, annualRate, years, annualFee })) finite(v, k);
  if (initial < 0 || monthly < 0) throw new RangeError('Amounts cannot be negative');
  if (annualRate <= -1 || annualFee < 0 || annualFee >= 1) throw new RangeError('Rate or fee out of range');
  if (!Number.isInteger(years) || years < 0 || years > 80) throw new RangeError('Years must be a whole number from 0 to 80');
  const netAnnual = (1 + annualRate) * (1 - annualFee) - 1;
  const m = (1 + netAnnual) ** (1 / 12) - 1;
  const rows = [{ year: 0, contributed: initial, value: initial }];
  let value = initial, contributed = initial;
  for (let y = 1; y <= years; y++) {
    for (let k = 0; k < 12; k++) { value = value * (1 + m) + monthly; contributed += monthly; }
    rows.push({ year: y, contributed, value });
  }
  return rows.map(r => ({ ...r, growth: r.value - r.contributed }));
}

/** Gain needed after a fall of `drop` (0.3 = 30%) to get back to the start. */
export function recoveryGain(drop) {
  finite(drop, 'drop');
  if (drop < 0 || drop >= 1) throw new RangeError('Drop must be from 0% to under 100%');
  return 1 / (1 - drop) - 1;
}

/** Years for a constant annual return to recover a fall of `drop`. */
export function recoveryYears(drop, annualReturn) {
  const gain = recoveryGain(drop);
  if (finite(annualReturn, 'annualReturn') <= 0) return Infinity;
  return Math.log(1 + gain) / Math.log(1 + annualReturn);
}

// Standard normal CDF (Abramowitz–Stegun 7.1.26 via erf), accurate to ~1e-7.
export function normCdf(x) {
  const t = 1 / (1 + 0.3275911 * Math.abs(x) / Math.SQRT2);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x / 2);
  return x >= 0 ? (1 + y) / 2 : (1 - y) / 2;
}

export const Z = { p10: -1.2815515655, p25: -0.6744897502, p50: 0, p75: 0.6744897502, p90: 1.2815515655 };

/**
 * Model range of outcomes for 1 unit invested: annual log returns independent
 * and normal, with median annual return `median` and volatility `sigma` (the
 * standard deviation of annual log returns). Returns percentile values by year.
 * This is a teaching model, not market history: real returns have fatter tails.
 */
export function outcomeBands({ median, sigma, years }) {
  finite(median, 'median'); finite(sigma, 'sigma');
  if (median <= -1 || sigma <= 0 || sigma > 1) throw new RangeError('Return or volatility out of range');
  const mu = Math.log(1 + median);
  return Array.from({ length: years + 1 }, (_, t) => {
    const row = { year: t };
    for (const [k, z] of Object.entries(Z)) row[k] = Math.exp(mu * t + z * sigma * Math.sqrt(t));
    row.lossChance = t === 0 ? 0 : normCdf(-mu * Math.sqrt(t) / sigma);
    return row;
  });
}

/** Volatility of an equal-weight portfolio of n holdings with equal volatility and pairwise correlation. */
export function equalWeightVolatility(n, sigma, rho) {
  finite(sigma, 'sigma'); finite(rho, 'rho');
  if (!Number.isInteger(n) || n < 1) throw new RangeError('Holdings must be a whole number of at least 1');
  if (rho < 0 || rho > 1) throw new RangeError('This illustration uses a correlation from 0 to 1');
  return sigma * Math.sqrt(1 / n + (1 - 1 / n) * rho);
}

/** Expected return and volatility of a two-asset mix with weight w in asset A. */
export function twoAssetMix(w, a, b, rho) {
  for (const [k, v] of Object.entries({ w, ra: a.ret, sa: a.vol, rb: b.ret, sb: b.vol, rho })) finite(v, k);
  const variance = w * w * a.vol ** 2 + (1 - w) ** 2 * b.vol ** 2 + 2 * w * (1 - w) * rho * a.vol * b.vol;
  return { ret: w * a.ret + (1 - w) * b.ret, vol: Math.sqrt(Math.max(0, variance)) };
}

/**
 * Units bought by investing the same dollars at each price. Average cost per
 * unit is the harmonic mean of prices, never above the simple average price.
 */
export function regularPurchases(prices, amount) {
  if (!prices.length || prices.some(p => !(p > 0))) throw new RangeError('Prices must be positive');
  const units = prices.map(p => amount / p);
  const totalUnits = units.reduce((s, u) => s + u, 0), invested = amount * prices.length;
  return { units, totalUnits, invested, averageCost: invested / totalUnits, averagePrice: prices.reduce((s, p) => s + p, 0) / prices.length, endValue: totalUnits * prices.at(-1) };
}

// 2026 statutory brackets. Federal: CRA "Tax rates and income brackets for
// individuals – current year" (page dated 2026-06-25). BC: gov.bc.ca "B.C.
// basic personal income tax rates" (updated 2026-04-17); the 5.60% lowest rate
// is a Budget 2026 measure in Bill 2, which BC describes as subject to the
// legislature's approval.
export const TAX_2026 = {
  federal: [[58523, .14], [117045, .205], [181440, .26], [258482, .29], [Infinity, .33]],
  bc: [[50363, .056], [100728, .077], [115648, .105], [140430, .1229], [190405, .147], [265545, .168], [Infinity, .205]],
  // Gross-ups: CRA line 12000. Credit rates as a share of the grossed-up amount:
  // federal 15.0198% eligible / 9.0301% other; BC 12% / 1.96% (2025 and 2026).
  dividends: { eligible: { grossUp: .38, federal: .150198, bc: .12 }, other: { grossUp: .15, federal: .090301, bc: .0196 } },
  capitalGainsInclusion: .5
};

export function bracketRate(brackets, income) {
  finite(income, 'income');
  // CRA and BC publish upper bounds inclusively ("$58,523 or less").
  for (const [top, rate] of brackets) if (income <= top) return rate;
  return brackets.at(-1)[1];
}

/**
 * Combined federal + BC statutory marginal rates on the next dollar of each
 * income type, at a given taxable income. Excludes credits that phase in or out
 * (federal basic personal amount phase-out, BC tax reduction, OAS recovery,
 * income-tested benefits), so actual marginal rates can differ.
 */
export function bcMarginalRates(income, t = TAX_2026) {
  const ordinary = bracketRate(t.federal, income) + bracketRate(t.bc, income);
  const div = d => (1 + d.grossUp) * ordinary - (1 + d.grossUp) * (d.federal + d.bc);
  return { ordinary, eligible: div(t.dividends.eligible), other: div(t.dividends.other), capitalGains: ordinary * t.capitalGainsInclusion };
}

/** Tax from a bracket table alone (no credits), on taxable income `income`. */
export function bracketTax(brackets, income) {
  finite(income, 'income');
  let tax = 0, lower = 0;
  for (const [top, rate] of brackets) {
    if (income <= lower) break;
    tax += (Math.min(income, top) - lower) * rate;
    lower = top;
  }
  return tax;
}

/** Combined federal + BC statutory bracket tax (no credits, surtaxes or clawbacks). */
export const bcBracketTax = (income, t = TAX_2026) => bracketTax(t.federal, Math.max(0, income)) + bracketTax(t.bc, Math.max(0, income));

/**
 * TFSA versus RRSP with tax calculated across brackets, not at one marginal rate.
 * - Today: the RRSP deduction saves bcBracketTax(incomeNow) − bcBracketTax(incomeNow − pretax);
 *   the TFSA receives pretax minus that same tax. The RRSP refund is assumed invested.
 * - Later: the RRSP balance is withdrawn in equal amounts over `spreadYears` years on top of
 *   `incomeLater`, each year taxed incrementally at 2026 brackets (held constant).
 * Excludes credits and benefit clawbacks; see the page note.
 */
export function tfsaVsRrspIncremental({ pretax, rate, years, incomeNow, incomeLater, spreadYears = 1 }) {
  for (const [k, v] of Object.entries({ pretax, rate, years, incomeNow, incomeLater, spreadYears })) finite(v, k);
  const deductionValue = bcBracketTax(incomeNow) - bcBracketTax(Math.max(0, incomeNow - pretax));
  const growth = (1 + rate) ** years, balance = pretax * growth, each = balance / spreadYears;
  const withdrawalTax = spreadYears * (bcBracketTax(incomeLater + each) - bcBracketTax(incomeLater));
  return {
    tfsa: (pretax - deductionValue) * growth,
    rrsp: balance - withdrawalTax,
    rateNow: pretax > 0 ? deductionValue / pretax : 0,
    rateLater: balance > 0 ? withdrawalTax / balance : 0,
    balance
  };
}

// Income ranges where 2026 credits change the actual marginal rate, so the
// statutory bracket figures can mislead. BC tax reduction: up to $690, reduced
// by 3.56% of net income over $25,570, nil at $44,952 (gov.bc.ca). Federal basic
// personal amount: reduced between the 4th and 5th federal bracket thresholds.
export const CREDIT_ZONES = { low: [0, 44952], bpa: [181440, 258482] };
/**
 * Zones touched by any income range [lo, hi]. A single income is [x, x].
 * low: at or below $44,952. bpa: overlaps ($181,440, $258,482], where the
 * phase-down applies to income above the lower threshold.
 */
export function creditZones(ranges) {
  const hit = { low: false, bpa: false };
  for (const [lo, hi] of ranges) {
    if (lo <= CREDIT_ZONES.low[1]) hit.low = true;
    if (lo < CREDIT_ZONES.bpa[1] && hi > CREDIT_ZONES.bpa[0]) hit.bpa = true;
  }
  return Object.keys(hit).filter(k => hit[k]);
}
