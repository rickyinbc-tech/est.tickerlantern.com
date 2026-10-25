# AI work-time survey and independently entered cash scenarios

The English guide `/research/ai-work-time-survey-paid-hours-personal-income-scenario` adds five charts/tables. Its first two reproduce categorical results from the Bank of Canada's CSCE 2026 Q3 Box 1 and linked Valet groups C1A and C1B. The other three use independently authored assumptions. No product recommendation, causal productivity result or observed earnings increase is claimed.

## Bounded source-quality check

The public report and both linked groups were retrieved 25 October 2026. Release: 19 October; online collection: 5–27 August; follow-up interviews: 24 August–4 September. Three SHA-256 hashes, exact series IDs, category order, question/statistic labels, units and estimation note are retained in the public derived extract. Raw public snapshots remain ignored QA material.

Grain is categorical, not daily: each group has one series with the `k` Category dimension. A generic API date-format hint says daily, but no date observations exist and it is not used as a time axis. There are two unique hour rows and five unique response-share rows, seven complete finite values, no join and no imputation. The source hours use interpolated medians; the active-use estimate depends on duration midpoints and weekly frequency, including a 7.5-hour assumption for the open-ended daily category. The second hour measure is a respondent counterfactual, not a causal experiment. Multiple-answer shares retain the question denominator and total 209.20%; no pie normalization, response intersections, sample count or hours allocation is inferred. No respondent microdata or uncertainty intervals are available in the extract.

The independent scenario uses 3 hours/week, 46 weeks, 50% converted into additional paid hours, CAD 50 actually received per converted hour and CAD 240 annual out-of-pocket cost. It produces 69 paid hours, CAD 3,450 additional gross receipts and CAD 3,210 cash change before personal tax/other work costs. A fixed-pay path has no additional compensation and pays the same tool cost. Neither copies the survey's 4.7-hour median or any response share into its assumptions.

Validation:

- The extractor and exact `--check` passed for seven observations, metadata, dates and all three source hashes.
- All 1,347 Node tests passed. Seven focused source/model tests and four SEO checks passed before the final table-unit wording refinement; the full suite includes the refined output.
- Checks cover correct unit conversion, categorical grain, unchanged source panels/metric, independent weekly receipt summation, one cost deduction, fixed-pay comparison, zero paid conversion/hours/rate/cost, scaling, matrix replacement assumptions, whole weeks and five finite figures/tables.
- `tests/browser_ai_time.py` passed at desktop and 390px mobile: English, five accessible figures/tables, SVG descriptions/text bounds, no overflow, official panels unchanged by scenario controls, zero receipts with cost retained, zero out-of-pocket cost, fractional-week rejection retaining valid results, reset, full multiple-answer table values and explicit hour units.
- Mobile response-share and compensation-arrangement charts were visually inspected.
