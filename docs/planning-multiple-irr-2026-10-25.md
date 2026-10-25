# Multiple IRRs and a later required payment

The English guide `/research/multiple-internal-rates-return-later-payment-npv-profile` adds three interactive charts and tables: signed dated flows, an NPV profile and a present-value bridge. OpenStax's NPV/IRR definitions and multiple-solution discussion were reviewed on 25 October 2026. All cash flows, algebra, charts and worked examples are original; no publisher illustration or worked-answer table is reproduced.

The model pays at time zero, receives at time one and pays a required obligation at time two. It solves the quadratic in annual growth factors, uses the product-of-roots identity to avoid subtractive cancellation, rejects inadmissible growth factors and lists distinct finite nonnegative rates only. Negative rates are outside its expressly stated domain. A repeated root is listed once. The 121-point NPV profile is computed separately and does not determine the roots. Its upper rate is the greater of 30% and the selected discount input; roots outside that plot range remain reported in the metric.

No reinvestment rate, cash funding account, tax, financing, extra terminal value or project-acceptance decision is calculated. NPV is a time-zero valuation, not spendable cash. A required later payment remains in the flows even if the earlier receipt has already been spent. The original example has nonnegative roots of 10% and 20%, selected 15% NPV of about CAD 18.90, and an undiscounted cash sum of negative CAD 200.

Validation:

- 970 full Node tests passed before a final companion-article title/link refinement.
- Six focused tests verify an independent factorized NPV, known-root fixtures constructed using Vieta identities, repeated/no/zero roots, discarded negative roots, scale invariance, discount-input independence and supported input boundaries.
- The build and four SEO checks passed.
- `tests/browser_multiple_irr.py` passed at desktop and 390px mobile, checking three charts/tables, accessible descriptions, bounded text, both original roots, the 15% tangent, a no-nonnegative-root scenario, invalid-input retention, reset and the NPV data table.
- The mobile NPV profile was visually inspected: both zero crossings and the small positive region are visible on an explicitly signed dollar scale.

The repair-reserve companion guide's title now emphasizes budgeting and cash reserve needs, and links to the separate contract-eligibility/payment-cap study. This distinguishes the two existing treatments while retaining each model's explicit coverage assumptions.
