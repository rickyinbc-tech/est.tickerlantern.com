# TFSA asset location and missed best/worst months

Two English articles dated 26 October 2026, each with four editable figures and chart data tables, plus reviewed Simplified Chinese editions:

- `tfsa-asset-location-bond-fund-equity-fund-after-tax` (`assetLocation`): the same bond fund and equity fund held in a TFSA and a non-registered account; only the account holding each fund changes (bond first, equity first, same mix). Distinct from the existing RRSP/TFSA timing, distribution-provision and fund-switch break-even guides.
- `missing-best-months-worst-months-market-exit-window` (`strongMonths`): hindsight removal of the N best months, N worst months or both from one authored 120-month path, compared with a rule a person could follow (leave after a month-end close, return after a fixed number of months). Distinct from the exit/re-entry and dip-waiting guides.

Dated official observation: CRA TFSA dollar limits 2009–2026 (page dated 1 December 2025, reviewed 26 October 2026), CAD 7,000 for 2024–2026, summing to CAD 109,000. Other sources: CRA What is a TFSA (17 September 2026), CRA Tax treatment of mutual funds (5 February 2026), CRA capital gains calculation page (5 February 2026, one-half inclusion rate in worked examples), CRA RRSP, CRA T4037, FINRA market timing (10 June 2025), FINRA DCA (19 May 2026), OSC GetSmarterAboutMoney volatility page (last updated 4 August 2026). No US tax rules are applied and no personal tax amount is calculated.

Asset-location model, each year in the non-registered account: bond interest taxed at the entered marginal rate; equity distributions taxed at a separate entered rate; after-tax cash reinvested in the same fund, raising the equity ACB; equity price growth untaxed until a sale at the horizon at marginal rate × 1/2. A loss on sale is given no tax value. Defaults (TFSA CAD 40,000, non-registered CAD 60,000, 40% bonds, bond 4%, equity growth 5% + 2% distributions, 30%/15% tax, 20 years): bond first CAD 289,292.743627; equity first 291,493.313455; same mix 290,613.085524. Yearly-income tax 7,141.91 vs 15,019.21; sale tax 17,854.77 vs 5,951.59. Equity first minus bond first: −247 (y5), −223 (y10), +408 (y15), +2,201 (y20).

Missed-months model: authored 120 monthly returns (calm months mean 0.544%, crisis months 41–54). Removed months earn the entered cash rate (effective annual converted to monthly). Best months chosen first; worst months from the remainder. Defaults (CAD 10,000, N = 5, 2.25% cash, exit after month 46 for 6 months): invested 18,044.895574; miss best 12,739.629503; miss worst 27,590.341917; miss both 19,478.679300; exit window 15,156.786096 (−2,888.11). Best months 45, 47, 48, 50, 52; worst 41, 43, 44, 46, 49; mean distance 1.4 months.

All defaults were reproduced independently with 40-digit Python Decimal arithmetic (`qa/planning-location-timing/check.py`, ignored). Tests cover the CRA limit total, constant combined mix across placements, the after-tax interest recurrence, zero-tax and TFSA-only identities, no tax value for a sale loss, the ranked months, zero removals, flat paths, windows past the horizon, related and in-text links, four finite figure/table pairs per guide and field bounds.

Chinese translations for the 232 new units were written directly (no external translation service) and passed `numguard`; `zh:refresh` reported 0 missing units.

Browser QA was not available: the in-app preview server start was declined during this unattended run. Checks used built HTML (4 figures, 4 tables and numeric inputs per page), sitemap, homepage and research-index entries, and the built module graph in Node. No browser pass is claimed.

## Release status

Source commit `b9097b78` was pushed to `main` as a fast-forward from pinned `5d4745c2` on 26 October 2026. Before pushing, the live sitemap matched local `dist` except the four new URLs. `wrangler deploy` was blocked by the unattended run's permission policy, and a push alone does not deploy, so the new URLs still returned 404 after about six minutes. The next authorized deployment from current `main` (Wrangler rebuilds from source) will publish them; after that, verify the two English and two Chinese URLs, their module `planning-location-timing-models.js`, and the homepage, library and sitemap entries.
