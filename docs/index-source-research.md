# Index valuation source research

Research date: October 22, 2026 (America/Vancouver). Public sources only. This note does not authorize redistribution of publisher datasets or charts.

## Practical recommendation

Use FactSet's public S&P 500 earnings article for a synchronized current forward P/E and publisher-reported 10-year average. Use monthly MSCI index fundamentals for international comparisons, with a missing (`null`) 10-year average. Do not substitute trailing P/E, CAPE, an ETF's P/E, annualized 10-year returns, or a short available history for a 10-year forward-P/E mean.

Store observation date separately from fetch time. A successful request without the expected index name, metric labels, and observation date is a failed refresh. Preserve the last verified record with an explicit stale/error status. User growth assumptions and exit multiples remain editable scenarios; a newly fetched source observation must not silently overwrite an edited scenario.

## FactSet: complete S&P 500 pair, accessible HTML and RSS

- Stable discovery: <https://insight.factset.com/topic/earnings/rss.xml>
- Human listing: <https://insight.factset.com/topic/earnings>
- Verified article: <https://insight.factset.com/sp-500-earnings-season-update-october-16-2026>
- Article publication / observation: October 16, 2026.
- S&P 500 forward **12-month** P/E: **19.0x**. Publisher-reported **10-year average: 19.1x**; 5-year average: 19.8x.
- The exact historical sampling frequency and start/end dates underlying the reported mean are not specified in this HTML article. Label it “FactSet reported 10-year average”; do not invent a computed period or claim a reconstructed series.
- This is the historical average of forward valuation observations, not a forecast P/E ten years into the future.

Direct `curl -fsSL` successfully returned both RSS (approximately 30 KB) and article HTML (approximately 87 KB). RSS items provide `link` and `pubDate`; article JSON-LD provides `datePublished` and `dateModified`. Latest RSS item need not contain valuations: the October 19 article precedes the October 16 earnings-season update.

Suggested parser: read RSS in descending `pubDate` order, restrict URLs to `https://insight.factset.com/`, fetch a small bounded number of recent S&P 500 articles, strip HTML, and find the sentence beginning `The forward 12-month P/E ratio is`. Parse the current number plus `5-year average (...)` and `10-year average (...)` within the same bounded paragraph. Accept variants “above” / “below” / “equal to” without depending on wording. Choose the newest article with a complete valid pair; preserve its actual article date. Reject absent/ambiguous matches and future-dated articles. Refresh daily after U.S. close, although publication is usually weekly.

## MSCI: official monthly current forward P/E and dividend yield

All rows below were verified on the live official HTML profile, **data as of September 30, 2026**. These are the named MSCI indexes, not equivalent labels for another index provider's benchmark. No profile supplied a historical 10-year forward-P/E mean.

| Exact index | Index code | P/E Fwd | Dividend yield | Official profile |
|---|---:|---:|---:|---|
| MSCI ACWI | 892400 | 16.28x | 1.58% | <https://www.msci.com/indexes/index/892400/msci-acwi-index> |
| MSCI World | 990100 | 17.92x | 1.52% | <https://www.msci.com/indexes/index/990100/msci-world-index> |
| MSCI EAFE | 990300 | 14.79x | 2.67% | <https://www.msci.com/indexes/index/990300/msci-eafe-index> |
| MSCI Emerging Markets | 891800 | 9.72x | 2.02% | <https://www.msci.com/indexes/index/891800/msci-em-emerging-markets-index-2> |
| MSCI Europe | 990500 | 14.20x | 2.87% | <https://www.msci.com/indexes/index/990500/msci-europe-index> |
| MSCI Japan | 939200 | 15.63x | 1.84% | <https://www.msci.com/indexes/index/939200/msci-japan-index> |
| MSCI China | 302400 | 10.15x | 2.43% | <https://www.msci.com/indexes/index/302400/msci-china-index> |
| MSCI India | 935600 | 18.61x | 1.34% | <https://www.msci.com/indexes/index/935600/msci-india-index> |

Important availability distinction: web reading obtained these profiles, but ordinary command-line HTTP returned an approximately 1.8 KB `Challenge Validation` page with HTTP 200. Treat that body as unavailable, do not attempt to bypass the challenge, and do not promise dependable HTML synchronization.

Accessible official PDF fallback verified by ordinary `curl`:
<https://www.msci.com/documents/10199/255599/msci-acwi.pdf>

This URL returned a real 182 KB PDF. Reading page 1 in memory with `pypdf` confirmed September 30, 2026 fundamentals and all three rows for ACWI / World / Emerging Markets matching the live HTML values above. Thus one small monthly document can supply three named benchmarks. Public web-search PDF caches still reported April 2026 for this same mutable URL: use the downloaded document's internal date, not a search-engine snippet date. No PDF bytes were saved in the repository. For production parsing, require `%PDF`, exact named row labels, `FUNDAMENTALS` date, and the ordered `Div Yld (%)`, `P/E`, `P/E Fwd`, `P/BV` header. Visually verify the original page before shipping a changed table parser.

MSCI methodology reference:
<https://www.msci.com/indexes/documents/methodology/0_MSCI_Fundamental_Data_Methodology_20240625.pdf>

Pages 16–17 describe forward EPS as a rolling blend of current- and next-fiscal-year analyst consensus, using months remaining in the current year. Forecast data is refreshed monthly. Page 48 explains index aggregation. The profile's `P/E` and `P/E Fwd` are distinct fields. Do not infer a ten-year mean from the ten-year return/risk columns. Check the current methodology version if precise implementation changes matter.

## Additional official publishers investigated

- **RBC Wealth Management, October 2026 Global Insight:** current public pointer is the October 15 advisor blog <https://wmc.rbcwealthmanagement.com/sullivan-wealth-management-group/blog/october-update-from-sullivan-wealth-management-6497920538419887624>, which links <https://rbcwm.bluematrix.com/attachments/9227_590dd6a8-fa9c-45d0-bf06-56273e128a8a.pdf>. The 16-page current issue contains equity commentary on pages 9–11, but does not reproduce the old eight-market current/10-year-mean table. Older 2021 and 2022 Outlook tables exist; they must not be used as current means.
- **FTSE Russell Q1 2026 Russell US Indexes Spotlight:** <https://www.lseg.com/content/dam/ftse-russell/en_us/documents/market-insights/russell-us-index-spotlight/us-russell-quarterly-spotlight-q1-2026.pdf>. Current forward valuation comparisons are charts and use a **5-year**, not 10-year, average. The April 2023 report explicitly gave a Russell 2000 10-year mean, but is too old for a current dashboard.
- **Nasdaq Global Indexes, May 2026 research:** <https://www.nasdaq.com/docs/index/investment-insights-ai-earnings-equity-returns-portfolio-dynamics>. Figure 6 compares Nasdaq-100, S&P 500 and four regions against 10-year means, sourced to Bloomberg as of May 4, 2026. It presents bars and percentage-premium markers, not a machine-readable exact current/average table; do not estimate numbers from graphical positions or relabel generic regional universes as MSCI indexes.

No dependable, current, public primary-publisher table covering six or more exact major indexes with both forward P/E and exact 10-year average was verified. Leave unavailable figures null and provide source links. Complete historical coverage requires a suitable licensed data source or a separately verified publisher source; do not manufacture historical averages to fill the design.
