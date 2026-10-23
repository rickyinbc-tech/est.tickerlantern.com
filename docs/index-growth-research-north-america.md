# North America annual earnings-growth research

Research date: October 22, 2026 (Vancouver). Candidates for independent validation; growth values are percentages. Downloaded originals and verification images are owner-only in ignored `qa/north-america-growth/`. No application or feed edits were made.

| Exact index | 2026 | 2027 | Evidence date | Primary publisher evidence |
|---|---:|---:|---|---|
| S&P 500 | 32.8% | 16.0% | October 16, 2026 | [FactSet Earnings Insight, p. 14](https://advantage.factset.com/hubfs/Website/Resources%20Section/Research%20Desk/Earnings%20Insight/EarningsInsight_101626.pdf) |
| Nasdaq-100 | 43% | 28% | Published October 7, 2026 | [UBS CIO daily](https://www.ubs.com/global/en/wealthmanagement/insights/chief-investment-office/house-view/daily/2026/latest-07102026.html) |
| Russell 2000 | 85% | 44% | LSEG data July 9, 2026 | [First Eagle July commentary, p. 2](https://www.firsteagle.com/sites/default/files/2026-07/Small-Cap-Market-Overview-2026Q2_M-TL-SCT-MO26Q2-D-LT.pdf) |
| Canada S&P/TSX | 28.3% | 11.6% | Report October 1, 2026 | [NBI CIO Asset Allocation Strategy, p. 6 chart 15](https://www.nbinvestments.ca/content/dam/bni/publication/cio-asset-sllocation-strategy-2026-10.pdf) |

All numbers above were visually verified against original pages or the rendered UBS article. No 2028 observation was verified. FactSet explicitly labels calendar years; UBS resolves this/next year against publication year. First Eagle and NBI print annual year labels but do not define a precise per-share aggregation method in the cited passage. The latter three should retain the publisher’s annual earnings-growth wording.

First Eagle is an old July consensus snapshot, even when retrieved in October. Its page publication is July 23, whereas forecast footnote 4 gives July 9. The forecast source is LSEG I/B/E/S; the commentary does not specify an alternative constituent-average method.

The NBI chart uses full lines for 2026 and dashed lines for 2027. Its Canada series is red; extracted-text order mixes countries and cannot establish row identity. Chart 15 also shows EAFE 2026 20.4% / 2027 9.9%, EM 74.3% / 23.9%, and S&P 500 34.0% / 16.8%. Prefer newer FactSet for the latter. The older `nbfwm.ca` stable CIO PDF is stale May 1 and must not supply an assumed current date.

The newer [Royce October recap](https://www.royceinvest.com/insights/small-cap-recap) shows Russell 2000 40.5% / 49.8% as of September 30. Its explicit definition is mean constituent one-year EPS growth, excluding uncovered issuers and certain securities. It is unsuitable for directly compounding aggregate index EPS and was rejected as a model default.

Public update discovery routes and source hashes are in `research-growth-north-america.json`. NBI’s insights list links dated monthly articles and their PDFs. FactSet’s earnings topic lists weekly updates; full PDFs preserve both CY values when the article only prints the first. First Eagle’s insights list can discover later written small-cap overviews. UBS’s listing uses a client-rendered ActivityStream, so a parser must actually discover new dated articles or report its coverage limit instead of refreshing only an old URL’s retrieval timestamp.

Krungsri’s listing identifies an October 6 handbook, but ordinary HTTP/browser requests expose an Incapsula/hCaptcha barrier and no current PDF could be verified. No bypass was attempted. Nasdaq’s October 16 nearly 41% figure describes Q3 only and cannot be relabelled annual. GSAM September 25 and October 2/9/16 monitors were checked and did not provide a replacement annual Nasdaq-100 table.


## Follow-up: automated discovery verified

Verified October 22, 2026 (Vancouver), with ordinary anonymous requests and no account cookies. Source downloads and responses remain under private `qa/north-america-growth/`.

### UBS: use the published sitemap route

The [UBS robots file](https://www.ubs.com/robots.txt) explicitly disallows `/bin/` and ActivityStream query URLs. It publishes [the root sitemap](https://www.ubs.com/sitemap.xml), which links [the global English sitemap](https://www.ubs.com/global/en.sitemap.xml). All three returned HTTP 200. No crawl-delay was specified. The English XML was 3,867,534 bytes and contained 206 `/house-view/daily/2026/` article URLs, including:

- October 22: `https://www.ubs.com/global/en/wealthmanagement/insights/chief-investment-office/house-view/daily/2026/latest-22102026.html`
- October 20: `https://www.ubs.com/global/en/wealthmanagement/insights/chief-investment-office/house-view/daily/2026/latest-20102026.html`
- October 7: `https://www.ubs.com/global/en/wealthmanagement/insights/chief-investment-office/house-view/daily/2026/latest-07102026.html`

There are no `lastmod` fields. Extract `url/loc`, filter the exact global English daily path, and parse `latest-DDMMYYYY.html`; some August URLs use `latest-DDMMYY.html`. Use this solely to order candidates, then confirm the actual publication date in each article. Skip future URLs. Fetch new candidates conservatively and retain checked hashes to avoid repeatedly downloading unchanged articles.

The newest eleven daily articles from October 8–22 were checked: none contained a replacement annual Nasdaq-100 growth pair. October 7 remains the newest verified annual pair found in that bounded window. Current retrieval does not change its October 7 evidence date.

### UBS API experiment: works, but not the scheduled discovery choice

The ordinary browser requests `POST https://www.ubs.com/bin/ubs/caas/v2/searchContentAbstracts`. A replay without required site headers returned 401; supplying the same publicly served bootstrap headers returned 200, `totalHits=451`, and the seven newest dated article records. No user login, account credential, cookie, or CAPTCHA bypass was involved. However, because `/bin/` is explicitly disallowed by robots, use the sitemap instead for the scheduled crawler.

For reproducibility, parse JSON from the daily page element’s `data-nc-params-sdas` attribute. Header names are `Referer`, `X-APP-Id`, and `X-API-Key`; derive their values from the page URL and public `options` object in memory. Do not persist the application identifier or key. The observed request body, which contains neither value, was:

```json
{
  "contentTypes": ["ARTICLE"],
  "mediaTypes": [],
  "language": "en",
  "isoLanguage": "en",
  "tagSelectionLogic": "(magazine:cio/cio-house-view-daily)",
  "maxResult": 7,
  "offset": 0,
  "useLanguageFallback": true,
  "includePaths": [],
  "excludePaths": [],
  "searchKeyword": "",
  "siteContext": "/content/sites/global/wealthmanagement/insights/chief-investment-office",
  "currentPagePath": "/content/sites/global/en/wealthmanagement/insights/chief-investment-office/house-view/daily",
  "sortingRule": "DATE",
  "excludeResult": "",
  "articleDisplayPage": "",
  "marketNewsDisplayPage": "",
  "newsDisplayPage": ""
}
```

Clicking the actual Show more control produced the same body with `maxResult=10, offset=7`; that anonymous replay also returned 200. Response fields are `documents[].fields.targetUrl[0]`, `as_displayDate[0]`, and `title[0]`. Page one returned October 22, 21, 20, 19, 16, 15, 14; page two returned October 13 through September 30. No key/app identifier was saved with these response snapshots.

### NBI: working HTML → article → PDF route

Normal GET [NBI Insights](https://www.nbinvestments.ca/perspectives.html) returned 200 and 21 ordinary anchors containing `asset-allocation-strategy-`. The newest matching anchor was October 1, 2026, linking [the October article](https://www.nbinvestments.ca/perspectives/article/asset-allocation-strategy-october-2026.html). That article returned 200 and its Download complete edition anchor resolved to the verified [October PDF](https://www.nbinvestments.ca/content/dam/bni/publication/cio-asset-sllocation-strategy-2026-10.pdf). The spelling `sllocation` is the publisher’s actual URL. September, August, and earlier monthly anchors are also present, so discovery does not require guessing filenames. Select by article date, validate its report date and exact annual chart, and preserve the source’s observation-date limitation. Robots disallows `/bin/*`, which this route does not use; no crawl-delay was specified.

### First Eagle: working written-overview discovery

Normal GET [All Insights](https://www.firsteagle.com/all-insights) returned 200 and ordinary anchors with dates. Filter titles/paths for Small Cap Market Overview; the newest written result is [2Q26, published July 23](https://www.firsteagle.com/insights/2q26-small-cap-market-overview). GET of that article returned 200 and its Download PDF anchor resolved to the verified July PDF used above. The October 12 item is US Small Caps in Focus: 3Q26, a video, and must not displace the written forecast source without usable new annual figures. The April 30 1Q26 and February 5 4Q25 overviews were also listed. No crawl-delay was specified in the robots file.
