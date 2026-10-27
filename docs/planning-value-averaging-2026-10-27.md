# Value averaging versus dollar-cost averaging through a crash

One English article dated 27 October 2026, with four figures, chart data tables and nine editable inputs, plus a Simplified Chinese edition:

- `value-averaging-vs-dollar-cost-averaging-cash-pot-after-crash` (`valueAveraging`): the same monthly paycheque saving invested by plain dollar-cost averaging or by value averaging (top the fund up to a target path; sell above it, optionally). Charts: (1) CAD 10,000 rolled in 3-month treasury bills Sept 2006–Sept 2026, nominal and in Sept 2006 prices (official); (2) monthly amount each rule asks to invest in the three years around the crash; (3) value-averaging cash pot: crash / no crash / crash with no selling; (4) grouped totals (fund + cash) for no crash, crash in the chosen year and crash in year n−1. Themes: DCA, crash fear, market timing, inflation/purchasing power of waiting cash, account wrappers (TFSA room trap, RRSP, non-registered realized gains), paycheque saving vs staging a lump sum (cross-linked).

Not duplicated: equal-cash unit averages, pausing contributions in a crash, lump-sum phasing, waiting-for-a-crash cash break-even, income-interruption cash floor, rebalancing with new contributions (all cross-linked). At start no other local checkout had unmerged guide work beyond `main` (one untracked offset-account model in an unrelated checkout).

## Sources (27 Oct 2026)

- Bank of Canada Valet V122531 "Treasury Bills - 3 month" (Statistics Canada table 10-10-0122-01, release 9 Oct 2026), monthly from 2006-01: 249 values, none missing; SHA-256 75a2f6acf46c5682a8880c2872d1ab4b69f24feb655ea94fe0a37a70fb90565b. Sept 2006 4.15%, low 0.06% (Jan 2021), high 5.08% (Aug and Oct 2023), Sept 2026 2.39%.
- Valet V41690973 total CPI from 2005-01; SHA-256 77d87ea21328d9adf7ffb53e52e87ac2f05c20c597e1ccdf1e1a5ca49e08a0ba (same file as the 26–27 Oct runs). Sept 2006 109.2, Sept 2026 170.0.
- Raw downloads kept in session scratch only, not committed.
- CRA Withdrawing from your TFSA (dated 2026-02-20): room re-added 1 January next year; do not re-contribute same year without room; 1%/month on excess. CRA RRSP page (2026-05-07): income usually exempt while in plan; payments generally taxed. CRA Tax treatment of mutual funds (2026-02-05): redemption gain/loss, average-cost ACB.

## Model and calculations

Fund starts at CAD 10/unit; all trades at the start of each month. Target T(m)=T(m−1)(1+g)+saving, g = monthly equivalent of target growth. VA saving goes to a pot (which also starts with the buffer); buys limited to the pot; unpaid part recorded (count and largest single month), not carried as debt. DCA invests the saving; buffer stays in cash. Crash year −d, next year (1+r)²/(1−d)−1. Treasury-bill chart compounds yield/1200 monthly from Sept 2006 (approximation before tax).

Defaults ($500/month; $3,000 buffer; target 5%; return 5%; −25% in year 2; cash 2.5%; selling on; 10 years), reproduced with 40-digit Python Decimal and asserted in `tests/planning-value-averaging.test.mjs`: DCA 84,685.71, VA 84,071.66 (VA $614 behind); pot 6,575.63; max buy 833.99 (month 24); pot short 1 month (78.51 in month 25); average price DCA 12.0890, VA 12.1147. No crash: both 81,336.28 (identical when return = target). Crash year 9: DCA 83,716.66, VA 83,892.31; short 19 months, largest 15,798.06. No selling: pot 6,579.00. T-bills: 10,000 → 13,934.63 nominal, 8,950.95 in 2006 prices; CPI +55.68%. Text checks: buffer 0 → short 19 months; 10,000 → 0; target 3% → pot 13,361, total 83,369; target 7% → short 12 months, total 84,808; year-2 VA buys 8,849 at avg 9.097; year-3 buys 1,406.

Finding stated in the article: with target = expected return, VA buys more during the fall but much less in the rebound year (the rebound lifts the fund back to target), so its average purchase price was not lower and unspent savings idle in cash.

## Checks

- `npm test`: 1,800 tests, 0 failures. `npm run zh:refresh`: missing 0; numeric guard kept English for 0 of 44,174. 115 Chinese units written directly and merged after prefix, tag-count, number and CJK checks (`qa/value-averaging-2026-10-27/`, ignored).
- Built HTML: EN and ZH pages each 4 figures, 4 tables, 9 inputs; homepage, research index, Chinese home, search index and sitemap entries present (sitemap 720 URLs); `dist/research/planning-value-averaging-models.js` emitted and imported by `planning-models.js`.

## Release status

Pinned base `2b65a6ab` (origin/main at start, unchanged when re-fetched before committing). Article commit `bc110927` pushed to `main` as a fast-forward (branch `claude/planning-visual-20261027d`) and deployed with `npx wrangler deploy` (4.153.0) from a clean detached checkout of `bc110927`; the deploy rebuild left no diff. Worker `tickerlantern-est`, version `5f846ec7-5746-4616-a10e-e9141801ccfe`. Before it the live sitemap had 716 URLs; the training-credit guide (`2b65a6ab`, pushed earlier but not deployed) went live in the same deploy.

After that deploy: live sitemap 720 URLs = local `dist` 720, no differences, all 720 returned HTTP 200. New EN and ZH pages: 4 figures, 4 tables, 9 inputs, correct H1; listed on the homepage, research index, Chinese homepage and search index. SHA-256 of live `planning-value-averaging-models.js`, `planning-models.js`, `planning-ui.js`, `planning-withdraw-sequence-models.js` and `guides.css` matched local `dist`.

Live browser check (built-in browser, public URL): defaults matched the tested values; typing a 40% crash recalculated to DCA $87,373.34 / VA $85,928.53 / 8 short months, matching the model; sell switch 0 gave VA $86,490.36 and the no-selling note; Restore example returned the defaults; 375 px and 1280 px had no horizontal page overflow, all four SVG charts fit (339 px / 1152 px). The first sell-switch keystroke was lost while the viewport was being resized in the same batch; a dispatched input event then updated correctly. Metric money values drop a trailing zero (`$11.7`), the site-wide formatter's existing behaviour.

Follow-up: an impossible crash year (crash ≥ years) was rejected but not flagged on the field; the input issue now returns a message and flags both fields, like other modules. Committed and deployed as a second release (see git log).
