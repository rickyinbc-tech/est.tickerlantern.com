# One-time versus monthly illness-benefit cash

One English guide adds four interactive figures and inspectable data tables.
All monetary values, receipt dates and costs are authored hypothetical inputs.

## Evidence and boundary

FCAC health and disability insurance HTML pages were read and captured on
25 October 2026, with original URLs, page dates and SHA-256 hashes retained in
ignored owner-only qa/illness-cash-sources. Their respective displayed dates are
16 October 2025 and 31 July 2026. Sources support the broad payment structures
and the need to check definitions, timing, tax and benefit offsets.

Scenario A and scenario B are independent alternatives, each assuming a
separately confirmed claim and net receipts. They are never added. The model
does not determine medical or contractual eligibility, offsets, taxes, premium
cost, waiting periods, recovery income or a product recommendation. Inputs
specify actual cash receipt months rather than a contractual delay calculation.

Every month adds receipts before costs. The month-1 extra cost is counted once.
Required opening cash is the deepest cumulative shortfall, including month 0;
additional cash subtracts the entered reserve with a zero floor. Negative cash
is an unfunded position. No credit facility, interest or future settlement is
invented, and receipts after the horizon are excluded.

## Checks

Ten focused JavaScript tests pass: independent closed-form receipt counts and
cash reconciliation, default early-deficit/end-balance distinction, monotonic
delay stress, finite payment duration, post-horizon events, cash invariance,
zero cases, independent matrix cells, all field boundaries and invalid months.
The default one-time calendar needs CAD 10,000 opening cash and ends at zero;
the monthly calendar needs CAD 15,000 and ends with CAD 4,000 from the entered
CAD 10,000. Its positive ending cash does not fund the earlier CAD 5,000 gap.

Full JavaScript suite: 871 passed. Python suite: 122 passed.
Browser checks cover 1440, 390 and 320 pixels, four figures/tables, actual receipt
date changes, out-of-window receipts, fractional-month rejection, reset and
table disclosure. The test scrolls controls fully into view before clicking.
Mobile cash-path and matrix screenshots are inspected before publication.
