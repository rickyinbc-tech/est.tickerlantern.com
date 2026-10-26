# Balanced fund joint decline and fund tax-loss selling

Two English articles dated 26 October 2026, each with four figures, chart data tables and editable inputs, plus Simplified Chinese editions:

- `balanced-fund-stocks-bonds-fall-together-rate-rise-inflation` (`jointDecline`): a balanced fund in a year when stocks fall, bond yields rise and inflation jumps; shock-year waterfall to real value, nominal/real paths against a no-rise counterfactual, and a real-recovery heatmap by stock share and stock fall. Distinct from the balanced-fund crash, rebalancing-drift and single-bond duration/convexity guides, which it cross-links.
- `fund-tax-loss-selling-superficial-loss-switch-after-crash` (`lossHarvest`): realizing a capital loss on a non-registered fund and switching to a different fund, against holding, rebuying the same fund within 30 days, or buying it in a TFSA/RRSP. Distinct from the capital-loss carryback ledger, fund-switch gain break-even and TFSA in-kind guides, which it cross-links.

## Dated sources

- Statistics Canada table 18-10-0004-01, all-items CPI NSA (vector v41690973), WDS API, retrieved 26 Oct 2026, Dec 2020 to Sep 2026. Response SHA-256 `cd20e2d88ce105c6f0746bd7702a427da498c0936e87f25b29b19f615cdc3068`. Sep 2026 = 170.0 (+3.1% y/y); peak 8.1% Jun 2022.
- Bank of Canada Valet V39079 (overnight target) and BD.CDN.10YR.DQ.YLD (10-year benchmark), retrieved 26 Oct 2026, 2021-01-01 to 2026-10-23. Response SHA-256 `daa9a381ee1cc00fec2e3b8f66bf946fc903669525e2d878a8a829fc136ad940`. Month-end values: 10-year 1.42% (Dec 2021), 3.30% (Dec 2022), 3.99% (Sep 2026); policy 4.25% (Dec 2022), 5% (Jul 2023), 2.25% (Sep 2026).
- CRA Capital losses page (no page date; written for 2025), read in the in-app browser on 26 Oct 2026: superficial loss = same/identical property bought by you or an affiliated person from 30 calendar days before to 30 after the sale and still held 30 days after; loss not deductible, usually added to the ACB of substituted property you acquire; net capital loss carry back 3 years, forward indefinitely; inclusion rate 1/2 for 2001–2025. Direct `curl` to canada.ca failed (HTTP/2 stream error), so no source bytes were saved.
- OSC GetSmarterAboutMoney Diversification (last updated 14 Oct 2026): limits of diversification in extreme conditions; recoveries can take months or several years. Prior-reviewed pages reused: OSC volatility (4 Aug 2026), FINRA DCA (19 May 2026), CRA mutual-fund tax treatment (5 Feb 2026), CRA capital gains calculation, CRA What is a TFSA (17 Sep 2026).

Source responses are kept under ignored `qa/planning-visual-2026-10-26/src/`.

## Calculations (defaults)

Joint decline: CAD 100,000, 60% stocks, stocks −12%, yield 1.5% + 2 pp, duration 7, later stocks 6%, inflation 6.3% then 2.5%, 15 years. Bond shock return 1.5% − 7 × 2% = −12.5% (first-order, no convexity); fund −12.2% → 87,800; real 82,596.43 (−17.40%). Later fund return 5% (0.6 × 6% + 0.4 × 3.5%); no-rise path 93,400 then 4.2%. Nominal back above 100,000 in year 4; real in year 9; catches the no-rise path in year 10. Year 15: 173,837.99 vs 166,147.93; real 115,738.36.

Loss harvest: ACB 100,000, value 75,000, gains available 20,000, 40% now and later, 6% growth, 0 gap, 0.25% switching cost, 10 years. Loss 25,000; used 20,000; carried 5,000; saving 20,000 × ½ × 40% = 4,000. Hold after tax 127,450.86; switch 129,675.45 (+2,224.59); same-fund rebuy 127,144.73. Bridge: saving grown 7,163.39, switching cost −335.78, gap 0, extra tax −4,603.02. No gains: −306.13; 5 years at 50% later rate: −220.39; gap −0.5 pp: −2,989.85; 2% cost: +81.70. Unused losses at the final sale are given no value in either path.

All defaults were reproduced with 40-digit Python Decimal arithmetic (`qa/planning-visual-2026-10-26/check.py`, ignored) and are asserted in `tests/planning-shock-harvest.test.mjs`.

## Checks

- `npm test`: 1728 tests, 0 failures. `npm run zh:refresh`: 0 missing units. The 287 Chinese units were written directly (no external translation service), mapped by source text, and inserted only after `numguard` agreement and identical-markup checks.
- Built HTML: both pages have English and Chinese editions; homepage, research index and sitemap entries present.
- Browser QA: the in-app browser cannot open the local Worker, and the pages are not live yet, so no browser pass of the new pages is claimed. The in-app browser was used only to read the CRA source page.

## Release status

Pinned base `2f49a04c` (origin/main at start, unchanged when re-fetched before publishing). Source commit `6f5c23cb` was pushed to `main` as a fast-forward on 26 October 2026. Before pushing, the live sitemap was a strict subset of local `dist`: no live-only URLs; local-only were this batch's four URLs plus fourteen already on `main` but never deployed (TFSA asset location, missed best/worst months, fund income type, crash warnings, CPP pension sharing, Groceries and Essentials Benefit, Canada Disability Benefit; English and Chinese).

`npx wrangler deploy` (Wrangler 4.153.0) was blocked by the unattended run's permission policy (production deploy). After the push, the new URLs and the earlier TFSA asset-location guide returned 404, while the homepage, research index and existing guides returned 200. The next authorized `npx wrangler deploy` from current `main` (Wrangler rebuilds from source) will publish all eighteen URLs. After it, verify each URL, the module `planning-shock-harvest-models.js`, the homepage/library/sitemap entries, and phone/desktop layouts.
