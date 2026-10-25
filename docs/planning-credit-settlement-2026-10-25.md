# Non-refundable credits and a refund settlement

The English guide `/research/non-refundable-tax-credit-refund-withholding-settlement` adds four charts and expandable tables. CRA educational, refund and line-48400 pages were reviewed on 25 October 2026 for general calculation stages and settlement context. No tax-year rate, tax bracket, credit entitlement or publisher worked example is encoded.

The three independent inputs are a tax charge before one selected credit, a credit value already converted into tax-offset dollars, and prior payments credited toward the same compatible simplified settlement. Non-refundable usage is capped at the tax charge. Excess is unapplied in this current-period illustration, without an expiry/carryforward/transfer conclusion. The refundable alternative uses the same value under a different hypothetical rule, not a legal election or a second claim.

Positive settlement means owing; negative means a modeled refund before offsets, reassessment and other adjustments. Prior payments are subtracted once. A refund of earlier overpayments does not refund the unapplied part of a non-refundable credit. More prior payments change settlement without changing the credit's benefit. The tool does not combine jurisdictions, determine actual withholding or predict a receipt date.

The credit-value profile includes the exact utilization breakpoint and selected value alongside the regular display samples. Its connecting line therefore preserves the piecewise-linear kink even when the tax amount falls between regular grid points.

Validation:

- 993 full Node tests passed.
- Six focused mathematical tests check complete settlement identities over 48 tax/credit/payment combinations, usage limits, prior-payment invariance, zero/fully usable credits, chart decomposition, exact breakpoint sampling and supported input limits.
- The build and four SEO checks passed.
- `tests/browser_credit_settlement.py` passed at desktop and 390px mobile, checking four figures/tables, accessible descriptions, bounded labels, independent payment changes, credit usage, invalid-input retention, reset and signed settlement values.
- The mobile credit-use composition chart was visually inspected.
