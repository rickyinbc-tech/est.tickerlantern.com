# Nasdaq-100 forecast coverage correction - 23 October 2026

This Nasdaq-only release is superseded by the [shared policy for all 21 indices](five-year-forecast-policy.md).

The five-year path now uses published annual forecasts only for the years they cover, then a sourced long-term EPS projection. This supersedes the same-day carry-forward release, which incorrectly repeated the 2027 rate in all five years.

- 2027: 28%, from [UBS CIO, 7 October 2026](https://www.ubs.com/global/en/wealthmanagement/insights/chief-investment-office/house-view/daily/2026/latest-07102026.html).
- 2028-2031: 8.04% annual nominal EPS projection, derived from Invesco US large-cap building blocks. See [the source and formula](five-year-forecast-policy.md#long-term-source-and-derivation).

Forecasts replace only their named year. Missing annual estimates use the long-term input immediately, including gaps between published estimates. User overrides stay protected. The timing-v4 migration updates both the earlier 8% defaults and the repeated-28% defaults, including paused source scenarios; explicit constant and annual custom modes retain their settings.

The workbench, static comparison table, interactive comparison table and CSV share the same policy. Both source links, the long-term vintage and derivation appear in the workbench. CSV provenance records the correct source for each year. Other benchmarks and the stock-analysis, notes and GIC pages are unchanged.

Original public PDFs and rendered source pages remain local and ignored. No source PDFs or private archive contents are published.

Validation before publication: 125 automated tests passed. Production build and Wrangler dry run passed. Local browser checks confirmed the five annual inputs, 14.04% cash-flow IRR, downloaded CSV with correct per-year sources, protected user edits, benchmark isolation and source restoration. Desktop (1440px) and mobile (390px) layouts were inspected. The initial 720px-tall automated download click timed out; repeating the export check with a 1200px-tall viewport passed. This was a browser automation scroll issue; the exported rows reconciled to the model.

Published as Worker version `6810961e-de4f-44ec-a899-d101feaf2071`. Live browser checks passed the same annual inputs, 14.04% IRR, CSV source attribution, edit protection and desktop/mobile layout checks. All five changed production assets matched local SHA-256 hashes. Stock analysis, structured notes and GIC routes returned HTTP 200.
