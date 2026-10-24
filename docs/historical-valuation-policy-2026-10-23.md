# Historical earnings valuation policy - 23 October 2026

The site now values current earnings using the best verified same-index historical multiple and uses a matching earnings basis for the five-year exit. The policy is `historical-earnings-reference-v1`.

## Selection order

1. Internally paired ten-year forward P/E mean: retain the existing default and comparison permissions.
2. Verified same-index qualified forward mean: use it as an explicit dated historical exit assumption. This does not certify direct statistical comparability, a current rolling ten-year window or fair value. Original source dates and qualifications remain visible.
3. Where neither usable forward reference exists, use a verified exact-index ten-year trailing P/E arithmetic mean with aligned current trailing P/E and aggregation. Keep the basis marked TTM.
4. If neither basis is supported, use a clearly labelled constant-multiple scenario or an explicit reader assumption.

A current P/E, CAPE, ten-year median, different index, trimmed average or ETF proxy is not silently substituted for an exact-index ten-year arithmetic mean. Withdrawn, incompatible, changed-definition and unverified observations cannot become qualified forward defaults.

## Current-earnings valuation

The new valuation card uses a normalized current market value of 100:

- Current normalized forward EPS = 100 / current forward P/E.
- Forward reference value = historical forward P/E × current normalized forward EPS.
- Current normalized TTM EPS = 100 / current TTM P/E.
- TTM reference value = historical TTM P/E × current normalized TTM EPS.

This applies the historical multiple to the current earnings basis rather than reusing earnings from ten years ago. The card names the basis, both dates and original sources. It is an explicit historical-multiple scenario, not a precise fair-value conclusion. The stricter current-versus-history premium statistic still requires the original compatibility assessment.

## Matching a TTM exit to the forward-earnings engine

The workbench retains its existing forward earnings timeline. At year n the engine's F_n represents earnings after exit; the corresponding terminal trailing earnings are F_(n-1).

`TTM exit price = mean_TTM_PE × F_(n-1)`

`F_(n-1) = F_n / (1 + g_n)`

`Equivalent forward exit PE = mean_TTM_PE / (1 + g_n)`

Consequently the existing engine can calculate the TTM exit without multiplying a trailing multiple by next-period forward earnings. Changing the final following-period growth input updates this conversion. With the first four growth factors unchanged, terminal TTM price and cash-flow IRR do not change merely because the fifth following-period growth assumption changes. Edited exit multiples remain protected. Paused scenarios are retained.

The current TTM comparison uses current trailing EPS; the five-year exit uses projected terminal trailing EPS. Holding today's EPS fixed for five years would be a different scenario.

## Source review and actual activation

All 21 retained benchmarks already have a published ten-year **forward** historical reference. Six are internally paired; fifteen were blocked from default exits solely by the earlier stricter comparison policy. The fifteen now use their documented dated forward reference as a scenario assumption, with qualifications visible. No production benchmark has been relabelled TTM, and no synthetic TTM observations were published.

The candidate [Omnigence May 2026 report](https://omnigenceam.com/files/global-valuation-metrics-are-debt-and-equity-markets-stretched), p. 4, was rejected as exact-index TTM fallback evidence: its footnote says the ratios are computed from SPY/EFA/EEM ETF prices and earnings, and its historical averages exclude 20% outliers. Those are not an untrimmed exact-index ten-year mean. No values from that candidate were imported.

[MSCI Fundamental Data Methodology](https://www.msci.com/indexes/documents/methodology/0_MSCI_Fundamental_Data_Methodology_20240625.pdf), sections 1.3 and 3.2.6, distinguishes trailing and forward earnings and describes index EPS as index level divided by its corresponding P/E. The implementation keeps those bases separate.

Future exact-index TTM inputs must supply `trailingValuation` with index identity, verified status, `trailing-12m` basis, ten-year arithmetic mean, no outlier trimming, aligned aggregation, positive current/historical P/E values, original source links and observation dates. Feed validation rejects unsupported or future-dated fallback metadata. Only a validated object can activate TTM fallback after the forward tiers are unavailable.

## Verification

Independent tests cover all 21 real reference choices, forward/TTM priority, rejection cases, current-EPS normalization, terminal TTM algebra, final-year growth changes, reader edits and CSV provenance. Synthetic TTM data is used only in private local test fixtures and is never part of the production feed.

Validation before publication: 129 automated tests passed. Production build, Wrangler dry run and whitespace checks passed. Local browser checks verified all 21 current-earnings reference values and selected exits at 1440px and 390px, plus all-index CSV reconciliation. A separate local synthetic TTM fixture verified current-EPS normalization, terminal basis conversion, final-year growth changes, protected manual exits, source restoration and CSV reproduction. Final desktop/mobile screenshots were inspected for both the production-data paths and the synthetic TTM path.

Published as Worker version `9c856157-30f7-418f-a6b2-985482a68231`. Live browser checks passed all 21 current-earnings reference calculations and historical exits at desktop/mobile widths, plus downloaded all-index CSV provenance. All eight changed production asset hashes matched the local build. Stock analysis, notes and GIC routes retained HTTP 200. The live mobile valuation card was visually inspected.
