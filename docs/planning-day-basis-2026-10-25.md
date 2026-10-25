# Actual accrued days and annual denominators

The English guide `/research/actual-days-interest-360-fixed-365-leap-year-denominator` adds four charts/tables. New York Fed's reference-rate methodology and Bank of Canada's CORRA methodology were reviewed on 25 October 2026 for their separate 360/365 denominator and compounding terms. No market rate, index value or published numeric example is reproduced. The tool implements neither benchmark.

Three original constant-principal SIMPLE accrual methods use identical civil dates: fixed 365, fixed 360 and an explicitly authored calendar-year daily denominator. The latter is not asserted to be a universal Actual/Actual convention. The start date is included and the close excluded; no business-day adjustment, compounding, rate reset, tax, fee, bank cash movement or principal repayment is calculated.

Default CAD 10,000 at a hypothetical 5% begins 15 December 2027 and closes 15 March 2028: 91 included dates, 17 in 2027 and 74 in 2028, including 29 February. Interest: fixed365 CAD 124.6575342466; fixed360 CAD 126.3888888889; calendar-year split CAD 124.3805674077. The day donut uses an explicit calendar-day description and centre label, rather than inheriting an asset-composition caption. Date calculation uses civil UTC dates consistently. The matrix compares calendar-year accrual with fixed365 using the selected principal/rate and independently replaced start/day count.

Validation:

- All 1,444 Node tests passed. Seven focused model tests and four SEO checks passed.
- Independent year-end arithmetic and daily sums verify 124 start/window combinations. Checks cover the exact 91-date interval, unique dates, closing-date exclusion, January entry, leap-day inclusion and century rules, fixed-denominator ratios, no compounding, zero/scale identities, exhaustive day grouping, matrix replacements, whole days and four finite figures/tables.
- `tests/browser_day_basis.py` passed at desktop and 390px mobile: English, four accessible figures/tables, SVG descriptions/text bounds, no overflow, close on 1 January excluding that day, next-day entry into 2028, zero principal, fractional-day rejection retaining results, reset, full closing dates and the 17/74-day table.
- Mobile calendar donut and leap-year difference-matrix screenshots were visually inspected.
