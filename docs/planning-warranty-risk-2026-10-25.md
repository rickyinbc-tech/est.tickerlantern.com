# Expected repair costs and repair-state reserves

The English guide `/research/extended-warranty-expected-cost-repair-cash-reserve` adds four hypothetical charts with inspectable data tables. Public ISED Office of Consumer Affairs guidance and a dated St. Louis Fed educational essay were reviewed on 25 October 2026. They provide consumer context only. No historical survey statistic, repair frequency, product quote or jurisdiction-specific legal conclusion is reproduced.

The two outcomes are no eligible repair and exactly one eligible repair over one fixed comparison period. The assumed probability applies to that whole period. The fee is paid upfront in both contract outcomes; the repair out-of-pocket amount is capped at the repair cost. The provider is assumed to accept the claim and directly pay the covered remainder. That deliberately limited model excludes repeat repairs, caps, exclusions, reimbursement delays, default, shipping, maintenance, financing and refunds. It does not establish a real contract's maximum loss or suitability.

Expected cost is a weighted average of complete outcome costs. Equality is solved only within probabilities 0–100%; no covered amount and no fee produce ties at every probability. State-specific reserve positions retain signed funding gaps without assuming available credit. Changing the probability does not change a specified state's outlay; changing the reserve does not change expected costs.

Validation:

- 867 full Node tests passed.
- Six focused mathematical tests verify weighted outcomes, analytical equality and signs, deductible caps, probability/reserve independence, severity-matrix replacements, all-zero cases and supported boundaries.
- The build and four SEO checks passed.
- `tests/browser_warranty_risk.py` passed at desktop and 390px mobile, covering all four figures/tables, accessible descriptions, SVG text bounds, controls, fixed repair-state costs, invalid-input retention, reset and capped deductibles.
- The mobile expected-cost plot was visually inspected; its axis explicitly states assumed repair chance, and its two lines use different stroke styles.
