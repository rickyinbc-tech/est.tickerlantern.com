# Nasdaq-100 published-growth scenario — 23 October 2026

The owner requested restoring the published growth number and removing the
artificial reduction. Nasdaq-100 now uses the 2027 annual earnings growth input
of 28% and carries it through the five holding years without a cap or fade.
The prior 8% fallback is removed. The 2026 43% reference remains in the source
card. The original UBS CIO article dated 7 October was rechecked:
https://www.ubs.com/global/en/wealthmanagement/insights/chief-investment-office/house-view/daily/2026/latest-07102026.html

The first year is labelled published-growth scenario and later carried years
are growth projections. A new published annual forecast replaces the carried
rate for its year and subsequent years. Source data is retained unchanged;
projected years are not added to the source feed as consensus observations.
An absent next-year input produces an unavailable scenario rather than 8%.

Growth policy v3 migrates saved source-mode schedules, including paused old
schedules. Named yearly edits and custom constant/annual scenarios remain
protected. Other benchmarks retain their existing growth arithmetic. The
comparison table, calculator, annual editor, sensitivity outputs and CSVs use
the same updated path; exports retain source year/date and projection labels.

At the existing 21.36× entry, 23.09× illustrative exit and calibrated dividend
input, the model shows 28% EPS CAGR, approximately 30.01% price CAGR and 30.49%
cash-flow IRR. These results describe the selected constant-growth scenario.

Verification: 125 tests passed, including new tests for 28% carry-forward,
uncapped 85% inputs, new annual estimates, saved-state migration, user override
protection, independent terminal-price reconciliation and CSV provenance.
Production build, Wrangler dry run and whitespace checks passed. The local browser verified all five 28% inputs, the recalculated 30.49% IRR,
actual CSV contents and source labels, higher custom growth, independent S&P
settings, source restore, and 1440/390px containment with no browser errors.
Production results are recorded after publication.
