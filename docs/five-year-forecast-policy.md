# Five-year scenario timing policy

Reviewed 23 October 2026 · `tickerlantern-forward-timing-v3`. Supersedes `tickerlantern-five-year-fade-v1`.

Every workbench mode, preset, sensitivity, chart and export keeps **five holding years**. Published growth observations retain their original values, dates and definitions in the source card. Nasdaq-100 now uses its published next-year growth as the owner-selected five-year scenario input, without a cap or fade.

## Eligible calendar-to-forward bridge

Only an explicitly calendar-year growth source paired with an explicitly rolling-12-month entry P/E and a recorded valuation date may supply a modeled bridge. Current accepted sources meet these conditions for S&P 500 and MSCI Japan. Their date is a **timing proxy** where the original separately observed price/estimate vintage is undisclosed; this is not a claim of an exact contemporaneous consensus EPS series.

Set relative calendar EPS for the valuation year y to 1 and compound six calendar growth rates through y+6. With w equal to the elapsed fraction of the recorded valuation year, assume uniform earnings accrual and keep that within-year weight fixed:

`F_t = (1-w) E_CY(y+t) + w E_CY(y+t+1)`

`g_model,t = F_t / F_(t-1) - 1`, for t = 1…5.

Normalize F0 to `100 / entry PE`. Six calendar growth inputs create six forward anchors F0…F5 and **five investment-year transitions**. They do not create a sixth holding year. No seasonality, quarterly estimate schedule or matched-provider bridge is verified.

Keep contiguous published CY rates through the sixth input where available. To extend uncovered calendar years, fade the last published rate’s spread toward the editorial anchor at calendar position five, with the carried spread limited to ±10 percentage points. Uncovered positions five and six use the anchor. Published values are never clipped. Every resulting holding-year rate is labeled **calendar-to-forward model**, including the first year, because the interpolation and later earnings assumptions are modeled.

S&P 500 uses 16%,13.5%,11%,8.5%,6%,6% as underlying CY inputs and an October 16 timing proxy. Its five modeled forward growth rates are approximately 13.968279%,11.476627%,8.985278%,6.494249%,6%. The original published 16% remains visible as CY2027 evidence. It is not the modeled first holding-year growth rate.

## Nasdaq-100 published-growth scenario

At the owner’s request, Nasdaq-100 now uses the published 2027 earnings growth
of 28% in the model and carries that rate through the five holding years without
an 8% fallback, cap or fade. The 43% figure for 2026 stays in the source card.
The first model year is labelled published-growth scenario; subsequent years
are labelled growth projection. Future published annual estimates replace the
carried rate for their year and later years. Yearly user edits remain protected.
The source does not publish those additional projected years as consensus.
Source: UBS CIO, 7 October 2026, annual earnings growth 43%/28%.

## Other period definitions

Publisher-year, FY or forecast-endpoint labels are not silently converted into CY or rolling NTM. Where definitions cannot support the bridge, each of the five holding years uses the benchmark’s **editorial normalized EPS anchor**. Eighteen current benchmarks use this policy. This reduces unsupported period conversions; it does not establish the normalized rates as more accurate forecasts. Readers can edit any year or choose custom constant/annual growth.

The other benchmarks’ anchors are nominal per-share earnings assumptions. They are not provider consensus, asset-manager forecasts, GDP-derived estimates, or uniquely correct expected growth. Funding feasibility, retention/ROE, dilution and buybacks require additional evidence. No separate buyback yield is added.

| Benchmark | Year-five EPS growth | Rationale |
| --- | ---: | --- |
| S&P 500 | 6% | Diversified mature US companies; nominal sales growth with modest per-share gains. |
| Nasdaq-100 | Latest published next-year input: 28% | Carried forward without a cap or fade; later years are projections. |
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


## State, valuation and export

Scenarios are dated to the recorded entry valuation, not automatically shifted forward by the current calendar year while retaining an old P/E. A publication date is explicitly qualified as a date proxy. A fresh market observation can move the scenario date; stale observations retain their date warnings.

Unedited legacy source-mode paths migrate once to timing-v3, including paused paths. Explicit yearly overrides remain protected. Custom constant/annual modes keep their inputs. Modern paused source scenarios freeze their saved rates. Each benchmark remains independent.

Eligible historical means can still supply explicitly labeled illustrative mean-reversion exits. Fifteen qualified references cannot supply comparisons or defaults. Neither a compatible mean nor a constant P/E is a fair-value forecast. The sensitivity matrix tests alternative growth/exit assumptions without assigning probabilities.

All displays reuse one accepted engine output. CSV records preserve model/source provenance, timing dates, bridge calendar inputs, dividend evidence and snapshot identity. The universe export retains entry plus five rows for every benchmark. Unavailable cash models have status/reason and blank computed values rather than zero returns or silent omission. STOXX 600’s net-return spread cannot anchor automatic cash distributions.

See [the complete audit](full-model-audit-2026-10-23.md) and [dividend policy](dividend-policy.md). The Invesco building-block methodology supports separating income, earnings and valuation, but does not substantiate these particular anchors or the uniform-accrual bridge.
