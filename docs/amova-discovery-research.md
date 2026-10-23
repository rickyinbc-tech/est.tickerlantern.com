# Amova GISC automatic discovery

Verified October 23, 2026. Research only; no application changes.

## Observed public route

The [Amova Insights page](https://emea.amova-am.com/institutional/insights) loads its listing through this exact **GET** request, observed in the site's own browser network traffic:

```text
https://emea.amova-am.com/api/insight/searchandfilter?page=1&pagesize=500&investortype=institutional&country=&lang=en
```

The browser request returned HTTP 200, `application/json`. An independent anonymous request to the identical URL also returned the listing. No authentication, investor declaration acceptance, location selection, consent-cookie injection or access-control bypass was used. The page's investor overlay remained unaccepted; the site itself issued this request with an empty `country` parameter.

The normal Insights HTML has the filters and page structure but no article anchors; it is not a sufficient discovery document by itself. The API response was saved privately under ignored `qa/international-growth/amova-insights-api.json`, owner-only. SHA-256 of the verified response: `e73a4f7d836c0306070cc1f62eacf8e41ea69069e233fe01fe686ddf4d294027`.

## Response schema and selection

Top-level fields observed:

```json
{
  "totalRecords": 140,
  "data": [
    {
      "DisplayTitle": "Global Investment Strategy Committee Outlook Q4 2026",
      "StartPublishing": "09 October 2026",
      "PublicationDateSortable": "2026-10-09T09:00:00.0000000Z",
      "AbsoluteUrl": "https://emea.amova-am.com/institutional/insights/detail/2610-global-investment-strategy-committee-outlook-q4-2026",
      "InsightTypeTaxonModel": {
        "Title": "Quarterly Reports",
        "NameCode": "quarterly-reports"
      }
    }
  ],
  "status": "ok",
  "message": "Success",
  "hasMore": false,
  "debugRelevance": null
}
```

Each article also has `Subtitle`, `Introduction`, `AuthorModels`, `FeaturedImageUrl`, `ReadingTimeText`, `FeaturedText` and `AllowedAudiencesDisplayString`. `data` currently contains all 140 records.

Match the exact report family by title, for example `^Global Investment Strategy Committee Outlook Q[1-4] 20[0-9]{2}$`, and select the largest valid `PublicationDateSortable`. Do not select the first general article; the newest GISC is currently the third listing item. Do not require a single taxonomy: the Q2 2026 item is classified `articles`, and Q1 2026 is `outlook`.

Observed reports include Q4 2026 (October 9), Q3 2026 (July 3), Q2 2026 (March 19) and Q1 2026 (December 17, 2025). Publication date and report year differ for Q1, so do not infer them from each other.

Validate `status`, the array, dates, allowed publisher hostname and `hasMore`. The exact request fetched all records today. If the site later returns `hasMore: true`, a single response does not prove the newest report was found; handle the site's pagination or report discovery incomplete. No alternate guessed pagination endpoint was tested.

## Follow the actual article and PDF links

Fetch the selected `AbsoluteUrl`. The original article HTML provides an actual PDF anchor; use its `href`, resolving relative paths against the article origin. Retain its query string. The verified Q4 link is:

[Global Investment Strategy Committee Outlook Q4 2026 PDF](https://emea.amova-am.com/docs/default-source/default-document-library/pdf/insights/2026/2610-global-investment-strategy-committee-outlook-q4-2026.pdf?sfvrsn=169a9d76_3)

Require agreement among listing title, article title and PDF title/period before parsing exact index forecast tables. Do not construct future article slugs or PDF filenames from the quarter. The verified article currently has exactly one PDF link matching the GISC report family. The listing API has no PDF field, so the article-fetch stage is required.

Fresh checks confirmed the API's current newest matching article, its timestamp and its actual PDF anchor. Existing visual verification of that PDF's EPS scenarios is documented in `index-growth-research-asia-exact.md`.
