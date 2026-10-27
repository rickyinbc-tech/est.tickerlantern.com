# Buying at a record high, and the same fund at death in three accounts

Two English articles dated 27 October 2026, each with four figures, chart data tables and editable inputs, plus Simplified Chinese editions:

- `buying-at-record-high-sp-tsx-record-months-what-followed-1956-2023` (`recordHigh`, 7 inputs). Charts: (1) S&P/TSX Composite quarter-end close, as published and in September 2023 prices (official); (2) distance of every month-end close below the running peak (derived from official); (3) median price change 1/3/5/10 years after record months vs all other months (derived from official); (4) heatmap, share of starting months by distance below the peak after which index + assumed yield − fee beat assumed cash (official index · hypothetical constants). Themes: market timing, fear of a crash, lump sum vs paycheque saving, balanced-fund long-term investing, TFSA vs taxable exit cost.
- `same-fund-at-death-tfsa-rrsp-rrif-taxable-account-what-heirs-receive` (`estateAccount`, 10 inputs). Charts: (1) stacked split at death per account (heir, final-return tax, probate, tax paid on distributions while alive); (2) amount received by a child by years until death, three accounts; (3) child vs spouse rollover; (4) heatmap, taxable received as a share of TFSA received by return and years. All hypothetical; no official statistics answer this question. Themes: tax-efficient investing through funds and account wrappers, the account vs the investment, RRSP deduction fairness, lump sum already held.

Topic selection: 365 guides at start (live sitemap 738 URLs). No existing guide used S&P/TSX history or asked what followed record highs (the dip-waiting, exit/re-entry, missed-best-months and crash-signal guides use authored paths). No guide compared accounts at death (estate liquidity covers timing only; deemed disposition appears only in passing). Currency hedging was considered and dropped because `currency-cad-hedging` already exists. Other worktrees had no uncommitted work on these topics.

## Sources (reviewed 27 Oct 2026)

- Statistics Canada table 10-10-0125-01, Toronto Stock Exchange statistics, S&P/TSX Composite close, vector v122620. Table page: release date 2023-11-01 (last update). WDS `getDataFromVectorsAndLatestNPeriods` returned 813 contiguous monthly values Jan 1956 (525.63) to Sep 2023 (19,541.27); SHA-256 be4dc8b7…4e03c10c. Price index only.
- Statistics Canada CPI vector 41690973 via WDS, same file as the previous run (SHA-256 dd3e814c…c148b440); Jan 1956 14.2, Sep 2023 158.5.
- Justice Laws, Income Tax Act s.70 (70(5) deemed disposition at FMV, 70(6) spouse rollover) and s.146.3 (146.3(6) RRIF FMV deemed received, 146.3(6.1) designated benefit), fetched from the shell.
- CRA (read through the in-app browser because canada.ca timed out from the shell): deceased persons capital gains page (mutual funds included; spouse rollover, vested within 36 months, election out); deceased persons RRIF and RRSP pages (full FMV included unless paid to and transferred by a spouse); TFSA designated beneficiary page (no tax up to FMV at death; post-death earnings taxable; 1 Jan 2026 exempt-contribution change; Quebec limits). One-half inclusion rate per CRA's capital gains page as cited by earlier runs. The old `deceased-persons-tfsa.html` and `death-a-tfsa-holder` URLs are 404/redirected; current URL used.
- Ontario Estate Administration Tax page (updated 2026-06-24): CAD 15 per CAD 1,000 above CAD 50,000; used only as an example.
- Raw downloads kept in session scratch only; nothing private used.

## Model and calculations

Record high: running peak from Jan 1956; a month is a record if close ≥ peak × (1 − near%). Months counted from January of the chosen first year, with a full horizon of data after them. Price change = close(t+h)/close(t) − 1; real = (1+price)/(CPI ratio) − 1. Cash test: (1+price)(1 + yield − fee)^years ≥ (1+cash)^years.
Estate: TFSA and RRSP/RRIF grow at r with no withdrawals. Taxable: each year distribution = d × start value, value × (1+r), cost += distribution, tax = distribution × life rate paid by a unit sale grossed up for the half-taxed gain on the sale. At death: RRIF tax = value × final rate; taxable tax = max(0, gain)/2 × final rate; spouse = deferred; probate = rate × value for the taxable account and for registered accounts without a named beneficiary.

Independent check (`qa/record-estate-2026-10-27/`, Python Decimal 40 digits, from the raw WDS file): 144 records of 801 months; 5-year medians 18.86093580% (record) and 30.63105785% (other); lower after 21.875% vs 9.1354%; cash beat 74.2188%; 1-year 1.16527835% / 8.46096108%, lower 43.75% / 32.25%; 10-year 1 of 119 lower. Spells: deepest 45.05% 2000-08→2002-09, regained 2005-12; longest 73 months twice; 9 falls ≥ 20%. From 1991: 70 records, median 12.22%, 1/3 lower. Estate (200,000; ACB 70%; 5%; 2% dist; 30%; 15 yrs; 45%; 1.5%): TFSA 415,785.64; RRIF heir 228,682.10; taxable value 379,484.11, life tax 26,268.76, gain 172,928.96, death tax 38,909.02, probate 5,692.26, heir 334,882.84; no beneficiary named probate 18,165.83.

A data-embedding defect was caught by the new tests before publishing: the first export used `%g`, which rounded closes to six significant digits (19,541.27 → 19,541.3). The arrays were regenerated at full precision and checked value by value against the WDS file; all figures above are from the corrected data.

## Checks

- `npm test`: 1,848 tests, 0 failures (new `tests/planning-record-high.test.mjs`, `tests/planning-estate-account.test.mjs`). Python unittest OK. `npm run zh:refresh`: missing 0; numeric guard kept English for 0 of 45,421. 238 Chinese units written directly and merged after tag-count, markup, number, `&amp;` and CJK checks.
- Built HTML: EN and ZH pages each 4 figures and 4 tables (7 and 10 inputs); homepage, research index, Chinese home, search index and sitemap (742 URLs, 738 live before) entries present; both model modules emitted in `dist/research/` and imported by `planning-models.js`.
- 836 calculator cases (defaults, each field at min and max, 800 random) produced no NaN, Infinity or undefined, and every chart rendered at 340 px and 760 px.
- Known cosmetic limit kept as elsewhere on the site: the year input hint shows "Range 1,957 to 2,013".

## Release status

Pinned base `036a9198` (origin/main at start, unchanged when re-fetched before pushing). Article commit `87bd5db7`
pushed to `main` as a fast-forward (branch `claude/planning-visual-20261027h` in the reused
`tickerlantern-wealth-career-20261025` worktree).

## Deployment (pending)

`npx wrangler deploy` from the clean checkout of `87bd5db7` was blocked by this unattended session's permission policy
(production deploy). The repository has no deploy-on-push workflow. On 2026-10-27 after the push: all four new EN/ZH
routes returned 404; existing guides (FTHB GST rebate, inflation windows), the homepage and research index returned
200; the live sitemap had 738 URLs against 742 in local `dist`.

Required action: from a clean checkout of `main` at `87bd5db7` or later, run `npx wrangler deploy` (no config change;
custom domains kept). Then verify: the four new EN/ZH routes return their article with 4 figures and 4 tables;
homepage, research index, Chinese homepage, search index and sitemap (742) list them; SHA-256 of live
`planning-record-high-models.js`, `planning-estate-account-models.js` and `planning-models.js` match `dist`; prior
sitemap URLs still return 200; then exercise the inputs and check 375 px and 1280 px layouts in a browser.
