# Inflation order and annual-rate conventions

Two English guides add nine hypothetical charts, each with an expandable data table:

- `/research/retirement-inflation-order-same-price-level-spending-sequence`
- `/research/nominal-effective-annual-rate-compounding-monthly-payment`

Public sources reviewed 25 October 2026 are the Bank of Canada inflation explanation, SEC purchasing-power glossary, FCAC sample fixed-mortgage information box and FCAC personal-loan guidance. The FCAC disclosure is an example, not a current rate offer. No private records or local account information are used.

The inflation model reverses the exact same ten inflation factors. Requests occur at the start of each year, with the first request immediate. The constant nominal return follows the funded withdrawal; inflation is then applied for the next year’s request. The final inflation factor changes closing purchasing power, without introducing an eleventh request. Unfunded spending remains separate. Required opening capital discounts all ten requested withdrawals from their start-of-year dates. It is not a safe withdrawal calculation or a complete retirement horizon.

The rate comparison distinguishes nominal compounding counts from an already-effective annual interpretation. Each annual growth factor is converted to an equivalent monthly rate before solving the payment. Rates remain fixed for the full displayed repayment horizon, without any claim that an actual mortgage term lasts that long. The extra-interest chart subtracts the already-effective interpretation to make small convention effects visible; zero means equal cost to that baseline, not an interest-free loan. No fee-inclusive APR is calculated.

Validation:

- 691 full Node tests passed before the final difference-view chart refinement.
- The final build and eleven targeted mathematical/SEO tests passed after that refinement.
- `tests/browser_timing_conventions.py` passed on both pages at 1440px and 390px, checking nine charts/tables, editing, fractional-period validation, retained results and reset.
- Mobile price-path, funded-spending and rate-conversion figures were visually inspected. The conversion matrix preserves two-decimal percentages and short column headings.

Independent tests expand the start-of-year cash flows, reproduce present values and terminal portfolios, verify annual/monthly growth-factor identities and closed-form amortization, and check zero rates, no principal, no spending, insufficient capital and supported input boundaries.
