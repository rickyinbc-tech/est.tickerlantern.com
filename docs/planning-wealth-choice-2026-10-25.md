# Employer risk, investment-entry schedules and purchase financing

Three English visual guides, with four figures and a data table for every figure:

- `/research/employer-stock-income-interruption-household-risk`
- `/research/lump-sum-staged-investing-cash-return-path`
- `/research/cash-discount-financing-purchase-reserve-tradeoff`

The original wealth-median draft was replaced when the current main branch
added its own SFS guide. That published statistics article and its source
snapshot are retained without a competing definition or a duplicate article.

All twelve new graphics are original hypothetical scenarios. Their public
source notes were reviewed on 25 October 2026. Investor.gov supplies the
employer concentration and periodic-investment principles; FCAC supplies
the general loan-cost context. Neither source supplies the model inputs or
predicts a preferred investment or payment method.

## Model boundaries

Employer risk applies a single share-price loss and a selected net-income
interruption over twelve months. Other assets remain unchanged and outside
the spending account. Bills precede month-end income. Unfunded bills stay
separate, with no automatic credit or retrospective payment. An alternative
assumes all shares can be sold after the shock and uses an independently
entered usable share of gross proceeds; it does not calculate tax, vesting,
permission to sell or the value of continued ownership.

Investment entry gives both schedules the same starting capital. Purchases
occur at the beginning of each month; waiting cash earns a monthly-equivalent
effective return, retained in cash. One shock multiplies one monthly market
factor. Total wealth includes both invested assets and waiting cash. There
are no historical returns, probability estimates or trading costs.

Purchase financing gives both methods identical starting cash and monthly
household resources. A cash discount, a cash-paid setup fee and loan interest
are distinct. The loan payment precedes the month-end household budget. Any
negative position is an unmet funding requirement, and the ending economic
comparison is suppressed for such cases. The quoted model rate is nominal
annual interest, not an all-in disclosed APR. Negative positions have no
priced overdraft; they require a separately funded plan.

## Verification

`tests/planning-wealth-choice.test.mjs` checks independent expanded investment
holdings, waiting-cash interest, annuity payment and terminal cash formulas,
expense timing, ledger conservation, 0% cases, complete share loss, missing
funding and numerical/rendering boundaries. The final build and full Node and
Python suites are required before publication. Server HTML checks verify all
three pages, English metadata, canonical URLs, twelve figures and twelve tables.

`tests/browser_wealth_choice.py` is a reproducible browser interaction check.
This session's browser service timed out during navigation and then reported
resource unavailable / busy. There is no passing end-to-end browser report.
The server-rendered pages and 300px/760px SVG/data-table boundary tests are
verified separately; they do not establish complete browser interaction QA.
