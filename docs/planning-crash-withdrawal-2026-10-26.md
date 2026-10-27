# Paycheque contributions through a crash and non-registered fund withdrawals

Two English articles dated 26 October 2026, each with four figures, chart data tables and editable inputs, plus Simplified Chinese editions:

- `keep-or-pause-monthly-fund-contributions-during-market-crash` (`crashContribution`): monthly contributions from pay continued through a hypothetical fall and recovery, against holding them in cash until the old peak returns. Paths against money put in, account/contribution ratio against the market, per-year contribution blocks valued at the old peak, and a break-even heatmap by fall depth and starting balance. Distinct from the waiting-for-a-dip, income-interruption, exit/re-entry and lump-sum phasing guides, which it cross-links; it is about earned-pay contributions, not staging an existing lump sum.
- `non-registered-fund-withdrawals-taxable-gain-share-cost-base` (`fundWithdrawalTax`): redemptions from a non-registered fund split into returned ACB, untaxed and taxable halves of the gain; same withdrawal compared across TFSA, RRSP/RRIF and cost bases; 20-year value/ACB/deferred-tax path; tax-per-dollar heatmap by cost base and growth. Distinct from the sale-proceeds earmark, distribution-tax and fund-switch guides, which it cross-links.

The models were begun by an earlier run (untracked `src/planning-crash-withdrawal-models.js`) and completed in this run: null break-even metrics now read "Not within the horizon", the heatmap has its own unit label, an unverified death-disposition sentence was replaced with CRA's deemed-disposition definition, and the withdrawal default is 20 years (the 25-year default runs out in year 24, which the article now states).

## Sources (reviewed 26 Oct 2026 in the in-app browser; `curl` to canada.ca hung, so no source bytes saved)

- CRA, Current year tax rates and income brackets (2026): federal 14% to 58,523, 20.5% to 117,045, 26% to 181,440, 29% to 258,482, 33% above; Ontario 5.05% to 53,891, 9.15% to 107,785, 11.16%, 12.16%, 13.16%; BC 5.6% to 50,363, 7.7% to 100,728.
- CRA, Tax treatment of mutual funds: distributions taxable including reinvested; redemption gains usually capital gains; identical-property average cost; group same-year redemptions; ACB per class/series.
- CRA, Calculating and reporting capital gains and losses: deemed disposition definition; 1/2 inclusion rate referenced.
- CRA, RRSP tax rates on withdrawals: 10% / 20% / 30% outside Quebec (5,000 and 15,000 thresholds).
- FINRA, Dollar-cost averaging (benefits and limits; per-transaction fees). OSC GetSmarterAboutMoney volatility (4 Aug 2026) and diversification (14 Oct 2026) pages, reused from the earlier same-day review.
- Statistics Canada WDS (table 10-10-0125-01, TSX statistics) returned its "website unavailable" page during this run, so no dated official market chart was added; both articles label every chart hypothetical.

## Calculations (defaults)

Crash: 20,000 start, 500/month, −35% over 18 months, 42 months back (peak regained month 60), 6%/yr after, cash 2.5%, 96 months. Continued back above contributions month 46; paused month 53. Month 18: 20,400.12 vs 29,000 put in (paused 22,159.32). Month 60: 57,499.58 vs paused 51,897.73 on 50,000. Month 96: 88,104.28 vs 81,432.40 on 68,000; cash 0% → 79,172.17. Average contribution price to month 60 = 0.80001 of peak. Block returns at peak: 17.23%, 46.74%, 35.42%, 19.74%, 5.87%.

Withdrawal: value 300,000, ACB 200,000, 18,000 rising 2%, growth 4%, distributions 1.5% taxed at full rate, 20.5% + 9.15%, 20 years. Year 1: ACB out 12,000, gain 6,000, tax 889.50; distribution tax 1,254.195. Year 20: redemption 26,222.60, gain share 58.5%, gain tax 2,273.54, distribution tax 415.11. Totals: redeemed 437,352.66, tax 50,674.35 (gains 31,605.04, distributions 19,069.32), 11.587% per dollar. End value 98,468.00, ACB 40,149.51, deferred tax 8,645.72. Wrapper bars for 18,000: 0 / 0 / 889.50 / 2,668.50 / 5,337.

All defaults reproduced with 40-digit Python Decimal (`qa/planning-crash-withdrawal-2026-10-26/check.py`, ignored) and asserted in `tests/planning-crash-withdrawal.test.mjs`.

## Checks

- `npm test`: 1,741 tests, 0 failures. `npm run zh:refresh`: 0 missing units; numeric guard 0 rejections of 42,473. The 232 Chinese units were written directly (no external translation service) and merged only after numguard agreement and identical-markup checks (`qa/planning-crash-withdrawal-2026-10-26/merge_zh.py`).
- Built HTML: English and Chinese pages each have 4 figures, 4 data tables and 8/9 inputs; homepage, research index, Chinese hub, search index and sitemap entries present; `dist/research/planning-crash-withdrawal-models.js` emitted.
- 6,000 random valid input sets across both models: no exceptions, no non-finite chart values or metrics.
- Local browser preview of `127.0.0.1` was denied in this unattended run, so no local browser pass is claimed.

## Release status

Pinned base `4be63962` (origin/main at start, unchanged when re-fetched before publishing). Source commit `d9ba024a` was pushed to `main` as a fast-forward on 26 October 2026. Before pushing, the live sitemap was a strict subset of local `dist`: no live-only URLs; 26 local-only URLs, which are this batch's four plus earlier guides already on `main` but never deployed (including the balanced-fund joint-decline, fund tax-loss, medical expense credit and disability credit transfer guides).

`npx wrangler deploy` (Wrangler 4.153.0) was blocked again by the unattended run's permission policy (Production Deploy). After the push, the homepage, research index, Chinese hub and existing guides returned 200; the two new URLs returned 404. The next authorized `npx wrangler deploy` from current `main` (Wrangler rebuilds from source) will publish all 26 URLs. After it, verify each URL, the module `planning-crash-withdrawal-models.js`, homepage/library/sitemap entries, and phone/desktop layouts.
