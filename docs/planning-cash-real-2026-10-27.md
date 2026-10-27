# Cash in treasury bills against inflation and tax, 1956–2026

One English article dated 27 October 2026 with four figures, chart data tables and six editable inputs, plus a
Simplified Chinese edition (required by the bilingual-page test):

- `cash-treasury-bills-inflation-tax-1956-2026-purchasing-power-tfsa` (`cashReal`).
  Charts: (1) real (CPI-adjusted) value of the amount in a TFSA, taxed at the marginal rate, and earning nothing;
  (2) groupbar by decade: compounded T-bill yield, after-tax yield, CPI inflation; (3) rolling N-year real return by
  starting month, TFSA vs taxed, with the target line (falls back to the longest period that fits); (4) heatmap,
  share of rolling periods that kept purchasing power by tax rate (0/20/30/40/50%) and length (1/5/10/20/30 years).
  Themes: inflation and purchasing power, responding to fear of a crash (cash as a waiting place), tax-efficient
  investing (interest fully taxed vs TFSA; the investment vs the account), paycheque contributions vs staging a lump sum.

Topic selection: 371 guides at start (origin/main `69c9435c`). Existing cash/inflation guides use hypothetical rates
(`taxable-interest-after-tax-inflation-purchasing-power`) or T-bills only from 2006 (exit-tax, value-averaging);
none covers the full 1956–2026 official record by rolling period and tax rate. No other worktree had uncommitted work
on this topic.

## Sources (reviewed 27 Oct 2026)

- StatCan WDS `getDataFromVectorByReferencePeriodRange`, vectors v122541 (table 10-10-0122-01, T-bill auction average
  3 month) and v41690973 (table 18-10-0004-01, CPI 2002=100), Jan 1956 – Sep 2026: 849 values each, no gaps; T-bill
  release 2026-10-09 (Sep 2026 2.387%), CPI release 2026-10-19 (Sep 2026 170.0). Download SHA-256
  66d8aafd78011598107f8975aa1930b905406df1869abc6a1b01aa9e81c8d6e6, kept in session scratch only. First 813 values
  identical to `tbillMonthly` and `cpiMonthly` (asserted in the test).
- CRA Line 12100 (page modified 2026-01-20): report interest paid or credited; compound interest reported yearly as
  earned; matured T-bill discount reported as interest. CRA What is a TFSA: income generally tax-free.

## Model

Balance earns max(0, y_t − spread)/1200 · (1 − m) each month t (tax taken as earned); real = nominal × CPI_s / CPI_e.
Rolling periods start at every month-end from the chosen first year with the full horizon after them.

## Verification

- `qa/cash-real-2026-10-27/check.py` (40-digit Decimal from the raw WDS file; `check.log`): full period TFSA
  359,834.91 nominal / 30,056.80 real (1.57%/yr); 40% 86,076.09 / 7,189.89 (−0.47%); 30% 10,284.40 real; spread 1:
  15,512.56 / 4,831.55; from 2009 TFSA 8,596.17 real; kept 10y 537/729 (TFSA), 300/729 (40%), 0/93 from 2009;
  30y 489/489, 209/489 (40%), 80/489 (50%); spread 1 10y 414/729 and 175/729. All asserted in
  `tests/planning-cash-real.test.mjs` against the JS model.
- Prose figures checked against the model: break-even tax 30.8%; decade yields/after-tax/inflation 1970s 7.27/4.30/7.54,
  1980s 11.86/6.97/6.26, 1990s 6.41/3.80/2.00, 2010s 0.92/0.55/1.74, 2020–26 2.46/1.47/3.31; 12 months to Sep 2026
  T-bills 2.30% vs CPI 3.09%; best 10y TFSA 1980-12 +5.95%, worst 2012-07 −1.47%, worst 40% 1971-03 −3.69%.
- `npm test` 1,869 passed; Python unittest OK; 111 Chinese units written directly, tag/number/`&amp;` guards
  0 rejections (`merge_zh.py`); `zh:refresh` missing 0. Built EN/ZH pages: 4 figures, 4 tables, 6 inputs, no
  NaN/undefined. Node render fuzz (17 cases incl. every field at min/max and periods that do not fit, 340 and 960 px):
  no NaN/Infinity/undefined; found and fixed a crash when the rolling period did not fit.
- Local browser preview was declined in this unattended run; no browser pass is claimed.
