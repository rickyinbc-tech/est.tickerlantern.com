# Index numbers audit — 26 October 2026

Every number on the home page (21 benchmarks: forward P/E, ten-year mean,
dividend yield and annual growth inputs) was reopened against its original
publisher document. This audit records what was verified, what changed and
what could not be improved.

## Verified unchanged against the original

| Source | Benchmarks and metrics | Original checked |
| --- | --- | --- |
| FactSet Earnings Insight, 23 Oct | S&P 500 forward P/E 18.7, ten-year mean 19.1, CY2026/CY2027 growth 33.1%/16.0% | Article paragraph and PDF p. 14 |
| J.P. Morgan Guide to the Markets – Asia, data 23 Oct | ACWI, Europe, EM, Japan, CSI 300 forward P/E (p. 31); Japan growth (p. 30); Australia, China, India, Asia Pacific ex Japan P/E, mean, yield and growth (p. 37) | PDF pp. 30, 31, 37 |
| Nasdaq Global Markets Dashboard, data 13 Oct | Nasdaq-100, Russell 2000, MSCI Japan mean and yields | Live file byte-identical to the reviewed original; p. 1 inspected |
| MSCI factsheets, 30 Sep | Canada, EAFE, UK, World (ACWI factsheet World row), ACWI and EM yields, Europe yield | Fundamentals tables, all four PDFs re-downloaded |
| MSCI reference deck, 31 Dec 2025 | ACWI, World, EM, Europe ten-year means | p. 7 |
| Segal Marco Advisors Q4 2025 | MSCI Canada, EAFE, UK ten-year means | p. 3 table; the Q1/Q2 2026 reports no longer publish it |
| Raymond James, 30 Sep | S&P/TSX and Nikkei 225 forward P/E | pp. 20–21 |
| Cumberland, June 2025 | S&P/TSX ten-year mean 15.1 | p. 7; the October 2026 report no longer publishes it |
| LSEG STOXX 600 Earnings Outlook, 22 Oct | STOXX 600 forward P/E and ten-year mean | p. 8 |
| Edelweiss TEMPO, data 30 Sep | FTSE 100 and Hang Seng P/E and means | Live file byte-identical to the reviewed original |
| IG, Dec 2025 | Nikkei 225 ten-year mean 18.0 | Article; no newer published mean found |
| STOXX factsheet, 30 Sep | STOXX 600 2.8% net-return spread (reference only) | Fundamentals table |
| NBF, NBI, Hartford, Amova | ACWI, World, MSCI Canada, Europe, S&P/TSX, EAFE, EM, UK, FTSE 100, STOXX 600, Nikkei 225, Hang Seng growth | NBF p. 3, NBI p. 6 chart 15, Hartford p. 19, Amova pp. 14–15 |

## Changes

- **FTSE 100 dividend yield corrected from 3.04% to 3.11%.** The earlier value
  came from a dynamically loaded London Stock Exchange page field labelled with
  the factsheet date. FTSE Russell's own 30 September 2026 factsheet reports
  3.11% in Index Characteristics.
- **S&P 500 dividend yield 1.09% (21 Oct) → 1.10% (22 Oct)**, State Street Index
  Dividend Yield.
- **S&P/TSX Composite dividend yield re-dated to 23 October** (2.1%, unchanged).
- **CSI 300 ten-year mean 12.2× (SCBAM, 15 March 2024) → 12.1× (CICC / Wind,
  23 October 2026).** CICC's 26 October report states the CSI 300 forward P/E of
  11.9× is below its past-ten-year historical mean of 12.1×. The public repost
  quotes the report with its Wind data date. The JPM current multiple is kept,
  so the pair remains a qualified, cross-publisher comparison.
- **Five dividend anchors now refresh daily** (S&P 500, S&P/TSX, FTSE 100,
  Hang Seng, CSI 300) through `scripts/dividend_sources.py`, replacing manual
  checks that went overdue after 48 hours.
- **The daily refresh can publish again.** Every scheduled run since
  23 October failed because three tests pinned that day's dividend yield and
  valuation date. New publisher values made `npm test` fail, so the publish
  step never ran. The tests now use fixed fixtures or the feed's own values.

## Not improved, and why

- **Russell 2000 growth** stays on First Eagle's Q2 report (data 9 July). The
  publisher blocks automated and browser access to a later edition.
- **Nikkei 225 dividend yield** stays at 1.56% (23 Oct); Nikkei Indexes refuses
  automated requests.
- **FTSE 100 and Hang Seng P/E** stay at Edelweiss's 30 September values.
  These are correct, but the verification timestamp needs the owner's
  scheduled browser check.
- **Older ten-year means** (S&P/TSX June 2025, Segal Q4 2025, IG December 2025,
  MSCI deck December 2025): no newer published ten-year forward-P/E mean for the
  exact benchmark was found. Bloomberg- and Raymond James-based figures use
  different windows or definitions and were not substituted.
- **STOXX 600 growth** keeps Amova's house scenario. LSEG I/B/E/S consensus
  for 2026 is 21.0%, but LSEG publishes no annual 2027 figure; the model uses
  the long-term proxy for STOXX 600 either way.
