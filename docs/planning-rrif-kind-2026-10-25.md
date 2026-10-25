# RRIF payment form and cash budget

One detailed English guide adds four interactive figures and data tables.
Every amount and mix is an original hypothetical input; no private account
information or client record is used.

## Source and scope

CRA IC78-18R7 paragraph 5 and the public RRIF overview were read on
25 October 2026. Original official HTML copies, SHA-256 hashes and retrieval
timestamps remain owner-restricted in ignored qa/rrif-kind-sources. The circular
allows non-cash minimum payments and discusses available property; the overview
states the broad taxable-on-receipt treatment. The model does not calculate the
statutory minimum, an account's available options or a tax bill.

Inputs assume a carrier-approved ordinary minimum-payment illustration and a
non-registered destination for securities. All values share one assumed
transfer-date basis. No withholding, fees, sale, market movement, settlement
lag, return, contribution room or cost basis is calculated. A selected amount
above entered available RRIF value is capped and identified as unrepresented,
without declaring a statutory-minimum breach.

The gross payment splits into securities and cash, with total resources
conserved before household payments. A separate tax earmark and household
spending are assignments of the actual bank cash. Neither is treated as paid,
and an earmark does not reduce the household's assets. Negative budget capacity
is an unfunded assignment, not a negative bank account or automatic borrowing.

## Verification

Nine focused tests pass: default values, independent cash/asset conservation,
assignment-versus-payment distinction, monotonic payment-form stress, asset
caps, zero funding gaps, independent matrix and line formulas, all field
boundaries, finite accessible rendering and article/source scope.

Defaults represent CAD 25,000, including CAD 15,000 securities and CAD 10,000
bank cash. Opening bank cash brings the bank balance to CAD 22,000. Tax and
spending assignments total CAD 24,000, leaving a CAD 2,000 funding need.
The same gross amount at a 52% securities share just funds the two assignments.

Full JavaScript suite: 1052 passed. Python suite: 122 passed.
Browser checks cover 1440, 390 and 320 pixels, four figures/tables, actual
securities-share and starting-cash changes, invalid-share retention, reset and
data disclosure. All four mobile figure screenshots are inspected before
publication.
