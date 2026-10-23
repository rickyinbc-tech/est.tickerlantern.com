# Exact Asian index forecast supplement

Research checked October 22, 2026, Vancouver time. Candidate data is in `research-growth-international.json`; the original sources and visual evidence remain private, owner-only and ignored under `qa/international-growth/`.

## Amova: exact index house scenarios

[Amova Q4 2026 GISC outlook](https://emea.amova-am.com/institutional/insights/detail/2610-global-investment-strategy-committee-outlook-q4-2026), published October 9 after the September 30 committee meeting, links the [original PDF](https://emea.amova-am.com/docs/default-source/default-document-library/pdf/insights/2026/2610-global-investment-strategy-committee-outlook-q4-2026.pdf?sfvrsn=169a9d76_3). Visually verified appendix **EPS Growth Scenarios**, median column:

| Exact index | Year to Dec 2026 | Year to Sep 2027 | PDF page |
| --- | ---: | ---: | ---: |
| Nikkei 225 | 27% | 22% | 14 |
| Hang Seng Index | -1% | 3% | 15 |
| FTSE 100 | 8% | 7% | 15 |
| STOXX Europe 600 | 14% | 14% | 15 |

These are **house forecast horizons**, not calendar consensus. September 30 is the committee date; no separate market-data date is stated. Currency is unspecified. The endpoints are nine months apart; do not compound them as adjacent full years. No 2028 estimate. Parse the median of the first three EPS-growth columns, avoiding the adjoining P/E and index-price columns. Native PDF text is available; discover each new quarterly link and validate exact index blocks and endpoint rows. A matching pair of rates, such as STOXX 14%/14%, can be a valid published forecast.

## CSI 300: dated iFAST house model

[FSM/iFAST article](https://fsm.global/sg/article/rcms370440/policy-support-and-valuation-re-rating-signal-it-is-time-to-revisit-ch), published **May 21, 2026**, table observations **May 14, 2026**. Exact benchmark **CSI 300 (000300.SH)**. Published EPS-growth row: **2026E 9%; 2027E 12%; 2028E 6%**. This is the publisher's constituent-weighted model, not consensus. Annual year labels do not explicitly define fiscal versus calendar aggregation. EPS levels are labelled RMB; use printed growth rather than reconstructing it from rounded levels. Visually verified in the loaded original table.

The anonymous page loads its body through **POST** to [the public article content endpoint](https://fsm.global/sg/rest/article/get-rcms-article-details?paramArticleId=370440&paramPlatformId=SGFSM), with an empty request body. A regular request with `--data ''` succeeded; bare `-X POST` did not. JSON `content` contains the full HTML table, while `publishedDate` supplies publication metadata. `source.sha256` in the candidate data hashes that JSON response. Its view counters can change independently of forecasts, so a changed hash is not proof of a numerical update. The normal article GET is only an Angular shell and cannot verify the forecast.

Bounded searches found the same figures in March and April material, without a newer verified exact CSI 300 annual table. Preserve the May observation date. Checking this article does not establish that it is the newest publication. A discovery pipeline must inspect newer publisher articles and accept a replacement only when the exact benchmark, annual years, growth row, forecast type and observation date are supported.

## Candidate and source checks

The JSON has 16 exact benchmark keys and 39 published estimates. It carries source URLs, document pages, hashes, period labels, dates and method limits; it contains no private evidence paths. J.P. Morgan country records use PDF page 34, where both the exact MSCI definition and calendar-year consensus footnote accompany the values; the same rates also appear in the page 37 valuations table. Japan uses page 30 rounded labels. EAFE is being sourced separately by the parent task.
