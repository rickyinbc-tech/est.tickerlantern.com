# Period life tables and retirement cash horizons

One detailed English guide adds four figures and data tables. Its first three
figures use official public statistics; the fourth is an independent authored
cash illustration. No private account, client or research archive is used.

## Source and extraction

Statistics Canada Table 13-10-0114-01 was released on 13 January 2026 and
reviewed on 25 October 2026. The 2022/2024 period is preliminary under metadata
note 14 even though the selected CSV row STATUS cells are blank. The source
ZIP, metadata, official table HTML and methods HTML remain ignored and
owner-restricted under qa/life-table-next and qa/period-life-sources.
SHA-256, source URLs, dates and period designation accompany the curated data.

Reproduce with scripts/extract-planning-life-table.py --archive <official ZIP>.
A second extraction matched the bundled data byte-for-byte. The extractor
selects 294 observations: Canada, Both sexes/Males/Females; survivor lx values
at exact ages 55–100; expectations ex and their 95% margins at ages 55–80.
It checks dimensions, units/scale, original precision, blank row flags,
missingness, duplicates, positive monotone survivors and exact age-65 values.
Element definitions establish years for ex although the CSV's broad UOM is
Number. The open 110+ interval is not treated as a single exact age.

Published expectation bounds are ex minus/plus the corresponding 95% margin,
rounded to the source's two decimal places. Those intervals describe mean
estimation uncertainty, not individual lifespan dispersion. Conditional
survival is ly/lx from the same source category and period. No confidence
interval is fabricated for that ratio or recycled from ex. Survivor counts
refer to a hypothetical 100,000-birth radix, not an observed population count.
Source sex categories are retained; no couple probability is calculated.

## Separate cash illustration

The cash figure multiplies an independent constant-real annual spending gap by
whole years to ages 85, 90, 95 and 100. It assumes zero real return and no tax,
within-year timing, mortality weighting or recommended ending age. Changing
this gap cannot alter any source statistic. Plotting survival only to 100 does
not set remaining survival beyond 100 to zero or renormalize it away.

## Verification

Eleven focused tests pass: dated/preliminary provenance, source checkpoints,
monotone radix counts, exact corresponding margins, matching conditional
denominators, multiplicative probability identity, threshold/curve agreement,
cash/statistics independence, supported boundaries, finite accessible figures,
invalid whole ages and editorial scope. Default both-sexes ex at 65 is 20.85,
with a 20.83–20.87 mean interval; conditional survival to 95 is 13600/88760.
Default constant cash to 95 is CAD 1,200,000 from age 65 at CAD 40,000/year.

Full JavaScript suite: 1114 passed. Python suite: 122 passed.
Browser checks at 1440, 390 and 320 pixels verify four figures/tables, exact
confidence bounds, independent cash edits, age conditioning, invalid fractional
age retention, reset and data disclosure. All four mobile figures are visually
inspected before publication.
