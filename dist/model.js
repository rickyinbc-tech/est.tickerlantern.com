import {metricProvenance} from './update-status.js';
// Educational annual convention; the earnings anchor is synthetic, not official index EPS.
export const MODEL_CONVENTION_VERSION = 'tickerlantern-annual-forward-anchor-v2';
export const MODEL_CONVENTIONS = Object.freeze({
  version: MODEL_CONVENTION_VERSION,
  initialWealth: 100,
  earningsAnchor: 'synthetic normalized forward earnings: initial wealth / entry PE',
  earningsTimeline: 'F0 covers approximately holding year 1; Ft is the following-period anchor at valuation date t',
  priceBasis: 'modeled ex-distribution price, excluding distributions',
  valuationPath: 'geometric interpolation from entry PE to exit PE at annual valuation dates',
  dividendTiming: 'prior valuation date earnings anchor; paid at holding year end',
  yieldTiming: 'initial yield anchors first payment; subsequent payments follow prior-anchor earnings growth',
  reinvestmentTiming: 'each year-end distribution reinvested at the modeled year-end ex-distribution price',
  cashInterestPercent: 0,
  returnBasis: 'nominal; before taxes, fees and trading costs',
  currencyBasis: 'normalized currency-neutral illustration; no FX translation or hedging',
  growthMapping: 'timing-v4: Nasdaq-100 uses each published annual earnings forecast only in its named year and a derived Invesco US large-cap long-term EPS proxy in missing years; explicit CY/rolling12m inputs for other benchmarks may use a uniform-accrual calendar-to-forward model bridge; remaining definitions use editorial normalized rates',
  exclusions: 'no separate buyback return; no independently forecast EPS series; no official daily total-return replication'
});
export const DEFAULTS = Object.freeze({ growth: 6, growthMode: 'constant', growthStartYear: null, annualGrowth: Object.freeze([]), entryPE: 25, exitPE: 20, payout: 30, years: 5, dividendMode: 'payout', dividendYield: 1.2 });
export const BOUNDS = Object.freeze({ growth: [-99, 1000], entryPE: [1, 100], exitPE: [1, 100], payout: [0, 100], years: [1, 20] });

export function validate(input) {
  const errors = {};
  for (const [key, [min, max]] of Object.entries(BOUNDS)) {
    if (key === 'payout' && input.dividendMode === 'yield' || key === 'growth' && input.growthMode === 'source') continue;
    if (input[key] === '' || input[key] === null || input[key] === undefined || !Number.isFinite(Number(input[key]))) errors[key] = 'Enter a number.';
    else if (+input[key] < min || +input[key] > max) errors[key] = `Use a value between ${min} and ${max}.`;
  }
  if (!errors.years && !Number.isInteger(+input.years)) errors.years = 'Use a whole number of years.';
  if (input.growthMode && !['constant', 'annual', 'source'].includes(input.growthMode)) errors.growthMode = 'Select a growth schedule.';
  if (input.growthMode === 'source' && (!Number.isInteger(+input.growthStartYear) || +input.growthStartYear < 2020 || +input.growthStartYear > 2100)) errors.growthMode = 'Published forecast year is unavailable.';
  if (['annual', 'source'].includes(input.growthMode) && !errors.years) {
    const rates = input.annualGrowth;
    if (!Array.isArray(rates) || rates.length < +input.years || Array.from({ length: +input.years }, (_, i) => rates[i]).some(rate => rate === '' || rate == null || !Number.isFinite(+rate) || +rate < BOUNDS.growth[0] || +rate > BOUNDS.growth[1])) errors.annualGrowth = input.growthMode === 'source' ? `Enter a rate between ${BOUNDS.growth[0]}% and ${BOUNDS.growth[1]}% for each uncovered year, the holding period stays five years. Published estimates are not automatically replayed.` : `Enter an EPS growth rate between ${BOUNDS.growth[0]}% and ${BOUNDS.growth[1]}% for every year.`;
  }
  if (input.dividendMode && !['payout', 'yield'].includes(input.dividendMode)) errors.dividendMode = 'Select a dividend convention.';
  if (input.dividendMode === 'yield' && (input.dividendYield === '' || input.dividendYield == null || !Number.isFinite(+input.dividendYield) || +input.dividendYield < 0 || +input.dividendYield > 15)) errors.dividendYield = 'Enter an initial yield between 0 and 15%.';
  return errors;
}

// Unique periodic IRR: one negative initial payment and at least one positive receipt.
// Solve log(1 + r), using log-sum-exp PVs to avoid arbitrary rate floors/caps and
// overflow when evaluating large proceeds or rates near negative 100 percent.
export function solveIRR(cashflows) {
  if (!Array.isArray(cashflows) || cashflows.length < 2 || Array.from(cashflows).some(v => !Number.isFinite(v)) || !(cashflows[0] < 0) || cashflows.slice(1).some(v => v < 0) || !cashflows.slice(1).some(v => v > 0)) throw new Error('Unsupported cash flows: require one finite initial outflow and non-negative receipts including a positive receipt.');
  const initialLog = Math.log(-cashflows[0]);
  const receipts = cashflows.flatMap((amount, year) => year && amount > 0 ? [{ year, logAmount: Math.log(amount) - initialLog }] : []);
  const logPV = logGross => {
    const terms = receipts.map(({ year, logAmount }) => logAmount - year * logGross);
    const max = Math.max(...terms);
    return max + Math.log(terms.reduce((sum, term) => sum + Math.exp(term - max), 0));
  };
  let lo = -1, hi = 1;
  while (logPV(lo) < 0) lo *= 2;
  while (logPV(hi) > 0) hi *= 2;
  let logGross = 0, iterations = 0;
  for (; iterations < 256; iterations++) {
    logGross = (lo + hi) / 2;
    const value = logPV(logGross);
    if (Math.abs(Math.expm1(value)) <= 2e-14 || logGross === lo || logGross === hi) break;
    if (value > 0) lo = logGross; else hi = logGross;
  }
  const rate = Math.expm1(logGross);
  if (!Number.isFinite(rate) || rate <= -1) throw new Error('IRR is outside the representable finite rate range.');
  // Assess the rounded, returned rate rather than only its internal log value.
  const relativeNPVResidual = Math.expm1(logPV(Math.log1p(rate)));
  const converged = Math.abs(relativeNPVResidual) <= 1e-10;
  if (!converged) throw new Error('IRR failed the scale-relative NPV residual check.');
  return { rate, iterations: Math.min(iterations + 1, 256), relativeNPVResidual, npvResidual: relativeNPVResidual * -cashflows[0], converged, method: 'log-gross-bisection-v1' };
}

export function irr(cashflows) { return solveIRR(cashflows).rate; }

export function project(input = DEFAULTS) {
  const errors = validate(input);
  if (Object.keys(errors).length) throw new Error('Invalid assumptions: ' + JSON.stringify(errors));
  const { growth, entryPE, exitPE, payout, years } = Object.fromEntries(Object.keys(BOUNDS).map(k => [k, +input[k]]));
  const dividendMode = input.dividendMode || 'payout', dividendYield = dividendMode === 'yield' ? +input.dividendYield : null;
  const growthMode = input.growthMode || 'constant';
  const annualGrowth = Array.from({ length: years }, (_, i) => growthMode === 'constant' ? growth : +input.annualGrowth[i]);
  const growthStartYear = growthMode === 'source' ? +input.growthStartYear : null;
  const initialPrice = MODEL_CONVENTIONS.initialWealth, initialEPS = initialPrice / entryPE, p = payout / 100;
  const points = [{ year: 0, eps: initialEPS, pe: entryPE, price: initialPrice, dividend: 0, cumulativeDividend: 0, cashWealth: initialPrice, reinvestedWealth: initialPrice, shares: 1 }];
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
  const irrDiagnostics = solveIRR(cashflows);
  return { input: { growth, growthMode, growthStartYear, growthOverrides:{...(input.growthOverrides || {})}, growthPlan:input.growthPlan || [], annualGrowth, entryPE, exitPE, payout, years, dividendMode, dividendYield }, conventions: MODEL_CONVENTIONS, irrDiagnostics, initialPrice, initialEPS, epsCAGR, points, cashflows, priceCAGR, cashWealthCAGR, reinvestedCAGR, cashIRR: irrDiagnostics.rate, multipleEffect, epsOnlyPrice, epsGain: epsOnlyPrice - initialPrice, multipleImpact: last.price - epsOnlyPrice, last };
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
  const entry = +input.entryPE, growth = ['annual', 'source'].includes(input.growthMode) ? Math.max(BOUNDS.growth[0], Math.min(BOUNDS.growth[1], +((project(input).epsCAGR * 100).toFixed(8)))) : +input.growth;
  if (!Number.isFinite(entry) || entry < 1 || entry > 100 || !Number.isFinite(growth) || growth < BOUNDS.growth[0] || growth > BOUNDS.growth[1]) throw new Error('Invalid sensitivity anchors');
  return {
    entryAnchor: entry,
    growths: boundedAxis([-8, -4, 0, 4, 8].map(delta => growth + delta), ...BOUNDS.growth, growth),
    multiples: boundedAxis([.6, .8, 1, 1.2, 1.4].map(factor => entry * factor), 1, 100, entry)
  };
}

export function sensitivity(input, axes = sensitivityAxes(input)) {
  const { growths, multiples } = axes;
  return { growths, multiples, rows: growths.map(growth => multiples.map(exitPE => project({ ...input, growthMode: 'constant', growth, exitPE }).cashIRR)) };
}

export const ANNUAL_CSV_HEADER = 'Year,Synthetic normalized forward earnings anchor,Valuation PE,Normalized price index,Dividend per original unit,Cumulative cash dividends,Price plus cash wealth,Reinvested wealth index,Published period,Growth basis,Observation date,Source URL,Model convention version,Benchmark ID,Snapshot ID,Snapshot version,Snapshot published at,Normalized starting wealth,Entry PE assumption,Exit PE assumption,Holding years,Growth mode,Dividend convention,Payout percent,Initial yield percent,Cash interest percent,Price basis,Return basis,Currency basis,Growth mapping,Entry metric provenance,Exit metric provenance,Yield metric provenance,Scenario protection metadata,Health evaluated at,Payout metric provenance,Model status,Unavailable reason,Growth source provenance,EPS growth percent';

export function annualCSV(model, forecast, context = {}) {
  const header = ANNUAL_CSV_HEADER;
  const evaluatedAt=new Date(context.healthEvaluatedAt || Date.now());
  const growthStatus=context.growthMetric || metricProvenance({growthForecast:forecast},'growthForecast',evaluatedAt);
  // Keep round-trip numeric precision, including small non-zero modeled earnings.
  const cell = v => /[,"\n\r]/.test(String(v ?? '')) ? '"' + String(v).replaceAll('"', '""') + '"' : v ?? '';
  const provenance = value => value == null ? '' : JSON.stringify(value);
  const scenarioMetadata = [
    MODEL_CONVENTION_VERSION, context.benchmarkId, context.snapshotId, context.snapshotVersion, context.publishedAt,
    model.initialPrice, model.input.entryPE, model.input.exitPE, model.input.years, model.input.growthMode,
    model.input.dividendMode, model.input.dividendMode === 'payout' ? model.input.payout : '',
    model.input.dividendMode === 'yield' ? model.input.dividendYield : '', MODEL_CONVENTIONS.cashInterestPercent,
    MODEL_CONVENTIONS.priceBasis, MODEL_CONVENTIONS.returnBasis, MODEL_CONVENTIONS.currencyBasis,
    model.input.growthMode === 'source' ? MODEL_CONVENTIONS.growthMapping : 'user-selected holding-year earnings growth scenario',
    provenance(context.entryMetric), provenance(context.exitMetric), provenance(context.yieldMetric),
    provenance({ sourceFollowing: context.sourceFollowing ?? null, fieldProvenance: context.fieldProvenance ?? null, locks: context.locks ?? context.fieldOverrides ?? null, growthOverrides: model.input.growthOverrides }),evaluatedAt.toISOString()
  ];
  return [header, ...model.points.map(p => {
    const year = model.input.growthStartYear + p.year - 1;
    const point = model.input.growthMode === 'source' && forecast?.estimates.find(x => x.year === year);
    const plan = model.input.growthMode === 'source' && model.input.growthPlan?.find(x => x.year === year && +x.growth === p.growth);
    const extension = !!p.year && ['model extension','calendar-to-forward model','normalized model','published-growth scenario','growth projection','long-term EPS projection'].includes(plan?.basis) && !Object.hasOwn(model.input.growthOverrides || {}, year);
    const sourced = !!p.year && !extension && model.input.growthMode === 'source' && !Object.hasOwn(model.input.growthOverrides || {}, year) && !!point && +point.growth === p.growth;
    const growthEvidence = sourced ? provenance({ publisher: forecast.source.publisher, url: forecast.source.url, sha256: forecast.source.sha256 ?? null, parserVersion: forecast.source.parserVersion ?? null, asOf: forecast.asOf, forecastType: forecast.forecastType, periodBasis: forecast.periodBasis ?? null, periodLabel: point.periodLabel ?? null, year: point.year, periodEnd: point.periodEnd ?? null,synchronization:growthStatus.synchronization,health:growthStatus.health }) : '';
    return [
      p.year, p.eps, p.pe, p.price, p.dividend, p.cumulativeDividend, p.cashWealth, p.reinvestedWealth,
      p.year && model.input.growthMode === 'source' ? extension ? plan.periodLabel : point?.periodLabel || String(year) : '',
      p.year ? sourced ? forecast.forecastType : extension ? plan.basis : 'custom assumption' : '', sourced ? forecast.asOf : '', sourced ? forecast.source.url : '',
      ...scenarioMetadata, provenance(context.payoutMetric), 'calculated', '', extension ? provenance(plan) : growthEvidence, p.growth ?? ''
    ].map(cell).join(',');
  })].join('\n');
}
