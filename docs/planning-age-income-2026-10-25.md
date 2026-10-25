# Employment-income age groups: cross-section, recipients and populations

One detailed English guide adds four interactive figures with data tables.
It uses public statistics, with no private account, client or archive evidence.

## Source and reproducibility

Statistics Canada Table 11-10-0239-01 was released on 29 April 2026 and reviewed
on 25 October 2026. Original full-table CSV and metadata bytes remain ignored
under qa/income-age-next. SHA-256 is recorded in the deployed curated data.

Reproduce with scripts/extract-planning-age-income.py --archive <official ZIP>.
A second extraction compared byte-for-byte with the bundled data. The script
selects 72 observations: Canada, Total - Gender, Employment income, six disjoint
age bands, four measures and reference years 2022–2024. It checks dimensions,
units/scale, missingness, duplicates, finite nonnegative integers, source quality
flags and published 2024 checkpoints. It excludes overlapping age aggregates.

Income means and medians explicitly exclude zeros and retain 2024 constant-CAD
units. Number of persons and number with income are estimated population counts,
not survey sample sizes. A–D source quality letters remain attached to their
actual statistic. The 2023 older-group median's C is retained when filtering.
Derived count complements and ratios receive no invented quality grade or CI.

Three public official HTML copies, hashes and retrieval timestamps remain
owner-restricted under ignored qa/age-income-sources. The employment-income
classification confirms the broader paid-employment/net-self-employment measure.
The CIS release supplies sampling-variability and revision context. Source HTML
was decoded before content verification, including numeric character entities.

## Analytical boundaries

These are different people in disjoint age groups, never an individual career
or future-pay path. No age effect, statistical significance, labour-force
employment rate, full-time salary, after-tax cash, pension-income total or
retirement adequacy is inferred. The year selector filters observed years only.
The count-derived headline ratio is population weighted, not an unweighted
average of group percentages.

Four figures show conditional mean/median, count composition, matching-denominator
ratios and a two-measure scatter. Optional scatter context and table-label fields
replace allocation-specific wording for this observed-data figure, retaining the
existing default on scenario scatter plots. Optional thin label guides make
point identity readable at narrow widths. No line joins one age group's estimate
to the next.

## Verification

Eight focused JavaScript tests pass: exact source checkpoints, disjoint groups,
count conservation, independent ratios and weighting, moving quality codes,
matching scatter coordinates, source units, immutable observations, supported
whole years, accessible finite figures, article scope and related links.

Full JavaScript suite: 949 passed. Python suite: 122 passed.
Browser checks cover 1440, 390 and 320 pixels: four figures/tables, six observed
scatter points, year/quality changes, invalid fractional year, reset and data
disclosure. All four mobile figures are visually inspected before publication.
