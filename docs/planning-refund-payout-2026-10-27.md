# RRSP refund every payday and T-series versus a withdrawal plan

Two English articles dated 27 October 2026, each with four figures, chart data tables and editable inputs, plus Simplified Chinese editions:

- `rrsp-refund-every-payday-reduce-tax-at-source-t1213` (`rrspPayroll`): the same after-tax monthly RRSP effort three ways: tax reduced at source (payroll contributions or a CRA letter of authority via Form T1213), spring refund invested, refund spent. Official chart: 2026 federal plus BC statutory bracket rates. Distinct from the RRSP deduction-timing, RRSP-versus-TFSA and TFSA payday guides, which it cross-links.
- `t-series-fund-return-of-capital-or-systematic-withdrawal-plan` (`tSeriesSwp`): same fund, same cash: T-series return of capital against SWP redemptions; ACB path, annual capital-gains tax, total tax including the final sale, heatmap of years until the T-series ACB reaches zero. All four charts hypothetical. Distinct from the non-registered withdrawal, fund cost-base and fund income-type guides, which it cross-links.

## Dated sources (reviewed 27 Oct 2026)

- CRA current-year (2026) tax rates and brackets (page date 2026-06-25): federal 14 / 20.5 / 26 / 29 / 33 at 58,523 / 117,045 / 181,440 / 258,482; BC 5.6 / 7.7 / 10.5 / 12.29 / 14.7 / 16.8 / 20.5 at 50,363 / 100,728 / 115,648 / 140,430 / 190,405 / 265,545.
- CRA Increase or reduce income tax deducted at source (page date 2024-06-20): letter of authority required when an employee makes deductible RRSP contributions; employer blanket waiver for 15,000 or less. Search excerpt of CRA payroll guidance/T4001: payroll-withheld RRSP contributions automatically reduce remuneration subject to tax; letters usually for one tax year; not usually issued with a balance owing or unfiled returns.
- CRA T1213 form page (page date 2026-09-03).
- CRA MP/RRSP/TFSA limits (page date 2025-12-01): RRSP 33,810 (2026), 35,390 (2027).
- CRA Tax refunds page: online refunds within about two weeks.
- CRA Tax treatment of mutual funds (page date 2026-02-05): ROC reduces ACB; T3 box 42; negative ACB deemed capital gain and ACB reset to zero; fund-corporation ROC not on T5; identical units average cost.
- CRA Calculating and reporting capital gains (page date 2026-02-05): 50% taxable.
- RBC GAM "How does Series T provide tax-efficient cash flow?": text read from the private local archive copy captured 2026-08-10 (not committed); live URL returned HTTP 200 (after redirect) on 27 Oct 2026. Used only as an example of T-series mechanics (prior 31 Dec NAV x 5% or 8% / 12; ROC tops up income; downward reset after a falling year).
- Bank of Canada Inflation page: 2% midpoint of 1–3% target.
- canada.ca and Bank of Canada pages were read with WebFetch; no page bytes saved.

## Calculations (defaults)

RRSP: 500/month after tax, 28.2%, 6%, refund invested in May, 25 years. At-source contribution 696.38/month (8,356.55/yr); first refund 1,692. Dec year 1: 8,625.72 vs 6,193.26. Year 25: at source 473,245.71; spring refund (counting refund still owed and its own refund chain, t·C/(1−t)) 463,969.58; spent 339,790.42. Gap 9,276.12; spent gap 124,179.17. 0% return: gap exactly 0 (identity ΣC + tC_N/(1−t) = 12PN/(1−t)). Heatmap 20%/3% 1,780.54; 50%/9% 75,274.50.

T-series: 300,000 value, 180,000 ACB, 5% payout, 5% return, 2% income, 30%/30%, 25 years. Payout 15,000; ROC 9,000/yr; T ACB zero in year 20; SWP ACB 85,969.00 at year 25; first-10-year CG tax 0 vs 6,590.54; totals 51,750 each; final-sale rate 20%: 36,750 vs 41,048.45. 8% payout / 4% return: 13 years. 1/1.02^25 = 0.6095 (about 39% less purchasing power).

All defaults reproduced with 40-digit Python Decimal arithmetic (`qa/refund-payout-2026-10-27/check.py`, ignored) and asserted in `tests/planning-refund-payout.test.mjs`. 665 randomized/edge input runs produced no non-finite chart or metric values. Heatmap float noise near zero (|v| < 0.005) is clamped to 0 so the scale never shows "-$0".

## Checks

- `npm test`: 1780 tests, 0 failures. `npm run zh:refresh`: 0 missing units at the catalog step. 221 Chinese units written directly (no external translation service), inserted only after numguard agreement and identical-markup checks.
- Built HTML: four figures, four data tables and the inputs on each English and Chinese page; homepage, research index, Chinese homepage and sitemap entries present; `planning-refund-payout-models.js` imported by `planning-models.js`.
- Browser QA: starting a local static preview in the in-app browser was declined in this unattended run, so no browser pass of the local build is claimed.

## Release status

Pinned base `3854ca75` (origin/main at start, unchanged when re-fetched before publishing).
