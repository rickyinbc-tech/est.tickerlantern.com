# Arrears rates: borrowers, product loans and different thresholds

Reviewed October 25, 2026. Public-primary HTML/CSV research only. Recommended distinct English guide: **“Count borrowers or count loans? Read an arrears rate’s denominator and threshold.”**

## Scope selected after the gap check

Current/origin inventories at HEAD `af3b381` and origin `0298d79` had no mortgage-arrears or loan/borrower-delinquency guide. Existing renewal, payment-pause, credit-utilization and household-debt articles answer different questions. Preserve their routes rather than repeating their calculators.

The initial CBA mortgage-count proposal was narrowed because its accessible HTML did not establish the full reporting-lender/geography footnotes; the detailed data were linked as Excel/PDF. Those files were not accessed. This article instead uses the **Bank of Canada’s TransUnion-based household credit-performance indicators**. Keep CBA out of the charts and do not treat the Bank’s mortgage series as a refreshed CBA numerator or denominator. No due-date ledger is needed: a small assigned-status grouping gives this article a distinct counting lesson.

## Primary sources, provider and measurement limits

The [current Financial stability indicators page](https://www.bankofcanada.ca/rates/indicators/financial-stability-indicators/) was updated **September 25, 2026**. It distinguishes an indebted-borrower measure with at least one account **60 or more days late** from product measures describing the share of loans in that product class **90 or more days late**. These are separate thresholds and denominators. Do not relabel the first as mortgage-account arrears or change 60 into 90.

The [associated notes, Household credit performance](https://www.bankofcanada.ca/rates/indicators/financial-stability-indicators/notes-on-the-financial-stability-indicators/) identify **TransUnion and Bank of Canada calculations**, with the Bank applying **X-13 seasonal adjustment** to arrears rates. They say the data provided to the Bank were anonymized. This research uses only published aggregates, with no individual credit files. The page states that data can be revised and publication timing depends on availability. Retain the September 2026 update vintage when citing the current extract.

The accessible notes do **not** supply an exact contributing-lender list, coverage fraction, age/residency/geographic exclusions, original account or borrower counts, joint-account deduplication, or household-construction method. Do not claim all Canadians, all lenders, only banks, a CBA-equivalent sample, or a specific share of the mortgage market. Describe these as the Bank’s published Canadian indicators based on TransUnion data. Within-quarter observation timing or averaging is also not specified here: label the series by quarter, rather than asserting a quarter-end count or a precise day’s status.

There is a source-label inconsistency worth preserving. The [Valet metadata](https://www.bankofcanada.ca/valet/observations/group/FVI_HOUSEHOLD_CREDIT_PERFORMANCE/json) calls `FVI_FIN_STRESS` **Rates of financial stress**, and its description says **households**. The current public page’s explicit arrears definition and the original inline chart title say **indebted borrowers**. Use the explicit borrower definition with that qualification; do not silently invent a household aggregation from account records. The toy model below likewise labels its units borrowers, not families.

## Machine-readable evidence and reviewed values

The [official CSV](https://www.bankofcanada.ca/valet/observations/group/FVI_HOUSEHOLD_CREDIT_PERFORMANCE/csv) and [official JSON](https://www.bankofcanada.ca/valet/observations/group/FVI_HOUSEHOLD_CREDIT_PERFORMANCE/json) share group `FVI_HOUSEHOLD_CREDIT_PERFORMANCE`. Both contain seven series and **46 consecutive quarters, 2015 Q1–2026 Q2**. CSV uses quarter strings such as `2026Q2`; JSON uses the corresponding quarter-start key `2026-04-01` with `dateFormat: quarterly`. This key does not establish a real April 1 observation. Original chart settings also specify quarters.

All reviewed values are percentages, not dollar balances or loan counts. Latest **2026 Q2** observations are:

| Published series label | Exact Valet identifier | Value (%) | Denominator and threshold |
| --- | --- | ---: | --- |
| Rates of financial stress | `FVI_FIN_STRESS` | 2.23 | Indebted borrowers; at least one account 60+ days late; metadata wording caveat above |
| Mortgages | `FVI_LOANS_ARR_MTG` | 0.23 | Loans in that product class, 90+ days late |
| Automobile loans | `FVI_LOANS_ARR_AUTO` | 0.87 | Same product-specific loan denominator, 90+ |
| Credit cards | `FVI_LOANS_ARR_CC` | 0.80 | Same product-specific loan denominator, 90+ |
| Home equity lines of credit | `FVI_LOANS_ARR_HELOC` | 0.11 | Same product-specific loan denominator, 90+ |
| Unsecured lines of credit | `FVI_LOANS_ARR_LOC` | 0.40 | Same product-specific loan denominator, 90+ |
| Instalment loans | `FVI_LOANS_ARR_INSTALL` | 2.95 | Same product-specific loan denominator, 90+ |

Source: [current official CSV](https://www.bankofcanada.ca/valet/observations/group/FVI_HOUSEHOLD_CREDIT_PERFORMANCE/csv), interpreted with the [public definitions](https://www.bankofcanada.ca/rates/indicators/financial-stability-indicators/). Retain separate figures: a borrower-60+ trend, then six latest product-90+ bars. The product rates have different class denominators and are not parts of one whole. Do not stack or sum them, convert their differences into a personal-risk ranking, or recover unreported counts by assuming a population size. The retrieved endpoints provide no confidence intervals or quality grades.

The reviewed twelve-quarter borrower series, 2023 Q3 through 2026 Q2, is **1.83, 1.88, 1.93, 2.00, 2.05, 2.08, 2.13, 2.10, 2.11, 2.16, 2.16, 2.23**. `reviewed-extract.json` retains all **84** cells for seven measures over these twelve quarters, with exact source IDs, date keys and adjustment labels. These quarterly rates describe accounts or borrowers meeting a condition, rather than the number newly missing a payment during each quarter. An observed rate change is not an inflow count: exits, recoveries and denominator changes can also matter. The published values alone do not identify those flows.

## Original assigned-status fixture

Use four **fictional** borrower IDs A–D, each assigned exactly two toy accounts. Each account belongs to one borrower only; there are no shared accounts, changing balances or institutions. These simplifying assumptions must not be described as TransUnion’s reporting or deduplication rules. The account labels do not reproduce the source’s individual product classes.

Four numeric controls assign A1, A2, B1 and B2 one of three **teaching codes**: `0 = below60`, `1 = 60–89`, `2 = 90+`. C1/C2/D1/D2 stay at code 0. The labels are inputs. The app must not calculate them from dates, missed instalments, partial payments, agreements or actual credit reports. Code 0 does not prove an account has never been late; it only means below the chosen 60-day teaching threshold.

Defaults `[2,0,1,2]` produce this fixed grouping:

| Fictional borrower | Account 1 code | Account 2 code | At least one assigned 60+ flag? |
| --- | ---: | ---: | --- |
| A | 2 | 0 | Yes |
| B | 1 | 2 | Yes |
| C | 0 | 0 | No |
| D | 0 | 0 | No |

The borrower numerator counts A and B **once each**: `2/4 = 50%`. Assigned 90+ accounts are A1 and B2: `2/8 = 25%`. Assigned 60+ accounts additionally include B1: `3/8 = 37.5%`. This third metric helps distinguish the threshold effect from the denominator effect. None is an estimate of Canadian arrears, a borrower diagnosis, a forecast, or an actual credit-report classification.

Changing only **B1 from code 1 to code 2** keeps the borrower-60+ share **50%**, keeps account-60+ **37.5%**, and raises account-90+ to **37.5%**. Another qualifying account attached to an already flagged borrower need not create another distinct flagged borrower. This is elementary set counting under the stated grouping; it does not reconstruct a real dataset.

Appropriate original figures are a four-by-two categorical account heatmap, a four-borrower donut for at-least-one-code-1-or-2, and an eight-account donut for code 2. Each must display its own numerator, denominator and assigned threshold. Codes are categories rather than exact day counts or dollar amounts; use explicit labels alongside color. Keep official figures fixed when toy controls change. No input changes actual repayment obligations or predicts a legal, credit-score or lending outcome.

## Capture and validation

Ignored `qa/arrears-denominators/` contains original dashboard/notes HTML, CSV and JSON, headers and SHA-256 manifest. All four source requests returned HTTP 200 through ordinary anonymous TLS-verified retrieval. Derived chart settings are separately labeled. No PDF, workbook, private archive or private credit report was accessed.

`python3 qa/arrears-denominators/validate.py` verifies four original hashes, date uniqueness/continuity, all **322 CSV/JSON numerical cells**, seven exact series labels, quarter-format conversion and source wording/seasonal-adjustment evidence. It independently checks all **81** combinations of the four codes, the default fractions and the B1 threshold-change example. CSV SHA-256 is `5ba4fe1d341b1f0cf257aae2498b54409d64c7e3afd771111d53a2726d3706b1`. No application, registry, build, test, commit or deployment changes are part of this task.
