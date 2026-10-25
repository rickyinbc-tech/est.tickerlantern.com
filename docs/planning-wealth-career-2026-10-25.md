# Wealth, retraining and pension buyback guides

Three English articles add twelve figures to the existing financial-planning
library. Each article has editable inputs, four data tables, source notes,
related reading and detailed explanations. The normal build includes them in
the homepage, research hub and sitemap.

## Articles and calculations

- `/research/wealth-statistics-medians-liquid-cash`: two dated official median
  charts, an invented mean/median example and an editable balance-sheet waterfall.
  Survey observations remain fixed when personal assumptions change. Constant
  2023 dollars are separate from the hypothetical balance sheet. No percentile
  is inferred from grouped medians.
- `/research/career-retraining-cost-payback`: upfront spending and foregone
  take-home income, cumulative incremental cash, a common ten-year reconciliation
  and a signed present-value matrix. The default incremental cost is CAD 30,000,
  nominal recovery is month 64 and ten-year nominal incremental cash is CAD 31,050.
  The discount rate is effective annual, converted to an equivalent monthly rate.
  This comparison does not calculate the reserve needed for actual living bills.
- `/research/pension-service-buyback-cash-comparison`: nominal payment totals,
  monthly cash summarized at year-ends, discounted payment/benefit components and
  a separate upfront-option receipt-horizon matrix. Inputs are independently
  quoted gross payments and gross additional pension, not a pension formula.
  Survival through the receipt period is assumed; tax effects, death protection
  and actuarial probabilities are excluded explicitly.

## Public source extract

Statistics Canada SFS 2023 was released on 29 October 2024 and retrieved on
25 October 2026. The data module retains five age groups at two dates, ten
provincial medians and the national median. No private records or microdata are
used. Population, exclusions, units and unavailable confidence intervals are
visible beside the official charts. The age comparisons are separate survey
cross-sections, not a cohort trajectory.

Reproduce the comparison after downloading the official HTML to ignored `qa/`:

```sh
python3 scripts/check-planning-wealth-source.py \
  qa/planning-wealth-career/sfs-age-table.html \
  qa/planning-wealth-career/sfs-infographic.html
```

The checker reconciles all 21 cells, independently cross-checks provincial
values against the release table and validates the correct median headers.
The original release table was also rendered from the saved original HTML and
visually inspected, including the median columns, province rows and constant
2023-dollar note. Direct browser navigation to Statistics Canada failed, while
anonymous HTML download succeeded; the saved source bytes remain under `qa/`.

Source SHA-256:

- Table: `ccc2eb4d9808a04574b8259845d315c8f7b173ee28197fdd5328a3c53d19c2cc`
- Infographic: `60a0f1acbfbeeb4d22d14ef4431da46a263eaffcb8681e55678158f75b52d41e`

## Verification

The arithmetic tests independently expand deferred-annuity formulas for both
present-value calculations, check receipt and indexing dates, preserve the common
training horizon and reconcile the balance-sheet and cash-flow identities.
They exercise zero benefits, zero discount rates, insufficient income uplift,
negative net worth, invalid fractional calendar inputs and supported extremes.
The initial integrated run passed 340 tests; final publication checks are recorded
with the release rather than inferred from that earlier run.

Browser QA uses the actual Worker locally at `http://127.0.0.1:8796`, with 1440px
desktop and 390px phone viewports. Review captures remain ignored under
`qa/planning-wealth-career/`. A page opened during a Git conflict briefly loaded
conflict markers; it was reloaded after rebuilding before final interaction QA.
The published assets contain no conflict markers or raw downloaded source HTML.
