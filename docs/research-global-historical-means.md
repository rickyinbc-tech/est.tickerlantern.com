# Global index historical forward-P/E references

Research and original-page verification: October 22, 2026 (America/Vancouver).
Only public publisher and public retirement-board sources were consulted for
these figures. Complete reports and source-page images are not redistributed.

## Coverage now supported

All twelve MSCI benchmarks in the catalog have a precisely labelled,
publisher-reported 10-year forward-P/E average available. Four have a current
daily-update report; eight have an older dated reference that must remain
visibly separate from the current fundamentals date. These figures are averages
of historical forward valuation observations, not a P/E forecast ten years ahead.

| Catalog benchmark | Reported 10-year mean | Mean reference date | Source / PDF page |
|---|---:|---|---|
| MSCI ACWI | 16.50x | 2025-12-31 | MSCI presentation / 7 |
| MSCI World | 16.95x | 2025-12-31 | MSCI presentation / 7 |
| MSCI Emerging Markets | 12.25x | 2025-12-31 | MSCI presentation / 7 |
| MSCI Europe | 14.10x | 2025-12-31 | MSCI presentation / 7 |
| MSCI EAFE | 14.3x | 2025-12-31 | Segal Marco / 3 |
| MSCI United Kingdom | 12.7x | 2025-12-31 | Segal Marco / 3 |
| MSCI Japan | 14.3x | 2025-12-31 | Segal Marco / 3 |
| MSCI Canada | 14.6x | 2025-12-31 | Segal Marco / 3 |
| MSCI Australia | 16.5x | 2026-10-22 | J.P. Morgan / 37 |
| MSCI China | 11.3x | 2026-10-22 | J.P. Morgan / 37 |
| MSCI India | 21.0x | 2026-10-22 | J.P. Morgan / 37 |
| MSCI AC Asia Pacific ex Japan | 13.6x | 2026-10-22 | J.P. Morgan / 37 |

The publisher-reported sampling frequency is not specified for the historical
means. Do not invent an exact daily/monthly averaging method or a reconstructed
120-month series. A mean reported by one provider may differ from another
provider's mean because earnings definitions, aggregation, dates and samples
can differ. Preserve the selected publisher and reference date.

## J.P. Morgan: four current pairs at a stable daily PDF URL

Source:
<https://am.jpmorgan.com/content/dam/jpm-am-aem/asiapacific/regional/en/insights/market-insights/daily-guide-updated.pdf>

Ordinary unauthenticated HTTPS download succeeds even though the web-reader
fetch timed out. The live document has 87 PDF pages and the relevant table is
**physical PDF page 37**, printed page 36. Its title is “APAC ex-Japan equities:
Returns and valuations by market.” The page footer identifies FactSet, MSCI and
J.P. Morgan Asset Management, describes the market indices as within the MSCI
AC Asia Pacific ex-Japan Index, and dates the data **22/10/26**. The original page
was rendered and visually inspected, including column names, row headings,
values and date. These are the exact MSCI market benchmarks, not Hang Seng or
other local-index proxies.

For the four catalog matches, the same table supplies current forward P/E and
dividend yield, enabling a consistent current/mean pair:

| MSCI index | Current forward P/E | 10-year mean | Dividend yield |
|---|---:|---:|---:|
| Australia | 18.3x | 16.5x | 3.3% |
| China | 9.7x | 11.3x | 1.6% |
| India | 18.7x | 21.0x | 1.3% |
| AC Asia Pacific ex Japan | 9.6x | 13.6x | 1.7% |

Validated complete column order: Australia, China, Hong Kong, India, Indonesia,
South Korea, Malaysia, New Zealand, Philippines, Singapore, Taiwan, Thailand,
APAC ex-Japan. Each row must contain exactly thirteen cells. Select the
**first** 10-year-average row immediately following “Forward P/E ratio”; the
later similarly named rows refer to trailing P/B and dividend yield.

The physical PDF page 31 also gives current forward P/E for MSCI ACWI, Europe,
EM and Japan, but no numerically labelled 10-year means. It must not be used to
infer missing historical values from chart geometry.

Sync: fetch the stable daily URL, find the named table, check identity, date,
column order and row count, and parse its native text. Keep source dates
separate from fetch times; reject a source-date rollback. Table and layout
changes require review before accepting a changed column mapping.

## MSCI: exact numerical historical labels for four additional benchmarks

Source:
<https://www.msci.com/downloads/web/msci-com/discover-msci/events/event-assets/2026/january/are-you-as-diversified-as-you-intend-in-2026-/Are%20you%20as%20diversified%20as%20you%20intend%20in%202026%20-%20Master%20deck.pdf>

MSCI's January 2026 public presentation “Are you as diversified as you intend in
2026?” has 39 PDF pages. Physical page 7 explicitly labels a forward-earnings
valuation chart **as of December 31, 2025**, with exact numbers above all bars.
The values are native PDF text and were visually verified on the original page.
The legend explicitly distinguishes current forward P/E from its 10-year
average. No plotted height was estimated.

The six column labels, in order, are ACWI, WORLD, USA, WORLD ex USA,
EM (EMERGING MARKETS), EUROPE. The chart's current values are
18.96, 19.95, 22.35, 15.66, 13.48, 15.03. Its historical means are
16.50, 16.95, 19.25, 14.26, 12.25, 14.10. Only the four exact catalog matches
are needed. Do not use MSCI USA as a replacement for S&P 500.

The slide's separate USA prose uses a different current multiple from its USA
chart. That inconsistency does not affect the four selected historical means,
but reinforces retaining exact chart labels and avoiding the unused USA figure.

Sync: the known public URL can be checked for revisions; MSCI's public event
and research listings can discover future presentations. It is an older dated
reference, not a regularly republished rolling average. A successful repeated
download must not make its historical date appear current.

Parser: `scripts/reference_sources.py::parse_msci_deck_text` requires the exact
chart title, date, twelve numerical labels, six ordered categories and 10-year
mean legend. It returns historical metrics only.

## Segal Marco / FactSet: exact 2025 year-end means and quarterly discovery

Official public retirement-board discovery page:
<https://cambridgeretirementma.gov/retirement-system/financial-reports/>

Verified report:
<https://cambridgeretirementma.gov/wp-content/uploads/2025-4Q-Segal.pdf>

The Cambridge Retirement Board publicly posts Segal Marco's complete quarterly
reports. The 2025-Q4 report's physical PDF page 3, printed page 2, contains a
FactSet forward-12-month P/E table with an explicit **10Yr Avg** row. Its chart
date is **12/31/25**. The original page was rendered and visually inspected.

Its ordered categories are S&P 500, S&P 400, S&P 600, MSCI EAFE, MSCI EM,
MSCI World, MSCI UK, MSCI Japan, MSCI Canada. The historical-average row is
18.7, 16.0, 16.3, 14.3, 12.4, 17.1, 12.7, 14.3, 14.6. The separate Median row
describes a different statistic and longer overall chart range; it must never
be substituted for the 10-year averages. For World and EM, the direct index
publisher's same-date MSCI means above are preferable; do not blend sources.

The chart body/headers are raster images, while the mean row is separate native
text. `parse_segal_text` accepts the visually verified 2025-12-31 native layout.
For a different date, it requires all nine ordered labels in the supplied text
(native extraction or separately verified OCR), preventing silent category
shifts when a publisher changes a raster-only table.

The discovery page currently lists 2025-Q3, 2025-Q4, 2026-Q1 and 2026-Q2. The
latest Q2 link is a WordPress attachment page:
<https://cambridgeretirementma.gov/retirement-system/financial-reports/2026-2q-segal/>
whose normally accessible content links the actual PDF:
<https://cambridgeretirementma.gov/wp-content/uploads/2026-2Q-Segal.pdf>.
The original physical page 3 was visually inspected. The **10Yr Avg row was
removed**; its table contains only High, Low, Median, Current and Previous.
It cannot refresh historical means. A refresh should check a bounded set of
newest reports plus the known valid seed, retain the last verified mean/date
when newer reports omit the statistic, and show the dated-reference status.
Do not claim that fetching the 2026 report updates the old rolling mean.

## Other sources screened

- WisdomTree's public August 19, 2026 India article explicitly reports an
  approximate 19.8x 10-year mean. J.P. Morgan's October table provides a newer,
  exact pair and an easier daily sync route, so use the latter.
- Schwab's old International Stock Market Outlook URL now redirects to a June
  2026 mid-year article without the old EAFE mean. Its December 2025 14.5x mean
  remains quoted in a syndication copy, but the directly downloadable Segal
  original is preferable to relying on a replaced page or syndication cache.
- National Bank Financial's public mutable Vision Monthly PDF presently serves
  July/August 2026. The old 2021/2022 MSCI ten-year valuation table was not found
  in the current document, so it cannot serve as a current mean adapter.
- Altrinsic's 2026 cross-asset review includes 10-year P/E averages but the
  valuation field is not labelled forward P/E. Do not relabel it.

Seven focused parser tests cover exact mappings, forward/10-year definitions,
wrong categories, missing values, invalid dates, Median rejection and newer
Segal layout safeguards. Both parser functions were also run successfully
against the live downloaded originals used in the visual checks.

## CSI 300: exact, accessible SCBAM dated reference

Public original:
<https://www.scbam.com/medias/module-knowledge/document/290324-SCBAM_Korea_Mar_2024_1.pdf>

Physical page 4 of SCB Asset Management's March 29, 2024 Korea Fund Finder
contains a global valuation chart. The chart explicitly defines the measure as
forward 12-month P/E and separately labels current values and 10Y averages.
The **CSI300 current value is 11.0x and its 10-year average is 12.2x**, with
**March 15, 2024** as the chart's observation date. Each is an exact printed
numerical label, not an estimate from a marker position. The source is Bloomberg
and SCBAM Investment Strategy. Ordinary anonymous HTTP returned the original
PDF successfully; the original page was rendered and visually checked.

Use only the 12.2x historical mean as a dated reference; retain a newer current
NTM multiple from another verified provider and disclose the separate dates.
Rechecking this fixed document does not move the mean's observation date.
`scripts/scbam_source.py::parse_scbam_text` returns only the CSI300 mean/date,
requiring the exact forward definition, 10Y legend, source date, complete
ordered categories and both exact-number series. Five tests cover wrong
definitions/windows, shifted/missing categories/cells, z-score separation and
pypdf's compact text runs. The actual original was parsed with both PyMuPDF
and pypdf 6.14.2 successfully.

Public discovery pages:

- <https://www.scbam.com/th/knowledge/fund-finder> lists the research series
  and links articles containing original PDF download anchors. The English
  Fund Finder category currently says No Data, so use the Thai listing.
- <https://www.scbam.com/en/knowledge/market-insight> lists weekly reports.
  Its October 19, 2026 report was accessible, but contains commentary and no
  explicit ten-year forward-P/E mean table.

A later China Fund Finder article, published May 23, 2024, links
<https://www.scbam.com/medias/module-knowledge/document/230524-SCBAM_China_May_2024_1.pdf>.
Its physical page 3 visually repeats a labelled 12.2x CSI300 mean, but its chart
has no separately printed observation date on that page. The March original's
unambiguous date is preferable. The newest Korea Fund Finder, published
June 12, 2026, is a 38-page memory-industry report and does not contain this
global CSI300 mean table. New research should pass the parser's definition
and layout checks before replacing the retained reference.

## FTSE 100: Edelweiss monthly TEMPO and publisher discovery

Exact-definition primary source: Edelweiss Mutual Fund's TEMPO report has an
explicit global table headed 12-month-forward valuation, with separate P/E
and P/E 10yr Avg columns and an exact UK / FTSE100 row. Its China row is
Shanghai Composite, which must not be substituted for CSI300. Older editions'
Japan rows are labelled TOPIX but display Nikkei-sized index levels; those rows
are not used. The October edition uses a plausible TOPIX level, but TOPIX is
still a different benchmark from either MSCI Japan or Nikkei225.

Official stable detail page, found by following the publisher's research card:
<https://www.edelweissmf.com/investor-insights/fund-market/tempo>

On October 22, 2026 the publisher's normal browser navigation exposed this
latest original PDF link (it is an observed link, not a guessed filename):
<https://www.edelweissmf.com/Files/Insights/viewpoint/9th%20Oct%20Edelweiss%20Mutual%20Fund%20-%20TEMPO_09102026_101803_AM.pdf>

The publisher changed the directory spelling: older reports use `Insigths`,
while this October report uses `Insights`. Discovery must support both. The
detail page's download anchors are more focused than the general insights
listing. Anonymous command-line requests returned 403 in this local network;
the parent task is verifying the latest original through the working normal
browser session and testing hosted refresh transport separately. Do not mark
a rejected HTTP response as a successful numeric sync or change retained dates.

The latest October report's original PDF confirms physical page 4,
data **September 30, 2026**, **FTSE100 current 12.3x / 10-year mean 12.6x**.
The publisher now identifies Bloomberg directly. Its exact printed row is
index level 10,606; P/E 12.3; P/E 10yr Avg 12.6; P/B 2.1; P/B 10yr Avg 1.8;
ROE 16.0. Its exact **Hang Seng current P/E is 10.3x / 10-year mean 10.4x**,
also dated September 30, 2026. The Hang Seng row is identified as Hong Kong /
Hang Seng, not MSCI Hong Kong, HSCEI or Hang Seng Tech. The original page was
visually verified through the publisher's
normally accessible browser download, and the parser was subsequently run
successfully against the downloaded original with pypdf 6.14.2.
The parser supports this new source line, abbreviated month and unit-tagged
header, and defaults to physical page 4.

Earlier exact table observations readable from the official PDF's web extraction
are listed here as research leads, pending original visual confirmation:

| Report | Physical page | Table date | FTSE100 current | FTSE100 10-year mean |
|---|---:|---|---:|---:|
| December 2025 | 3 | 2025-11-28 | 13.1x | 12.8x |
| February 2026 | 8 | 2026-01-30 | 13.8x | 12.5x |

December original:
<https://www.edelweissmf.com/Files/Insigths/viewpoint/December_Edelweiss_Mutual_Fund_-_TEMPO_%28003%29_12122025_124700_PM.pdf>

February original, verified as the destination of the publisher's publicly
posted `https://bit.ly/TEMPO_Feb26` link:
<https://www.edelweissmf.com/Files/Insigths/viewpoint/Edelweiss_Mutual_Fund-TEMPO_10022026_031024_PM.pdf>

`scripts/edelweiss_source.py` provides a strict FTSE100/Hang Seng parser plus official
anchor discovery, the stable detail URL, latest observed PDF URL and dated
December fallback URL. The parser checks the definition, header order, ten-year
labels, exact index identity, full row cell count, source/date and bounds.
Discovery accepts only HTTPS links on the exact official hostname and either
verified directory spelling, with no credentials or query keys. Five focused
tests plus October-format and Hang Seng identity tests pass (seven total). The
live original's native extraction passes the parser with FTSE100 12.3x / 12.6x
and Hang Seng 10.3x / 10.4x, all dated 2026-09-30.

## Additional follow-up sources rejected or held

- Krungsri's March and June 2026 Investment Handbooks have exact CSI300
  blended-forward means in official web extraction (June: 12.48x, data
  May 31, 2026, physical page 20). Both normal local requests and browser
  access lead to the publisher's hCaptcha page. No gate was bypassed.
- Hang Seng Investment's Tracker Fund brochure has a CSI300 ten-year mean
  marker but no numerical mean label. OMBA's public China report likewise has
  exact forward-12-month definitions and mean markers without exact labels.
  Neither chart's pixel positions were converted into numerical observations.
- Fisdom's May 2025 China report claims a ten-year mean in its slide title,
  while its original embedded chart explicitly says **15-year average 13.52**.
  The original physical page 5 was visually checked in the browser. Reject it
  for this ten-year field.
- Amundi's February 2025 German elections report is normally downloadable at
  <https://www.amundi.com/globaldistributor/files/nuxeo/dl/19ad4028-b104-4337-a18c-ac5e4dd54013?inline=>.
  Its original page 7 has a forward-P/E range chart with **no printed numerical
  mean labels**. The web reader synthesizes approximate numeric tables from
  marker positions; these are not exact publisher figures and are not accepted.
- BNY's 2025 Outlook prints CSI300 current 11.28x and ten-year mean 15.2x,
  but does not define the forward earnings horizon as NTM. A nearby chart uses
  a future calendar year. Do not silently relabel this as forward-12-month.
- The March 21, 2023 South Yorkshire/Border to Coast public meeting pack has
  a cached sentence reporting FTSE100 forward P/E 9.5x versus ten-year mean
  13x at year-end 2022. Current original access presents Cloudflare. It has
  not passed original visual verification and is not the preferred seed.
- Eurex's July 5, 2021 FTSE Russell partner article has a visually verified
  original image table defining regional twelve-month-forward P/E, with
  FTSE100 current **13.5x** and ten-year average **13.0x**, data **May 2021**.
  Its prose reverses these two figures. Preserve this inconsistency and month
  precision if this much older fallback is used; do not silently assign a day.
  Article: <https://www.eurex.com/ex-en/find/news-center/news/Part-I-From-headwinds-to-tailwinds-a-reversal-in-fortune-for-the-FTSE-100--2715064>.

All original PDF bytes, temporary extracted pages and visual QA captures used
for this research remain outside the public repository. Only small metric
observations, methodology, code and source URLs are intended for publication.
