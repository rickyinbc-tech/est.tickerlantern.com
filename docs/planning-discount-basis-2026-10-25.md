# Nominal and real cash-flow price bases

The English guide `/research/real-nominal-cash-flow-discount-rate-price-basis` adds four charts/tables. ACCA's inflation-appraisal explanation, HM Treasury's Green Book 2026 and Damodaran's NYU time-value primer were reviewed on 25 October 2026 for general mechanics only. Publisher examples, historical returns, policy discount rates and tax calculations are not reproduced.

The annual cost has constant starting-date purchasing power. Nominal payments grow with the entered price level, beginning at the end of year one after one complete year of inflation. The real discount growth factor is the nominal growth factor divided by price growth, with full precision and no clamp on negative real rates. Nominal here refers to price basis, not a compounding-frequency quotation.

The two matched routes value the same plan year by year and in total. Two deliberately mismatched calculations illustrate errors, not actual alternative forecasts. The rate/inflation grid reports a relative error; zero-cost denominators remain N/A. No bank ledger, saving contribution, investment return or funding-adequacy judgment is calculated.

Validation:

- 1,109 full Node tests passed.
- Six focused tests verify exact payment timing, growth-factor and per-year PV identities, independent finite geometric sums, zero inflation, zero/negative real rates, scale invariance, undefined zero-cost ratios, matrix assumptions and whole-period limits.
- The build and four SEO checks passed.
- `tests/browser_discount_basis.py` passed at desktop and 390px mobile, checking four figures/tables, accessible descriptions, text bounds, matched present-cost table values, a negative real rate, zero-cost N/A, fractional-period rejection, retained valid results and reset.
- The mobile method-comparison chart was visually inspected. Its concise labels explicitly identify cash basis divided by rate basis.
