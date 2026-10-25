# Wealth statistics, retirement cuts and family gifts

Three English visual planning articles add twelve charts to the existing library.
Each includes an editable scenario, accessible figure description, exact data table,
worked arithmetic, source review date, limitations and related reading.

## Public evidence

The official Statistics Canada Daily HTML release was retrieved on 25 October 2026:
https://www150.statcan.gc.ca/n1/daily-quotidien/241029/dq241029a-eng.htm

Release date: 29 October 2024. Observation year: 2023. Dollar amounts retain the
release's 2023 constant-dollar definition. Six medians are transcribed; the
CAD 1.4 million observation retains the original rounding. Family-unit scope,
major-income-earner ages, housing/pension groups, exclusions, sampling variability
and unavailable confidence intervals are disclosed. No percentile or causal
estimate is calculated. No local financial account or private research file is used.

The ignored local HTML check copy has SHA-256 `5667dcb179237d5d8e11d509a24602d1fa785d52509357ee83478520cef77239`.
Recheck with `python3 scripts/check-planning-housing-wealth-source.py qa/statcan-wealth-2023.html`.
The original downloaded page is not included in the deployed assets.

## Model conventions

- Home/pension wealth context: observation charts never change with scenario controls. Net home
  equity, restricted/pension value, other investments and uncommitted cash are
  separate net inputs. The six-month stress has no income, interest, liquidation
  or borrowing; it is independent of the statistical medians.
- Retirement: the two policies share twenty invented returns and start-of-year
  withdrawals. From year two, the cut policy compares the indexed prior request
  with a relative initial-rate threshold, applying at most one cut and an indexed
  essential-request floor. There is no catch-up restoration. Voluntary reductions,
  funded payments and unfunded requests are distinct. Exact zero cuts preserve
  the uncut request without displaying a negative rounding zero.
- Family gifts: a due gift precedes the household withdrawal, then returns apply.
  Payments are capped at assets and both kinds of shortfall remain separate.
  The comparison retains the same nominal gift, not the same real purchasing
  power. A date outside the horizon is explicitly excluded. Starting assets less
  actual gifts and withdrawals plus modeled gains/losses reconciles to the endpoint.

## Validation

The focused suite checks source transcription, source/scenario isolation,
hand-worked calculations, cash conservation, essential-floor behavior, strict
relative triggers, zero cuts/gifts, depletion, partial gifts, dates beyond the
horizon, input validation and finite rendering at every field boundary.
The complete JavaScript suite passed 378 tests and the Python suite passed 122.
`npm run build` succeeded; the browser module dependency graph, canonical paths
and sitemap entries were checked against the local build.

`python3 tests/browser_wealth_flex.py http://127.0.0.1:8895` exercises all three
pages at desktop and mobile widths, controls, reset, invalid inputs and chart-data
expansion. The automated run timed out on browser navigation before completing.
Manual browser verification completed for the retirement page at 1440 and 390
pixels, including a zero-cut edit, reset and visible figures. Desktop and mobile
retirement screenshots were visually inspected. Full multi-page browser QA is
limited by CLI navigation timeouts; a second browser-control service also timed
out. Static HTML, all twelve accessible figures, controls/models, module delivery
and canonical/sitemap coverage were verified separately. Screenshots remain
ignored under `qa/`.
