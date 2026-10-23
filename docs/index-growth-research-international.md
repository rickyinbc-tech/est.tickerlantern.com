# International annual EPS forecast source research

Checked October 22, 2026 (America/Vancouver). Public original publisher sources only. Source PDFs and rendered inspection images are private, owner-only files in ignored `qa/international-growth/`; hashes are in `source-hashes.json`. Every numerical table recommended below was rendered from the downloaded original and visually inspected. No application code or data was edited by this research task.

## J.P. Morgan: current calendar-year country forecasts

[Daily Asia Guide](https://am.jpmorgan.com/content/dam/jpm-am-aem/asiapacific/regional/en/insights/market-insights/daily-guide-updated.pdf), cover October 23, 2026; observations **October 22, 2026**. Publisher J.P. Morgan Asset Management; underlying FactSet/MSCI. PDF page 37, “APAC ex-Japan equities: Returns and valuations by market”; page 34 explicitly defines respective MSCI indexes and FactSet calendar-year consensus.

| Exact site benchmark | 2026 EPS growth | 2027 EPS growth |
| --- | ---: | ---: |
| MSCI Australia | 7.7% | 4.9% |
| MSCI China | 1.4% | 13.7% |
| MSCI India | 13.0% | 16.6% |
| MSCI AC Asia Pacific ex Japan | 69.5% | 26.8% |

PDF page 30 labels MSCI Japan **24% / 15%**, rounded to whole percentages. Do not claim greater precision. Page 49 has MSCI Europe growth bars without numeric labels; do not read exact rates from bar height. No 2028 EPS consensus in this edition. The page 37 Hong Kong column is MSCI Hong Kong, **not Hang Seng**; China is MSCI China, **not CSI 300**. The separate P/E chart is not a growth forecast.

Automation: stable public PDF; extract native earnings rows, validating headings, years, observation date and benchmark identities.

## National Bank: broad annual index coverage

[Monthly Equity Monitor](https://www.nbc.ca/content/dam/bnc/taux-analyses/analyse-eco/mensuel/monthly-equity-monitor.pdf), **September 2026**, PDF **p3**. Observation **August 28, 2026**; NBF / Refinitiv.

| Exact site benchmark | 2026 | 2027 | 2028 |
| --- | ---: | ---: | ---: |
| MSCI ACWI | 33.8% | 15.1% | 12.9% |
| MSCI World | 27.2% | 13.2% | 13.5% |
| MSCI Canada | 25.0% | 8.2% | 8.7% |
| MSCI Europe | 19.4% | 9.9% | 10.5% |
| MSCI Japan | 14.0% | 18.1% | 13.1% |
| MSCI Emerging Markets | 71.5% | 23.4% | 10.4% |

Publisher year-labelled annual EPS estimates, separate from “12 months forward”. Currency and fiscal/calendar aggregation are unspecified. “MSCI Pacific ex Jp” is **not** MSCI AC Asia Pacific ex Japan.

Automation: stable URL, native table, monthly. Validate month, observation, years, identities. Daily checks preserve August dates. NBF Vision is older (July/August; July 10 observations).

Exact row labels present: MSCI ACWI; MSCI World; MSCI USA; MSCI Canada; MSCI Europe; MSCI Pacific ex Jp; MSCI Japan; MSCI EM; MSCI EM EMEA; MSCI EM Latin America; MSCI EM Asia. No UK, FTSE 100, STOXX 600 or EAFE row.

## Hartford Funds: MSCI United Kingdom and newer Japan/EM

[MarketView landing page](https://www.hartfordfunds.com/insights/market-perspectives/global-macro-analysis/market-view-snapshot.html) links the [Fourth Quarter 2026 PDF](https://www.hartfordfunds.com/dam/en/docs/pub/funddocuments/flyers/estories/marketview/HF0044_Q426.pdf). PDF page **19**, “Earnings-Per-Share Growth Rate Forecasts (%)”. Observations **September 30, 2026**; source LSEG and Schroders, October 2026.

| Exact site benchmark | 2026e | 2027e | 2028e |
| --- | ---: | ---: | ---: |
| MSCI United Kingdom | 23% | 5% | 8% |
| MSCI Japan | 22% | 13% | 11% |
| MSCI Emerging Markets | 74% | 24% | 10% |

Whole-percentage precision as published. Index identities are explicit in the footnote. “Europe (ex UK)” is **not** MSCI Europe; “US” is MSCI USA, **not** S&P 500. The chart uses annual year labels, without an explicit fiscal/calendar methodology statement.

Automation: discover the current `HF0044_Q...pdf` link on the stable landing page. All chart numbers are native vector text (series-major text order); use coordinate grouping or check all 15 labels, legend and year headings. No OCR required. Old quarterly PDF URLs can return 404 after replacement, so do not hardcode Q426 forever.

## BTC Capital Management: explicit calendar-year EAFE

[September 2026 article](https://www.btccapitalmgmt.com/five-in-five-september-2026/), published **September 9, 2026**, links [Five in Five PDF](https://www.btccapitalmgmt.com/wp-content/uploads/2026/09/BTCCap_FiveinFive_September2026.pdf). PDF page **6**. Sources: BTC Capital Management / FactSet Research Systems.

| Exact site benchmark | CY2026E | CY2027E | CY2028E |
| --- | ---: | ---: | ---: |
| MSCI EAFE | 15.7% | 9.6% | 10.4% |
| MSCI Emerging Markets | 67.6% | 24.2% | 10.5% |

The text explicitly says calendar years. No distinct observation date is printed, so report the publication date rather than inventing an as-of date. The EAFE 2027 chart label is **9.6%** despite surrounding prose claiming double-digit growth each year; the chart controls this extraction, and the inconsistency should remain documented.

Automation: [publisher news](https://www.btccapitalmgmt.com/news/) lists Five in Five issues. The numerical chart is a raster image: native PDF text contains descriptions but no values. Updating numerical data requires OCR with visual review or another machine-readable publisher source. Merely downloading a changed PDF must not mark old numbers successfully refreshed. Keep this as a dated verified reference unless that pipeline exists.

## Additional European candidates with material limitations

**FTSE 100 dated original EPS table:** [RBC Wealth Management, “Rocket ships to the moon”](https://www.rbcwealthmanagement.com/en-ca/insights/rocket-ships-to-the-moon), published June 25, 2026. Its [original table image](https://www.rbcwealthmanagement.com/en-ca/wp-content/uploads/sites/5/2026/07/26-RI-how-the-AI-theme-is-driving-todays-markets-WMC-CHART-4-EN.jpg) explicitly prints FTSE 100 **2026E EPS growth 17.7%; 2027E 5.9%**. Visually inspected. Source Bloomberg; original image observation date **June 25, 2026**, although the HTML caption says June 15. Preserve the discrepancy and use the original image date. No 2028. Exact chart title: “Developed markets EPS growth estimates and valuations”; EPS means year-over-year earnings per share. This is a four-month-old dated reference, not current-day consensus. Native HTML alt text omits the FTSE 2026 value. A refresh must OCR/review changed images or retain the old observation date and report no new verified numerical forecast. Local image: `qa/international-growth/rbc-ftse-table.jpg`.

**STOXX Europe 600 recent house forecast:** [FSM Global / iFAST, “Europe 4Q Outlook”](https://fsm.global/sg/article/rcms398940/europe-4q-outlook-more-resilient-than-expected-but-the-risk-reward-rem), by Laven Cao CFA, October 9, 2026. Table 1 explicitly prints **FY2026E 13.29%; FY2027E 7.41%; FY2028E 8.05%** EPS growth. Observations September 30, 2026; Bloomberg Finance L.P. / iFAST Estimates. These are **iFAST house forecasts**, not market consensus, and fiscal-year labels must remain FY. HTML table is directly machine-readable and internally matches EPS 40.50/43.50/47.00, but do not convert FY labels into explicit calendar years or describe this provider's estimates as consensus. This could support a separately identified publisher-forecast series if the product supports that distinction; otherwise retain the source gap. Discovery can use the publisher's Macro Research articles, select this exact index and table, and fail closed on changed semantics.

## Rejected substitutions and remaining source gaps

- **FTSE 100:** newer annual EPS consensus not yet found in a reliably extractable primary source. [HSBC Q4 2026](https://www.privatebanking.hsbc.com/content/dam/privatebanking/gpb/wealth-insights/investment-insights/house-views/2026/q4-2026-investment-outlook-ai-celeration.pdf), PDF page 9, has the correct benchmark and September 2 observations, but bars have no numeric labels; do not assign precise percentages from heights.
- [AJ Bell August 18 article](https://www.ajbell.co.uk/news/can-earnings-growth-continue-sustain-us-and-uk-markets) discusses aggregate FTSE 100 earnings growth 12%/8%; [October article](https://www.ajbell.co.uk/group/news/why-rise-gilt-yields-means-company-profit-growth-even-more-important) explicitly calls 10%/9%/6% **net income growth**. Aggregate net-income growth can differ from EPS after share-count changes; do not silently ingest as EPS.
- **STOXX Europe 600:** [LSEG October 22 report](https://lipperalpha.refinitiv.com/2026/10/stoxx-600-earnings-outlook-26q3-october-22-2026/) links [original PDF](https://lipperalpha.refinitiv.com/wp-content/uploads/2026/10/TRPR_83201_669.pdf). Full-index outlook is quarterly; the CY2026 column on page 6 is explicitly Eurozone constituents only. Neither supplies full-index annual growth. [Goldman Sachs January article](https://www.goldmansachs.com/insights/articles/economic-growth-is-forecast-to-drive-a-modest-rise-in-europe) gives an old **house forecast**, not current consensus; do not label it current.
- [LSEG Weekly Aggregates October 16](https://lipperalpha.refinitiv.com/2026/10/weekly-aggregates-report-october-16-2026/) “Global Datapoints” FY1/FY2 rows are I/B/E/S country universes, not exact MSCI/FTSE benchmark matches. Reject proxy substitutions.

The [exact Asian index supplement](index-growth-research-asia-exact.md) adds verified Amova house forecasts for Nikkei 225, Hang Seng, FTSE 100 and STOXX Europe 600, with explicit forecast horizons, plus a dated iFAST CSI 300 model. The [candidate JSON](research-growth-international.json) preserves those distinctions. The parent task separately researches EAFE and North America. No missing source is permission to repeat 6%, extend the final forecast year indefinitely, or mark an unsupported rate as synchronized.
