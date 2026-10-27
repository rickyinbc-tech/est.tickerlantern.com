# Monthly saving through every S&P/TSX starting month, 1956–2023

One English article dated 27 October 2026 with four figures, chart data tables and eight editable inputs, plus a
Simplified Chinese edition:

- `monthly-saving-every-sp-tsx-start-month-1956-2023-below-contributions-lump-sum-phase-in` (`tsxMonthly`).
  Charts: (1) ending value as a share of money paid in by starting month (official index · hypothetical yield and fee);
  (2) the worst starting month's account value against money paid in; (3) share of starts ending below money paid in,
  below it raised by CPI, and a lump sum below its amount, for 5–30 years (official index and CPI · hypothetical);
  (4) heatmap, share of starts in which investing a lump sum at once beat a 3/6/12/24/36-month phase-in, by distance
  below the previous peak (official index · hypothetical yield, fee and cash rate).
  Themes: dollar-cost averaging, inflation and purchasing power, market timing, paycheque contributions vs staging an
  existing lump sum, fund vs account tax rules (TFSA/RRSP/taxable), balanced-fund context.

Topic selection: 366 guides at start (live sitemap 744 URLs). Existing DCA guides (keep-or-pause, regular investing,
value averaging, phased lump sum, return order, waiting for a dip) use authored return paths; only the record-high guide
used the S&P/TSX series, and it studies single purchases. No other worktree had uncommitted work on this topic
(`tickerlantern-wealth-choice` had an unrelated untracked offset-account module; `income-timing` only docs).

## Sources (reviewed 27 Oct 2026)

- Statistics Canada table 10-10-0125-01, S&P/TSX Composite close, vector v122620. Cube metadata via WDS
  `getCubeMetadata`: end date 2023-09-01, release 2023-11-01, status CURRENT. WDS `getDataFromVectorsAndLatestNPeriods`
  for vectors 122620 and 41690973 re-fetched this run (SHA-256 3c8d9d5d…80e04523, kept in session scratch only): 813
  values Jan 1956 525.63 to Sep 2023 19,541.27, identical to the arrays embedded by the record-high guide (the model
  imports them from `planning-record-high-models.js`).
- CPI v41690973 (table 18-10-0004-01): latest release 2026-10-19, Sep 2026 = 170.0; only Jan 1956–Sep 2023 used.
- CRA "What is a TFSA" (read in the in-app browser; canada.ca timed out from the shell): income generally tax-free even
  when withdrawn; contributions not deductible, unlike an RRSP.

## Model

Contribution C at the close of months s..s+12n−1; value at month t = Σ C·P_t/P_j·g^(t−j), g = (1 + (yield − fee))^(1/12).
Valued at s+12n. CPI-raised contributions = Σ C·CPI_e/CPI_j. Underwater months counted at t = s+1..s+12n. Lump sum L at
s: L·P_e/P_s·g^(12n). Phase-in over k months: Σ (L/k)(1+cash)^(j/12)·P_e/P_{s+j}·g^(e−s−j). Starting position from the
running peak (record-high module). Phase-in longer than the holding period is rejected as an input issue.

## Verification

- `qa/tsx-monthly-2026-10-27/check.py` (40-digit Decimal, reads the raw WDS file; `check.log`). Defaults (10 years,
  CAD 500, 2.5% yield, 0.5% fee, CAD 60,000, 12 months, 3% cash): 693 starts, median 1.4770209231, worst 1964-12
  0.9627436239, below paid-in 3, below CPI-raised 78, longest underwater 35 months, lump below 0, lump beat phase-in 435
  (62.77%), median gap 2.990%. 5 years: 753 starts, median 1.2131, worst 2004-02 0.7762, below 52, CPI 153, lump below 36.
  20 years: CPI 36/573. 30 years: none. From 1991: 273 starts, median 1.3879, lump wins 184. All match the JS model
  (asserted in `tests/planning-tsx-monthly.test.mjs`).
- Prose figures checked against the model: 1990-08 best 2.70; 2000-06 start 1.34, 35 months below, 12-month phase-in
  +12.6% vs at once; 72 of 78 real shortfalls started in the 1960s/1970s; heatmap 48.8–63.4% at record, 71.9% when
  more than 20% below (12 months).
- `npm test` 1,854 passed; Python unittest OK; `npm run zh:refresh` missing 0 after 108 Chinese units written directly
  and merged through the tag, markup, number and `&amp;` checks (`qa/tsx-monthly-2026-10-27/merge_zh.py`).
- Fuzz (`fuzz.mjs`): 817 cases, no NaN/Infinity/undefined; 13 rejections, all phase-in longer than holding period (intended).
- Built-in browser on a local static server (port 8791): EN at 375 px, 4 SVG charts, no horizontal overflow; changing
  years to 5 updated metrics (753, 121.31%, 77.62%, worst 2004-02); years 1 + phase 24 showed the field error; ZH page at
  1024 px renders 4 charts. Phone x-axis tick "2020" clipped at the right edge was fixed by limiting ticks to the data.

## Deployment (2026-10-27)

Pinned base `c1966e1c` (origin/main at start, unchanged when re-fetched before pushing and again before deploying).
Article commit `8d9223d7` pushed to `main` as a fast-forward (branch `claude/planning-visual-20261027j` in the reused
`tickerlantern-wealth-career-20261025` worktree), then `npx wrangler deploy` from that clean checkout: version
145f04c1-a173-417c-a84c-e6997aa9a065; tickerlantern.com, www and est custom domains kept.

Live checks: EN and ZH routes 200 with 4 figures and 4 tables; homepage, research index and Chinese homepage link the
guide; search index lists it; live sitemap 746 URLs = local dist; SHA-256 of live `planning-tsx-monthly-models.js`,
`planning-record-high-models.js`, `planning-models.js`, `planning-ui.js` and `planning-charts.js` match dist; all 744
URLs of the previous sitemap return 200. Live at 375 px: 4 SVG charts, no horizontal overflow, no NaN; typing 5 years
updated the metrics to 753 starts, CAD 30,000, 121.31%, 77.62% and the worst chart to 2004-02, matching the model.
(Synthetic script events did not trigger the live update; real typing did.) No physical-phone test. Site-wide CSP
console messages about inline legend styles and the Cloudflare beacon pre-exist and are unchanged.
