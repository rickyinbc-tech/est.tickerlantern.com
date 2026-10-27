# US dividend withholding by account and inflation-taxed capital gains

Two English articles dated 26 October 2026, each with four figures, chart data tables and editable inputs, plus Simplified Chinese editions:

- `us-dividend-withholding-tax-rrsp-tfsa-non-registered-fund-structure` (`usWithholding`): the same US stocks held four ways (US-listed ETF or Canadian-listed fund; RRSP/RRIF, TFSA/FHSA/RESP, taxable). One year of dividends by destination, shortfall vs no-withholding over time, break-even years for a US-listed ETF in an RRSP (conversion cost both ways) vs a Canadian-listed fund (withholding every year), and loss per CAD 100,000 by yield and horizon. Tax-efficient fund theme; separates the account's rules from the fund structure.
- `capital-gains-tax-on-inflation-real-after-tax-return-fund-non-registered-tfsa` (`inflationGainTax`): the inflation part of a nominal gain is taxed because the ACB is not indexed. Waterfall of real/inflation parts and tax on each, effective tax on the real gain by real growth × inflation, September CPI 2006–2025 → Sept 2026 rise needed per CAD 10,000 and its tax, and real after-tax paths (TFSA, deferred gain, interest taxed yearly). Inflation/purchasing-power and wrapper themes; distinguishes new pay from moving an existing holding.

Not duplicated: asset location, fund income type, pre-distribution, NAV/total return, gain timing, taxable interest after inflation (all cross-linked). No other local checkout had unmerged guide work at start.

## Sources (26 Oct 2026)

- Canada–US Convention, Department of Finance consolidated text to the 2007 Protocol (WebFetch): Art. X(2)(b) 15% cap; Art. XXI(2) pension/retirement arrangement exemption for dividends and interest. Treaty PDFs from IRS/Treasury were fetched but not text-extracted (no PDF tool); not relied on.
- CRA Folio S5-F2-C1 ¶1.69 (foreign tax on RRSP/TFSA income not counted for FTC) and ¶1.22 (excess over 15% deductible).
- CRA line 40500 (page date 2026-08-14); CRA Tax treatment of mutual funds (2026-02-05; T3 boxes 25/34 → T2209); CRA RC4466 (marked cancelled; foreign withholding sentence); CRA Investments in your FHSAs (2026-02-02); CRA capital gains page (2026-02-05; 50% example, no indexing).
- Statistics Canada CPI v41690973 via Bank of Canada Valet JSON from 2005-01, retrieved 26 Oct 2026; SHA-256 77d87ea21328d9adf7ffb53e52e87ac2f05c20c597e1ccdf1e1a5ca49e08a0ba (file in session temp only, not committed). Sept values 2006 109.2 … 2025 164.9, 2026 170.0 (matches the 26 Oct TFSA record).
- 2026 federal 20.5% + Ontario 9.15% = 29.65% reused from the 25–26 Oct reviews.

## Calculations (40-digit Python Decimal, asserted in `tests/planning-withholding-inflation.test.mjs`)

Withholding (defaults $100,000, 1.5% yield, 5% growth, 15%, 29.65%, 1% FX each way, 25 years): dividend 1,500; lost 225; taxable account credited 225, further Canadian tax 219.75, kept 1,055.25. Year 25: no-withholding 482,769.91; Canadian-listed fund in RRSP/TFSA 457,907.59 (short 24,862.32); US-listed in TFSA 448,795.23 (33,974.68); US-listed in RRSP 473,162.79 (9,607.12). Break-even 10 years; 1.5%/0.25% → 3; 0.5%/2% → 57. Loss per 100k: 0.5% yield 464 (5 yr), 10,520 (30 yr); 4% yield 4,188 (5), 202,478 (30).

Inflation gain (defaults $10,000, 4% real, 2.5% inflation, 20 years, 29.65%): nominal 6.6%; value 35,904.10; gain 25,904.10; inflation part 6,386.16 (24.7%); tax 3,840.28 of which 946.75 on inflation; effective tax on real gain 19.68% vs statutory 14.825%; interest taxed yearly 56.96% (real after-tax ~2.1%/yr). 1% real / 4% inflation → 51.4%. CPI: from Sept 2006 the rise needed is 5,567.77 per 10,000, tax 825.42.

## Checks

- `npm test`: 1,759 tests, 0 failures (includes 800 random valid inputs per guide rendered at 720 and 360 px). `npm run zh:refresh`: missing 0; numeric guard kept English for 0 of 43,340. 233 Chinese units written directly, merged after tag-count, markup and number checks (`qa/planning-withholding-inflation-2026-10-26/`, ignored).
- Built HTML: EN and ZH pages each 4 figures, 4 tables (7 and 5 inputs); homepage, research index, Chinese home, search index and sitemap entries present; `dist/research/planning-withholding-inflation-models.js` emitted.
- Local browser preview: starting a local preview server was declined in this unattended run, so no local desktop/phone browser pass.

## Release status

Pinned base `39b32512` (origin/main at start, unchanged when re-fetched before pushing). Source commit `103475c1` was pushed to `main` as a fast-forward on 26 October 2026 (branch `claude/fund-planning-20261026c` in this checkout). Before the deploy attempt the live sitemap (662 URLs) was a strict subset of local `dist` (700): no live-only URLs; 38 local-only URLs = this batch's four (EN + ZH) and 34 from earlier batches already on `main` but never deployed.

`npx wrangler deploy` was denied again by the unattended run's permission policy (Production Deploy); it was not retried or worked around. After the push the homepage, research index and Chinese hub returned 200, existing guides checked (market timing, balanced-fund crash) returned 200, and the new URLs, `planning-withholding-inflation-models.js` and earlier undeployed guides (e.g. the TFSA indexation guide) returned 404. No browser pass of the new pages: the local preview server was declined and the pages are not live.

Next authorized step: from a clean checkout of current `main`, run `npx wrangler deploy` (it rebuilds from source), then verify every local-only URL, `planning-withholding-inflation-models.js`, homepage/library/sitemap entries and phone/desktop layouts.
