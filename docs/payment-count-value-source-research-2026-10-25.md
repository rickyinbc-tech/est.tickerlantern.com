# Payment-method transaction shares versus dollars spent

Reviewed October 25, 2026. Public-primary HTML/CSV research only. Recommended distinct English guide: **“Many small purchases, a few large purchases: payment counts and dollar shares.”**

## Inventory and scope

Current and `origin/main` guide inventories contain card billing, utilization, rewards, foreign-currency charges, account access and investment-settlement topics, but no Methods-of-Payment Survey or purchase-count/value-share guide. Preserve those existing routes; this guide should not calculate repayment timing, credit availability, rewards, merchant acceptance or system reliability. Its planning lesson is narrow: identify the denominator before interpreting a payment statistic, then reconcile an independently invented purchase tally.

The latest [Bank of Canada Methods-of-Payment Survey dashboard](https://www.bankofcanada.ca/banknotes/bank-notes-research-reports/methods-of-payment-survey/) includes **2025**. Its [2025 report landing page](https://www.bankofcanada.ca/2026/08/staff-analytical-paper-2026-36/) identifies Staff Analytical Paper **2026-36**, published **August 2026**, by Marie-Hélène Felt, Saika Pacouloute and Angelika Welte. Use reference year 2025 and that publication month; an exact release day was not verified. Neither page requires authentication.

The dashboard describes a representative consumer-payment snapshot, focused on cash, with a questionnaire and a **three-day diary** recording payments and cash withdrawals. The two linked charts measure payment **volume shares** and **value shares**. This is sufficient public HTML/CSV evidence for a denominator lesson. The landing page offers the full report only as a PDF; it was not accessed. Consequently this research does not verify the 2025 sample size, precise collection dates, detailed population exclusions, weighting formula, or complete transaction-inclusion rules. Do not import those details from an earlier survey report or assert that the charts represent every payment in the Canadian economy. The [dashboard’s general description](https://www.bankofcanada.ca/banknotes/bank-notes-research-reports/methods-of-payment-survey/) concerns consumers buying goods/services; its cash headline mentions point-of-sale use.

## Exact machine-readable sources

The dashboard directly links these official datasets, retrieved successfully as original CSV and JSON:

- [Volume-share CSV](https://www.bankofcanada.ca/valet/observations/group/METHODS_OF_PAYMENT_SURVEY_VOLUME_SHARES/csv) and [volume JSON metadata](https://www.bankofcanada.ca/valet/observations/group/METHODS_OF_PAYMENT_SURVEY_VOLUME_SHARES/json).
- [Value-share CSV](https://www.bankofcanada.ca/valet/observations/group/METHODS_OF_PAYMENT_SURVEY_VALUE_SHARES/csv) and [value JSON metadata](https://www.bankofcanada.ca/valet/observations/group/METHODS_OF_PAYMENT_SURVEY_VALUE_SHARES/json).

Group IDs are `METHODS_OF_PAYMENT_SURVEY_VOLUME_SHARES` and `METHODS_OF_PAYMENT_SURVEY_VALUE_SHARES`. Each contains nine series and observations keyed to 2009, 2013, 2017 and 2020–2025. The API’s `dateFormat: daily` and January 1 keys are transport formatting: the original dashboard chart settings specify `period: year`. Do not call a key such as `2025-01-01` a January 1 diary observation or interpolate daily values. Historical blank cells remain missing; newly introduced mobile-card categories must not become invented historical zeros.

The original HTML chart settings specify percentage axes. Series names alone can mislead: **Credit** and **Debit** appear alongside separate contactless categories. Do not read the standalone Credit series as all credit-card use. Preserve the original nine labels, or identify every component explicitly if creating a one-year derived aggregate.

## Reviewed 2025 observations

The table below reproduces the current datasets’ numerical precision. For each suffix, the full series identifiers are `MOP_PAYMENT_VOLUME_<suffix>` and `MOP_PAYMENT_VALUE_<suffix>`. The date key is `2025-01-01`; display it as **2025**.

| Published label | Suffix | Transaction volume share (%) | Transaction value share (%) |
| --- | --- | ---: | ---: |
| Cash | CASH | 17.90 | 9.60 |
| Credit | CREDIT | 14.20 | 26.20 |
| Contactless credit | CTCC | 26.00 | 26.20 |
| Contactless credit, mobile | CTCCM | 8.00 | 6.10 |
| Debit | DEBIT | 6.70 | 9.40 |
| Contactless debit | CTDC | 16.00 | 12.80 |
| Contactless debit, mobile | CTDCM | 2.70 | 2.00 |
| Mobile app | MOBILE | 2.30 | 1.30 |
| Other | OTHER | 6.20 | 6.50 |

Sources: [official volume](https://www.bankofcanada.ca/valet/observations/group/METHODS_OF_PAYMENT_SURVEY_VOLUME_SHARES/csv) and [official value](https://www.bankofcanada.ca/valet/observations/group/METHODS_OF_PAYMENT_SURVEY_VALUE_SHARES/csv) CSVs. The nine volume values sum to **100.0%**; value shares sum to **100.1%**. Preserve this rounding difference instead of normalizing source figures or altering a residual category. The retrieved datasets provide no confidence intervals or quality codes; do not invent them, test significance from these percentages, or treat the estimates as individual probabilities.

The original [dashboard chart notes](https://www.bankofcanada.ca/banknotes/bank-notes-research-reports/methods-of-payment-survey/) explain a **2025 category break**. Contactless card payments newly distinguish physical cards from cards linked to mobile devices. The 2025 Mobile app category excludes those mobile contactless card transactions; the pre-2025 mobile-app category used the older reporting definition. The Bank says the categories cannot be fully harmonized with earlier years. A latest-year comparison is therefore the safest primary figure. Avoid presenting a smooth mobile-app or physical-card trend through that break. The separate cash-withdrawal cleaning note on the page concerns withdrawal estimates, not authority to adjust these payment-share rows.

## Interpret the denominator

For a defined purchase set, volume share is the method’s transaction count divided by the total count; value share is dollars assigned to the method divided by total purchase dollars. A purchase contributes one count but can contribute many dollars. This arithmetic explains how the same method can have different shares without implying an error or a causal effect on spending.

Neither denominator is household income, available bank cash, the number of people owning a card, or the number of Canadians who ever use a method. A payment share does not measure card interest, outstanding borrowing, affordability, fraud, declined payments or outage probability. The dashboard separately reports people’s cash holdings/plans; those person-based measures should not be mixed into a transaction-share chart. These are interpretive limits of the [published payment-share measures](https://www.bankofcanada.ca/banknotes/bank-notes-research-reports/methods-of-payment-survey/), not predictions about an individual.

## Original purchase-tally fixture

Use a deliberately small **invented** purchase set, independent of the survey: six cash purchases at CAD 5 each, three debit purchases at CAD 40 each, and one credit purchase at CAD 350. Assume each transaction belongs to exactly one chosen method, all stated purchase amounts are final cash prices, and there are no refunds, fees, split tenders or currency conversions. These three teaching categories are not a reconstruction of the Bank’s nine reporting bins.

Totals are **10 purchases / CAD 500**: cash CAD 30, debit CAD 120, credit CAD 350. Count shares are **60% / 30% / 10%**; value shares **6% / 24% / 70%**. Mean ticket sizes are CAD 5 / 40 / 350 and the overall mean is **CAD 50**. One credit purchase represents only one tenth of this tally but seven tenths of its value. This result comes entirely from selected counts and ticket sizes, not an estimate that using credit causes larger purchases.

With method counts `nᵢ` and assumed mean tickets `pᵢ`, dollars `vᵢ=nᵢpᵢ`, total count `N=Σnᵢ`, total value `V=Σvᵢ`. Calculate count shares only when `N>0`, value shares only when `V>0`, and observed method mean only when that method has a positive count. An all-zero count set has undefined shares, not three 0% shares pretending to form a distribution. Positive counts with zero prices leave count shares defined and value shares undefined. Retain those distinctions in controls and chart labels.

Holding counts fixed while increasing the credit ticket to CAD 700 keeps its count share at **10%**, raises total dollars to **CAD 850**, and raises its dollar share to **14/17 = 82.352941…%**. Changing method labels alone does not change total purchase dollars. No purchase tally supplies the money to pay a later card statement; link the existing billing/cash-calendar guide for that separate question.

Six bounded controls suffice: three integer counts from 0–100 and three nonnegative assumed tickets from CAD 0–1,000. Possible figures are the fixed 2025 source comparison, invented count/value shares, method dollar totals or mean tickets, and a fixed-count ticket-size sensitivity. Source figures stay fixed when toy controls change. Additional personal budget or income inputs are unnecessary for this focused lesson.

## Evidence and independent checks

Ignored `qa/payment-denominators/` contains two original public HTML captures, two CSVs, two JSON responses, request headers and a SHA-256 source manifest. Extracted chart settings are derived JSON, not additional original sources. All six originals returned HTTP 200 with ordinary anonymous TLS-verified requests; no PDF, private archive or access-control bypass was used.

`python3 qa/payment-denominators/validate.py` verifies six hashes, exact CSV/JSON agreement for both nine-year datasets, 18 series/18 latest-year cells, units from chart settings, date uniqueness, missing historical categories and the 2025 break note. It independently checks **729** exact synthetic purchase tallies, undefined-denominator boundaries, label permutations and the CAD 700 sensitivity. `reviewed-extract.json` preserves the reviewed source cells, metadata, original chart notes and separate fictional fixture. No application, registry, build, test, commit or deployment changes are part of this task.


## Implemented English guide

Five figures are implemented: all nine original 2025 bins with paired count/value shares; a disclosed one-year signed percentage-point difference using the three combined credit bins, the three combined debit bins, cash, mobile app and other; a fictional count donut; a fictional dollar donut; and a purchase-dollar reconciliation. The current source rounding and category break remain explicit. No source shares are normalized or used to set the invented counts/prices. Both donut descriptions/centres refer to purchases, never assets. Zero-denominator rings are empty with unavailable shares; positive counts/zero prices retain a valid count distribution and undefined dollar distribution.

Nine app checks cover the exact ten-purchase/CAD500 fixture, CAD700 ticket sensitivity, undefined denominators, cent arithmetic, current source labels/identifiers/rounding, explicit category combinations, source-plot invariance, integer count validation and five finite accessible figures at supported extrema. Independent research checks729 exact tallies and six original-file hashes. Desktop/mobile interactions, native exact tables and reset pass; mobile zero-tally views also pass. The long nine-row source figure was inspected at its top and bottom, and the other four mobile figures were visually inspected.
