# Food-insecurity prevalence and a separate essential-cost cash plan

Reviewed 2026-10-25. Chosen fallback topic: **a percentage of people experiencing household food insecurity is not a personal grocery-budget target or a reserve requirement**. The recommended English guide keeps fixed official survey observations separate from an invented household cash ledger. It does not classify a person's food security, assess benefits, estimate nutrition requirements or recommend investment products.

## Why this topic, rather than another RESP page

At the read-only scope review, HEAD and origin/main were both `44ecaf8`, with 217 guide slugs. The existing `/research/resp-withdrawal-education-budget` already explains contribution refunds versus EAP grants/bonds/earnings, ordinary CAD 8,000 during the first thirteen weeks, different part-time periods, promoter review and a budget model. That substantially occupies the proposed RESP withdrawal topic. Preserve it rather than create another guide with the same foundation.

No food-insecurity guide was found. The existing household-spending-quintile article compares consumption composition; this new topic measures reported financial constraints, with different units and definitions. The existing asset-resilience and income-buffer articles remain related but do not explain the food-security survey's household measure/person denominator.

## Primary sources, dates and coverage

1. [Statistics Canada Table 13-10-0835-01: Food insecurity by selected demographic characteristics](https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1310083501) is annual; its release date is 2026-04-29. The reviewed selection is **Canada / All persons / Percentage of persons**, with matching number-of-persons observations. Original [entire-table CSV ZIP](https://www150.statcan.gc.ca/n1/tbl/csv/13100835-eng.zip) and metadata were downloaded successfully. The table page's modification date is 2026-10-24; do not confuse that page date with the release or reference period.
2. [The Daily: Canadian Income Survey, 2024](https://www150.statcan.gc.ca/n1/daily-quotidien/260429/dq260429a-eng.htm), released 2026-04-29, explains that 2018–2023 estimates were revised using the 2021 Census; national estimates were also revised to include territories. Food responses for the displayed 2024 reference year were collected January–June 2025 and concern the preceding twelve months. Preserve that distinction rather than describe an exact January–December 2024 diary. This release also cautions about sampling variability. Its current HTML footer is modified 2026-07-10.
3. [Statistics Canada: Quality of life indicator—Food insecurity](https://www.statcan.gc.ca/hub-carrefour/quality-life-qualite-vie/prosperity-prosperite/food-security-securite-alimentaire-eng.htm) defines the indicator as proportions of individuals by household food-security status. Its measure concerns financial-resource constraints over the previous twelve months. Marginal insecurity includes worry or restricted choice; moderate includes compromised quality/quantity; severe includes disrupted eating and reduced intake. Do not reproduce the questionnaire or turn the site into a survey scoring tool. The page also warns that estimates from different survey sources can differ; do not mix CIS and CCHS series.
4. [Canadian Income Survey metadata](https://www23.statcan.gc.ca/imdb/p2SV.pl?Function=getSurvey&SDDS=5200) describes a nationwide probability survey covering provinces and territories, with exclusions including reserves/other Indigenous settlements in provinces, institutional populations and extremely remote low-density areas. Therefore “all persons” means the selected survey population, not a complete census of every resident. The captured metadata explicitly identifies detailed information for 2024 and the April 29, 2026 release; preserve the capture date because the URL may later display another survey cycle.

## Reviewed observations and exact dimensions

The CSV has four dimensions: geography, demographic characteristic, household food-security status and statistic. For the retained Canada selection, DGUID is `2021A000011124`. Percentages use `UOM=Percent`, scalar `units` and one decimal; counts use `Number`, scalar `units`, zero decimals. Counts are **persons**, not thousands or households. Annual survey observations are being used, not a monthly seasonally adjusted series.

| Reference year | Marginal % | Moderate % | Severe % | Total food-insecure % |
|---|---:|---:|---:|---:|
| 2018 | 5.2 | 8.0 | 3.6 | 16.8 |
| 2019 | 5.1 | 7.6 | 3.3 | 16.0 |
| 2020 | 4.6 | 7.6 | 3.6 | 15.8 |
| 2021 | 5.6 | 8.9 | 4.0 | 18.5 |
| 2022 | 6.0 | 11.0 | 6.1 | 23.1 |
| 2023 | 6.3 | 12.5 | 6.9 | 25.7 |
| 2024 | 5.6 | 11.9 | 6.5 | 24.0 |

These are the current reviewed table vintage, not the original observations published in older releases. In particular, do not splice an older 2023 estimate of 25.5% into this revised series. The source's total includes marginal, moderate and severe categories. The separate “moderate or severe” series is 18.4% in 2024 and must not be stacked alongside its two component categories. Published rounded components need not always add exactly; for example, 2018 moderate 8.0 + severe 3.6 differs from the separately reported combined 11.7. Preserve reported values rather than force reconciliation by changing one category.

2024 food-insecure persons are **9,755,600**, quality A; the percentage is 24.0%, quality A. The three severity percentages are quality B. Metadata defines A as excellent, B very good and C good; retain the quality statuses in the data record. Do not calculate a new confidence interval from them. The reported 2024 food-secure count is 30,818,700; its sum with the food-insecure count is only a rounded estimate of the covered-person denominator, not a household count or actual sample size. [Source table](https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1310083501)

Reusable percentage vectors/coordinates: total `v1529611793 / 1.1.6.2`; marginal `v1288342807 / 1.1.2.2`; moderate `v1288342811 / 1.1.4.2`; severe `v1288342813 / 1.1.5.2`; combined moderate/severe `v1288342809 / 1.1.3.2`; food secure `v1288342805 / 1.1.1.2`. Latest counts and their separate vectors are included in the reviewed extract.

## What the statistic cannot establish

A household-level experience is assigned to people in that household for this person-based indicator. Larger households therefore contribute more people to the numerator than smaller households; 24% of persons cannot be relabelled 24% of households. The percentage is neither a grocery-cost inflation rate nor the fraction of a personal budget that should be spent on food. It does not estimate a viewer's likelihood of a future shortage or show that a particular cash reserve guarantees security.

The annual observations are repeated survey estimates, not a panel showing the same household moving through all seven years. A chart can describe these reported rates without inventing a causal effect or independent significance test. The new household model should use no survey percentage as an input, multiplier, risk score or food-cost assumption.

## Original six-month cash model

Keep all following figures explicitly invented. Opening accessible cash 600; normal monthly take-home receipts 3,600; other essential cash commitments 2,600; intended food cash 800. Income is 600 lower in months 3–5, then returns to 3,600 in month 6. Hold the full stated food amount throughout; do not automatically reduce it or assume borrowing when funding runs short.

```text
monthly cash change = actual modeled income − other essential commitments − intended food cash
closing scheduled cash = opening cash + cumulative monthly cash changes
required opening cash = max(0, −minimum cumulative change including the initial zero)
additional funding gap = max(0, required opening cash − entered opening cash)
```

Balances after months 1–6 are 800, 1,000, 600, 200, −200, 0. Required opening cash is 800, leaving a 200 gap against 600 entered cash. The zero endpoint coexists with an earlier unfunded payment. A negative scheduled balance denotes missing funding; it does not authorize an overdraft, pay an actual expense or retrospectively finance the earlier date. This model assumes within-month receipts precede the combined monthly spending and does not test daily posting order.

The food amount is an intended scenario input, not a minimum adequate diet or recommended spending level. A funding gap does not determine a survey category, and a positive ledger does not establish the absence of food insecurity. No housing-payment, debt or benefit eligibility decision follows from the model.

Four charts can show fixed severity history; a fixed 2024 category/person-denominator comparison; the separate six-month cash path; and a sensitivity of additional cash needed to the selected income reduction and intended food amount. Keep the public survey year and the synthetic month labels visually distinct. Link existing income-buffer and spending-composition guides for broader context.

## Files and verification

Ignored `qa/food-insecurity/` holds the original CSV ZIP, both extracted CSV members, four primary HTML captures, retrieval timestamps and SHA-256 hashes. `reviewed-extract.json` contains 42 percentage rows and six latest count rows, exact dimensions, vectors, coordinates, quality flags and original cash-model fixtures. `validate.py` checks 84 unique Canada/all-person source rows across 2018–2024, exact reviewed values/units, rounded-category tolerances, count/rate consistency and 144 independent cash scenarios. Result: PASS, seven original-file hashes verified. The dataset is not copied into application code by this task. No application, registry, distribution, deployment, tests or commit was changed.


## Publication follow-up: quality and numerical change

Quality flags for the four displayed component/total series, plus the combined trend series, are:

| Year | Total | Marginal | Moderate | Severe | Moderate/severe |
|---|---|---|---|---|---|
| 2018 | B | C | B | B | B |
| 2019 | B | C | B | C | B |
| 2020 | B | B | B | C | B |
| 2021 | A | B | B | C | B |
| 2022 | A | B | B | B | A |
| 2023 | A | B | B | B | A |
| 2024 | A | B | B | B | B |

The table metadata defines A/B/C as excellent/very good/good, with coefficient-of-variation bands 0–2%/2–4%/4–8%; observation counts also inform quality. These letters are not confidence intervals.

Descriptive wording is supported: *In the revised series, the total published estimate is 25.7% in 2023 and 24.0% in 2024, a decrease of 1.7 percentage points. The moderate/severe estimate changes from 19.4% to 18.4%, down 1.0 percentage point.* This describes reported point estimates, without an independent significance or causal claim. Quality rows and exact decimal differences are now saved in the extract. The latest publication scope keeps the two official charts separate from three invented cash-plan figures, with no nutrition target, survey classification or personal probability.


## Implemented guide and verification

The published implementation uses five figures: fixed revised total and moderate/severe annual lines; fixed 2024 disjoint-category bars; an invented reduced-month cash waterfall; a signed six-month cash path beside the unchanged-spending/no-reduction control; and additional-funding sensitivity across opening cash and monthly receipts reductions. Survey percentages never enter the cash formulas. A static source-quality table preserves the published per-year flags. The reviewed public extract stores series vectors/coordinates, dimensions and source CSV hash.

The cash inputs have nonnegative numerical bounds that keep reduced receipts nonnegative. No food cut, borrowing, missed payment or support receipt is automatically inserted. The model retains negative scheduled balances and separates the lowest amount, extra opening funding and ending balance. The exact fixture ends at zero but reaches negative CAD 200 beforehand. Independent validation passed 84 public source rows, 144 fictional schedules and seven hashes. App tests cover cash conservation at 243 combinations, prefix-minimum funding, source-chart invariance, source vintage/flags, grid substitutions, invalid inputs and finite accessible figures at field boundaries.
