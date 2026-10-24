# Five-year forecast and long-term EPS policy

Reviewed 23 October 2026. Policy: `tickerlantern-forward-bridge-long-term-v6`. This replaces raw named-year replay in v5.

The entry anchor is already forward earnings. Applying next calendar year's year-over-year earnings growth directly to that anchor can count growth already inside the denominator. All published forecasts remain visible at their original uncapped rates. Annual calendar/publisher-year estimates instead inform a uniform-accrual calendar-to-forward model. Missing calendar inputs use a derived long-term EPS proxy.

For valuation date in year Y, let `w` be elapsed calendar-year days divided by total days. Start with a relative calendar EPS level `CY_Y=1`. Compound six annual growth inputs, for Y+1 through Y+6, to construct seven levels. At valuation t, `F_t=(1-w)*CY_(Y+t)+w*CY_(Y+t+1)`. The five model growth transitions are `F_t/F_(t-1)-1`. The extra calendar year supports the forward earnings at year-five exit; it is not a sixth holding year. Uniform earnings accrual, constant within-year weights and the long-term extension are assumptions.

Two current benchmarks have explicit CY forecasts and a rolling-12-month entry definition: S&P 500 and MSCI Japan. Fifteen additional annual series use a visibly qualified bridge: publisher-year estimates are modeled as CY, and/or an unspecified forward denominator is modeled as NTM. These are declared scenario assumptions, not verified publisher definitions. No definition registry is silently upgraded. The four Amova endpoint forecasts have an undisclosed growth measurement interval and cannot be annualized reliably; FTSE 100, STOXX 600, Nikkei 225 and Hang Seng therefore use their long-term EPS proxies throughout. Their original house estimates remain visible as references.

A new annual forecast can affect two adjacent NTM transitions because their earnings windows overlap. Reader overrides refer to holding-year forward-anchor growth, and stay protected independently of the calendar inputs. Calendar rollover does not move a retained valuation's date or its schedule.

For Nasdaq-100, UBS's 2027 **28%** is preserved as a calendar-level input under the disclosed CY assumption. At the dated October entry, most of 2027 is already inside NTM earnings. The first modeled forward transition is about **11.63%**, followed by the sourced **8.04%** long-term EPS proxy. This reduction comes from earnings-window overlap, not an arbitrary growth cap or fade.

## Long-term source and derivation

[Invesco 2026 Capital Market Assumptions, Q1 update](https://www.invesco.com/content/dam/invesco/apac/en/pdf/insights/2026/april/2026-invesco-capital-market-assumptions-usd-q1-2026.pdf#page=7), assumptions as of 31 December 2025. Figure 4a on PDF p. 7 supplies the components; p. 11 defines them. Original pages were visually verified. SHA-256: 28faab4574d491474f4eac99fc734e5c4615ec320793bcc2f0c264dc5b70ee7b. The original PDF and page captures remain private local QA files and are not published.

Nominal EPS projection = real earnings growth + expected inflation + buyback/dilution effect, as an additive approximation. The source presents separate building blocks; their conversion into an EPS proxy is Ticker Lantern’s derivation. A ten-year structural assumption is applied as a constant annual input for uncovered calendar inputs and series without a supported annual measurement interval. This is not an Invesco forecast for a specific missing calendar year.

Buybacks enter per-share earnings once. Source dividends, valuation and FX components are excluded: the workbench calculates dividends and the selected exit P/E separately. RBC GAM total-return assumptions are not put into an EPS growth field.

| Published market basis | Real earnings | Inflation | Buyback/dilution | Derived nominal EPS |
| --- | ---: | ---: | ---: | ---: |
| US large cap | 4.01% | 2.19% | 1.84% | 8.04% |
| US small cap | 2.43% | 2.19% | 0.99% | 5.61% |
| Canada equity | 2.99% | 1.95% | 0.73% | 5.67% |
| Global equity | 3.92% | 2.14% | 1.01% | 7.07% |
| Global ex-US equity | 3.82% | 1.97% | 0.13% | 5.92% |
| Europe equity | 4.24% | 1.79% | 0.54% | 6.57% |
| UK equity | 6.06% | 2.24% | 0.82% | 9.12% |
| Japan equity | 4.3% | 2% | 0.89% | 7.19% |
| EM equity | 3.73% | 2.24% | -0.31% | 5.66% |
| China equity | 1.4% | 1.75% | -0.55% | 2.6% |

## All 21 mappings and current paths

The table below uses the retained market observation dates, not a claim of current live prices. Holding-year growth, EPS CAGR and returns are conditional model outputs. Broader long-term proxies are identified explicitly and carry no invented country or sector premium.

| Benchmark | Year 1 | Year 2 | Year 3 | Year 4 | Year 5 | Timing basis | Long-term proxy | Default exit |
| --- | ---: | ---: | ---: | ---: | ---: | --- | --- | ---: |
| S&P 500 | 9.53% | 8.04% | 8.04% | 8.04% | 8.04% | explicit-calendar-ntm | US large cap | 19.1× |
| Nasdaq-100 | 11.63% | 8.04% | 8.04% | 8.04% | 8.04% | assumed-period-alignment | US large cap | 23.09× |
| Russell 2000 | 11.87% | 5.61% | 5.61% | 5.61% | 5.61% | assumed-period-alignment | US small cap | 23.34× |
| S&P/TSX Composite | 7.06% | 5.67% | 5.67% | 5.67% | 5.67% | assumed-period-alignment | Canada equity | 15.6× |
| MSCI Canada | 8.58% | 6.40% | 5.67% | 5.67% | 5.67% | assumed-period-alignment | Canada equity | 15.68× |
| MSCI ACWI | 13.28% | 8.10% | 7.07% | 7.07% | 7.07% | assumed-period-alignment | Global equity | 15.9× |
| MSCI World | 13.43% | 8.56% | 7.07% | 7.07% | 7.07% | assumed-period-alignment | Global equity | 17.92× |
| MSCI EAFE | 6.86% | 5.92% | 5.92% | 5.92% | 5.92% | assumed-period-alignment | Global ex-US equity | 14.79× |
| MSCI Emerging Markets | 12.28% | 6.44% | 5.66% | 5.66% | 5.66% | assumed-period-alignment | EM equity | 8.9× |
| MSCI Europe | 10.39% | 7.27% | 6.57% | 6.57% | 6.57% | assumed-period-alignment | Europe equity | 14× |
| MSCI United Kingdom | 7.26% | 8.85% | 9.12% | 9.12% | 9.12% | assumed-period-alignment | UK equity | 12.12× |
| FTSE 100 | 9.12% | 9.12% | 9.12% | 9.12% | 9.12% | Unspecified house interval; LT scenario | UK equity | 12.6× |
| STOXX Europe 600 | 6.57% | 6.57% | 6.57% | 6.57% | 6.57% | Unspecified house interval; LT scenario | Europe equity | 14.2× |
| MSCI Japan | 8.55% | 7.19% | 7.19% | 7.19% | 7.19% | explicit-calendar-ntm | Japan equity | 15× |
| Nikkei 225 | 7.19% | 7.19% | 7.19% | 7.19% | 7.19% | Unspecified house interval; LT scenario | Japan equity | 19.7× |
| MSCI China | 4.54% | 2.60% | 2.60% | 2.60% | 2.60% | assumed-period-alignment | China equity | 9.7× |
| Hang Seng | 2.60% | 2.60% | 2.60% | 2.60% | 2.60% | Unspecified house interval; LT scenario | China equity | 10.4× |
| CSI 300 | 7.06% | 3.23% | 2.60% | 2.60% | 2.60% | assumed-period-alignment | China equity | 11.8× |
| MSCI India | 7.54% | 5.66% | 5.66% | 5.66% | 5.66% | assumed-period-alignment | EM equity | 18.7× |
| MSCI AC Asia Pacific ex Japan | 9.04% | 5.66% | 5.66% | 5.66% | 5.66% | assumed-period-alignment | EM equity | 9.6× |
| MSCI Australia | 5.73% | 5.92% | 5.92% | 5.92% | 5.92% | assumed-period-alignment | Global ex-US equity | 18.3× |

## Consistency and provenance

The workbench, static and interactive comparisons, and both CSV exports use the same policy. Each bridge exports six original calendar inputs, individual source objects, the fractional-year weight, bridge quality and assumption text. Every holding-year rate is labeled as a calculation, long-term projection or reader assumption; a numerically equal value does not acquire published-forecast status. The source snapshot, observation dates and validation timestamps are not advanced by this methodology change.

Earlier source-mode defaults migrate once, including paused defaults. Named holding-year reader overrides, custom constant/annual modes and manual valuation edits remain protected. Calculator bounds never clip a published forecast. A bridge that cannot produce positive annual EPS levels is unavailable and does not silently replace the bad input with a lower rate.
