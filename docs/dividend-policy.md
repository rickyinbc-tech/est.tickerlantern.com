# Benchmark dividend policy

Reviewed 23 October 2026 · `benchmark-dividend-anchor-v1`

Twenty benchmarks have eligible separately dated cash-dividend anchors. STOXX 600 retains a net-return-spread reference which is ineligible for automatic cash calibration. The default workbench uses payout mode with:

`model payout percent = source dividend-anchor percent × active entry PE`

Starting wealth is 100 and synthetic initial earnings are `100 / entry PE`, so this reproduces the source anchor as the first annual cash distribution. Dividends in years two to five grow with the prior-year synthetic EPS path. The payout stays constant along that scenario path. This is a **model-implied ratio**, not an official reported payout, a matched-period dividend/earnings statistic, or a verified dividend-growth forecast. Entry valuations and dividend sources can have different dates and definitions. A change in active entry P/E recalibrates an unlocked payout; an explicit payout edit remains a reader assumption.

Missing, invalid, withdrawn or ineligible dividend anchors leave a benchmark payout blank and block calculation until a reader supplies an assumption. Out-of-range derived payouts are not clipped. The 30% value is retained only for the separate teaching example. Legacy untouched defaults migrate to each benchmark calibration, including paused scenarios; explicitly protected payout edits survive. Source pausing after migration freezes the current scenario. Reset and the dividend-default button restore the benchmark calibration. Every workbench and all-index CSV records the policy and dividend evidence. Unavailable benchmarks retain six explicitly labeled rows and blank calculated cash fields.

STOXX Europe 600’s official 2.8% footnote uses net-return index return minus price-index return. This historical net performance contribution is **reference-only**, not an eligible cash-dividend anchor. Its default payout and cash returns are unavailable until the reader enters an explicit cash assumption. The source value remains visible; it is not replaced with zero or a guessed gross yield.

## Accepted anchors and default calibration

Payouts below use the current source entry P/E, rounded here to two decimal places. The engine and exports retain full input precision. The original publishers report the dividend column; the payout column is calculated by this application.

| Benchmark | Dividend anchor | Observation date | Model payout | Dividend evidence |
| --- | ---: | --- | ---: | --- |
| S&P 500 | 1.10% | 2026-10-22 | 20.57% | [State Street Investment Management](https://www.ssga.com/us/en/individual/etfs/state-street-spdr-sp-500-etf-trust-spy) |
| Nasdaq-100 | 0.50% | 2026-10-13 | 10.68% | [Nasdaq / Bloomberg / FactSet](https://www.nasdaq.com/docs/global-indexes/global-markets-dashboard-oct-16-2026) |
| Russell 2000 | 1.50% | 2026-10-13 | 35.80% | [Nasdaq / Bloomberg / FactSet](https://www.nasdaq.com/docs/global-indexes/global-markets-dashboard-oct-16-2026) |
| S&P/TSX Composite | 2.10% | 2026-10-23 | 32.76% | [Carolann Steinhoff / Bloomberg Automation](https://carolannsteinhoff.com/october-23rd-2026-the-newsletter/) |
| MSCI Canada | 2.19% | 2026-09-30 | 34.34% | [MSCI](https://www.msci.com/documents/10199/255599/msci-canada-index-cad-net.pdf) |
| MSCI ACWI | 1.58% | 2026-09-30 | 25.12% | [MSCI](https://www.msci.com/documents/10199/255599/msci-acwi.pdf) |
| MSCI World | 1.52% | 2026-09-30 | 27.24% | [MSCI](https://www.msci.com/documents/10199/255599/msci-acwi.pdf) |
| MSCI EAFE | 2.67% | 2026-09-30 | 39.49% | [MSCI](https://www.msci.com/documents/10199/4753a237-7f5a-4ef6-9f2b-9f46245402e6) |
| MSCI Emerging Markets | 2.02% | 2026-09-30 | 17.98% | [MSCI](https://www.msci.com/documents/10199/255599/msci-acwi.pdf) |
| MSCI Europe | 2.87% | 2026-09-30 | 40.18% | [MSCI](https://www.msci.com/documents/10199/a8a34a67-5439-44f1-909a-ba982cb8ca52) |
| MSCI United Kingdom | 3.17% | 2026-09-30 | 38.42% | [MSCI](https://www.msci.com/documents/10199/255599/msci-unitedkingdom-index.pdf) |
| FTSE 100 | 3.11% | 2026-09-30 | 38.25% | [FTSE Russell factsheet](https://research.ftserussell.com/Analytics/FactSheets/Home/DownloadSingleIssue?issueName=UKX&IsManual=false) |
| STOXX Europe 600 | 2.80% reference only | 2026-09-30 | Unavailable | [STOXX](https://stoxx.com/index/sxxp/?factsheet=true) |
| MSCI Japan | 1.80% | 2026-10-13 | 27.00% | [Nasdaq / Bloomberg / FactSet](https://www.nasdaq.com/docs/global-indexes/global-markets-dashboard-oct-16-2026) |
| Nikkei 225 | 1.56% | 2026-10-23 | 30.73% | [Nikkei Indexes](https://indexes.nikkei.co.jp/en/nkave/archives/data?list=dividend) |
| MSCI China | 1.60% | 2026-10-22 | 15.52% | [J.P. Morgan / FactSet / MSCI](https://am.jpmorgan.com/content/dam/jpm-am-aem/asiapacific/regional/en/insights/market-insights/daily-guide-updated.pdf) |
| Hang Seng | 2.97% | 2026-09-30 | 30.59% | [Hang Seng Indexes](https://www.hsi.com.hk/api/wsit-hsi-ddoc-ea-public-website-proxy/v1/content/gcs/download?resource=%2Fpublic-website%2Fwebapp%2Ffactsheets%2Fen-hk%2Fhsi.pdf) |
| CSI 300 | 2.49% | 2026-09-30 | 29.38% | [China Securities Index Co., Ltd.](https://oss-ch.csindex.com.cn/static/html/csindex/public/uploads/indices/detail/files/en/000300factsheeten.pdf) |
| MSCI India | 1.30% | 2026-10-22 | 24.31% | [J.P. Morgan / FactSet / MSCI](https://am.jpmorgan.com/content/dam/jpm-am-aem/asiapacific/regional/en/insights/market-insights/daily-guide-updated.pdf) |
| MSCI AC Asia Pacific ex Japan | 1.70% | 2026-10-22 | 16.32% | [J.P. Morgan / FactSet / MSCI](https://am.jpmorgan.com/content/dam/jpm-am-aem/asiapacific/regional/en/insights/market-insights/daily-guide-updated.pdf) |
| MSCI Australia | 3.30% | 2026-10-22 | 60.39% | [J.P. Morgan / FactSet / MSCI](https://am.jpmorgan.com/content/dam/jpm-am-aem/asiapacific/regional/en/insights/market-insights/daily-guide-updated.pdf) |

## Review and refresh coverage

The seven previously missing observations are recorded in `data/dividend-observations.json`: S&P 500, S&P/TSX Composite, FTSE 100, STOXX Europe 600, Nikkei 225, Hang Seng and CSI 300. Since 26 October 2026, five of them (S&P 500, S&P/TSX, FTSE 100, Hang Seng and CSI 300) are refreshed daily by `scripts/dividend_sources.py` from the same exact-benchmark publisher pages and factsheets. STOXX Europe 600 and Nikkei 225 remain manually reviewed because their public pages are script-rendered or refuse automated requests; a manual check is accepted for 48 hours before showing an overdue check. Source observation age remains independent. The FTSE 100 anchor was corrected from 3.04% to FTSE Russell's factsheet value of 3.11% ([audit](numbers-audit-2026-10-26.md)). The table records review-day values; the live feed is authoritative. Monthly snapshots retain their month-end dates. The other 14 dividend observations keep their existing source adapters and freshness state. This release does not claim to have reverified all 14 source documents.

Selection details: State Street’s **Index Dividend Yield** rather than ETF distribution/SEC yield; the exact TSX Composite Bloomberg Automation market-close figure; FTSE’s **Index characteristics** table; STOXX’s exact benchmark column plus net-return footnote; Nikkei’s **Index Weight Basis**, not simple average; HSI’s September factsheet HSI row; CSI’s exact 000300 factsheet yield. The HSI and CSI original PDF pages were rendered and visually inspected. Nikkei was available through public web retrieval; a direct browser challenge was not bypassed and its bytes are not recorded as financial evidence. Raw source documents/captures remain local and ignored; only observations, public URLs and evidence metadata are published.

Verification is in `tests/dividend-policy.test.mjs`, `tests/test_definition_registry.py` and the full browser flow in `tests/browser_five_year.py`, including actual downloads, all 21 defaults, legacy migration and protected custom inputs.
