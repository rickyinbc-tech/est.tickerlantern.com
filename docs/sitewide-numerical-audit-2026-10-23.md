# Site-wide numerical review — 23 October 2026

## Verdict and scope

The site is suitable for dated source comparison and conditional calculations.
Its projections and simulated probabilities are not independently validated
expected returns. No blanket assurance that every future number will be accurate
is justified. This review separates correct transcription and arithmetic from
source comparability and the assumptions needed to project a future outcome.

Reviewed the index workbench's 21 benchmarks, the stock article's 21 sections,
all 16 note records and their contract/model/scenario/backtest views, three
adjusted-return indices, notes overview/screener/probabilities/scenarios/methodology/
sources/downloads, and all 15 GIC product/term combinations in both languages.
The initial live capture contains 31 routes. It includes the five notes downloads
as linked artifacts, rather than treating them as additional page routes.

## Material corrections

| Finding | Impact and repair |
| --- | --- |
| Calendar earnings growth replayed after a forward earnings entry anchor | The prior policy applied a named annual EPS rate directly to an earnings denominator that already includes much of that year. Six calendar EPS inputs now generate five forward transitions under uniform accrual. Seventeen benchmarks use this bridge: two with explicit CY/NTM definitions, fifteen with separately disclosed calendar and/or NTM assumptions. Four Amova forecast intervals cannot support an annual bridge and use the sourced long-term proxy. Raw forecasts remain visible and uncapped. |
| Qualified historical P/E means drove automatic exits and current-value ratios | Fifteen dated/cross-definition references no longer default the exit or generate a current reference ratio. They remain visible and can be selected as explicit reader assumptions. Six assessed compatible pairs retain their historical exits. Others default to constant P/E. A TTM fallback still requires verified same-index, same-basis history; no new TTM observations were fabricated. |
| Stock calculator universally called exit earnings forward | Neutral exit EPS/P/E labels now support both the senior FY2027 estimate and the original provider FY2028 case. Financial values are unchanged. |
| Notes used an ambiguous expected IRR label | Screener/sensitivity now say mean pathwise IRR. The mean of simulated investor IRRs is distinct from the IRR of mean cash flows. |
| Averaged GIC results looked more exact than their fixing calendar | EN/ZH results now identify the 12 mid-month proxy checkpoints beside the output. Actual contracts require month-end business closes. Without certificate dates, another calendar convention would not establish an exact contractual result. Numbers were retained. |
| GIC audit/default and download descriptions were outdated | Source prose now matches the capital-market default; notes.csv is described as contractual terms, with citations in research JSON. |

The annual model engine, source observations, publisher dates and source-check
stamps were not changed. This is a correction to the use and presentation of
inputs, not a new market-data release.

## Effect on default index scenarios

These are effects of changed assumptions using the same dated inputs; they are
not new forecasts or a ranking of investable expected returns.

| Benchmark | Previous five-year cash-flow IRR | Revised |
| --- | ---: | ---: |
| S&P 500 | 10.82% | 9.54% |
| Nasdaq-100 | 14.04% | 10.95% |
| Russell 2000 | 13.58% | 7.90% |
| Emerging Markets | 19.16% | 9.18% |
| Asia Pacific ex Japan | 19.09% | 8.05% |
| Australia | 6.97% | 9.18% |

Nasdaq's published 2027 growth remains **28%** in the source table and calendar
inputs. The derived first forward-anchor transition is **11.63%**, followed by
the existing 8.04% long-term proxy. This adjusts the timing overlap; it is not a
cap or a discretionary reduction of the source estimate.

## Source tie-outs and mechanical checks

- Stock: official Q3 report PDF pp. 4, 14 and 49; FY2025 annual report pp. 36
  and 244; Q3 slide pages supporting business/credit/rate assumptions were
  visually inspected. Ten annual history rows agree. All six OLS fits, thirty
  chronological test predictions and 138 CSV rows were recomputed. The C$280.01
  price is correctly dated October 16, not a live price. Analyst scenario weights
  and forecasts remain judgments.
- GIC: 27/27 published minimum/maximum/participation inputs matched fresh official
  sources. Official outlook p. 7 and CMA p. 11 were visually inspected and match
  the transcribed regional assumptions. The source does not publish GIC expected
  returns or the model's inferred dividend residual.
- Notes: coupon, call, barrier, principal floor, dated investor IRR and termination
  logic pass quantitative checks. The October 21 research snapshot uses observations
  through October 20. Its twelve modelled notes and four missing-fixing/future-issue
  records retain that date and availability distinction. Persisted-output validation
  checked 180 models. No missing prices or fixings were invented.
- Indices: UBS, FactSet, First Eagle, NBF, JPM and Invesco material values were
  rechecked. Invesco p. 7 and p. 11 were visually inspected. The sum of real earnings,
  inflation and buyback components is a derived nominal EPS approximation, not a
  publisher-provided five-year EPS series. Amova's live URL was unavailable during
  the recheck; retained source data did not receive a new freshness stamp.

## Remaining uncertainty and permitted interpretation

The fifteen assumed-period bridges do not establish matched-provider EPS series.
Regional long-term assumptions are proxies for some exact indices. Dividend growth,
smooth annual valuation paths and historical exit multiples are conditional inputs.
STOXX 600's net return-spread reference remains insufficient for a cash-dividend
return calculation without an explicit cash assumption.

GIC default paths reuse a dated August 2026–August 2027 outlook before extending
older long-term references. Banks, utilities and TSX 60 use a broad Canadian proxy;
the twenty-stock basket uses regional 50/50 paths. Thirteen products have conditional
projections; two ESG products lack a compatible final-strategy forecast. Optional
stock estimates have undisclosed consensus vintages. These limitations are not
resolved by extra decimal places or by passing code tests.

Note probabilities condition on fitted GBM/bootstrap parameters and provider
backtested history; short live histories, parameter uncertainty, changing decrement
drag, issuer default and liquidity remain outside numerical sampling intervals.
RBC's historical regression extrapolates beyond the observed valuation range and
uses dependent return windows. Its negative extrapolated return is not a validated
expected-return forecast. Source disclosures retain these distinctions.

The recursive private PDF-library refresh was attempted during this review.
Completion must be recorded separately; financial table tie-outs above rely on
fresh official originals and visual inspection, not a claim of a newly complete
local OCR index. Private source files, original PDFs and raw histories remain local
and excluded from publication.

## Public controlling sources

- [UBS Nasdaq annual earnings estimates](https://www.ubs.com/global/en/wealthmanagement/insights/chief-investment-office/house-view/daily/2026/latest-07102026.html)
- [FactSet S&P 500 valuation](https://insight.factset.com/sp-500-earnings-season-update-october-16-2026)
- [Invesco building blocks and methodology](https://www.invesco.com/content/dam/invesco/apac/en/pdf/insights/2026/april/2026-invesco-capital-market-assumptions-usd-q1-2026.pdf#page=7)
- [RBC Q3 report](https://www.rbc.com/investor-relations/_assets-custom/pdf/2026q3_report.pdf)
- [RBC annual report](https://www.rbc.com/investor-relations/_assets-custom/pdf/ar_2025_e.pdf)
- [Issuer GIC rates](https://www.rbcroyalbank.com/investments/gic-rates.html)
- [Canadian GIC averaging contract](https://www.rbcroyalbank.com/investments/_asset-custom/pdf/6320.pdf)
- [ESG GIC averaging contract](https://www.rbcroyalbank.com/investments/_asset-custom/pdf/126579.pdf)
- [RBC GAM Fall outlook](https://www.rbcgam.com/documents/en/articles/global-investment-outlook-fall-2026.pdf#page=7)
- [RBC GAM long-term assumptions](https://www.rbcgam.com/_assets/insight-article/RBC%20GAM%20long-term%20capital%20market%20assumptions-E-a.pdf#page=11)

## Verification and publication

Fresh prepublication checks: 129 index JavaScript tests, 122 index Python tests,
59 notes/GIC JavaScript tests and 56 notes/GIC Python tests passed. Both production
builds and Wrangler dry runs passed. The notes publication gate accepts the retained
reviewed snapshot and changed source hashes. Browser and live-publication results
are recorded after execution below.

Final live publication: index/stock application `cbbaa8d`, Worker
`d4ce96ee-f96c-4658-b1e2-b062ef2cfb0b`; notes/GIC application `8797db7`, Worker
`15a1e71a-cd50-4d36-a24e-31b0384f1094`. All 49 checked deployed assets/downloads
match the reviewed bytes. The live API retains the reviewed dated observations.
HTTP 404, twenty notes/GIC HTTP routes and twenty-two legacy redirects passed.

The final rendered workbench passed all 21 benchmark defaults, an independently
calculated Nasdaq timing bridge, the qualified-exit selection/reset, saved custom
edits, actual CSV download, desktop/mobile containment and browser-error checks.
The downloaded CSV's 126 rows reconcile to independently recalculated earnings,
prices, dividends, cash wealth, reinvestment and IRRs for all twenty calculated
benchmarks; STOXX cash returns remain unavailable. The standalone regression is
`node tests/browser_numerical_audit.mjs <origin>`; it also checks nonempty source
method text and reference-only period descriptions.

Stock tools passed 57 browser checks locally; live assets match those tested and
the senior preset was rechecked live. GIC checks passed sixty product/language/width
views, both actual CSV downloads, numerical parity of their fifteen rows and the
new accuracy labels. The thirty-one-route live capture reported no browser errors.
Desktop/mobile screenshots were visually inspected. No original source PDFs,
private archive records or raw daily histories were deployed.
