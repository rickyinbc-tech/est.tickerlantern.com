# Repeated independent events and one reserve

The English guide `/research/repeated-independent-events-average-cost-reserve-shortfall-probability` adds four charts/tables. NIST's binomial-distribution reference and FCAC's emergency-fund context (dated 20 October 2025) were reviewed on 25 October 2026. No household incident dataset, fitted probability, source figure or published fund-size recommendation is reproduced.

The model has one binary event opportunity per complete year, a fixed independently entered annual probability and mutually independent years. Every event has the same whole-CAD cost. One whole-CAD reserve is available initially and never replenished; all amounts share a constant-dollar basis. No income, insurance, interest, inflation, borrowing or other use of cash is modeled. Cost exceeding reserve is strict; equality is fully funded for the narrow calculation. The probability-weighted unfunded cost includes zeros in funded states and is neither a conditional tail average nor a recommended reserve.

Defaults: ten years, 10% annual event probability, CAD 5,000 per event and CAD 5,000 reserve. Any-event probability is 65.13215599%; cost exceeds reserve with probability 26.39010709%; mean cost CAD 5,000 and probability-weighted unfunded cost CAD 1,743.3922005. The count distribution is computed exactly by repeated probability convolution, not Monte Carlo. A displayed five-or-more bucket retains the complete tail, while cost calculations use every exact count.

Validation:

- All 1,321 Node tests passed. Seven focused model tests and four SEO checks passed.
- Independent enumeration of every binary path through eight years matches the count distribution at probabilities 0, .01, .1, .5 and 1. Other checks cover mass/mean identities, strict funding equality, zero severity/risk/reserve, all outcomes funded, reserve monotonicity, cost scaling, state-by-state funded/unfunded conservation, exact tail retention, matrix assumptions, whole-input limits and four finite figures/tables.
- `tests/browser_repeat_risk.py` passed at desktop and 390px mobile: English, accessible SVG descriptions/tables, text bounds, no overflow, distinct event/shortfall probabilities, no-reserve identity, sufficient reserve, zero severity with unchanged event probability, unchanged count distribution when reserve changes, fractional-period rejection retaining results, reset and tail-table labels.
- Mobile count-distribution and cost/reserve charts were visually inspected; actual axis-label bounding boxes were checked for separation.

The title and introduction now emphasize state-by-state unfunded-cost averaging and link the complementary repeated-event guide for percentile costs/dependence alternatives. Both articles are retained; no other author’s guide or model is replaced.
