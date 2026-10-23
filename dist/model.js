// All amounts are illustrative. EPS uses a consistent normalized basis.
export const DEFAULTS = Object.freeze({ growth: 6, growthMode: 'constant', annualGrowth: Object.freeze([]), entryPE: 25, exitPE: 20, payout: 30, years: 5, dividendMode: 'payout', dividendYield: 1.2 });
export const BOUNDS = Object.freeze({ growth: [-15, 20], entryPE: [1, 100], exitPE: [1, 100], payout: [0, 100], years: [1, 20] });

export function validate(input) {
  const errors = {};
  for (const [key, [min, max]] of Object.entries(BOUNDS)) {
    if (key === 'payout' && input.dividendMode === 'yield') continue;
    if (input[key] === '' || input[key] === null || input[key] === undefined || !Number.isFinite(Number(input[key]))) errors[key] = 'Enter a number.';
    else if (+input[key] < min || +input[key] > max) errors[key] = `Use a value between ${min} and ${max}.`;
  }
  if (!errors.years && !Number.isInteger(+input.years)) errors.years = 'Use a whole number of years.';
  if (input.growthMode && !['constant', 'annual'].includes(input.growthMode)) errors.growthMode = 'Select a growth schedule.';
  if (input.growthMode === 'annual' && !errors.years) {
    const rates = input.annualGrowth;
    if (!Array.isArray(rates) || rates.length < +input.years || Array.from({ length: +input.years }, (_, i) => rates[i]).some(rate => rate === '' || rate == null || !Number.isFinite(+rate) || +rate < BOUNDS.growth[0] || +rate > BOUNDS.growth[1])) errors.annualGrowth = 'Enter an EPS growth rate between -15% and 20% for every year.';
  }
  if (input.dividendMode && !['payout', 'yield'].includes(input.dividendMode)) errors.dividendMode = 'Select a dividend convention.';
  if (input.dividendMode === 'yield' && (input.dividendYield === '' || input.dividendYield == null || !Number.isFinite(+input.dividendYield) || +input.dividendYield < 0 || +input.dividendYield > 15)) errors.dividendYield = 'Enter an initial yield between 0 and 15%.';
  return errors;
}

// Unique IRR: one negative initial investment followed by non-negative proceeds.
export function irr(cashflows) {
  if (!(cashflows[0] < 0) || cashflows.slice(1).some(v => v < 0)) throw new Error('Unsupported cash flows.');
  const npv = rate => cashflows.reduce((sum, amount, year) => sum + amount / (1 + rate) ** year, 0);
  let lo = -0.999999, hi = 1;
  while (npv(hi) > 0 && hi < 1e8) hi *= 2;
  for (let i = 0; i < 180; i++) {
    const mid = (lo + hi) / 2;
    if (npv(mid) > 0) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

export function project(input = DEFAULTS) {
  const errors = validate(input);
  if (Object.keys(errors).length) throw new Error('Invalid assumptions: ' + JSON.stringify(errors));
  const { growth, entryPE, exitPE, payout, years } = Object.fromEntries(Object.keys(BOUNDS).map(k => [k, +input[k]]));
  const dividendMode = input.dividendMode || 'payout', dividendYield = dividendMode === 'yield' ? +input.dividendYield : null;
  const growthMode = input.growthMode || 'constant';
  const annualGrowth = Array.from({ length: years }, (_, i) => growthMode === 'annual' ? +input.annualGrowth[i] : growth);
  const initialPrice = 100, initialEPS = initialPrice / entryPE, p = payout / 100;
  const points = [{ year: 0, eps: initialEPS, pe: entryPE, price: 100, dividend: 0, cumulativeDividend: 0, cashWealth: 100, reinvestedWealth: 100, shares: 1 }];
  const cashflows = [-initialPrice];
  let shares = 1, cumulativeDividend = 0;
  for (let year = 1; year <= years; year++) {
    const previousEPS = points.at(-1).eps, growth = annualGrowth[year - 1];
    const eps = previousEPS * (1 + growth / 100);
    const pe = entryPE * (exitPE / entryPE) ** (year / years);
    const price = eps * pe;
    // Year t's distribution is p times the prior valuation date's EPS anchor.
    // Annual cash receipt/reinvestment at the year-end ex-distribution price.
    const dividend = dividendMode === 'yield' ? initialPrice * dividendYield / 100 * previousEPS / initialEPS : p * previousEPS;
    cumulativeDividend += dividend;
    shares *= 1 + dividend / price;
    points.push({ year, growth, eps, pe, price, dividend, cumulativeDividend, cashWealth: price + cumulativeDividend, reinvestedWealth: shares * price, shares });
    cashflows.push(dividend + (year === years ? price : 0));
  }
  const last = points.at(-1);
  const priceCAGR = (last.price / initialPrice) ** (1 / years) - 1;
  const cashWealthCAGR = (last.cashWealth / initialPrice) ** (1 / years) - 1;
  const reinvestedCAGR = (last.reinvestedWealth / initialPrice) ** (1 / years) - 1;
  const multipleEffect = (exitPE / entryPE) ** (1 / years) - 1;
  const epsOnlyPrice = initialPrice * last.eps / initialEPS;
  const epsCAGR = (last.eps / initialEPS) ** (1 / years) - 1;
  return { input: { growth, growthMode, annualGrowth, entryPE, exitPE, payout, years, dividendMode, dividendYield }, initialPrice, initialEPS, epsCAGR, points, cashflows, priceCAGR, cashWealthCAGR, reinvestedCAGR, cashIRR: irr(cashflows), multipleEffect, epsOnlyPrice, epsGain: epsOnlyPrice - 100, multipleImpact: last.price - epsOnlyPrice, last };
}

function boundedAxis(values, min, max, anchor) {
  const round = value => Math.round(value * 10000) / 10000;
  const axis = [...new Set(values.map(value => round(Math.max(min, Math.min(max, value)))))].sort((a, b) => a - b);
  // Fill clamped duplicates near supported bounds without removing the anchor.
  while (axis.length < 5) {
    let gap = 0;
    for (let i = 1; i < axis.length - 1; i++) if (axis[i + 1] - axis[i] > axis[gap + 1] - axis[gap]) gap = i;
    axis.splice(gap + 1, 0, round((axis[gap] + axis[gap + 1]) / 2));
  }
  return axis.map(value => Math.abs(value - anchor) < .00005 ? +anchor : value);
}

export function sensitivityAxes(input) {
  const entry = +input.entryPE, growth = input.growthMode === 'annual' ? Math.max(BOUNDS.growth[0], Math.min(BOUNDS.growth[1], +((project(input).epsCAGR * 100).toFixed(8)))) : +input.growth;
  if (!Number.isFinite(entry) || entry < 1 || entry > 100 || !Number.isFinite(growth) || growth < -15 || growth > 20) throw new Error('Invalid sensitivity anchors');
  return {
    entryAnchor: entry,
    growths: boundedAxis([-8, -4, 0, 4, 8].map(delta => growth + delta), -15, 20, growth),
    multiples: boundedAxis([.6, .8, 1, 1.2, 1.4].map(factor => entry * factor), 1, 100, entry)
  };
}

export function sensitivity(input, axes = sensitivityAxes(input)) {
  const { growths, multiples } = axes;
  return { growths, multiples, rows: growths.map(growth => multiples.map(exitPE => project({ ...input, growthMode: 'constant', growth, exitPE }).cashIRR)) };
}

export function annualCSV(model) {
  const header = 'Year,Normalized EPS,Valuation PE,Price index,Dividend per original unit,Cumulative cash dividends,Price plus cash wealth,Reinvested wealth index,EPS growth percent';
  return [header, ...model.points.map(p => [p.year, p.eps, p.pe, p.price, p.dividend, p.cumulativeDividend, p.cashWealth, p.reinvestedWealth, p.growth ?? ''].map(v => typeof v === 'number' ? Number(v.toFixed(8)) : v).join(','))].join('\n');
}
