# Employer risk and purchase financing

Two English visual guides, with four figures and a data table for every figure:

- `/research/employer-stock-income-interruption-household-risk`
- `/research/cash-discount-financing-purchase-reserve-tradeoff`

The wealth-median and staged-entry drafts were removed when the current main
branch added those topics. Existing published guides and public statistical
snapshots are retained, without competing definitions or duplicate articles.

All eight new graphics are original hypothetical scenarios. Their public
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

Purchase financing gives both methods identical starting cash and monthly
household resources. A cash discount, a cash-paid setup fee and loan interest
are distinct. The loan payment precedes the month-end household budget. Any
negative position is an unmet funding requirement, and the ending economic
comparison is suppressed for such cases. The quoted model rate is nominal
annual interest, not an all-in disclosed APR. Negative positions have no
priced overdraft; they require a separately funded plan.

## Verification

`tests/planning-wealth-choice.test.mjs` checks independent annuity payment and terminal cash formulas,
expense timing, ledger conservation, 0% cases, complete share loss, missing
funding and numerical/rendering boundaries. The final build and full Node and
Python suites are required before publication. Server HTML checks verify both
pages, English metadata, canonical URLs, eight figures and eight tables.

`tests/browser_wealth_choice.py` is a reproducible browser interaction check.
This session's browser service timed out during navigation and then reported
resource unavailable / busy. There is no passing end-to-end browser report.
The server-rendered pages and 300px/760px SVG/data-table boundary tests are
verified separately; they do not establish complete browser interaction QA.
