# CPI windows, seasonal adjustment and twelve future bills

One detailed English guide adds two fixed official-source figures and two
separate editable cash illustrations, all with data tables. It uses no
private account, client, email, archived PDF or research source. No CPI
forecast or personalized inflation estimate is calculated.

## Sources and extraction

Statistics Canada's 19 October 2026 September-CPI release, official HTML
tables 1/3, CPI FAQ and Bank of Canada's monthly table/API were checked on
25 October 2026. Original public bytes, retrieval times and SHA-256 hashes
remain ignored under qa/cpi-month-next. One web-reader request for table 3
timed out; a normal verified-HTTPS curl request retrieved its official HTML,
whose All-items row was checked directly. No PDF source was used.

Reproduce with scripts/extract-planning-cpi-window.py --archive
qa/cpi-month-next. A second extraction matched the bundled module byte for
byte. The extractor verifies all six source hashes, thirteen consecutive
reference months, dimensions/units, source precision, flags, positive levels,
exact checkpoints and separate unadjusted/adjusted table rows. It selects 39
values: monthly NSA V41690973, SA V41690914 and published unadjusted YoY
STATIC_TOTALCPICHANGE for September 2025–September 2026. Core measures are
excluded. YYYY-MM-01 source dates label monthly periods, not day-one prices.

The August 2026 SA level 169.4 has the publisher's r=1 revision flag. That flag
is retained in the data and displayed as R beside the reference month in the
accessible chart table. The entire snapshot uses the same retrieval vintage.
Index units are 2002=100, not dollars. Source values/percentages retain their
original one-decimal strings and display precision. The history figure
explicitly focuses its value axis on 160–172.

The September published changes are separately retained as 3.1% for the
twelve-month NSA comparison, 0.1% for the one-month NSA comparison and 0.4%
for the one-month SA comparison. The source bars use one-decimal percentage
values directly, without fabricating further source precision. Indices 170.0
and 169.8 imply a recomputed monthly ratio of about 0.1178%, while 170.0 and
adjusted 169.4 imply about 0.3542%. Those are derived from rounded displayed
levels, not recovered unrounded official estimates. They are not silently
substituted into the official headline-rate figure.

## Independent cash example

The hypothetical inputs are a reference-month basket cost B and a constant
future monthly price change m, with fixed quantities. Month zero is a
reference only. Each of the twelve future bills is B(1+m)^k for k=1..12,
with the first change before the first bill. Annualized endpoint price change
is (1+m)^12-1. No income, investment return, tax or CPI forecast is added.

At B=CAD 3,000 and m=0.4%, month one is CAD 3,012, month twelve CAD 3,147.21
and the twelve future bills sum to CAD 36,949.87. The waterfall adds CAD
949.87 to the CAD 36,000 unchanged-bill baseline. The endpoint price change
is about 4.91%; the total-spending increase is about 2.64% because the price
path affects the twelve bills gradually. Twelve final-price bills and adding
the month-zero reference as a thirteenth bill are different calculations.

Zero monthly change produces the unchanged baseline. Assumed deflation keeps
a signed negative price-path adjustment while all basket costs remain
nonnegative. Zero budget produces zero cash amounts without changing the
price-rate arithmetic or source figures. Editing either input cannot change
the official chart data or official metric.

## Verification

Eleven focused tests cover source provenance/precision/flags, exact reference
periods, labelled tables, focused axes, published-versus-derived rates,
independent recurrence and geometric-series sums, default checkpoints,
twelve-bill timing, signed deflation, source/input independence, all control
extrema, finite accessible rendering, invalid ranges and editorial scope.

Full JavaScript suite: 1523 passed. Python suite: 122 passed.
Browser checks at 1440, 390 and 320 pixels verify four figures/data tables,
no page overflow, exact revised/date labels, fixed source figures under cash
edits, zero and negative price changes, zero budget, invalid-range retention,
reset and disclosure. All four default mobile figures are visually inspected.
