# Balanced-fund withdrawals when the crash comes first

One English article dated 27 October 2026, with four figures, chart data tables and eight editable inputs, plus a Simplified Chinese edition:

- `balanced-fund-withdrawals-crash-first-reverse-dollar-cost-averaging-cash-reserve` (`withdrawSequence`): fixed, inflation-indexed monthly withdrawals from one balanced fund. Charts: (1) September CPI 2006–2026 applied to the user's monthly withdrawal (official); (2) units sold each month, crash in year 1 vs no crash (reverse dollar-cost averaging); (3) 30-year value with no crash / crash in year 1 / crash in year n−1 using the same set of yearly returns; (4) grouped bars for a 0–3-year cash reserve under each path. Themes: crash fear, balanced funds, inflation/purchasing power, DCA mirror; separates account tax rules (RRIF, TFSA, non-registered) from market risk and the drawdown phase from paycheque saving and lump-sum staging (cross-linked).

Not duplicated: contribution sequence risk, paycheque contributions through a crash, withdrawal sale sources, spending guardrails, rebalancing drift, non-registered withdrawal ACB, T-series (all cross-linked). At start no other local checkout had unmerged guide work beyond `main`.

## Sources (27 Oct 2026)

- Statistics Canada CPI v41690973 (table 18-10-0004-01) via Bank of Canada Valet JSON from 2005-01, retrieved 27 Oct 2026; SHA-256 77d87ea21328d9adf7ffb53e52e87ac2f05c20c597e1ccdf1e1a5ca49e08a0ba (identical to the 26 Oct file; kept in session scratch only, not committed). Sept 2006 109.2 … Sept 2025 164.9, Sept 2026 170.0.
- Bank of Canada, Inflation page: 2% midpoint of 1–3% target, total CPI y/y (default indexation).
- CRA RRIF page (dated 2026-01-06): payments taxable on receipt. CRA "What is the TFSA" (2026-09-17): tax-free withdrawals. CRA "Withdrawing from your TFSA" (2026-02-20): room added back 1 January following year. CRA Tax treatment of mutual funds (2026-02-05): redemption gain/loss, average-cost ACB.
- Two CRA URLs tried first (`.../tax-free-savings-account/withdrawing.html`, `.../rrif/receiving-income-a-rrif.html`) returned 404 and are not cited.

## Model and calculations

Fund starts at CAD 10/unit; withdrawal paid at the start of each month by selling units; price then grows at the monthly equivalent of that year's return. Crash year −d, next year (1+r)²/(1−d)−1, so every path has the same growth factors (asserted: identical ending value with no withdrawals). Cash reserve is carved from the start money, pays withdrawals only while the price is below its earlier month-start high, earns the cash rate, not refilled.

Defaults ($500,000; 4.5%; +2%/yr; 5%; −25% then +47%; 1-year reserve at 3%; 30 years), reproduced with 40-digit Python Decimal and asserted in `tests/planning-withdraw-sequence.test.mjs`: no crash 227,419.53; crash year 1 192,051.54; crash year 29 211,711.75; crash year 1 with 1-year reserve 210,899.76; extra units sold in years 1–2 818.34. Reserve grid (no crash / year 1 / year 29): 0 yr 227,420 / 192,052 / 211,712; 1 yr 184,789 / 210,900 / 183,303; 2 yr 142,159 / 208,057 / 143,071; 3 yr 100,541 / 165,427 / 100,440. CPI: $1,875 (Sept 2006) → $2,918.96 (Sept 2026); fixed $1,875 = $1,204.41 in 2006 prices. Text checks: 5%/40% early crash runs out month 345; 6%/25% runs out months 268 (early) and 277 (no crash); 4%/25% gap ≈ 31,438; total paid ≈ 912,784.

## Checks

- `npm test`: 1,790 tests, 0 failures. `npm run zh:refresh`: missing 0; numeric guard kept English for 0 of 43,915. 119 Chinese units written directly and merged after tag-count, markup and number checks (`qa/withdraw-sequence-2026-10-27/`, ignored).
- Built HTML: EN and ZH pages each 4 figures, 4 tables, 8 inputs; homepage, research index, Chinese home, search index and sitemap entries present; `dist/research/planning-withdraw-sequence-models.js` emitted and imported by `planning-models.js`.
- Local browser preview: starting a local preview server was declined in this unattended run, so no desktop/phone browser pass.

## Release status

Pinned base `97b55ec7` (origin/main at start, unchanged when re-fetched before committing).
Source commit `f279c303` was pushed to `main` as a fast-forward on 27 October 2026 (branch `claude/planning-visual-20261027c`).

Before this deploy the live sitemap had 662 URLs; every earlier batch since 25–26 October had been pushed to `main` but its deploy was blocked. `npx wrangler deploy` from a clean checkout of `f279c303` succeeded this run (Worker `tickerlantern-est`, version `1c321dbc-0a5e-4ff2-b7a4-56c4be6d5ba5`; 627 new files uploaded), so it published this guide and the 54 earlier pending URLs at once.

After deployment:
- Live sitemap 716 URLs = local `dist` 716; no live-only or local-only URLs; all 716 returned HTTP 200.
- New EN and ZH pages: 4 figures, 4 tables, 8 inputs each; correct H1; listed on the homepage, research index, Chinese homepage and search index.
- SHA-256 of live `planning-withdraw-sequence-models.js`, `planning-models.js`, `planning-ui.js` and three earlier batch modules matched local `dist` byte for byte.
- Earlier guides (LLP repayment, T-series, paycheque contributions through a crash, US withholding) returned 200.
- Live browser check (built-in browser, public URL): defaults matched the tested values; changing the crash to 40% recalculated (crash year 1 → $163,669.27, crash year 29 → $199,106.50, reserve → $198,590.16); 375 px phone and 1024 px desktop had no horizontal page overflow; all four SVG charts rendered with data tables. A local preview server was declined, so the check was on the live site only.
