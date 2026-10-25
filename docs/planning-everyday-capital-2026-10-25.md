# Personal assessment reserves, fixed debt and contribution implementation

Three English planning guides add twelve hypothetical figures and twelve data tables:

- `/research/condo-special-assessment-personal-reserve-deadlines`
- `/research/fixed-loan-inflation-real-debt-household-affordability`
- `/research/weekly-investing-batched-purchases-fees-waiting-cash`

Sources reviewed 25 October 2026: BC government special-levy and contingency-reserve guidance; the Bank of Canada inflation explanation; FCAC personal-loan guidance; the SEC fee bulletin of 23 July 2025. Sources establish general mechanics and scope, not the scenario values or predicted outcomes. The strata illustration does not determine legal approval, unit entitlement, sale responsibility or the building’s reserve adequacy. No private research records are used.

## Timing and units

The assessment uses independently entered owner-level instalments, due at the start of a month before that month’s saving. The personal reserve is distinct from corporation-held funds. Unfunded bills remain separate and are not retrospectively paid with later deposits. The required-saving calculation tests cumulative requirements at every due date. N/A indicates that a month-one bill exceeds opening cash; no later monthly saving can fund that earlier date.

The fixed-debt exercise amortizes a nominal fixed-interest loan. Real values divide nominal amounts by a cumulative assumed price factor. Monthly income and living-cost figures are run rates, not a bank-account or intramonth receipt ledger. A negative surplus is a funding need, not supplied credit. The final budget point includes the final loan payment.

The contribution comparison supplies equal cash deposits at the beginnings of weeks. It models 52 weeks per year, so four-week purchases yield thirteen scheduled opportunities rather than twelve monthly opportunities. A trade occurs only when cash exceeds the fee; no fee is paid for a skipped trade. Endpoints include waiting cash. Asset and cash returns are effective annual assumptions converted weekly. No spread, ongoing product fee, tax or required trading lot is modeled.

The chart renderer accepts an optional per-figure `unavailableLabel` for heatmaps and their data tables. Existing labels remain unchanged when this option is absent. The assessment matrix uses N/A consistently instead of a repayment-specific NR label.

## Verification evidence

- 614 Node tests and 122 Python tests passed before the final label-only refinement.
- The final build and fourteen targeted model/SEO tests passed after that refinement.
- `tests/browser_everyday_capital.py` passed for all three pages at 1440px and 390px, covering twelve charts/tables, input changes, invalid fractional calendar values, retained results and resets.
- Visual inspection of mobile charts found and repaired long purchase-interval column labels. The revised mobile matrix and selected payment/assessment figures were inspected from saved screenshots.

Original arithmetic checks include cumulative assessment deadline bounds, closed-form annuity payments and debt balances, real/nominal identities, expanded weekly deposit values, waiting-cash compounding, skipped purchases and preservation of leftover cash. Boundary cases render finite figures and data tables at 300px and 760px.
