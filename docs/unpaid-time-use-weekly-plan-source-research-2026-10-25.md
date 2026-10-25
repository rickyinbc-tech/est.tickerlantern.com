# Daily time-use denominators and a separate weekly time/cash plan

Reviewed October 25, 2026. Public-primary research only. Recommended distinct English angle: **“Unpaid work takes time: read the denominator before planning a 168-hour week.”**

## Existing-guide comparison

Read-only checks of current guide files and `origin/main` found no guide explaining population-average versus participant-average daily hours or an exclusive 168-hour personal week. The existing `/research/caregiving-household-cash-plan` already presents Canadian Social Survey 2022 past-year unpaid-care participation, then models support bills, earnings reductions and cash reserves. Preserve and link that route; do not repeat its survey categories or cash-draw model. The contractor billable-capacity guide uses a work-hours template, rather than the daily person/time denominators here. Checks were at HEAD `2ee2b4c`, origin `7d8bd39`.

This new angle should use two fixed time-use figures and a separately invented personal weekly schedule. It establishes neither care needs nor an appropriate amount of paid support. Do not draw medical, benefit, employment, tax, insurance or financial diagnoses from reported hours.

## Primary data, dates and denominator definitions

[Statistics Canada Table 45-10-0104-01](https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=4510010401), **Daily average time spent on various activities, by age group and gender, 2022**, was released June 5, 2024. The current [official entire-table CSV](https://www150.statcan.gc.ca/n1/tbl/csv/45100104-eng.zip) contains only reference year **2022**. The reviewed selection is `Canada`, DGUID `2021A000011124`, `Total, 15 years and over`, `Total, all persons`. All estimates use scalar `units`; time is **hours**, participation **percent**, with one published decimal. They describe persons, not households or care receivers.

The table’s metadata note 3 defines a daily average based on a seven-day week. Notes 40–43 distinguish population, participants who performed an activity on the reference day, proportion of a 24-hour day, and participation as the share performing the activity on that day. Notes 36–39 cover rounding, bootstrap 95% confidence intervals and E/F cautions. Reviewed rows have blank status/symbol fields: assign no A/B/C grade. Preserve the [published values and definitions](https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=4510010401), rather than manufacturing more precision.

The [2022 survey metadata](https://www23.statcan.gc.ca/imdb/p2SV.pl?Function=getSurvey&SDDS=4503), modified June 4, 2024, identifies non-institutionalized people aged 15+ living off First Nations reserves in the ten provinces. Collection ran **July 16, 2022–July 15, 2023**. One person per selected household responded; proxy responses were not permitted. Overall response was 30.7%. The metadata flags sampling, coverage and non-response risks and the change toward electronic collection. Avoid a historical trend chart across survey modes. Its statement that revisions/seasonal-adjustment methodology does not apply is not a guarantee that tables can never be updated. The table also explicitly excludes territories/institutions. Call the figures “2022 Time Use Survey,” not current weekly targets.

## Reviewed figures and exact coordinates

These fixed source figures can show paired population/participant hour bars and a separate daily-participation plot. A participant denominator changes with the activity; the bars are not a schedule for one person.

| Activity (household or family unless stated) | All-person mean hours/day | Participant mean hours/day | Participated on reference day (%) |
| --- | ---: | ---: | ---: |
| Unpaid household work | 2.1 | 3.0 | 71.4 |
| Care of children under 18 | 0.5 | 3.4 | 16.2 |
| Care of adults | 0.1 | 2.6 | 3.9 |
| Shopping for goods/services | 0.4 | 1.5 | 25.9 |

Source: [current table](https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=4510010401). For those four rows, point coordinates are respectively `1.12.1.1.1`, `1.13.1.1.1`, `1.14.1.1.1`, `1.15.1.1.1`; replace the final member with `4` for participant hours or `13` for participation. Population-hour point vectors are `v1592189785`, `v1592190145`, `v1592190505`, `v1592190865`. The reviewed extract contains every exact vector, coordinate and confidence bound.

Their published 95% intervals are, in the same order: population hours **[2.1,2.2], [0.5,0.6], [0.1,0.1], [0.4,0.4]**; participant hours **[2.9,3.0], [3.2,3.6], [2.2,3.0], [1.5,1.6]**; participation percentages **[70.0,72.7], [15.4,17.2], [3.4,4.3], [24.7,27.1]**. Equal displayed endpoints reflect published rounding, not certainty. Present no causal or group-significance interpretation.

Metadata note 17 groups these four activities as **Unpaid work activities**: aggregate means are 3.2 population hours and 4.0 participant hours; participation is 79.1%. The separate outside-household help/community/volunteering category has 0.2 population hours, 2.9 participant hours and 6.1% participation. Do not call the four-part aggregate all unpaid caregiving, add its components to their own parent, or combine participant hours across different participant groups. Its included shopping and household tasks are not equivalent to the existing guide’s care-dependent-adult/child concepts. Daily participation also differs from reporting care at some point over twelve months. These boundaries come from the [table definitions](https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=4510010401).

## Main activity, simultaneous care and rounding

The [official diary instructions](https://www.statcan.gc.ca/en/survey/household/4503/diary-instructions) describe a designated 24-hour day from 4 a.m. to the following 4 a.m. The [official methods article](https://www150.statcan.gc.ca/n1/pub/89-652-x/89-652-x2024003-eng.htm), “Data, measures, and methods” and Appendices A.4/A.5, distinguishes main activity, simultaneous activity and co-present time. It says exact simultaneous-activity duration was not collected and notes that primary childcare can miss supervision or interaction. Therefore these hours must not be described as all care responsibility, all time “on call” or all time with children.

A small source inconsistency should remain explicit: that article’s Appendix A.4 says respondents could report one simultaneous activity, while the [public questionnaire TUI_Q03](https://www23.statcan.gc.ca/imdb/p3Instr.pl?Function=assembleInstr&Item_Id=1395477&lang=en) displays “Select all that apply.” Do not assert a numerical simultaneous-option limit or try to resolve it from secondary sources. The supported limitation is that simultaneous responsibilities cannot be reconstructed as exact additional hours from these published means.

Original mathematical illustration, not survey microdata: if three of ten people each report four hours and the other seven report zero, the participant mean is four hours, population mean 1.2 hours and participation 30%. In exact unrounded consistent means, population mean equals participation share times participant mean. Published rounded source values need not reproduce that equality exactly; preserve them rather than calculating replacements.

## Bounded original weekly fixture

Use **one person’s** 168-hour week, with non-overlapping assigned blocks: fixed sleep/personal/other commitments **71**, work plus travel **45**, own domestic/care **30 before** and independently assumed **26 after**. Assigned time is **146 before / 142 after**; signed remainder is **22 before / 26 after**. The four-hour difference arises only from the separately entered own-time assumptions. The fixed 71-hour block is invented, not a sleep or health target. “Unassigned” is a bookkeeping label, not proof of usable free time. Survey averages do not populate these controls.

For independently entered nonnegative blocks, `assigned = 71 + work/travel + own domestic/care`, `remainder = 168 − assigned`, `unassigned = max(0,remainder)`, `overscheduled = max(0,−remainder)`. Changing work/travel to **80** while retaining after-care **26** produces **177 assigned / −9 remainder / 9 overscheduled**. Retain this result visibly. Do not normalize, clamp or redraw 177 hours as a feasible 168-hour schedule. Individual editable time controls may be bounded 0–100; the sum may exceed 168 so the conflict remains visible. Allow after-hours to exceed before-hours rather than promising a saving. No claim about simultaneous activity is hidden inside this deliberately exclusive teaching schedule.

An independent cash bridge uses an invented total paid-help cash quote **CAD 120 per week** and independently available **CAD 200 per week** after other budget commitments. Over **four weeks**, available cash **CAD 800** less invoices **CAD 480** leaves **CAD 320**. A CAD 250 weekly quote instead leaves **−CAD 200**, while every time block stays unchanged. Four weeks is a selected window, not an average calendar month. This aggregate comparison does not prove that each receipt precedes an invoice. The quote supplies no provider-hour/wage conversion, personal hours freed, higher earnings or care-suitability conclusion. Both before/after own hours need independent verification. No unpaid-hour-times-wage valuation, compensation estimate or benefit entitlement is modeled; a negative cash remainder is an unfunded schedule, not credit availability.

Possible final figures are paired source hours, daily participation, an after-plan time waterfall, a four-week cash waterfall, and a signed remainder matrix across work/travel and own after-care hours. Five controls suffice: work/travel, own hours before, own hours after, weekly invoice, weekly available cash. Keep the two source figures fixed when personal inputs change.

## Evidence and independent verification

Ignored `qa/unpaid-time-use/` contains the original ZIP, data/metadata CSVs, five successful anonymous HTTPS HTML captures, headers and SHA-256 manifest. The web tool timed out on the questionnaire; ordinary direct retrieval succeeded without bypass. The older release’s “most recent” link led to the generic Daily homepage, so no later table vintage was inferred from it.

`python3 qa/unpaid-time-use/validate.py` checks eight original hashes, **56,160 unique dimension/period rows**, **54 reviewed rows**, units/flags, confidence bounds and rounding compatibility. It verifies the original ten-person illustration, **125** before/after weekly schedules and **48** independent invoice/cash cases. `reviewed-extract.json` retains source metadata plus the fixture and a 16-cell signed-remainder matrix. No application, registry, build, test, commit or deployment changes are part of this research.


## Implemented publication scope

Five figures are implemented: fixed paired daily population/participant means; fixed daily-participation interval bars; an exclusive weekly time waterfall; signed before/after remainder bars; and an independent four-week cash waterfall. The signed bars replace the optional reference matrix so the before-time control has a direct visual comparison. Source hour bounds are preserved in a static article table. The quote never enters a time formula, and time never enters available cash or invoices. Negative requested time and negative cash remain visible. Distinct weekly available amounts are not the same opening balance reused four times.

Nine application checks cover the original fixture, 125 requested-week combinations, before/after direction, independent invoice effects and cent arithmetic, source years/units/means/interval metadata, source-chart invariance, article routes, invalid values and five finite accessible figure/table pairs at numerical boundaries. Independent research validation verifies eight hashes, 54 reviewed rows, 125 time cases and 48 cash cases. Desktop and 390-pixel mobile interactions pass changed input, invalid-input retention, restore and exact-value tables; all mobile figures were visually inspected.
