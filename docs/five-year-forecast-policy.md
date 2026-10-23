# Five-year forecast policy

Reviewed: 2026-10-23. Policy: tickerlantern-five-year-fade-v1.

The workbench and all-benchmark comparison use **five holding years**, including saved scenario migration, all custom modes, reset, source restore, presets, sensitivities and both CSV downloads. No source coverage rule can reduce this to one or two years.

## Growth path

Start with next-year-and-later exact-benchmark published rates. Current-year forecasts remain context. Preserve publisher period labels and house/consensus classifications; these rates are synthetic holding-year proxies alongside separately dated forward P/E, not precisely date-matched rolling-NTM forecasts. Stale observations and failed source checks keep their warnings. No new publisher validation is claimed by this policy review.

Let k be contiguous published future coverage (at most five), a the terminal nominal EPS growth anchor, and g_k the final published growth rate. For missing holding year t (k < t <= 5):

- s = max(-10, min(10, g_k - a)), in percentage points.
- g_t = a + s × (5 - t) / (5 - k), rounded to four decimal percentage points.
- If there is no published future coverage, every year uses a and is labelled model extension. Unknown benchmarks without an anchor remain unavailable.

Published rates are preserved without clamping. The cap applies only to the spread carried into missing years, limiting continuation of exceptional recovery growth. For S&P 500, 2027 published growth of 16% becomes 16%, 13.5%, 11%, 8.5%, 6% across 2027–2031. The high/low return sensitivity remains available. These inputs are not probabilities, a validated sustainable-growth model or guaranteed returns.

Custom edits override only their named year. Model extensions remain anchored to publisher inputs, so editing a near-term year does not silently change later assumptions. Source refresh replaces modeled years with newly published estimates and recomputes remaining extensions; custom years stay protected. Pausing source updates freezes the path and labels its rates saved assumptions. Short saved custom schedules keep existing rates and fill added years with the user's saved default.

## Terminal EPS anchors

These rounded, nominal per-share earnings assumptions reflect market maturity, business mix and normalization of cyclicality. They are **TickerLantern editorial assumptions**, not figures attributed to any asset manager, exact-benchmark consensus or estimates derived from GDP alone. Growth and payout feasibility require separate diligence. No separate buyback yield is added.

| Benchmark | Year-five EPS growth | Rationale |
| --- | ---: | --- |
| S&P 500 | 6% | Diversified mature US companies; nominal sales growth with modest per-share gains. |
| Nasdaq-100 | 8% | Technology mix supports a premium to broad US growth; competition and margin normalization limit persistence. |
| Russell 2000 | 6% | Small-company rebound growth normalizes; financing costs and dilution limit long-run gains. |
| S&P/TSX Composite | 5% | Mature financials and resources; commodity cycles do not compound indefinitely. |
| MSCI Canada | 5% | Mature Canadian market; separate benchmark from the TSX, with a similar long-run economic anchor. |
| MSCI ACWI | 5.5% | Diversified developed and emerging markets; a rounded global nominal EPS anchor. |
| MSCI World | 5.5% | Developed-market nominal growth with modest per-share gains. |
| MSCI EAFE | 5% | Mature non-US developed markets with slower structural growth. |
| MSCI Emerging Markets | 7% | Higher structural demand growth, discounted for cyclicality and dilution. |
| MSCI Europe | 5% | Mature European companies with global revenues and modest nominal growth. |
| MSCI United Kingdom | 4.5% | Mature financial, resource and defensive mix; limited sustained margin expansion. |
| FTSE 100 | 4.5% | Global mature-company mix; separate from MSCI UK and not its consensus forecast. |
| STOXX Europe 600 | 5% | Broad mature European earnings; normalize the near-term recovery. |
| MSCI Japan | 4.5% | Low structural growth with some inflation and corporate-efficiency improvement. |
| Nikkei 225 | 5% | Exporter and technology exposure allows a modest premium to broad Japan. |
| MSCI China | 6% | Normalize the recovery; allow for slower structural growth and policy risk. |
| Hang Seng | 5% | Mature financials and China exposure; a cautious normalized earnings anchor. |
| CSI 300 | 6% | Domestic China exposure; normalize cyclical growth without extending a rebound. |
| MSCI India | 9% | Higher structural nominal demand growth, moderated for dilution and competition. |
| MSCI AC Asia Pacific ex Japan | 7% | Emerging Asia and technology mix; normalize the current semiconductor-led upswing. |
| MSCI Australia | 5% | Mature banks and resources; normalize commodity-sensitive earnings. |

The [Invesco capital-market methodology](https://www.invesco.com/apac/en/institutional/insights/multi-asset/long-term-capital-market-assumptions.html), checked 23 October 2026, supports separating nominal earnings growth, valuation change and income in a building-block framework. Its published methodology considers revenues, margins and inflation. It does **not** supply the anchors above, the five-year fade, or the ±10-point cap. Its own capital-market assumptions have a different horizon and methodology.

## Returns and evidence

All projections reuse the existing annual EPS × P/E and dividend cash-flow engine. No changes to source multiples, historical-compatibility decisions, dividend sources or publication dates are made. Each year compounds once; dividends use the prior-period earnings anchor. Year-five price plus uninvested cash is cumulative wealth, while cash-flow IRR is annualized and respects distribution timing. The all-benchmark table uses defaults and the currently loaded snapshot, independently of saved custom workbench edits.

CSV exports retain full precision, five holding years, snapshot identity, valuation/dividend conventions, publisher-year evidence and model-policy evidence. Model years have no publisher observation date or publisher URL; their provenance names the extension policy, review date, anchor and rationale.

## Verification — 23 October 2026

- 102 Node tests and 122 Python parser/pipeline tests pass. Five-year tests cover all 21 actual benchmark paths, independent terminal EPS/price compounding and IRR/NPV reconciliation, source/model provenance, new source coverage, custom overrides, year rollover and legacy saved horizons.
- Chromium checks cover every benchmark, custom/constant/source modes, saved overrides and reloads, paused two-year settings migrating to five, invalid inputs, presets, source restore and sensitivity.
- Actual downloaded CSV bytes contain 6 active-scenario records and 126 all-benchmark records, all declaring five years. Downloaded assumptions independently reproduce terminal prices and the displayed IRR.
- Layout checks pass at 360, 390, 768 and 1440px without document overflow. Desktop comparison and mobile model captures were visually reviewed. No uncaught JavaScript errors were observed.
- Build, JavaScript syntax and static IDs/anchors/assets/placeholder checks pass. Review captures and downloads remain in ignored local `qa/`; they are not deployment assets.
