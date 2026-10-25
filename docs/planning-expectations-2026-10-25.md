# Consumer expectations and independent household price scenarios

The English guide `/research/canada-inflation-expectations-survey-horizons-household-price-scenarios` adds five charts and tables. The first three use or derive from Bank of Canada's CSCE 2026 Q3 chart 1; the final two are separately authored hypothetical annual-cost scenarios.

## Bounded data-quality assessment

The original public release and its linked Valet group were retrieved 25 October 2026. The release date is 19 October, online collection 5–27 August and follow-up interviews 24 August–4 September. Quarter-start date keys identify reference quarters, not collection or publication dates. The extraction retains both source URLs, SHA-256 hashes, series identifiers, question labels, percent units and the interpolated-median statistic.

The selected grain is one quarter × series: eight consecutive quarters from 2024 Q4 through 2026 Q3, four exact series, 32 finite complete values, unique ordered quarter keys. No joins, missing-value imputation or respondent-level data are involved. All values belong to the selected report's linked data vintage; no claim is made that each historical value matches its originally released vintage. The extractor fails on schema, labels, units, dates, grain or completeness drift. `--check` reproduces the derived public extract from the ignored original snapshots.

This scoped check supports descriptive comparisons only. Opinions are not measured CPI, an official forecast, a population probability, a respondent transition or a causal estimate. No uncertainty intervals or significance findings are invented. Changes use percentage points. Source percent numbers convert to chart fractions once.

The independent scenario uses current annual cost CAD 12,000, assumed annual price growth 3% and ten years. Its endpoint is CAD 16,126.996552129467 for one year's cost, not cumulative spending, present value or required savings. Scenario inputs cannot change official-data panels. Matrix alternatives carry no assigned probabilities.

Validation:

- The source extractor and exact `--check` passed for 32 observations and both source hashes.
- All 1,167 Node tests passed; six focused source/model tests and four SEO checks passed.
- `tests/browser_expectations.py` passed at 1440px desktop and 390px mobile: five figures/tables, English language, SVG descriptions and text bounds, no overflow, fixed official panels, cost editing, fractional-year rejection with last-valid results retained, reset and full quarter labels in the accessible table.
- Mobile snapshot and endpoint-matrix screenshots were visually inspected. Short matrix headings fit without overlap. Long bar labels retain their full text in the data table.
