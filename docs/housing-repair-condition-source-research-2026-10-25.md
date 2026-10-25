# Reported dwelling condition and a separate repair-cash plan

Reviewed October 25, 2026. Public-primary research only; no private records, PDFs, application changes or publication. Recommended distinct English guide: **“Housing repair statistics and the cash needed for a known quote.”**

## Scope and duplication check

The initially proposed shelter-cost-to-income topic is occupied by `/research/housing-affordability-statistics-household-budget`. That guide already explains the before-tax denominator, the 30% threshold, tenure differences and a separate after-tax cash budget. Repeating that statistic would add little. This alternative uses **reported dwelling condition**, not affordability, mortgage qualification or core-housing-need classification. Read-only checks of current guide sources and `origin/main` found no existing condition-prevalence guide. Initial inventory was HEAD/origin `7fe0806` with 227 slugs; the final check at HEAD `2ee2b4c`/origin `1925ee1` still found no matching repair-statistics scope. Preserve links to the housing-affordability guide and, where useful, the existing condo assessment and insurance guides; those do not establish this fictional household’s responsibility for repairs.

## Current official evidence and definitions

[Statistics Canada Table 46-10-0081-01](https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=4610008101), **Housing suitability and dwelling condition, by tenure including social and affordable housing**, was released September 21, 2026. Its current occasional observations are 2018, 2021, 2022 and 2024. The [entire official CSV ZIP](https://www150.statcan.gc.ca/n1/tbl/csv/46100081-eng.zip) is the numerical evidence. All reviewed rows select **Canada (provinces only)**, DGUID `2021A000011124`, household percentages, percent units, scalar `units`, one published decimal. Do not substitute the table’s separate person statistics.

Table metadata note 4 defines repair condition through respondent assessment. Major examples include defective plumbing/wiring and structural repairs; desirable remodeling/additions are excluded. Assessment can vary with time, season and collection context. Note 1 warns that estimates are rounded; note 7 defines tenure through owning/renting the private dwelling; note 9 uses 2021 Census geography. These definitions and exclusions are attached to the [official table and downloadable metadata](https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=4610008101), not inferred from chart labels.

The [2024 questionnaire, DCT_Q25](https://www23.statcan.gc.ca/imdb/p3Instr.pl?Function=assembleInstr&Item_Id=1545763&lang=en) asks whether the dwelling needs only regular maintenance, minor repairs or major repairs. Its examples distinguish maintenance such as painting/cleaning from repair work. DCT_Q27 separately offers reasons for outstanding repairs, including landlord refusal or lack of permission. This supports a narrow editorial distinction: reported need does not itself identify the person who must pay. It does **not** establish legal responsibility under any lease, condominium arrangement, insurance contract or provincial law. The article should require that responsibility and an actual quote be established independently before applying a personal cash model.

The [current CHS 2024 methodology](https://www23.statcan.gc.ca/imdb/p2SV.pl?Function=getSurvey&SDDS=5269), modified September 18, 2026, identifies ten-province coverage and collection from October 28, 2024 to March 31, 2025. Target exclusions include institutions, military camps, reserves/settlements and listed collective dwellings. It requests the household housing decision-maker’s response; dwellings are independently sampled each cycle. Overall response was 32%; estimates face sampling and non-sampling errors. Wider confidence intervals indicate less precision. Its revisions/seasonal-adjustment section says the methodology does not apply. That is not a promise that published tables can never change. The [September 21, 2026 release](https://www150.statcan.gc.ca/n1/daily-quotidien/260921/dq260921a-eng.htm) confirms the latest reference year and collection window. Label the data **2024**, not “2026 households,” and do not interpolate unobserved annual values.

## Reviewed source rows

The four-cycle chart uses actual year spacing. These are point estimates with the table’s published 95% intervals, not annual probabilities of a future repair:

| Reference year | Total households needing major repairs (%) | Published 95% interval (%) |
| --- | ---: | ---: |
| 2018 | 7.0 | 6.7–7.4 |
| 2021 | 7.4 | 6.9–7.9 |
| 2022 | 7.3 | 6.8–7.9 |
| 2024 | 7.1 | 6.6–7.7 |

The distinct second figure can use horizontal interval bars for 2024:

| Household tenure | Major repairs (%) | Published 95% interval (%) | Point/low/high coordinates |
| --- | ---: | ---: | --- |
| Total | 7.1 | 6.6–7.7 | `1.1.7.4` / `.5` / `.6` |
| Owner | 6.5 | 5.8–7.3 | `1.2.7.4` / `.5` / `.6` |
| Renter | 8.4 | 7.6–9.2 | `1.3.7.4` / `.5` / `.6` |

All figures above come from the [current table](https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=4610008101). Their point vectors are respectively `v1594709369`, `v1594709411`, `v1594709453`; corresponding low/high vectors are `v1594709376`/`v1594709383`, `v1594709418`/`v1594709425`, `v1594709460`/`v1594709467`. Full coordinates include the year separately. Reviewed statuses/symbols are blank; assign no A/B/C quality grade. Do not infer a cause, statistical significance or a particular household’s exposure from the group differences or interval overlap.

The same table’s 2024 total-tenure condition percentages are regular maintenance **71.0%**, minor repairs **22.0%**, major repairs **7.1%**. Preserve the **100.1%** rounded sum; do not silently normalize it into an exact partition. These are not amounts to put in a repair fund. Do not mix them with the release’s separate “often” housing-issue measures, overcrowding or a core-housing-need category.

## Original fictional model and exact fixture

The following assumptions are invented teaching choices, independent of the survey. They estimate neither prevalence nor a future building defect. Assume a known complete repair cash quote **CAD 12,000**, inclusive of assumed applicable taxes; opening **assigned repair cash CAD 3,000**; planned saving **CAD 1,500 per month**; and one complete payment at the **end of month 6**, after that month’s saving. No staged deposits, interest, inflation, financing, insurance proceeds or grants. Saving continues through the due month even when an earlier balance meets the target. Do not count the same opening money as a separately protected emergency reserve.

Compare the quote with an independently selected **20% cost stress**, which makes the assumed bill **CAD 14,400**. This scenario assumes that amount is actually paid. It is not an automatically spent contingency account or a forecast of inflation. A real quote’s validity, scope, inclusions, payment schedule and responsibility must be checked separately; changing a slider supplies no authority to delay necessary work.

With quote `Q`, stress `s` in percent, assigned opening cash `R`, monthly saving `M`, positive whole-month deadline `N`, bill `B = Q × (1 + s/100)`. Before payment, scheduled assigned cash at month `m` is `R + mM`. At `N`, show `R + NM − B`. A negative result is a **scheduled funding shortfall**, not a permitted negative bank balance or borrowing facility. Required monthly saving is `max(0, (B−R)/N)`, rounded **up** to the next cent. A fully funded opening reserve produces zero required saving; a same-day deadline is outside the positive-month calculator and would need immediate cash instead.

The original paths for months 0–6 are:

| Scenario | Scheduled assigned cash, CAD |
| --- | --- |
| Quote paid | 3,000; 4,500; 6,000; 7,500; 9,000; 10,500; **0** |
| Stressed bill paid | 3,000; 4,500; 6,000; 7,500; 9,000; 10,500; **−2,400** |

Required saving for the stressed bill is exactly **CAD 1,900 per month**. A matrix can compare original stresses `0/10/20/30%` against deadlines `3/6/12/24` months, holding the quote and opening cash fixed. Its rows of required monthly amounts are `3,000/1,500/750/375`, `3,400/1,700/850/425`, `3,800/1,900/950/475`, and `4,200/2,100/1,050/525`, in CAD. These are funding arithmetic, not recommended saving rates. Keep source figures visually separate from the quote/stress comparison, cash path and required-saving matrix. No probability-times-property-value calculation, repair-priority diagnosis or legal/insurance determination belongs in this guide.

## Reproduction and capture record

Ignored `qa/housing-repair-condition/` contains the original ZIP, data/metadata CSVs, five successful anonymous public HTML captures, headers and SHA-256 manifest. Questionnaire retrieval through the web tool timed out; direct ordinary HTTPS retrieval succeeded without bypassing controls. The table HTML is a dynamic shell; exact rows and footnotes were reviewed in its official CSVs. An additional older [2022 explainer](https://www.statcan.gc.ca/o1/en/plus/7347-which-households-need-repairs-and-how-much-more-do-they-cost), dated November 14, 2024, was captured for context; it is not substituted for the latest table vintage.

`python3 qa/housing-repair-condition/validate.py` independently verifies all eight original-file hashes, 162,882 unique period/dimension rows, 38 reviewed rows, interval ordering, the published rounding discrepancy, the fixture and 576 exact synthetic edge cases. It writes `reviewed-extract.json` with full vectors/coordinates and the 16-cell matrix. ZIP SHA-256: `59fb76c5d676a695bd9215b081008f03d21204c65435ada45e683a820a16665e`; data CSV: `31ad748663e77060d2db7a390861fb8524eb85b91f3f4641a6854e29c5a0a54b`; metadata CSV: `2f66d99ae45f6c712b6c244492fb50d2d09379bc71cff38f9c4dd976d75e6b47`. Re-retrieve and revalidate before later refreshes; do not splice figures from older table versions.


## Implemented guide

The English implementation has five interactive figures: actual-year-spaced major-repair point estimates; 2024 total/owner/renter interval bars using published 95% bounds; an independent quote-plus-cost-stress waterfall; paired dedicated-reserve paths through one complete payment; and the required-saving matrix. A static historical table retains published confidence bounds. All fixed survey plots stay invariant under cash-input changes. Monetary inputs and bill calculations are rounded to cents, and equal monthly saving is rounded upward to cents. No survey prevalence enters a cost or cash formula. Opening cash is assigned to this bill, not also counted as a separate emergency reserve.

Nine application checks cover the fixture, 324 cash conservation combinations, final-month payment ordering, cent rounding, zero/excess reserve, source invariance and exact interval metadata, fixed-grid substitutions, whole-month rejection and finite accessible figures. Independent public-source validation passes 576 exact scenarios, 38 reviewed rows and eight source hashes. Desktop and 390-pixel mobile interactions pass valid changes, invalid-output retention, restore and native exact-value tables; all five mobile chart screenshots were visually inspected.
