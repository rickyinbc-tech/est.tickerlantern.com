# Joint deposits: member and owner-set grouping

The English guide adds four editable charts with accessible data tables. It
uses public CDIC HTML guidance reviewed 25 October 2026 and original invented
balances. Public-source bytes, timestamps and SHA-256 hashes are retained in
ignored qa/joint-owner-next/manifest.json. No PDF, private account, client,
email or private research evidence is used. Abstract owners A/B/C and genuinely
distinct hypothetical members X/Y are assumptions, not verified identities.

The public joint-deposit page supplies same-set combination and the required
joint-ownership statement and owner name/address records. The general coverage
page supplies eligible-product context, distinct-member coverage and the
CAD 100,000 principal-plus-interest limit. The depositor reimbursement page’s
joint section clarifies that owners together receive a payment for their set;
the limit is not multiplied by owner count. No publisher worked case is copied.

The model assumes eligible non-registered joint deposits and complete member
records at a common snapshot date. It rounds each entered balance to cents,
groups by the member and sorted distinct owner set, then applies the limit.
It does not infer actual eligibility, validate records, allocate ownership
shares or reimbursements, project interest, or recommend changing ownership.
Trust/nominee arrangements, other categories, provincial insurance, currency
conversion, tax/estate consequences, loss estimates and access dates are out
of scope. An above-limit amount is not a predicted loss.

The default X/A+B accounts 72,000 and 46,000 combine to 118,000, with 18,000
above the cap. X/A+C has 51,000 within its cap and 49,000 unused. Y/A+B has
123,000, with 23,000 above its cap. The 292,000 total reconciles to 251,000
within and 41,000 above individual limits. Three notional caps totaling
300,000 do not remove that 41,000; unused capacity is not transferred.

Charts show grouped balances versus thresholds, within/above stacked portions,
a total reconciliation and an isolated X/A+B sensitivity matrix. At default
X1 multiples 0/1/2 and X2 multiples 0/1/2, above-limit matrix rows are
[0,0,0], [0,18000,64000], [44000,90000,136000]. Each stressed balance is rounded
to cents first. Other pools are excluded from the matrix.

Nine focused tests cover independent default checkpoints, owner-order and
account-splitting invariance, distinct sets/members, owner count, local unused
capacity, cent boundaries, fixed-pool sensitivity scope, every control endpoint,
zero inventory, finite accessible figures, invalid inputs and substantive
English source/related-reading scope.

Full JavaScript suite: 1581 passed. Python suite: 122 passed.
Local browser checks at 1440, 390 and 320 pixels passed: four figures/data
tables, no page overflow, default checkpoints, isolated matrix invariance,
exact threshold, zero inventory, one-cent excess, invalid input retention,
reset and disclosure. All four default mobile figures were visually inspected.
Live verification follows deployment.

An initial full-suite run overlapped the static build and its search test
encountered the temporarily absent dist/search-index.json. After the build
completed, the complete suite passed; future publication checks run build
before tests. No product change was needed for that execution-order issue.
