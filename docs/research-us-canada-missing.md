# Missing U.S. and Canadian valuations: source research

Reviewed 22 October 2026. Scope: exact Nasdaq-100, Russell 2000 and S&P/TSX Composite. Public publisher material only; no private account or client records.

## Nasdaq-100 and Russell 2000: a current, exact source

Nasdaq publishes a biweekly **Global Markets Dashboard / Global Index Snapshot**. Its 16 October 2026 issue has exact numeric current NTM P/E and ten-year-average columns, with an explicit statement that the averages use **daily** NTM P/E observations. This is preferable to inferring a mean from a chart or mixing providers.

- [16 October research article](https://www.nasdaq.com/articles/global-indexes/biweekly-investment-insights/earnings-show-me-moment), which links the report.
- [16 October dashboard PDF, physical page 1](https://www.nasdaq.com/docs/global-indexes/global-markets-dashboard-oct-16-2026).
- **Observation date: 13 October 2026**, distinct from the article date.
- Publisher attribution: Nasdaq Global Indexes, Bloomberg, FactSet.

| Exact benchmark | NTM P/E | 10-year daily mean | Dividend yield | Reported premium |
|---|---:|---:|---:|---:|
| Nasdaq-100 | 21.36 | 23.09 | 0.5% | -7.5% |
| Russell 2000 | 23.87 | 23.34 | 1.5% | +2.3% |
| MSCI Japan | 15.90 | 15.15 | 1.8% | +5.0% |

The same report also has S&P 500, ACWI **ex-USA**, Europe **ex-UK**, and Emerging Markets **IMI** rows. The latter three must never replace ACWI, MSCI Europe or MSCI Emerging Markets. The thematic-equity table uses **five-year**, not ten-year, means.

Cross-check: [2 October dashboard](https://www.nasdaq.com/docs/global-indexes/global-markets-dashboard-october-2-2026), physical page 1, data 28 September 2026, has Nasdaq-100 21.74 / 23.08 and Russell 2000 24.49 / 23.37. Changes across issues are consistent with a rolling publication. The old [undated filename](https://www.nasdaq.com/docs/global-markets-dashboard.pdf) serves a **20 January 2026** observation and must not be assumed to be latest.

### Auto-discovery and access

1. Use the [official index-research hub](https://www.nasdaq.com/products/global-indexes/research-insights) or Nasdaq's [public sitemap](https://www.nasdaq.com/sitemap.xml) to discover exact `biweekly-investment-insights` article links.
2. Extract only same-host publisher-linked `/docs/...global-markets-dashboard...` URLs from each article. Filename spellings vary (`october-2` versus `oct-16`), so do not generate future filenames.
3. Parse the PDF's actual observation date, exact benchmark labels, NTM / ten-year column order, daily-average definition, bounds and premium reconciliation. Prefer the newest validated observation; retain the last valid observation on failure.
4. Nasdaq's [robots.txt](https://www.nasdaq.com/robots.txt) sets a **30-second crawl delay** for general user agents, permits public docs/articles and advertises the sitemap. It disallows `/api/v1/*`; do not use the site's internal article API for discovery.

The web reader successfully obtained both public PDFs and machine-readable page text. At research time, ordinary Mac requests to `www.nasdaq.com` returned HTTP/2 stream resets or timed out without bytes. This is an access/reachability limitation, not proof that a scheduled fetch works. Test a normal request from the GitHub runner before labeling the connection healthy. No CAPTCHA or access-control bypass was attempted. The original public Nasdaq PDF was subsequently downloaded through its official article link, visually verified, and parsed from its actual native text. Raw publisher PDFs are not committed or served by the website.

`scripts/nasdaq_source.py` provides an isolated, network-free parser and same-host link extractors. Eight tests validate exact metrics plus definition, date, duplicate, identity, column-shift and native PDF punctuation-spacing failures. The actual original extraction passes. Scheduled publisher transport is verified separately in GitHub Actions; failed delivery remains visibly retained.

## S&P/TSX Composite

### Exact ten-year NTM mean, dated prefill

[Cumberland Private Wealth, June 2025 North American Strategy Review](https://cumberlandprivate.com/wp-content/uploads/2025/07/North-American-Strategy-Review-June-2025.pdf), physical page 7, Exhibit 10, reports **15.1x** for the TSX ten-year average as of **30 June 2025**. The footnote explicitly identifies blended-forward-12-month P/E for the average. The current-year rows are **calendar-year** estimates and are not valid substitutes for current NTM P/E.

A previous [December 2024 review](https://cumberlandprivate.com/wp-content/uploads/2025/01/North-American-Strategy-Review-December-2024.pdf), page 8, reports the same 15.1 ten-year mean as of 23 December 2024. The June 2025 observation is preferable. The March, June and September 2026 North American reviews were searched from their original public PDFs; those reports omit the TSX NTM / ten-year-average table. Do not advance the mean's date just because a newer report was checked.

Cumberland has a normally accessible public [WordPress posts endpoint](https://cumberlandprivate.com/wp-json/wp/v2/posts?search=north%20american&per_page=20). Exact report PDF links are inside each post's rendered content. A daily adapter can discover newly published North American reviews from it, inspect a small bounded number, and update only when the required table is actually present. Older mean observations must remain visibly dated.

### Exact current NTM valuation and working auto-discovery

Raymond James' monthly **Insights & Strategies**, [October 2026 report on its official Goodridge Group adviser site](https://www.goodridgegroup.ca/-/media/RJ/DotCom-Canada/Files/Commentary-and-Insights/Insights-and-strategies/Insights--Strategies-October-2026.pdf), physical page **20**, reports **15.6x current P/E NTM as of 30 September 2026** for S&P/TSX Composite. Its adjacent 14.6 historical P/E is **2000–present**, excluding outliers, and is not the requested ten-year average. Current NTM and the separately dated Cumberland mean must show explicit per-metric dates and sources.

The normal public fetch succeeded (4,270,584 bytes, 23 PDF pages), and the original page was rendered and visually verified. The isolated `scripts/tsx_source.py` parser was run successfully against native `pypdf` extraction from this actual PDF, returning `forwardPE=15.6`, `asOf=2026-09-30`, `sourcePage=20`. It also successfully parsed the actual Cumberland PDF, returning `mean10YearForwardPE=15.1`, `meanAsOf=2025-06-30`, `sourcePage=7`.

Working discovery chain:

1. [Goodridge Knowledge Centre](https://www.goodridgegroup.ca/knowledge-centre) includes exact, dated monthly article links in normal HTML. Select newest `/knowledge-centre/YYYY/MM/DD/insights-and-strategies` links. The public `/sitemap.xml` returns 404 and is unnecessary.
2. [October 8 article](https://www.goodridgegroup.ca/knowledge-centre/2026/10/08/insights-and-strategies) links the current report PDF using the `/ - /media/RJ/...` path, without spaces.
3. Fetch only exact same-host publisher-linked PDFs. Do not construct future filenames; the prior May report used `en_05082026_insights_strategies.pdf`.
4. Locate the exact Composite row in the sector table, confirm NTM/current column order and dated FactSet/Raymond James source, and record physical page number. Reject the historical column as a ten-year measure.

The main `raymondjames.ca` host had HTTP/2 resets locally, whereas its official `goodridgegroup.ca` adviser site served HTML and the full report normally. One initial Knowledge Centre response was thin; later responses contained the October and September links. Use a small bounded retry and retain prior values if no valid article links appear.

For completeness, the older [May 2026 report](https://www.douglasduncanwm.com/-/media/rj/dotcom-canada/files/commentary-and-insights/insights-and-strategies/en_05082026_insights_strategies.pdf), physical page 16, reports 15.8x as of 30 April 2026; it is superseded by the September observation above.

The October report's physical page 21 also includes exact current NTM values for Nikkei 225 (19.7), FTSE 100 (12.0), Hang Seng (10.2) and CSI 300 (14.1), all as of 30 September 2026. Its historical column is a 2000–present median and is not ten-year. The starred World/EAFE/EM rows explicitly use iShares ETF proxies and must not be substituted for their underlying MSCI index rows.

### Additional rounded source; not preferred

[Manulife's December 2025 outlook](https://www.manulife.com/ca/en/advisor/group-plans/resources/insights/2025/2026-market-outlook--winning-isn-t-all-it-s-cracked-up-to-be) states TSX nearly 19x forward versus a ten-year average of 17x, with Bloomberg as of 31 October 2025. Its footnote defines forward P/E as next-twelve-month earnings. These are rounded figures and differ substantially from the exact Cumberland convention. Avoid silently mixing them into a precise same-basis comparison; retain the original source, date and approximation if used.

The [National Bank Monthly Equity Monitor](https://www.nbfwm.ca/content/dam/bnc/taux-analyses/analyse-eco/mensuel/monthly-equity-monitor.pdf) is accessible and serves September 2026 at review time. Its TSX forward-P/E chart has no exact numeric last-value labels; its forecast table's 19.0 is explicitly **trailing** implied P/E. Neither is suitable for a precise forward-P/E prefill. No chart coordinates were estimated.
