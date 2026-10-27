# TFSA dollar-limit indexation and buying a fund before its distribution

Two English articles dated 26 October 2026, each with four figures, chart data tables and editable inputs, plus Simplified Chinese editions:

- `tfsa-dollar-limit-inflation-indexation-500-rounding-real-room` (`tfsaLimitIndex`): the TFSA dollar limit rebuilt from ITA s. 207.01 and s. 117.1 ($5,000 indexed since 2009, nearest $500, ties up). Stepped limit vs unrounded indexed amount, rounding gap by year, each year's room in September 2026 prices, and years until the limit reaches $7,500–$10,000 by assumed inflation. Inputs: age at end of 2026 (sets first eligible year), inflation after 2027, years projected. Inflation and tax-free-account theme; distinguishes room from investment, pay contributions from in-kind transfers of an existing holding.
- `buying-fund-before-year-end-distribution-non-registered-tax-cost` (`preDistribution`): same purchase just before vs just after a distribution in a non-registered account. Day-after value/ACB/tax, net cost by year of sale (sale-year and today's dollars), waterfall of the cost, heatmap per CAD 10,000 by distribution size and holding period. Distinct from the distribution tax-cash provision, NAV/total-return, income-type and return-of-capital guides, which it cross-links.

## Sources (26 Oct 2026)

- CRA TFSA/RRSP limits page (in-app browser): TFSA limits 2009–2026; no 2027 TFSA limit listed (RRSP 2027 $35,390 listed). Total 2009–2026 = $109,000.
- CRA indexation page (in-app browser): 2.0% (2026), 2.7%, 4.7%, 6.3% (2023); footnote on $5,000 indexed, nearest $500.
- Justice Laws ITA s. 207.01 and s. 117.1 (curl, retrieved 26 Oct 2026; local copies in scratch only, not committed).
- Statistics Canada CPI all-items v41690973 via Bank of Canada Valet JSON, Jan 2006–Sep 2026 (Sep 2026 = 170.0). SHA-256 of the retrieved JSON: 223c03d00f89f42bc8ff5dba3d134962f01c9c92f109cd1aa19bca6b218d43a5 (file not committed).
- CRA Tax treatment of mutual funds and Calculating and reporting capital gains (in-app browser). 2026 federal/Ontario rates reused from the 25–26 Oct reviews.

## Calculations

TFSA: s. 117.1 factors recomputed from CPI (12-month averages to September, rounded to 0.001): 2010 .006, 2011 .014, 2012 .028, 2013 .020, 2014 .009, 2015 .017, 2016 .013, 2017 .014, 2018 .015, 2019 .022, 2020 .019, 2021 .010, 2022 .024, 2023 .063, 2024 .047, 2025 .027, 2026 .020 — 2023–2026 match CRA; rounded amounts reproduce every CRA limit 2016–2026. Unrounded 2026 = 7,184.92. 2027: averages 167.525 / 163.275 → 2.6% → 7,371.72 → $7,500 (calculation, not a CRA announcement; would need factor ≤ 0.9% to stay $7,000). At 2% thereafter: $8,000 in 2030, $8,500 2033, $9,500 2039, $10,000 2042; 2027–2040 new room $118,000. 2009–2026 room in Sept-2026 prices (limit × 170.0 / January CPI) = 138,616.92; from 2015 = 78,000 → 94,148.43.

Pre-distribution (defaults $20,000, 8%, 75% gains, 29.65%, 10 years, 5% growth, 2.5% cash): distribution 1,600; tax now 296.50 (177.90 + 118.60); sale saving 237.20; growth forgone 83.05; net cost year 10 = 142.35, today 111.20 (0.56% of amount); year 0 = 59.30. Reproduced with 40-digit Python Decimal and asserted in `tests/planning-limit-distribution.test.mjs` (also: same-units identity, all-gains/0% cash → zero cost, 800 random valid inputs render).

## Checks

- `npm test`: 1,750 tests, 0 failures. `npm run zh:refresh`: missing 0 units; numeric guard kept English for 0 of 42,926. 237 Chinese units written directly (no external service), merged after numguard and identical-markup checks (`qa/planning-limit-distribution-2026-10-26/merge_zh.py`, ignored).
- Built HTML: EN and ZH pages each 4 figures and 4 data tables (3 and 7 inputs); homepage, research index, Chinese home, search index and sitemap entries present; `dist/research/planning-limit-distribution-models.js` emitted.
