# Moving-average exit rule on the S&P/TSX, 1958–2023

One English article dated 27 October 2026 with four figures, chart data tables and ten editable inputs, plus a
Simplified Chinese edition (required by the bilingual-page test):

- `moving-average-exit-rule-sp-tsx-1958-2023-treasury-bills-whipsaws-tax` (`trendRule`).
  Charts: (1) the rule's account as a share of staying invested, month by month (official index and yields ·
  hypothetical yield, fee, cost, tax); (2) each account's fall from its own previous high; (3) groupbar, exits to cash
  by decade and how many were bought back at a higher index level; (4) heatmap, share of rolling periods in which the
  rule ended ahead, by average length (3–24 months) and holding period (3/5/10/20 years).
  Themes: market timing difficulties and trade-offs, responding to fear of a crash, tax-efficient investing (TFSA vs
  taxable account, capital gains inclusion, superficial loss), balanced-fund alternative.

Topic selection: 369 guides at start (origin/main `b6d86f73`). Existing timing guides (missing best/worst months,
crash-warning false alarms, exit tax, waiting for a dip, record highs) use authored paths or single exits; none tests a
mechanical trend rule on official data. Other worktrees had no uncommitted work on this topic.

## Sources (reviewed 27 Oct 2026)

- StatCan table 10-10-0125-01, S&P/TSX Composite close, v122620: 813 values Jan 1956 525.63 – Sep 2023 19,541.27
  (WDS download SHA-256 d56bd53d…64fa001; identical to the arrays in `planning-record-high-models.js`).
- StatCan table 10-10-0122-01, Treasury bill auction average yields 3 month, v122541: complete Jan 1956 – Sep 2023
  (0.056%–20.82%); latest release 2026-10-09, Sep 2026 2.387%. v122531 ("Treasury bills: 3 month", used by earlier
  guides) has gaps before 1962 and in 1970–73, so it was not used. WDS download SHA-256 c04f75be…bf359f2ed (also holds
  CPI v41690973). Raw downloads kept in session scratch only.
- CRA T4037 Capital Gains – 2025 (in-app browser): inclusion rate generally 1/2; superficial loss = identical property
  bought within 30 calendar days before/after and held 30 days after. CRA Capital losses page: 2025 inclusion rate 50%,
  net capital losses carry back 3 years / forward indefinitely. CRA What is a TFSA: income generally tax-free.

## Model

Signal at month-end t (t > start): invested stays in while P_t ≥ SMA_k(t)(1−b); cash re-enters when P_t > SMA_k(t)(1+b).
Initial state invested iff P_s ≥ SMA_k(s). Cost c on each switch. Invested month: V' = V·P_{t+1}/P_t + V·(y(1−τd) − f)/12,
ACB += V·y(1−τd)/12. Cash month: V' = V·(1 + tb_t/1200·(1−m)). Sale: half of (proceeds − ACB) taxed at m after
carried-forward losses; losses added to the pool. Both accounts liquidated at the end. Start ≥ Jan 1958 (24 months of
history).

## Verification

- `qa/trend-rule-2026-10-27/check.py` (40-digit Decimal from raw WDS files; `check.log`): defaults 1958-01..2023-09
  hold 1,608,632.82 (8.044%/yr, dd −43.90%), rule 2,242,662.06 (8.592%, −24.67%), 58 exits, 40 bought back higher,
  rolling 10y wins 485/669. Yield 4%: 4,281,831.74 vs 4,294,682.08. Taxable 45/25: 907,033.82 vs 508,149.20 (360/669).
  From 1990: 216/285. From 2009: 30,093.82 vs 16,507.08, 0/57. Band 2%: 31 exits, 18 higher. k=24: 266,687.30, 69/669.
  All asserted in `tests/planning-trend-rule.test.mjs`.
- Prose figures checked against the model: ratio low 0.876 (1974-03), peak 2.718 (2009-02), end 1.394; episodes
  2008-06→2009-02 −43.0%/−5.0%, 2000-08→2002-09 −42.7%/−14.8%, 1973-10→1974-09 −34.5%/−7.1%; Oct 1987 −22.6% in one month;
  T-bills 6.4–9.1% (1974-03..1975-01) and 11.2–20.8% (1981-07..1982-10).
- `npm test` 1,861 passed; Python unittest OK; `npm run zh:refresh` missing 0 after 120 Chinese units written directly
  and merged through the tag, number and `&amp;` guards (`qa/trend-rule-2026-10-27/merge_zh.py`).
- Node fuzz (81 cases incl. every field at min/max, rendered at 340 and 960 px): no NaN/Infinity/undefined.
- Local browser preview was not available in this unattended run (server start declined); browser checks were done
  on the live site after deployment (below).

## Deployment (2026-10-27) — pending

Pinned base `b6d86f73` (origin/main at start, unchanged when re-fetched before pushing). Article commit `310f0ced`
pushed to `main` as a fast-forward (branch `claude/planning-visual-20261027k` in the reused
`tickerlantern-wealth-career-20261025` worktree). `npx wrangler deploy` was refused by this unattended session's
permission policy, so the guide is in main but not live: after the push the live route returned 404 and the live
sitemap still had 746 URLs (without this guide or the child care guide `d07778b2`, also pending). Prior live pages
checked (monthly-saving guide 200) are unaffected.

Next step: from a clean checkout at current main, run `npx wrangler deploy` (rebuilds from source; keeps the
tickerlantern.com, www and est custom domains), then check EN/ZH routes 200 with 4 figures and 4 tables, homepage /
research / ZH homepage links, search index, sitemap count = dist, SHA-256 of live `planning-trend-rule-models.js`,
`planning-record-high-models.js`, `planning-models.js`, `planning-ui.js`, `planning-charts.js` against dist, all
previous sitemap URLs 200, and a 375 px browser pass (typing 2009 as first year should show CAD 30,094 vs 16,507).
