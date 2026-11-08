# Ten-year forecast and long-term EPS policy

Reviewed 8 November 2026. Policy: `tickerlantern-forward-bridge-long-term-ten-year-v7`. This replaces the five-year v6 policy: every benchmark, chart, sensitivity case and export now uses a **ten-year** holding period. The file keeps its original name so existing links keep working.

Why ten years: the long-term EPS proxy is Invesco's 10-year capital market assumption, so a ten-year holding period matches the horizon the source was built for. Published consensus and house forecasts only cover the next one to three calendar years; over a ten-year horizon they inform the first transitions and the sourced long-term proxy carries the remainder. The exit multiple remains a dated ten-year historical forward-P/E mean where an assessed compatible pair exists.

The entry anchor is already forward earnings. Applying next calendar year's year-over-year earnings growth directly to that anchor can count growth already inside the denominator. All published forecasts remain visible at their original uncapped rates. Annual calendar/publisher-year estimates instead inform a uniform-accrual calendar-to-forward model. Missing calendar inputs use a derived long-term EPS proxy.

For valuation date in year Y, let `w` be elapsed calendar-year days divided by total days. Start with a relative calendar EPS level `CY_Y=1`. Compound eleven annual growth inputs, for Y+1 through Y+11, to construct twelve levels. At valuation t, `F_t=(1-w)*CY_(Y+t)+w*CY_(Y+t+1)`. The ten model growth transitions are `F_t/F_(t-1)-1`. The extra calendar year supports the forward earnings at year-ten exit; it is not an eleventh holding year. Uniform earnings accrual, constant within-year weights and the long-term extension are assumptions.

Explicit CY forecasts with a rolling-12-month entry definition use the `explicit-calendar-ntm` bridge. Other annual series use a visibly qualified bridge: publisher-year estimates are modeled as CY, and/or an unspecified forward denominator is modeled as NTM. These are declared scenario assumptions, not verified publisher definitions. No definition registry is silently upgraded. Endpoint forecasts with an undisclosed growth measurement interval, and forecasts older than their source cadence at the valuation date, cannot be annualized reliably and use their long-term EPS proxies throughout. Their original estimates remain visible as references.

A new annual forecast can affect two adjacent NTM transitions because their earnings windows overlap. Reader overrides refer to holding-year forward-anchor growth, and stay protected independently of the calendar inputs. Calendar rollover does not move a retained valuation's date or its schedule.

For Nasdaq-100, the first modeled forward transition is about **10.88%**, followed by the sourced **7.98%** long-term EPS proxy. Any reduction versus the raw published rate comes from earnings-window overlap, not an arbitrary growth cap or fade.

## Long-term source and derivation

[Invesco 2026 Capital Market Assumptions, Q3 update](https://www.invesco.com/content/dam/invesco/emea/en/pdf/invesco-capital-market-assumption-usd.pdf#page=7), estimates as of 30 June 2026 (10-year, USD). Figure 4a on PDF p. 7 supplies the components; p. 11 defines them. Figure values were read from the published PDF on 8 November 2026 and cross-checked twice; the file hash is to be recorded from the owner's desktop download because the hosted runner cannot fetch Invesco PDFs. Superseded source: 2026 CMA Q1 update, as of 31 December 2025 (SHA-256 28faab4574d491474f4eac99fc734e5c4615ec320793bcc2f0c264dc5b70ee7b).

Nominal EPS projection = real earnings growth + expected inflation + buyback/dilution effect, as an additive approximation. The source presents separate building blocks; their conversion into an EPS proxy is Ticker Lantern’s derivation. A ten-year structural assumption is applied as a constant annual input for uncovered calendar inputs and series without a supported annual measurement interval. This is not an Invesco forecast for a specific missing calendar year.

Buybacks enter per-share earnings once. Source dividends, valuation and FX components are excluded: the workbench calculates dividends and the selected exit P/E separately. RBC GAM total-return assumptions are not put into an EPS growth field.

| Published market basis | Real earnings | Inflation | Buyback/dilution | Derived nominal EPS |
| --- | ---: | ---: | ---: | ---: |
| US large cap | 3.93% | 2.26% | 1.79% | 7.98% |
| US small cap | 2.60% | 2.26% | 1.05% | 5.91% |
| Canada equity | 2.08% | 2.02% | 0.80% | 4.90% |
| Global equity | 3.76% | 2.17% | 1.13% | 7.06% |
| Global ex-US equity | 3.56% | 2.07% | 0.41% | 6.04% |
| Europe equity | 4.06% | 1.84% | 0.56% | 6.46% |
| UK equity | 5.19% | 2.14% | 0.82% | 8.15% |
| Japan equity | 4.30% | 2.01% | 0.91% | 7.22% |
| EM equity | 3.44% | 2.16% | -0.02% | 5.58% |
| China equity | 1.37% | 1.82% | -0.60% | 2.59% |

## All 21 mappings and current paths

The table below uses the retained market observation dates in `data/indices.json` at the time of this review, not a claim of current live prices. Holding-year growth, EPS CAGR and returns are conditional model outputs. Broader long-term proxies are identified explicitly and carry no invented country or sector premium.

| Benchmark | Y1 | Y2 | Y3 | Y4 | Y5 | Y6 | Y7 | Y8 | Y9 | Y10 | Timing basis | Long-term proxy | Default exit | EPS CAGR | Cash-flow IRR |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- | ---: | ---: | ---: |
| S&P 500 | 9.08% | 7.98% | 7.98% | 7.98% | 7.98% | 7.98% | 7.98% | 7.98% | 7.98% | 7.98% | explicit-calendar-ntm | US large cap | 19.1× | 8.09% | 10.03% |
| Nasdaq-100 | 10.88% | 7.98% | 7.98% | 7.98% | 7.98% | 7.98% | 7.98% | 7.98% | 7.98% | 7.98% | assumed-period-alignment | US large cap | 23.1× | 8.27% | 10.15% |
| Russell 2000 | 10.89% | 5.91% | 5.91% | 5.91% | 5.91% | 5.91% | 5.91% | 5.91% | 5.91% | 5.91% | assumed-period-alignment | US small cap | 23.33× | 6.40% | 7.71% |
| S&P/TSX Composite | 6.47% | 4.90% | 4.90% | 4.90% | 4.90% | 4.90% | 4.90% | 4.90% | 4.90% | 4.90% | assumed-period-alignment | Canada equity | 15.6× | 5.06% | 7.17% |
| MSCI Canada | 8.62% | 5.51% | 4.90% | 4.90% | 4.90% | 4.90% | 4.90% | 4.90% | 4.90% | 4.90% | assumed-period-alignment | Canada equity | 15.87× | 5.33% | 7.51% |
| MSCI ACWI | 7.06% | 7.06% | 7.06% | 7.06% | 7.06% | 7.06% | 7.06% | 7.06% | 7.06% | 7.06% | Unspecified house interval or expired forecast; LT scenario | Global equity | 15.6× | 7.06% | 8.67% |
| MSCI World | 13.45% | 8.06% | 7.06% | 7.06% | 7.06% | 7.06% | 7.06% | 7.06% | 7.06% | 7.06% | assumed-period-alignment | Global equity | 17.38× | 7.78% | 9.37% |
| MSCI EAFE | 6.66% | 6.04% | 6.04% | 6.04% | 6.04% | 6.04% | 6.04% | 6.04% | 6.04% | 6.04% | assumed-period-alignment | Global ex-US equity | 14.46× | 6.10% | 8.80% |
| MSCI Emerging Markets | 11.82% | 6.22% | 5.58% | 5.58% | 5.58% | 5.58% | 5.58% | 5.58% | 5.58% | 5.58% | assumed-period-alignment | EM equity | 8.5× | 6.25% | 8.51% |
| MSCI Europe | 6.46% | 6.46% | 6.46% | 6.46% | 6.46% | 6.46% | 6.46% | 6.46% | 6.46% | 6.46% | Unspecified house interval or expired forecast; LT scenario | Europe equity | 14.2× | 6.46% | 9.32% |
| MSCI United Kingdom | 7.50% | 8.13% | 8.15% | 8.15% | 8.15% | 8.15% | 8.15% | 8.15% | 8.15% | 8.15% | assumed-period-alignment | UK equity | 12.05× | 8.08% | 11.18% |
| FTSE 100 | 8.15% | 8.15% | 8.15% | 8.15% | 8.15% | 8.15% | 8.15% | 8.15% | 8.15% | 8.15% | Unspecified house interval or expired forecast; LT scenario | UK equity | 12.6× | 8.15% | 11.42% |
| STOXX Europe 600 | 6.46% | 6.46% | 6.46% | 6.46% | 6.46% | 6.46% | 6.46% | 6.46% | 6.46% | 6.46% | Unspecified house interval or expired forecast; LT scenario | Europe equity | — | — | unavailable |
| MSCI Japan | 8.30% | 7.22% | 7.22% | 7.22% | 7.22% | 7.22% | 7.22% | 7.22% | 7.22% | 7.22% | explicit-calendar-ntm | Japan equity | 14.2× | 7.33% | 9.28% |
| Nikkei 225 | 7.22% | 7.22% | 7.22% | 7.22% | 7.22% | 7.22% | 7.22% | 7.22% | 7.22% | 7.22% | Unspecified house interval or expired forecast; LT scenario | Japan equity | 19.7× | 7.22% | 8.78% |
| MSCI China | 4.13% | 2.59% | 2.59% | 2.59% | 2.59% | 2.59% | 2.59% | 2.59% | 2.59% | 2.59% | assumed-period-alignment | China equity | 9.9× | 2.74% | 4.35% |
| Hang Seng | 2.59% | 2.59% | 2.59% | 2.59% | 2.59% | 2.59% | 2.59% | 2.59% | 2.59% | 2.59% | Unspecified house interval or expired forecast; LT scenario | China equity | 10.4× | 2.59% | 5.65% |
| CSI 300 | 2.59% | 2.59% | 2.59% | 2.59% | 2.59% | 2.59% | 2.59% | 2.59% | 2.59% | 2.59% | Unspecified house interval or expired forecast; LT scenario | China equity | 12× | 2.59% | 5.08% |
| MSCI India | 7.13% | 5.58% | 5.58% | 5.58% | 5.58% | 5.58% | 5.58% | 5.58% | 5.58% | 5.58% | assumed-period-alignment | EM equity | 19.4× | 5.73% | 7.04% |
| MSCI AC Asia Pacific ex Japan | 8.38% | 5.58% | 5.58% | 5.58% | 5.58% | 5.58% | 5.58% | 5.58% | 5.58% | 5.58% | assumed-period-alignment | EM equity | 9.2× | 5.86% | 7.68% |
| MSCI Australia | 5.94% | 6.04% | 6.04% | 6.04% | 6.04% | 6.04% | 6.04% | 6.04% | 6.04% | 6.04% | assumed-period-alignment | Global ex-US equity | 18.3× | 6.03% | 9.33% |

## Consistency and provenance

The workbench, static and interactive comparisons, and both CSV exports use the same policy. Each bridge exports eleven original calendar inputs, individual source objects, the fractional-year weight, bridge quality and assumption text. Every holding-year rate is labeled as a calculation, long-term projection or reader assumption; a numerically equal value does not acquire published-forecast status. The source snapshot, observation dates and validation timestamps are not advanced by this methodology change.

Earlier source-mode defaults migrate once, including paused defaults. Named holding-year reader overrides, custom constant/annual modes and manual valuation edits remain protected. Calculator bounds never clip a published forecast. A bridge that cannot produce positive annual EPS levels is unavailable and does not silently replace the bad input with a lower rate.
