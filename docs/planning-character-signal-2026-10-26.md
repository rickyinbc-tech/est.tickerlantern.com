# Fund income type and crash-warning false alarms

Two English articles dated 26 October 2026, each with four editable figures and chart data tables, plus Simplified Chinese editions:

- `fund-income-type-interest-dividends-capital-gains-after-tax-return` (`incomeCharacter`): the same pre-tax return paid as interest, eligible Canadian dividends, capital gains realized yearly, gains deferred to sale, or inside a TFSA. Distinct from the TFSA asset-location, distribution-provision, return-of-capital and gain-timing guides, which it cross-links.
- `market-crash-warning-false-alarms-cash-break-even` (`crashSignal`): a crash signal with correct warnings, false alarms and unwarned crashes; the hit rate needed to break even. Distinct from the exit/re-entry, missed-best-months and dip-waiting guides.

## Dated sources (all reviewed 26 October 2026)

- CRA 5000-G 2025 guide, downloaded 26 Oct 2026, SHA-256 `1f263de22ae9e2c1c1d5749c249cd38a76adf6a9b7b83c24caed14dfb07a316f`: 138% / 115% gross-up (line 12000), federal DTC 15.0198% / 9.0301% (line 40425).
- CRA Worksheet ON428 (2025) 5006-D, SHA-256 `0bc3a1d80c8465db6c16a9dd95a0c46ff27d06dc3dcbda21b99194db78a6432f`: Ontario DTC 10% eligible, 2.9863% other.
- CRA current-year rates (2026), page dated 25 June 2026: federal 14% / 20.5% / 26% / 29% / 33% at 58,523 / 117,045 / 181,440 / 258,482; Ontario 5.05% / 9.15% / … / 13.16%.
- CRA lines 12000/12010 page; CRA mutual-fund tax treatment (5 Feb 2026); CRA capital gains page (one-half inclusion); CRA What is a TFSA (17 Sep 2026).
- FINRA Market timing (10 Jun 2025), FINRA Dollar-cost averaging (19 May 2026), OSC GetSmarterAboutMoney volatility page (updated 4 Aug 2026). Paraphrases were checked against each page; no figures are taken from them.

Source PDFs are kept only in the session scratchpad, not committed.

## Calculations (defaults)

Income type: CAD 50,000, 6% pre-tax, 3% eligible-dividend yield, 20.5% + 9.15% rates, 10% provincial DTC, 20 years. Eligible-dividend rate 1.38 × (0.2965 − 0.150198 − 0.10) = 6.389676%. After tax: interest 114,307.4989; dividend 146,641.9442 (yearly tax 3,453.92, sale tax 8,013.62); high turnover 135,485.2584; deferred 143,996.3819 (sale tax 16,360.39); TFSA 160,356.7736. Interest yearly tax 27,103.30, lost compounding 18,946. Top bracket (33% + 13.16%): 94,433 / 124,255 / 123,272 / 134,886 / 160,357. Lowest (14% + 5.05%): dividend rate −8.238324%.

Crash signal: CAD 100,000, 25 years, 6 warnings (2 correct), 1 unwarned crash, −25% crash, +25% rebound, 6% ordinary, 2.5% cash, 2 years out. Invested 100,000 × 1.06^19 × 0.9375^3 = 249,301.7168; acting on warnings 100,000 × 1.06^11 × 1.025^12 × 0.9375 = 239,343.7984 (−9,957.92). Break-even hit rate 37.0852%. Correct warning +12.0667% per episode, false alarm −6.4947%. Three correct: +31,333.51; one: −59,445.97.

All defaults were reproduced with 40-digit Python Decimal arithmetic (`qa/planning-character-signal/check.py`, ignored) and are asserted in `tests/planning-character-signal.test.mjs`.

## Checks

- `npm test`: 1717 tests, 0 failures. `npm run zh:refresh`: numeric guard 0 rejections, 0 missing units. The 230 Chinese units were written directly (no external translation service) and checked by `numguard` before insertion.
- Built HTML: 4 figures, 4 tables and 7 / 10 numeric inputs per page (English and Chinese); homepage, research index and sitemap entries present; the built `planning-models.js` returns 4 charts and 6 metrics for each new kind.
- Browser QA: the in-app preview server start was declined in this unattended run. No browser pass is claimed.

## Release status

Pinned base `b2bab283` (origin/main at start). Deployment results are appended below.
