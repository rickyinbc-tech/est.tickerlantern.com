# Original-principal flat and reducing-balance loan quotes

The English guide `/research/flat-interest-original-principal-reducing-balance-effective-cost` adds four charts/tables. MoneySense Singapore's explanation (updated 22 April 2026) was reviewed on 25 October for the interest-base distinction; FCAC's personal-loan page supplies general total-cost and repayment-schedule context. Published numeric examples, lending-market statements and statutory rates are not reproduced. The article explicitly defines its own annualization instead of adopting jurisdiction-specific APR/EIR terminology.

Both hypothetical schedules advance the same principal at time zero and receive month-end payments starting one complete month later. Flat interest is original principal × annual quote × months/12, allocated equally. The reducing quote is nominal annual/12 applied to opening unpaid principal, with a constant amortizing payment. Full-precision arithmetic is used; displayed installments are not a cent-rounded invoice. Allocated principal is not an early-settlement quote. Fees, taxes, insurance, default, rebates and actual household funding are excluded.

The flat periodic equivalent solves the complete discounted repayment schedule, then compounds for twelve months. The default CAD 10,000/24-month/6% examples produce flat payment CAD 466.6666667 and interest CAD 1,200, versus reducing payment CAD 443.2061025 and interest CAD 636.9464607. Flat effective annual equivalent is 11.71200157%, compared with 6.16778119% for 0.5% monthly. The selected zero advance yields N/A; the independent matrix uses a positive normalized unit advance.

Validation:

- All 1,285 Node tests passed. Seven focused model tests and four SEO checks passed.
- Independent present-value sums over 1, 12, 24 and 60 months and 0%, 3%, 6% and 15% flat quotes verify solved rates, root direction and cash-flow equivalence. Checks cover period and aggregate conservation, monthly interest bases, zero rates/advance, one payment, scale invariance, reversed quote rankings, fixed positive-unit grid assumptions and supported input limits.
- `tests/browser_flat_loan.py` passed at desktop and 390px mobile: four accessible figures/tables, English, SVG descriptions/text bounds, no overflow, default rates/payments, zero-advance N/A, unchanged normalized matrix, zero-rate payment, fractional-period rejection retaining valid results, reset and itemized interest totals.
- Mobile monthly-interest and effective-rate-matrix screenshots were visually inspected.
