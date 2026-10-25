# Advice-source observations and a separate fee budget

The English guide `/research/financial-advice-survey-age-sources-project-retainer-cost` adds four charts with accessible data tables. Two reproduce selected official observations; two illustrate an independently authored fee calendar. The hypothetical quotes do not describe survey participants or typical market prices.

Public sources were reviewed on 25 October 2026. FCAC's spotlight uses the February–March 2024 Canadian Financial Capability Survey. Its HTML records an issue date of 17 November 2025 and a modification date of 21 November 2025. The generated data module retains those distinct dates, the collection period, retrieval date and the original HTML SHA-256. `scripts/extract-planning-advice-source.py` checks the exact six selected age/source entries against the public HTML; raw snapshots remain ignored in `qa/`.

Professional-advisor use is displayed separately for three age bands. The second panel selects three potentially overlapping channels within the 18–34 band. These are descriptive reported shares, without supplied uncertainty intervals or inferred combinations. They are not a complete partition, a quality ranking or evidence of the effect of obtaining advice. Unrelated paid/free advice and gender figures are not reproduced. The first two panels identify FCAC explicitly and remain fixed when fee controls change.

The project quote is paid at time zero. Reviews occur after complete selected year intervals, only when their payment time falls before the end of the service window. The retainer is paid at the start of each service year, including time zero. Future review and retainer quotes escalate annually. Present costs discount each actual payment time; the discount input is not an assumed investment return. No household cash account, service benefit, tax or fee-inclusive product calculation is made. The packages are not assumed to have equivalent scope.

Validation:

- The source extractor verified six selected entries, source statements, issue/modification dates and the HTML hash.
- Six focused tests check timing boundaries, independent geometric-series totals, present-value identities, zero fees/rates, fixed survey panels and all supported input boundaries.
- 766 full Node tests passed before a final hub source-scope sentence was added; the final build and focused mathematical/SEO checks passed afterward.
- The real-browser check covers desktop and 390px mobile layouts, all four charts/tables, fixed observations, edited quotes, fractional-period rejection, retained valid results, reset and expandable data.
- The mobile survey and annual-fee figures were visually inspected. The fee-chart note makes the discrete payment times explicit.
