# CPP average, new-start maximum and household cash

One detailed English guide adds two official-source figures and two separate
editable household cash figures, all with inspectable data tables. No private
account, contribution statement, client record, email or research archive is
used. The article does not calculate a personal CPP entitlement or tax bill.

## Source verification

The official Service Canada payment-amounts HTML, personal-amount guidance and
ESDC October–December 2026 rate-card HTML were reviewed on 25 October 2026.
The payment table and rate card were modified on 29 September; the amount
guidance on 13 October. The table's mean of CAD 858.34 is for new age-65
retirement-pension beneficiaries in July 2026. Its CAD 1,507.65 maximum uses a
January 2026 new-benefit reference. These are not all-recipient means or a
description of a single household.

The Open Government dataset landing page returned 403 to the web reader. Its
anonymous public package API and original CSV were accessible. The CSV's
Retirement Pension column supplies monthly new-start maxima. The parser uses
Windows-1252, retains original bilingual month labels and validates exactly
twelve 2026 rows before selecting January–October. Future November–December
start rows are deliberately omitted. The rate-card footnote establishes the
new-start month/CPP-enhancement context and age-65 retirement category.

Reproduce with scripts/extract-planning-cpp-amounts.py --archive
qa/cpp-amounts-next. A second extraction matched the bundled data byte for
byte. The extractor checks source hashes, unique table row, average reference,
January benchmark, month order, absence of duplicates, positive increasing
values and exact January/July/October checkpoints. Public source bytes,
retrieval metadata and SHA-256 hashes remain ignored under that qa folder.
Source URLs, precision, units, dimensions and selected references accompany the
small attributed data module. No PDF source or private local index is needed.

January, July and October new-start maxima are CAD 1,507.65, CAD 1,516.99 and
CAD 1,521.67 per month. July maximum minus the published July mean is CAD
658.65; that is not an entitlement shortfall or a probability. The connected
monthly maxima represent different new-start cases, not the payment path of
one existing recipient. No count, distribution, quantile, personal replacement
rate or confidence interval is inferred. One-time death benefits and other
benefit types are excluded.

The maximum-series chart explicitly focuses its vertical scale on CAD
1,500–1,530. A new optional compactYTicks=false line-chart setting retains
distinct full-money labels; default formatting remains unchanged for other
figures. This avoids showing five indistinguishable $1.5k tick labels.

## Separate original cash illustration

Pension and other income are independently entered spendable amounts after any
assumed tax allowance. They are never filled or capped using official source
amounts. Spending and incomes stay constant; each month's income arrives at
month-end immediately before its spending. Opening reserve is recorded once
at month zero. There is no indexation, return, tax calculation, borrowing,
intra-month event model or funding recommendation beyond the selected period.

Default monthly net=1,800+1,000-3,500=-700. From CAD 6,000 opening cash,
month eight retains CAD 400, month nine has a provisional CAD 300 shortage
and month twelve has a CAD 2,400 shortage. Extra opening cash is the amount
needed to lift the lowest modeled point to zero. A provisional negative
balance is preserved as unfunded cash rather than converted into a loan.
Editing any household field leaves both official figures unchanged.

## Verification

Eleven focused tests check provenance, exact observations, corresponding date
labels, focused-axis bounds and distinct money ticks, independent cash sums,
source/scenario independence, additional-cash sufficiency, zero/surplus cases,
all supported field extrema, invalid months and source/editorial scope.

Full JavaScript suite: 1252 passed. Python suite: 122 passed.
Browser checks at 1440, 390 and 320 pixels verify four figures/data tables,
no overflow, fixed official values under cash edits, zero shortfall, extreme
negative reserve, invalid month retention, reset and disclosure. All four
default mobile figures are visually inspected, including the full focused
axis labels. Live route, hub and runtime verification follow deployment.
