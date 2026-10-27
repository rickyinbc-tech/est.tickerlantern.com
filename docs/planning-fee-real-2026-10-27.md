# Fund fees measured against the real return

One English article dated 27 October 2026, with four figures, chart data tables and eight editable inputs, plus a Simplified Chinese edition:

- `fund-fee-share-of-real-return-after-inflation` (`feeRealReturn`): the same fee as a share of the return before inflation and of the real return after it. Charts: (1) Canadian annual-average CPI inflation 1996–2025 and the trailing ten-year compound average (official); (2) waterfall: return before fees − fee − purchasing power lost to inflation = real return after fees (exactly additive); (3) plan value in today's dollars for no fee (reference), fee A, fee B and the amount put in; (4) heatmap of real return after fees by inflation (1–5%) and fee (0–2.5%). Themes: inflation and purchasing power, long-term balanced-fund investing, fees, tax wrappers (TFSA, RRSP, non-registered; MER not a separate deduction, line 22100 carrying charges exclude registered plans; tax on nominal gains), paycheque saving vs an existing lump sum (cross-linked to phased investing).

Topic selection: 347 guides checked. Fee guides (long-term fee plan, series comparison, advice fees) compare dollars at a nominal return; none measures the fee against the real return. A first candidate (spending vs reinvesting the RRSP refund) was dropped because the refund-at-source guide already covers the refund-spent path. At start the only unmerged local work elsewhere was an untracked offset-account model in an unrelated checkout.

## Sources (27 Oct 2026)

- Bank of Canada Valet V41690973 total CPI (Statistics Canada table 18-10-0004-01), monthly Jan 1995–Sep 2026: 381 values, none missing; SHA-256 ae48c5271f11c12a095b628c1307c50b09d68a58e73b46fb2a70cbd50ce3c29e. Raw download kept in session scratch only, not committed. Twelve-month sums embedded; Sept 2025 164.9, Sept 2026 170.0.
- Bank of Canada Inflation page: 2% midpoint of 1–3% target, total CPI y/y.
- OSC GetSmarterAboutMoney Mutual fund fees (last updated 26 Sep 2023): MER = management fee + operating expenses, paid from fund assets, returns reported after it, range under 1% to over 3%, trailers inside MER.
- CRA line 22100 (2026-01-20): investment management/advice fees deductible, registered-plan fees not. CRA What is a TFSA (2026-09-17). CRA RRSP (2026-05-07).

## Model and calculations

Annual: net = (1+g)(1−f)−1; real before = (1+g)/(1+i)−1; real after = (1+net)/(1+i)−1; share = (realBefore−realAfter)/realBefore (undefined when realBefore ≤ 0). Monthly path: balance × (1+g)^(1/12) × (1−f)^(1/12) + saving at month-end; saving raised by inflation each year when indexed; real values divide by (1+i)^(k/12).

Defaults (start 10,000; 500/month indexed; 6% before fees; 2.5% inflation; fees 0.5% and 2%; 25 years), reproduced with 40-digit Python Decimal and asserted in `tests/planning-fee-real.test.mjs`: real before fees 3.4146%; after 0.5% 2.8976%, after 2% 1.3463%; 2% fee share of real return 60.571%, of nominal 35.333%; 0.5% share 15.143% / 8.833%. Waterfall 6% − 2.12 − 2.5337 = 1.3463. Real values: no fee 254,711.65; 0.5% 236,224.59; 2% 189,635.14; put in 158,010.82; fees in today's dollars 13,744.64 / 47,839.92. Not indexed (2%): 148,935.18. Lump sum 100,000, no saving: 204,233.52 (0.5%) / 139,701.76 (2%). CPI: 2022 6.80%, 2009 0.30%, 10-yr to 2025 2.636%/yr, 20-yr 2.165%/yr, Sept 2026 y/y 3.09%. Heatmap text checks: 1% infl 2.85%, 4% −0.115%, 5% −1.07%, 0.5% fee at 4% 1.41%.

Edge cases exercised through the model: return below inflation (share shown as Unavailable, note explains), −2% return with 4% fee over 50 years, zero saving, fee A above fee B over 1 year (gap stated as which line leads; singular "year").

## Checks

- `npm test`: 1,809 tests, 0 failures. `npm run zh:refresh`: missing 0; numeric guard kept English for 0 of 44,452. 108 + 1 Chinese units written directly and merged after prefix, tag-count, number and CJK checks (`qa/fee-real-2026-10-27/`, `qa/fee-real-fix-2026-10-27/`, ignored).
- Built HTML: EN and ZH pages each 4 figures, 4 tables, 8 inputs; homepage, research index, Chinese home, search index and sitemap entries present (sitemap 724 URLs); `dist/research/planning-fee-real-models.js` emitted and imported by `planning-models.js`.
- Local browser preview was declined by the session's permission check; layout was checked on the public URL after deployment (see release status).

## Release status

Pinned base `99c59849` (origin/main at start, unchanged when re-fetched before committing).
