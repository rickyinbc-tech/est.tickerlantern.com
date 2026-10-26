# Decision: do not publish the second electricity comparison draft

Reviewed 25 October 2026.

## What was proposed

The `tickerlantern-savings-projects-20261025` worktree contains a complete, tested draft for
`electricity-time-band-usage-fixed-charge-budget`: a two-band price compared with a single-price plan,
weighted by actual kWh, with independent fixed charges, a shift-sensitivity table and a volume-by-band-share
heatmap.

## Why it is not being published

The live guide `time-of-use-electricity-shift-kwh-fixed-monthly-bill` already covers the same decision:

- it holds total monthly kWh constant and weights each period price by the kWh actually charged there;
- it separates the energy charge that can change from fixed charges that do not;
- it reports the whole-bill percentage effect rather than only the energy saving.

Adding a second article would restate those lessons with different defaults. Two near-identical guides split
search intent, invite contradictory defaults and make the library harder to read, without adding a distinct
question.

## What would justify a separate article

Only a clearly different question, for example a regulatory or contract-structure issue that the existing
guide explicitly excludes, with its own primary sources and a different unit of comparison. A new set of
hypothetical unit prices and a second heatmap are not enough.

## Disposition

The draft and its test were preserved as a stash on `codex/planning-savings-projects-20261025` with the message
`Electricity plan-comparison draft not published: duplicate of live time-of-use guide`. The worktree is left
clean so a later build cannot publish it by accident.
