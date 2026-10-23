# European and Asian benchmark source follow-up

Research date: October 22, 2026. Public publisher sources only. These are source findings, not a license to republish source documents or datasets. No PDF bytes or publisher charts are included in the repository.

## STOXX Europe 600 — complete current pair and working automatic discovery

- Publisher: LSEG Datastream, *STOXX 600 Earnings Outlook*, October 22, 2026.
- Exact printed figures: **13.9x** current **12-month forward P/E** and **14.2x** **10-Year Average**.
- Original: <https://lipperalpha.refinitiv.com/wp-content/uploads/2026/10/TRPR_83201_669.pdf>, physical page 8, Exhibit 17A.
- Article: <https://lipperalpha.refinitiv.com/2026/10/stoxx-600-earnings-outlook-26q3-october-22-2026/>
- Automatic discovery: <https://lipperalpha.refinitiv.com/category/earnings/feed/>, newest matching article's full RSS content contains the official PDF link. Normal anonymous requests returned both RSS and PDF successfully.
- SHA-256: `55ae16d6a56b3cd7521fa75e3092c6904fa249ea6db8eaef616ba0d51b3e23da`.
- Original page visually checked. Numbers are explicit right-edge labels, not estimated chart coordinates. Native PDF text omits the chart's image lettering. The isolated adapter requires report-date identity, the named exhibit, OCR of explicit 12-month/10-year legend wording, and unique color-separated printed numeric labels. It fails closed on changed layout or ambiguous OCR. Sampling frequency underlying the mean is not stated.

Implementation: `scripts/lseg_stoxx_source.py`; `refresh_lseg_stoxx(fetch)` returns `(values, source)`. Production needs Pillow, Poppler and Tesseract. Local macOS QA uses Apple Vision through Swift when Tesseract is absent. Live end-to-end refresh returned the figures above; six focused tests passed.

## FTSE 100 — current figure found; no verified recent exact ten-year mean

J.P. Morgan's public *Weekly Brief* search result dated October 5, 2026, contains a dated October 2 valuation table: FTSE 100 **12.0x** forward P/E. The ordinary personal-investor HTML route currently returned a role-selection shell, so this was not accepted as a dependable parser in this subtask:
<https://am.jpmorgan.com/gb/en/asset-management/per/insights/market-insights/market-updates/the-weekly-brief/>.

AJ Bell's April 23, 2026 article explicitly reports **13.1x** next-12-month earnings and a 3.2% prospective dividend yield, but describes the current ten-year comparison only qualitatively. Its **11.7x** number refers to the prior ten years ending April 20, **2016**; it must not become a 2026 ten-year mean:
<https://www.ajbell.co.uk/group/news/why-uk-stock-market-beats-us-valuation-and-dividends>.

Eurex/FTSE Russell's exact 13.0x / 13.5x current/ten-year pair is from July 5, **2021**, unsuitable as a current reference:
<https://www.eurex.com/ex-en/find/news-center/news/Part-I-From-headwinds-to-tailwinds-a-reversal-in-fortune-for-the-FTSE-100--2715064>.

## Krungsri handbook — exact dated 12-month pairs; current download access blocked

Official March 2026 handbook:
<https://www.krungsri.com/getmedia/955e6748-684b-45cb-8320-85d2b1dfa899/investment-handbook-mar2026>.

Its physical page 37 explicitly labels blended forward 12-month P/E and ten-year averages, with **March 4, 2026** data:

| Exact chart label | Current | Ten-year average |
|---|---:|---:|
| NIKKEI | 21.79x | 18.2x |
| HANG SENG | 10.76x | 10.2x |
| CSI300 | 13.93x | 12.1x |

These are dated prefills, not October observations. Web reading parsed the original public PDF, but ordinary local HTTP returned an Incapsula challenge; the original-page web screenshot request timed out, so visual verification remains incomplete in this subtask. Do not mark these visually verified until that check succeeds.

The current official listing shows an October 2026 edition published October 6:
<https://www.krungsri.com/th/wealth/krungsri-exclusive/investment/investment-handbook>.
Its PDF buttons use JavaScript rather than exposed hyperlinks in the readable web result. Both anonymous HTTP and a normal browser stopped at a security challenge. No challenge was bypassed. A bounded retrying discovery adapter may preserve the dated record on access failure, but must report that failure and must not advance observation dates. A June public PDF also exists but was inaccessible locally:
<https://www.krungsri.com/getmedia/320d5f16-1696-4255-bd0e-9c55656b2593/investment-handbook-june2026>.

## Nikkei alternatives — definition checks matter

Nikkei's own daily public page provides index-weight and market-cap forecast P/E. On October 22, 2026 they were **20.83x** and **16.78x**, respectively. The publisher's methodology uses estimated fiscal-year EPS, advancing following annual results; it is not a rolling consensus 12-month multiple. Its explicit website republication/licensing restrictions also make systematic rehosting an unsuitable default. No adapter was installed.

Aranca's August 2026 GCC 2Q26 report, physical page 11, prints Nikkei 225 **25.99x** / **21.97x**, under a forward-P/E caption:
<https://www.aranca.com/assets/docs/GCC-Capital-Markets-Newsletter-2Q26.pdf>.
The exact observation date and forward horizon are absent. Its Japan 2Q26 report separately labels a one-year-forward series with a substantially different ten-year-mean line (unlabelled numerically):
<https://www.aranca.com/assets/docs/Newsletter_Japan_Capital_Markets_2Q26.pdf>.
Both pages were visually inspected. This unresolved definition inconsistency means the GCC figures should not populate a rolling-12-month field. Never estimate the alternative mean from its line position.

## IG Asia outlook — reproducible dated prefill and article revision checks

<https://www.ig.com/sg/news-and-trade-ideas/Asia-stock-market-outlook-for-2026-251209> is accessible with anonymous HTTP. Its publication metadata says **December 22, 2025**; the article explicitly dates its figures **December 2, 2025**. Do not use the URL's date suffix or fetch date as the metric date.

The Hang Seng section explicitly reports next-12-month forward P/E **11.8x** and ten-year forward average **10.7x** (LSEG I/B/E/S). The separate Nikkei 225 section reports forward P/E **22x** and ten-year mean **18x**, in a next-twelve-month earnings outlook; that P/E sentence does not separately specify the forecast horizon. Preserve that qualification.

`scripts/ig_source.py` checks the original article for revisions, validates both exact named sections, rejects missing/ambiguous pairs, and preserves publication and observation dates separately. Six focused tests and an anonymous live fetch passed. This is an automatically checked **dated outlook**, not a promise of a newly published rolling ten-year mean each day. Searches of newer IG research found valuation commentary but no newer complete exact pair for these two benchmarks.

## Hang Seng and CSI 300 exclusions

Hang Seng Investment's official Tracker Fund brochure has explicit current forward multiples but its underlying date is March 29, **2024**. Its ten-year means are unlabelled chart markers. It does not fill a current exact mean:
<https://cms.hangsenginvestment.com/cms/ivp/hsvm/document/trahk_brochure_en.pdf>.

The official CSI provider's public P/E history is trailing. It cannot replace a forward series. Public CMBI Japan comments reporting 2025-forward P/E are fiscal-year estimates and cannot silently become next-twelve-month figures. CICC quotations syndicated by media can guide discovery, but the underlying primary report needs verification before automatic publication. The research also checked bank/asset-manager research from Standard Chartered, BEA, iFAST, FTSE Russell, LSEG, AJ Bell and Aranca; no benchmark swaps or ETF valuation proxies were used.
