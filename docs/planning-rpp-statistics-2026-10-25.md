# Registered pension plan statistics: counts and reporting dates

One English article adds four interactive figures from Statistics Canada Table
11-10-0099-01. It uses public statistics only, with no private account records.

## Source and reproducibility

The full-table public CSV ZIP was downloaded on 25 October 2026. The official
release is dated 28 July 2026. Source URL, reviewed date and ZIP SHA-256 remain
in src/planning-rpp-statistics-data.js. Raw bytes stay ignored under qa/.

Run scripts/extract-planning-rpp-statistics.py --archive <downloaded ZIP> to
reproduce the curated data. A fresh extraction compared byte-for-byte with the
bundled data. Forty selected observations cover five reference years, 2021–2025:
five plan totals, five active-member totals and thirty funding-category counts.
The extractor checks dimensions, number/units scaling, missingness, flags,
duplicates, hierarchy and six-category reconciliation for every year.

Plans and terms are measured on 1 January; membership relates to each plan's
year-end in the preceding calendar year, normally 31 December. The article
retains these distinct clocks. Insurance-contract children are excluded from
the six direct categories to avoid double counting. Funding instrument does
not stand for benefit design or asset allocation. No worker-coverage rate or
personal entitlement is inferred.

## Visuals and verification

The index divides each series by its own 2021 baseline and declares its focused
95–115 axis. Separate raw count charts preserve the absolute magnitudes. The
funding bar chart uses three labelled ticks so large integer counts fit on
narrow screens; other charts retain their existing default tick count.

Eight focused JavaScript tests passed, covering source counts, sums, index
arithmetic, filter invariants, immutable observations, units and invalid years.
Browser checks passed at 1440, 390 and 320 pixels: four figures and data tables,
no overflow, actual period filtering, invalid-year retention, reset and table
disclosure. Mobile screenshots were visually inspected.

Full JavaScript suite: 741 passed. Python suite: 122 passed.
