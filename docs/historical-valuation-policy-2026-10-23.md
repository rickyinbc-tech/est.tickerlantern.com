# Historical earnings valuation policy — 23 October 2026

Current policy: `historical-earnings-reference-v2`. This corrects v1's automatic use of qualified means. A source label does not establish matching earnings horizons, aggregation or loss-company treatment.

Only an assessed compatible current/historical forward pair can automatically supply a historical exit multiple or normalized current-earnings valuation reference. Six current benchmarks qualify: S&P 500, Nasdaq-100, Russell 2000, FTSE 100, STOXX Europe 600 and Hang Seng. Their mean-reversion exits remain scenario assumptions, not fair value.

The other fifteen published forward means remain visible with their separate dates and source links. They are optional reader-selected exit assumptions. The default uses active entry P/E, and no `100*historicalMean/currentPE` reference value is computed from those pairs. Multiplying a qualified historical mean by `100/currentPE` would reproduce the same unsupported comparison that the premium/discount control withholds. A date label or synthetic-EPS label does not fix incompatible denominators.

Examples of retained qualifications include CSI 300's Wind-based mean beside a FactSet current multiple (the March 2024 SCBAM mean was superseded by CICC's 23 October 2026 reference), the TSX's June 2025 Bloomberg-based mean versus a different current provider, and JPM forward multiples whose precise horizon is not disclosed. Refreshing a current multiple does not refresh an older mean's rolling window.

The optional button applies a qualified mean as a protected reader exit assumption. It does not alter source eligibility, the default all-index comparison or current-reference card. Restore source values returns to the assessed default; manual exit edits remain protected until restored.

## Exact-index TTM fallback

If no compatible forward mean exists, an optional future feed may supply a verified exact-index ten-year arithmetic TTM mean with aligned aggregation, current TTM P/E, original dates and sources. CAPE, medians, trimmed averages and ETF proxies are not silently substituted. No production TTM observations are currently connected; synthetic QA fixtures are not source evidence.

Current reference: `EPS_TTM=100/currentTTMPE`; `reference=meanTTMPE*EPS_TTM`.

At year-five exit, the forward model's `F5` covers the following earnings period. Under the annual convention terminal trailing EPS is `F4=F5/(1+g5)`. The equivalent forward exit multiple is `meanTTMPE/(1+g5)`, so terminal price equals `meanTTMPE*F4`. No direct TTM/forward denominator mixing is allowed. The current-reference EPS remains synthetic normalization, not official reported index EPS.

## Controls

Tests verify six automatic historical exits versus fifteen constant-multiple defaults; optional qualified exits remain explicit edits. They reject mismatched index IDs, unknown provenance, wrong windows/statistics, CAPE, median and trimmed ETF proxies. Synthetic TTM tests verify current and terminal earnings-basis conversion, protected edits and CSV provenance. These controls establish calculation and policy consistency; they do not prove that a historical mean is economically correct five years ahead.
