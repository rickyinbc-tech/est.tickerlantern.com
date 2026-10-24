# Five-year forecast and long-term EPS policy

Reviewed 23 October 2026. Policy: tickerlantern-forecast-long-term-v5. Supersedes the earlier timing bridges, editorial anchors and Nasdaq-only exceptions.

All 21 benchmarks use published forecasts only for the years they cover. Missing years immediately use a sourced long-term nominal EPS projection. A new forecast replaces only its named year, including gaps between published estimates. No near-term forecast is capped, faded or carried forward. The current-year forecast stays in the evidence card, rather than being replayed as a full future holding year.

Published calendar, publisher-year, fiscal and forecast-date labels retain their meaning. Consensus estimates and house forecasts are separately labelled. A house forecast for September 2027 remains a September 2027 house scenario when applied in the first model year; it is not relabelled calendar-year or rolling-NTM consensus. Applying the rates to synthetic forward earnings is an explicit scenario mapping.

## Long-term source and derivation

[Invesco 2026 Capital Market Assumptions, Q1 update](https://www.invesco.com/content/dam/invesco/apac/en/pdf/insights/2026/april/2026-invesco-capital-market-assumptions-usd-q1-2026.pdf#page=7), assumptions as of 31 December 2025. Figure 4a on PDF p. 7 supplies the components; p. 11 defines them. Original pages were visually verified. SHA-256: 28faab4574d491474f4eac99fc734e5c4615ec320793bcc2f0c264dc5b70ee7b. The original PDF and page captures remain private local QA files and are not published.

Nominal EPS projection = real earnings growth + expected inflation + buyback/dilution effect, as an additive approximation. The source presents separate building blocks; their conversion into an EPS proxy is Ticker Lantern’s derivation. A ten-year structural assumption is applied as a constant annual input only where the five-year scenario lacks a published forecast. This is not an Invesco forecast for a specific missing calendar year.

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

The target index keeps its own published forecasts. Only missing years use the named market/region proxy. Broader proxies carry no invented country, sector or index premium. They are not presented as index-specific published forecasts.

| Benchmark | 2027 | 2028 | 2029 | 2030 | 2031 | Long-term basis and mapping |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| S&P 500 | 16% forecast | 8.04% projection | 8.04% projection | 8.04% projection | 8.04% projection | US large cap. US large-cap assumption for the S&P 500. |
| Nasdaq-100 | 28% forecast | 8.04% projection | 8.04% projection | 8.04% projection | 8.04% projection | US large cap. US large-cap proxy for Nasdaq-100; no technology premium added. |
| Russell 2000 | 44% forecast | 5.61% projection | 5.61% projection | 5.61% projection | 5.61% projection | US small cap. US small-cap proxy for Russell 2000; source return table uses S&P 600. |
| S&P/TSX Composite | 11.6% forecast | 5.67% projection | 5.67% projection | 5.67% projection | 5.67% projection | Canada equity. Canadian broad-equity assumption for the S&P/TSX Composite. |
| MSCI Canada | 8.2% forecast | 8.7% forecast | 5.67% projection | 5.67% projection | 5.67% projection | Canada equity. Canadian broad-equity proxy for MSCI Canada. |
| MSCI ACWI | 15.1% forecast | 12.9% forecast | 7.07% projection | 7.07% projection | 7.07% projection | Global equity. Global equity assumption for MSCI ACWI. |
| MSCI World | 13.2% forecast | 13.5% forecast | 7.07% projection | 7.07% projection | 7.07% projection | Global equity. Global all-country equity proxy for developed-market MSCI World. |
| MSCI EAFE | 9.9% forecast | 5.92% projection | 5.92% projection | 5.92% projection | 5.92% projection | Global ex-US equity. Global ex-US equity proxy for EAFE; includes markets outside EAFE. |
| MSCI Emerging Markets | 24% forecast | 10% forecast | 5.66% projection | 5.66% projection | 5.66% projection | EM equity. Emerging-market equity assumption for MSCI Emerging Markets. |
| MSCI Europe | 9.9% forecast | 10.5% forecast | 6.57% projection | 6.57% projection | 6.57% projection | Europe equity. European equity assumption for MSCI Europe. |
| MSCI United Kingdom | 5% forecast | 8% forecast | 9.12% projection | 9.12% projection | 9.12% projection | UK equity. UK equity assumption for MSCI United Kingdom. |
| FTSE 100 | 7% forecast | 9.12% projection | 9.12% projection | 9.12% projection | 9.12% projection | UK equity. UK broad-equity proxy for FTSE 100. |
| STOXX Europe 600 | 14% forecast | 6.57% projection | 6.57% projection | 6.57% projection | 6.57% projection | Europe equity. European broad-equity proxy for STOXX Europe 600. |
| MSCI Japan | 15% forecast | 7.19% projection | 7.19% projection | 7.19% projection | 7.19% projection | Japan equity. Japanese equity assumption for MSCI Japan. |
| Nikkei 225 | 22% forecast | 7.19% projection | 7.19% projection | 7.19% projection | 7.19% projection | Japan equity. Japanese broad-equity proxy for Nikkei 225. |
| MSCI China | 13.7% forecast | 2.6% projection | 2.6% projection | 2.6% projection | 2.6% projection | China equity. Chinese equity assumption for MSCI China. |
| Hang Seng | 3% forecast | 2.6% projection | 2.6% projection | 2.6% projection | 2.6% projection | China equity. Chinese broad-equity proxy for Hang Seng; no Hong Kong-specific premium added. |
| CSI 300 | 12% forecast | 6% forecast | 2.6% projection | 2.6% projection | 2.6% projection | China equity. Chinese broad-equity proxy for CSI 300; no A-share premium added. |
| MSCI India | 16.6% forecast | 5.66% projection | 5.66% projection | 5.66% projection | 5.66% projection | EM equity. Broad emerging-market proxy for MSCI India; no unsupported country premium added. |
| MSCI AC Asia Pacific ex Japan | 26.8% forecast | 5.66% projection | 5.66% projection | 5.66% projection | 5.66% projection | EM equity. Broad emerging-market proxy for MSCI Asia ex Japan; no regional premium added. |
| MSCI Australia | 4.9% forecast | 5.92% projection | 5.92% projection | 5.92% projection | 5.92% projection | Global ex-US equity. Global ex-US equity proxy for Australia; no Australia-specific building block is published in this table. |

## Consistency and saved assumptions

The workbench, initial static comparison, interactive comparison, annual cash-flow CSV and all-index CSV use the same policy. Published rows retain original period labels, dates, source URLs and consensus/house classification. Projection rows retain the long-term source vintage, proxy mapping and building-block formula. Even coincidentally equal numbers retain their correct provenance.

Earlier source-mode defaults migrate once, including paused defaults. Explicit named-year overrides, custom constant/annual modes and each benchmark’s independent saved settings remain protected. A modern paused source scenario freezes its saved rates.

All growth paths contain exactly five holding years. Unsupported valuations or cash-dividend inputs still prevent a fabricated cash-return result: STOXX 600 has its full growth path but its net return-spread reference is not treated as a cash dividend. The cash-return table therefore has 20 calculated defaults, while the all-index export retains all 126 valuation-date rows.
