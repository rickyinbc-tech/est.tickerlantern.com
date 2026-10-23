// All amounts are illustrative. EPS uses a consistent normalized basis.
export const DEFAULTS = Object.freeze({ growth: 6, entryPE: 25, exitPE: 20, payout: 30, years: 5, dividendMode: 'payout', dividendYield: 1.2 });
export const BOUNDS = Object.freeze({ growth: [-15, 20], entryPE: [1, 100], exitPE: [1, 100], payout: [0, 100], years: [1, 20] });

export function validate(input) {
  const errors = {};
  for (const [key, [min, max]] of Object.entries(BOUNDS)) {
    if (key === 'payout' && input.dividendMode === 'yield') continue;
    if (input[key] === '' || input[key] === null || input[key] === undefined || !Number.isFinite(Number(input[key]))) errors[key] = 'Enter a number.';
    else if (+input[key] < min || +input[key] > max) errors[key] = `Use a value between ${min} and ${max}.`;
  }
  if (!errors.years && !Number.isInteger(+input.years)) errors.years = 'Use a whole number of years.';
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
  const initialPrice = 100, initialEPS = initialPrice / entryPE, g = growth / 100, p = payout / 100;
  const points = [{ year: 0, eps: initialEPS, pe: entryPE, price: 100, dividend: 0, cumulativeDividend: 0, cashWealth: 100, reinvestedWealth: 100, shares: 1 }];
  const cashflows = [-initialPrice];
  let shares = 1, cumulativeDividend = 0;
  for (let year = 1; year <= years; year++) {
    const eps = initialEPS * (1 + g) ** year;
    const pe = entryPE * (exitPE / entryPE) ** (year / years);
    const price = eps * pe;
    // Year t's distribution is p times the prior valuation date's EPS anchor.
    // Annual cash receipt/reinvestment at the year-end ex-distribution price.
    const dividend = (dividendMode === 'yield' ? initialPrice * dividendYield / 100 : p * initialEPS) * (1 + g) ** (year - 1);
    cumulativeDividend += dividend;
    shares *= 1 + dividend / price;
    points.push({ year, eps, pe, price, dividend, cumulativeDividend, cashWealth: price + cumulativeDividend, reinvestedWealth: shares * price, shares });
    cashflows.push(dividend + (year === years ? price : 0));
  }
  const last = points.at(-1);
  const priceCAGR = (last.price / initialPrice) ** (1 / years) - 1;
  const cashWealthCAGR = (last.cashWealth / initialPrice) ** (1 / years) - 1;
  const reinvestedCAGR = (last.reinvestedWealth / initialPrice) ** (1 / years) - 1;
  const multipleEffect = (exitPE / entryPE) ** (1 / years) - 1;
  const epsOnlyPrice = initialPrice * (1 + g) ** years;
  return { input: { growth, entryPE, exitPE, payout, years, dividendMode, dividendYield }, initialPrice, initialEPS, points, cashflows, priceCAGR, cashWealthCAGR, reinvestedCAGR, cashIRR: irr(cashflows), multipleEffect, epsOnlyPrice, epsGain: epsOnlyPrice - 100, multipleImpact: last.price - epsOnlyPrice, last };
}

export function sensitivity(input) {
  const growths = [2, 4, 6, 8, 10], multiples = [16, 18, 20, 22, 25];
  return { growths, multiples, rows: growths.map(growth => multiples.map(exitPE => project({ ...input, growth, exitPE }).cashIRR)) };
}

export function annualCSV(model) {
  const header = 'Year,Normalized EPS,Valuation PE,Price index,Dividend per original unit,Cumulative cash dividends,Price plus cash wealth,Reinvested wealth index';
  return [header, ...model.points.map(p => [p.year, p.eps, p.pe, p.price, p.dividend, p.cumulativeDividend, p.cashWealth, p.reinvestedWealth].map(v => typeof v === 'number' ? Number(v.toFixed(8)) : v).join(','))].join('\n');
}
