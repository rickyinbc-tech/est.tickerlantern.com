# Full model audit — 23 October 2026

**Verdict: ready with caveats for conditional scenario exploration. Not an underwritten expected-return forecast or a uniform ranking for portfolio decisions.**

The original price, dividend, cash-flow IRR and annual reinvestment arithmetic was internally consistent. Material corrections were required in the economic use of source growth, dividend eligibility, incomplete exports and wording. The five-year holding period is preserved everywhere.

## What was verified

The review covered all 21 benchmark identities, 63 market observations (current P/E, reported 10-year reference and dividend statistic), 49 published growth observations, the complete annual model, state migration, sensitivity, static educational examples and both CSV downloads. Public evidence only; no private account or client records were used.

- All 49 published growth points agree with their original sources. Seven freshly downloaded source PDFs matched the feed’s existing SHA-256 hashes and their controlling pages were rendered/visually inspected. UBS HTML and FSM/iFAST public article evidence also agree.
- Of 63 market points, 58 were independently re-read through fresh public access. Verification granularity: 26 fresh original-PDF visual checks, 25 fresh public web-PDF text reads with matching dated original-page visual evidence, 2 fresh FactSet HTML reads, 3 public web-HTML reads, 1 Bloomberg market-close redistribution and 1 rendered LSE browser table. Five rely on dated originals: four FTSE 100/Hang Seng P/E/mean observations due live 403, and STOXX’s dividend reference due live 429. These five are not represented as freshly confirmed source access.
- No supported numeric transcription correction was found. Correctly transcribed source numbers can still be unsuitable model inputs.
- Independent 55-digit Decimal calculations reproduced the former 21 benchmark price, cash-dividend, reinvested-wealth and IRR outputs within 8 × 10^-14. The fixed $200 teaching example correctly rounds to $267.65 sale price, $16.91 cash dividends, 42.28% cumulative cash return and 7.50% IRR under its stated assumptions.

A fresh source read does not refresh its observation date. Russell 2000’s 44% growth remains July 9 evidence; CSI 300’s 12%/6% remains May 14 research. Ten historical means predate 2026. Fifteen historical pairs remain qualified and cannot supply a direct premium/discount comparison or automatic historical exit. Six compatible pairs permit an explicitly illustrative mean-reversion scenario; this does not establish fair value.

## Corrections and why they matter

| Priority | Finding | Correction |
| --- | --- | --- |
| High | The initial EPS anchor is already forward-looking; replaying next CY/publisher-horizon growth can double-count near-term growth. | Timing-v2 models a calendar-to-forward bridge only for explicit CY growth paired with documented rolling 12-month valuation. Other periods use explicit editorial normalized EPS assumptions, with the original source estimates kept as reference. |
| High | Published forecasts, interpolations and editorial anchors were too readily described as one five-year forecast. | All holding-year derived rates are labeled model calculations/assumptions; the comparison is titled five-year scenarios. No claim of uniquely accurate expected returns. |
| High | STOXX 600’s 2.8% is net-return-index return minus price-index return, not a gross cash dividend yield. | Keep 2.8% reference-only; remove automatic first-payment permission. Its default payout and cash returns are unavailable until a reader supplies an explicit cash assumption. No invented replacement or zero dividend. |
| Medium | The universe download silently dropped a benchmark when its model was invalid. | Export all 21 × 6 records. Unavailable rows carry status/reason, with financial result cells blank. Active downloads are blocked when active assumptions are invalid. |
| Medium | Null dividend references could display as 0% or null%. | Use missing-aware metric formatting in both static and live tables. |
| Medium | Daily-check language overgeneralized manual coverage. | Disclose scheduled adapters and seven separately reviewed dividend references. Their own check/observation ages remain visible. |
| Low | Dividend mode said initial EPS although subsequent distributions use the prior earnings anchor. | Change to prior earnings; distinguish modeled payout from publisher-reported payout. |
| Low | Restore scope promised to keep every payout, though a restored entry multiple recalibrates unlocked payout. | State that custom payout is preserved. |
| Definition | Nikkei yield construction was underspecified. | Record Nikkei-estimated whole-financial-year DPS and price-adjustment-factor weighting, using official User’s Guide physical pp 6–7, version USG-E-20241105. It is not rolling NTM. |

## Five-year timing and assumptions

See [the full timing policy and all 21 editorial anchors](five-year-forecast-policy.md). For S&P 500 and MSCI Japan, build relative CY earnings levels through six future growth inputs. With w the elapsed fraction of the recorded valuation year, assume uniform earnings accrual:

`F_t=(1-w)E_CY(y+t)+wE_CY(y+t+1)` and `g_model,t=F_t/F_(t-1)-1` for t = 1…5.

F0 normalizes to 100/entryP/E. Six CY inputs support exactly five forward-earnings transitions. The recorded valuation date is a timing proxy where a separate price/estimate observation date is undisclosed. The model does not verify quarterly seasonality, matched-provider EPS aggregation, share-count bridges or contemporaneous price/estimate vintages. Even year 1 is a calculated model rate and includes later-year assumptions; it is not publisher consensus.

For the other 19 benchmarks, period definitions do not establish an equivalent CY-to-NTM bridge. Five normalized annual assumptions use each benchmark’s existing editorial anchor (4.5–9%). This removes an unsupported conversion. It does **not** prove those anchors are better predictions. Custom rates remain protected and editable.

Under unchanged dividend and valuation assumptions, the S&P 500 model IRR changes from 12.20% to 10.59%; MSCI Japan changes from 11.43% to 9.70%. These are effects of the revised model convention, not realized returns or new provider forecasts. Nasdaq-100’s default 8% normalized EPS assumption produces 10.18% model IRR; part of that difference is its explicitly assumed historical-multiple exit, not earnings alone.

## Current default outputs

These are reproducible conditional model outputs, rounded for display. They use differing recorded valuation/dividend dates, source dividend definitions, editorial earnings assumptions and explicit exit policies. They are not comparable expected-return estimates. The workbench supports alternative growth and valuation cases without assigning probabilities.

| Benchmark | Valuation date | Holding-year EPS inputs | Model payout | Model cash IRR | Year-five price + cash |
| --- | --- | --- | ---: | ---: | ---: |
| S&P 500 | 2026-10-16 | 13.9683% / 11.4766% / 8.9853% / 6.4942% / 6.0000% | 20.71% | 10.59% | 163.96 |
| Nasdaq-100 | 2026-10-13 | 8.0000% / 8.0000% / 8.0000% / 8.0000% / 8.0000% | 10.68% | 10.18% | 161.77 |
| Russell 2000 | 2026-10-13 | 6.0000% / 6.0000% / 6.0000% / 6.0000% / 6.0000% | 35.80% | 7.04% | 139.31 |
| S&P/TSX Composite | 2026-09-30 | 5.0000% / 5.0000% / 5.0000% / 5.0000% / 5.0000% | 32.76% | 7.10% | 139.23 |
| MSCI Canada | 2026-09-30 | 5.0000% / 5.0000% / 5.0000% / 5.0000% / 5.0000% | 34.34% | 7.19% | 139.73 |
| MSCI ACWI | 2026-10-22 | 5.5000% / 5.5000% / 5.5000% / 5.5000% / 5.5000% | 25.12% | 7.08% | 139.51 |
| MSCI World | 2026-09-30 | 5.5000% / 5.5000% / 5.5000% / 5.5000% / 5.5000% | 27.24% | 7.02% | 139.18 |
| MSCI EAFE | 2026-09-30 | 5.0000% / 5.0000% / 5.0000% / 5.0000% / 5.0000% | 39.49% | 7.67% | 142.38 |
| MSCI Emerging Markets | 2026-10-22 | 7.0000% / 7.0000% / 7.0000% / 7.0000% / 7.0000% | 17.98% | 9.02% | 151.87 |
| MSCI Europe | 2026-10-22 | 5.0000% / 5.0000% / 5.0000% / 5.0000% / 5.0000% | 40.18% | 7.87% | 143.49 |
| MSCI United Kingdom | 2026-09-30 | 4.5000% / 4.5000% / 4.5000% / 4.5000% / 4.5000% | 38.42% | 7.67% | 141.96 |
| FTSE 100 | 2026-09-30 | 4.5000% / 4.5000% / 4.5000% / 4.5000% / 4.5000% | 37.39% | 8.02% | 144.29 |
| STOXX Europe 600 | 2026-10-22 | 5.0000% / 5.0000% / 5.0000% / 5.0000% / 5.0000% | Unavailable: cash assumption needed | Unavailable: cash assumption needed | Unavailable: cash assumption needed |
| MSCI Japan | 2026-10-22 | 12.5207% / 9.9434% / 7.4517% / 4.9603% / 4.5000% | 27.00% | 9.70% | 156.76 |
| Nikkei 225 | 2026-09-30 | 5.0000% / 5.0000% / 5.0000% / 5.0000% / 5.0000% | 30.73% | 6.56% | 136.25 |
| MSCI China | 2026-10-22 | 6.0000% / 6.0000% / 6.0000% / 6.0000% / 6.0000% | 15.52% | 7.60% | 142.84 |
| Hang Seng | 2026-09-30 | 5.0000% / 5.0000% / 5.0000% / 5.0000% / 5.0000% | 30.59% | 8.16% | 145.28 |
| CSI 300 | 2026-10-22 | 6.0000% / 6.0000% / 6.0000% / 6.0000% / 6.0000% | 29.38% | 8.49% | 147.86 |
| MSCI India | 2026-10-22 | 9.0000% / 9.0000% / 9.0000% / 9.0000% / 9.0000% | 24.31% | 10.30% | 161.64 |
| MSCI AC Asia Pacific ex Japan | 2026-10-22 | 7.0000% / 7.0000% / 7.0000% / 7.0000% / 7.0000% | 16.32% | 8.70% | 150.03 |
| MSCI Australia | 2026-10-22 | 5.0000% / 5.0000% / 5.0000% / 5.0000% / 5.0000% | 60.39% | 8.30% | 145.86 |

## Market-source tie-out ledger

All values below retain their original source dates. “Fresh” describes retrieval during this audit, not a new market observation. “Dated only” means live source access could not be confirmed. No original PDFs or complete publisher documents are distributed in this repository.

| Benchmark | Metric | Published value | Observation / publication date | Evidence | Audit access |
| --- | --- | ---: | --- | --- | --- |
| S&P 500 | Forward P/E | 19.0 | 2026-10-16 | [FactSet](https://insight.factset.com/sp-500-earnings-season-update-october-16-2026) | Fresh read |
| S&P 500 | 10-year reference | 19.1 | 2026-10-16 | [FactSet](https://insight.factset.com/sp-500-earnings-season-update-october-16-2026) | Fresh read |
| S&P 500 | Dividend/reference | 1.09 | 2026-10-21 | [State Street Investment Management](https://www.ssga.com/us/en/individual/etfs/state-street-spdr-sp-500-etf-trust-spy) | Fresh read |
| Nasdaq-100 | Forward P/E | 21.36 | 2026-10-13 | [Nasdaq / Bloomberg / FactSet p1](https://www.nasdaq.com/docs/global-indexes/global-markets-dashboard-oct-16-2026) | Fresh read |
| Nasdaq-100 | 10-year reference | 23.09 | 2026-10-13 | [Nasdaq / Bloomberg / FactSet p1](https://www.nasdaq.com/docs/global-indexes/global-markets-dashboard-oct-16-2026) | Fresh read |
| Nasdaq-100 | Dividend/reference | 0.5 | 2026-10-13 | [Nasdaq / Bloomberg / FactSet p1](https://www.nasdaq.com/docs/global-indexes/global-markets-dashboard-oct-16-2026) | Fresh read |
| Russell 2000 | Forward P/E | 23.87 | 2026-10-13 | [Nasdaq / Bloomberg / FactSet p1](https://www.nasdaq.com/docs/global-indexes/global-markets-dashboard-oct-16-2026) | Fresh read |
| Russell 2000 | 10-year reference | 23.34 | 2026-10-13 | [Nasdaq / Bloomberg / FactSet p1](https://www.nasdaq.com/docs/global-indexes/global-markets-dashboard-oct-16-2026) | Fresh read |
| Russell 2000 | Dividend/reference | 1.5 | 2026-10-13 | [Nasdaq / Bloomberg / FactSet p1](https://www.nasdaq.com/docs/global-indexes/global-markets-dashboard-oct-16-2026) | Fresh read |
| S&P/TSX Composite | Forward P/E | 15.6 | 2026-09-30 | [Raymond James / FactSet p20](https://www.goodridgegroup.ca/-/media/RJ/DotCom-Canada/Files/Commentary-and-Insights/Insights-and-strategies/Insights--Strategies-October-2026.pdf) | Fresh read |
| S&P/TSX Composite | 10-year reference | 15.1 | 2025-06-30 | [Cumberland / Bloomberg p7](https://cumberlandprivate.com/wp-content/uploads/2025/07/North-American-Strategy-Review-June-2025.pdf) | Fresh read |
| S&P/TSX Composite | Dividend/reference | 2.1 | 2026-10-22 | [Carolann Steinhoff / Bloomberg Automation](https://carolannsteinhoff.com/october-22nd-2026-newsletter/) | Fresh read |
| MSCI Canada | Forward P/E | 15.68 | 2026-09-30 | [MSCI p1](https://www.msci.com/documents/10199/255599/msci-canada-index-cad-net.pdf) | Fresh read |
| MSCI Canada | 10-year reference | 14.6 | 2025-12-31 | [Segal Marco Advisors / FactSet p3](https://cambridgeretirementma.gov/wp-content/uploads/2025-4Q-Segal.pdf) | Fresh read |
| MSCI Canada | Dividend/reference | 2.19 | 2026-09-30 | [MSCI p1](https://www.msci.com/documents/10199/255599/msci-canada-index-cad-net.pdf) | Fresh read |
| MSCI ACWI | Forward P/E | 15.9 | 2026-10-22 | [J.P. Morgan / FactSet / MSCI p31](https://am.jpmorgan.com/content/dam/jpm-am-aem/asiapacific/regional/en/insights/market-insights/daily-guide-updated.pdf) | Fresh read |
| MSCI ACWI | 10-year reference | 16.5 | 2025-12-31 | [MSCI p7](https://www.msci.com/downloads/web/msci-com/discover-msci/events/event-assets/2026/january/are-you-as-diversified-as-you-intend-in-2026-/Are%20you%20as%20diversified%20as%20you%20intend%20in%202026%20-%20Master%20deck.pdf) | Fresh read |
| MSCI ACWI | Dividend/reference | 1.58 | 2026-09-30 | [MSCI p1](https://www.msci.com/documents/10199/255599/msci-acwi.pdf) | Fresh read |
| MSCI World | Forward P/E | 17.92 | 2026-09-30 | [MSCI p1](https://www.msci.com/documents/10199/255599/msci-acwi.pdf) | Fresh read |
| MSCI World | 10-year reference | 16.95 | 2025-12-31 | [MSCI p7](https://www.msci.com/downloads/web/msci-com/discover-msci/events/event-assets/2026/january/are-you-as-diversified-as-you-intend-in-2026-/Are%20you%20as%20diversified%20as%20you%20intend%20in%202026%20-%20Master%20deck.pdf) | Fresh read |
| MSCI World | Dividend/reference | 1.52 | 2026-09-30 | [MSCI p1](https://www.msci.com/documents/10199/255599/msci-acwi.pdf) | Fresh read |
| MSCI EAFE | Forward P/E | 14.79 | 2026-09-30 | [MSCI p1](https://www.msci.com/documents/10199/4753a237-7f5a-4ef6-9f2b-9f46245402e6) | Fresh read |
| MSCI EAFE | 10-year reference | 14.3 | 2025-12-31 | [Segal Marco Advisors / FactSet p3](https://cambridgeretirementma.gov/wp-content/uploads/2025-4Q-Segal.pdf) | Fresh read |
| MSCI EAFE | Dividend/reference | 2.67 | 2026-09-30 | [MSCI p1](https://www.msci.com/documents/10199/4753a237-7f5a-4ef6-9f2b-9f46245402e6) | Fresh read |
| MSCI Emerging Markets | Forward P/E | 8.9 | 2026-10-22 | [J.P. Morgan / FactSet / MSCI p31](https://am.jpmorgan.com/content/dam/jpm-am-aem/asiapacific/regional/en/insights/market-insights/daily-guide-updated.pdf) | Fresh read |
| MSCI Emerging Markets | 10-year reference | 12.25 | 2025-12-31 | [MSCI p7](https://www.msci.com/downloads/web/msci-com/discover-msci/events/event-assets/2026/january/are-you-as-diversified-as-you-intend-in-2026-/Are%20you%20as%20diversified%20as%20you%20intend%20in%202026%20-%20Master%20deck.pdf) | Fresh read |
| MSCI Emerging Markets | Dividend/reference | 2.02 | 2026-09-30 | [MSCI p1](https://www.msci.com/documents/10199/255599/msci-acwi.pdf) | Fresh read |
| MSCI Europe | Forward P/E | 14.0 | 2026-10-22 | [J.P. Morgan / FactSet / MSCI p31](https://am.jpmorgan.com/content/dam/jpm-am-aem/asiapacific/regional/en/insights/market-insights/daily-guide-updated.pdf) | Fresh read |
| MSCI Europe | 10-year reference | 14.1 | 2025-12-31 | [MSCI p7](https://www.msci.com/downloads/web/msci-com/discover-msci/events/event-assets/2026/january/are-you-as-diversified-as-you-intend-in-2026-/Are%20you%20as%20diversified%20as%20you%20intend%20in%202026%20-%20Master%20deck.pdf) | Fresh read |
| MSCI Europe | Dividend/reference | 2.87 | 2026-09-30 | [MSCI p1](https://www.msci.com/documents/10199/a8a34a67-5439-44f1-909a-ba982cb8ca52) | Fresh read |
| MSCI United Kingdom | Forward P/E | 12.12 | 2026-09-30 | [MSCI p1](https://www.msci.com/documents/10199/255599/msci-unitedkingdom-index.pdf) | Fresh read |
| MSCI United Kingdom | 10-year reference | 12.7 | 2025-12-31 | [Segal Marco Advisors / FactSet p3](https://cambridgeretirementma.gov/wp-content/uploads/2025-4Q-Segal.pdf) | Fresh read |
| MSCI United Kingdom | Dividend/reference | 3.17 | 2026-09-30 | [MSCI p1](https://www.msci.com/documents/10199/255599/msci-unitedkingdom-index.pdf) | Fresh read |
| FTSE 100 | Forward P/E | 12.3 | 2026-09-30 | [Edelweiss Mutual Fund / Bloomberg p4](https://www.edelweissmf.com/Files/Insights/viewpoint/9th%20Oct%20Edelweiss%20Mutual%20Fund%20-%20TEMPO_09102026_101803_AM.pdf) | Dated only |
| FTSE 100 | 10-year reference | 12.6 | 2026-09-30 | [Edelweiss Mutual Fund / Bloomberg p4](https://www.edelweissmf.com/Files/Insights/viewpoint/9th%20Oct%20Edelweiss%20Mutual%20Fund%20-%20TEMPO_09102026_101803_AM.pdf) | Dated only |
| FTSE 100 | Dividend/reference | 3.04 | 2026-09-30 | [London Stock Exchange / FTSE Russell](https://www.londonstockexchange.com/en/indices/ftse-100) | Fresh read |
| STOXX Europe 600 | Forward P/E | 13.9 | 2026-10-22 | [LSEG Datastream p8](https://lipperalpha.refinitiv.com/wp-content/uploads/2026/10/TRPR_83201_669.pdf) | Fresh read |
| STOXX Europe 600 | 10-year reference | 14.2 | 2026-10-22 | [LSEG Datastream p8](https://lipperalpha.refinitiv.com/wp-content/uploads/2026/10/TRPR_83201_669.pdf) | Fresh read |
| STOXX Europe 600 | Dividend/reference | 2.8 | 2026-09-30 | [STOXX](https://stoxx.com/index/sxxp/?factsheet=true) | Dated only |
| MSCI Japan | Forward P/E | 15.0 | 2026-10-22 | [J.P. Morgan / FactSet / MSCI p31](https://am.jpmorgan.com/content/dam/jpm-am-aem/asiapacific/regional/en/insights/market-insights/daily-guide-updated.pdf) | Fresh read |
| MSCI Japan | 10-year reference | 15.15 | 2026-10-13 | [Nasdaq / Bloomberg / FactSet p1](https://www.nasdaq.com/docs/global-indexes/global-markets-dashboard-oct-16-2026) | Fresh read |
| MSCI Japan | Dividend/reference | 1.8 | 2026-10-13 | [Nasdaq / Bloomberg / FactSet p1](https://www.nasdaq.com/docs/global-indexes/global-markets-dashboard-oct-16-2026) | Fresh read |
| Nikkei 225 | Forward P/E | 19.7 | 2026-09-30 | [Raymond James / FactSet p21](https://www.goodridgegroup.ca/-/media/RJ/DotCom-Canada/Files/Commentary-and-Insights/Insights-and-strategies/Insights--Strategies-October-2026.pdf) | Fresh read |
| Nikkei 225 | 10-year reference | 18.0 | 2025-12-02 | [IG research](https://www.ig.com/sg/news-and-trade-ideas/Asia-stock-market-outlook-for-2026-251209) | Fresh read |
| Nikkei 225 | Dividend/reference | 1.56 | 2026-10-23 | [Nikkei Indexes](https://indexes.nikkei.co.jp/en/nkave/archives/data?list=dividend) | Fresh read |
| MSCI China | Forward P/E | 9.7 | 2026-10-22 | [J.P. Morgan / FactSet / MSCI p37](https://am.jpmorgan.com/content/dam/jpm-am-aem/asiapacific/regional/en/insights/market-insights/daily-guide-updated.pdf) | Fresh read |
| MSCI China | 10-year reference | 11.3 | 2026-10-22 | [J.P. Morgan / FactSet / MSCI p37](https://am.jpmorgan.com/content/dam/jpm-am-aem/asiapacific/regional/en/insights/market-insights/daily-guide-updated.pdf) | Fresh read |
| MSCI China | Dividend/reference | 1.6 | 2026-10-22 | [J.P. Morgan / FactSet / MSCI p37](https://am.jpmorgan.com/content/dam/jpm-am-aem/asiapacific/regional/en/insights/market-insights/daily-guide-updated.pdf) | Fresh read |
| Hang Seng | Forward P/E | 10.3 | 2026-09-30 | [Edelweiss Mutual Fund / Bloomberg p4](https://www.edelweissmf.com/Files/Insights/viewpoint/9th%20Oct%20Edelweiss%20Mutual%20Fund%20-%20TEMPO_09102026_101803_AM.pdf) | Dated only |
| Hang Seng | 10-year reference | 10.4 | 2026-09-30 | [Edelweiss Mutual Fund / Bloomberg p4](https://www.edelweissmf.com/Files/Insights/viewpoint/9th%20Oct%20Edelweiss%20Mutual%20Fund%20-%20TEMPO_09102026_101803_AM.pdf) | Dated only |
| Hang Seng | Dividend/reference | 2.97 | 2026-09-30 | [Hang Seng Indexes p1](https://www.hsi.com.hk/api/wsit-hsi-ddoc-ea-public-website-proxy/v1/content/gcs/download?resource=%2Fpublic-website%2Fwebapp%2Ffactsheets%2Fen-hk%2Fhsi.pdf) | Fresh read |
| CSI 300 | Forward P/E | 11.8 | 2026-10-22 | [J.P. Morgan / FactSet / MSCI p31](https://am.jpmorgan.com/content/dam/jpm-am-aem/asiapacific/regional/en/insights/market-insights/daily-guide-updated.pdf) | Fresh read |
| CSI 300 | 10-year reference | 12.2 | 2024-03-15 | [SCB Asset Management / Bloomberg p4](https://www.scbam.com/medias/module-knowledge/document/290324-SCBAM_Korea_Mar_2024_1.pdf) | Fresh read |
| CSI 300 | Dividend/reference | 2.49 | 2026-09-30 | [China Securities Index Co., Ltd. p1](https://oss-ch.csindex.com.cn/static/html/csindex/public/uploads/indices/detail/files/en/000300factsheeten.pdf) | Fresh read |
| MSCI India | Forward P/E | 18.7 | 2026-10-22 | [J.P. Morgan / FactSet / MSCI p37](https://am.jpmorgan.com/content/dam/jpm-am-aem/asiapacific/regional/en/insights/market-insights/daily-guide-updated.pdf) | Fresh read |
| MSCI India | 10-year reference | 21.0 | 2026-10-22 | [J.P. Morgan / FactSet / MSCI p37](https://am.jpmorgan.com/content/dam/jpm-am-aem/asiapacific/regional/en/insights/market-insights/daily-guide-updated.pdf) | Fresh read |
| MSCI India | Dividend/reference | 1.3 | 2026-10-22 | [J.P. Morgan / FactSet / MSCI p37](https://am.jpmorgan.com/content/dam/jpm-am-aem/asiapacific/regional/en/insights/market-insights/daily-guide-updated.pdf) | Fresh read |
| MSCI AC Asia Pacific ex Japan | Forward P/E | 9.6 | 2026-10-22 | [J.P. Morgan / FactSet / MSCI p37](https://am.jpmorgan.com/content/dam/jpm-am-aem/asiapacific/regional/en/insights/market-insights/daily-guide-updated.pdf) | Fresh read |
| MSCI AC Asia Pacific ex Japan | 10-year reference | 13.6 | 2026-10-22 | [J.P. Morgan / FactSet / MSCI p37](https://am.jpmorgan.com/content/dam/jpm-am-aem/asiapacific/regional/en/insights/market-insights/daily-guide-updated.pdf) | Fresh read |
| MSCI AC Asia Pacific ex Japan | Dividend/reference | 1.7 | 2026-10-22 | [J.P. Morgan / FactSet / MSCI p37](https://am.jpmorgan.com/content/dam/jpm-am-aem/asiapacific/regional/en/insights/market-insights/daily-guide-updated.pdf) | Fresh read |
| MSCI Australia | Forward P/E | 18.3 | 2026-10-22 | [J.P. Morgan / FactSet / MSCI p37](https://am.jpmorgan.com/content/dam/jpm-am-aem/asiapacific/regional/en/insights/market-insights/daily-guide-updated.pdf) | Fresh read |
| MSCI Australia | 10-year reference | 16.5 | 2026-10-22 | [J.P. Morgan / FactSet / MSCI p37](https://am.jpmorgan.com/content/dam/jpm-am-aem/asiapacific/regional/en/insights/market-insights/daily-guide-updated.pdf) | Fresh read |
| MSCI Australia | Dividend/reference | 3.3 | 2026-10-22 | [J.P. Morgan / FactSet / MSCI p37](https://am.jpmorgan.com/content/dam/jpm-am-aem/asiapacific/regional/en/insights/market-insights/daily-guide-updated.pdf) | Fresh read |

## Growth-source tie-out ledger

| Benchmark | Published points | Source date | Period definition | Source |
| --- | --- | --- | --- | --- |
| S&P 500 | 2026: 32.8%; 2027: 16.0% | 2026-10-16 | calendar-year / consensus | [FactSet](https://advantage.factset.com/hubfs/Website/Resources%20Section/Research%20Desk/Earnings%20Insight/EarningsInsight_101626.pdf) |
| MSCI Japan | 2026: 24.0%; 2027: 15.0% | 2026-10-22 | calendar-year / consensus | [J.P. Morgan Asset Management; underlying FactSet and MSCI](https://am.jpmorgan.com/content/dam/jpm-am-aem/asiapacific/regional/en/insights/market-insights/daily-guide-updated.pdf) |
| MSCI Australia | 2026: 7.7%; 2027: 4.9% | 2026-10-22 | calendar-year / consensus | [J.P. Morgan Asset Management; underlying FactSet and MSCI](https://am.jpmorgan.com/content/dam/jpm-am-aem/asiapacific/regional/en/insights/market-insights/daily-guide-updated.pdf) |
| MSCI China | 2026: 1.4%; 2027: 13.7% | 2026-10-22 | calendar-year / consensus | [J.P. Morgan Asset Management; underlying FactSet and MSCI](https://am.jpmorgan.com/content/dam/jpm-am-aem/asiapacific/regional/en/insights/market-insights/daily-guide-updated.pdf) |
| MSCI India | 2026: 13.0%; 2027: 16.6% | 2026-10-22 | calendar-year / consensus | [J.P. Morgan Asset Management; underlying FactSet and MSCI](https://am.jpmorgan.com/content/dam/jpm-am-aem/asiapacific/regional/en/insights/market-insights/daily-guide-updated.pdf) |
| MSCI AC Asia Pacific ex Japan | 2026: 69.5%; 2027: 26.8% | 2026-10-22 | calendar-year / consensus | [J.P. Morgan Asset Management; underlying FactSet and MSCI](https://am.jpmorgan.com/content/dam/jpm-am-aem/asiapacific/regional/en/insights/market-insights/daily-guide-updated.pdf) |
| MSCI ACWI | 2026: 33.8%; 2027: 15.1%; 2028: 12.9% | 2026-08-28 | publisher-year / consensus | [NBF Economics and Strategy; underlying Refinitiv](https://www.nbc.ca/content/dam/bnc/taux-analyses/analyse-eco/mensuel/monthly-equity-monitor.pdf) |
| MSCI World | 2026: 27.2%; 2027: 13.2%; 2028: 13.5% | 2026-08-28 | publisher-year / consensus | [NBF Economics and Strategy; underlying Refinitiv](https://www.nbc.ca/content/dam/bnc/taux-analyses/analyse-eco/mensuel/monthly-equity-monitor.pdf) |
| MSCI Canada | 2026: 25.0%; 2027: 8.2%; 2028: 8.7% | 2026-08-28 | publisher-year / consensus | [NBF Economics and Strategy; underlying Refinitiv](https://www.nbc.ca/content/dam/bnc/taux-analyses/analyse-eco/mensuel/monthly-equity-monitor.pdf) |
| MSCI Europe | 2026: 19.4%; 2027: 9.9%; 2028: 10.5% | 2026-08-28 | publisher-year / consensus | [NBF Economics and Strategy; underlying Refinitiv](https://www.nbc.ca/content/dam/bnc/taux-analyses/analyse-eco/mensuel/monthly-equity-monitor.pdf) |
| S&P/TSX Composite | 2026: 28.3%; 2027: 11.6% | 2026-10-01 | publisher-year / consensus | [National Bank Investments CIO Office; underlying Refinitiv](https://www.nbinvestments.ca/content/dam/bni/publication/cio-asset-sllocation-strategy-2026-10.pdf) |
| MSCI EAFE | 2026: 20.4%; 2027: 9.9% | 2026-10-01 | publisher-year / consensus | [National Bank Investments CIO Office; underlying Refinitiv](https://www.nbinvestments.ca/content/dam/bni/publication/cio-asset-sllocation-strategy-2026-10.pdf) |
| MSCI United Kingdom | 2026: 23.0%; 2027: 5.0%; 2028: 8.0% | 2026-09-30 | publisher-year / consensus | [Hartford Funds; underlying LSEG and Schroders](https://www.hartfordfunds.com/dam/en/docs/pub/funddocuments/flyers/estories/marketview/HF0044_Q426.pdf) |
| MSCI Emerging Markets | 2026: 74.0%; 2027: 24.0%; 2028: 10.0% | 2026-09-30 | publisher-year / consensus | [Hartford Funds; underlying LSEG and Schroders](https://www.hartfordfunds.com/dam/en/docs/pub/funddocuments/flyers/estories/marketview/HF0044_Q426.pdf) |
| Nikkei 225 | 2026: 27.0%; 2027: 22.0% | 2026-09-30 | forecast-horizon / house | [Amova Asset Management Global Investment Strategy Committee](https://emea.amova-am.com/docs/default-source/default-document-library/pdf/insights/2026/2610-global-investment-strategy-committee-outlook-q4-2026.pdf?sfvrsn=169a9d76_3) |
| STOXX Europe 600 | 2026: 14.0%; 2027: 14.0% | 2026-09-30 | forecast-horizon / house | [Amova Asset Management Global Investment Strategy Committee](https://emea.amova-am.com/docs/default-source/default-document-library/pdf/insights/2026/2610-global-investment-strategy-committee-outlook-q4-2026.pdf?sfvrsn=169a9d76_3) |
| FTSE 100 | 2026: 8.0%; 2027: 7.0% | 2026-09-30 | forecast-horizon / house | [Amova Asset Management Global Investment Strategy Committee](https://emea.amova-am.com/docs/default-source/default-document-library/pdf/insights/2026/2610-global-investment-strategy-committee-outlook-q4-2026.pdf?sfvrsn=169a9d76_3) |
| Hang Seng | 2026: -1.0%; 2027: 3.0% | 2026-09-30 | forecast-horizon / house | [Amova Asset Management Global Investment Strategy Committee](https://emea.amova-am.com/docs/default-source/default-document-library/pdf/insights/2026/2610-global-investment-strategy-committee-outlook-q4-2026.pdf?sfvrsn=169a9d76_3) |
| Russell 2000 | 2026: 85.0%; 2027: 44.0% | 2026-07-09 | publisher-year / consensus | [First Eagle Investments; underlying LSEG I/B/E/S](https://www.firsteagle.com/sites/default/files/2026-07/Small-Cap-Market-Overview-2026Q2_M-TL-SCT-MO26Q2-D-LT.pdf) |
| Nasdaq-100 | 2026: 43.0%; 2027: 28.0% | 2026-10-07 | publisher-year / consensus | [UBS Chief Investment Office](https://www.ubs.com/global/en/wealthmanagement/insights/chief-investment-office/house-view/daily/2026/latest-07102026.html) |
| CSI 300 | 2026: 9.0%; 2027: 12.0%; 2028: 6.0% | 2026-05-14 | publisher-year / house | [FSM Global / iFAST Financial Research; underlying iFinD](https://fsm.global/sg/article/rcms370440/policy-support-and-valuation-re-rating-signal-it-is-time-to-revisit-ch) |

## Remaining limits and permitted use

The model is a normalized annual illustration: starting wealth 100; synthetic EPS100/entryP/E; one year-end distribution from prior EPS; zero interest on cash; annual reinvestment at a smooth modeled ex-distribution price. It is not an official index total-return series. Dividends are not free value; growth and distributions must be economically fundable. No matched retention/ROE, cash-flow or share-count model establishes that feasibility here. Buybacks already embedded in per-share growth are not added again.

Published dividend statistics include gross, unspecified and estimated-FY constructions; the model does not invent a uniform matched payout ratio. Yield×entryP/E is a synthetic first-payment calibration, not an official corporate or index payout. Historical averages and unchanged multiples are assumptions about exit valuations, not fair-value targets. Source age, failed checks and unsupported comparisons remain visible.

No independently verified current official EPS series/index level, FX conversion, hedging, taxes, fees, actual ex-dates, daily rebalancing, path volatility or drawdown distribution is modeled. A mathematically consistent IRR does not make a five-year expected return knowable. Use the site to examine conditional earnings/valuation/income cases; portfolio conclusions require fresh matched market/earnings inputs and a supported downside/funding analysis.

## Verification

118 Node tests and 122 Python parser/pipeline tests passed. Local Chromium checks passed 116 assertions, covering all 21 benchmarks,20 valid default return models, the blocked STOXX default, custom overrides, legacy migration, invalid inputs, source restore, sensitivities, actual 6-row/126-row downloads and independent cash-flow/terminal-value reconciliation. Width checks passed at 360/390/768/1440px. The desktop comparison capture was visually inspected. Production Chromium verification also passed all 116 assertions at the custom domain. All nine changed live asset/data responses match the verified build. Worker version: `92d71952-9723-42a6-bf44-b2adb91166c7`; code release: `2085778`; semantic snapshot version: 5. Raw review captures and source files stay in ignored local qa.
