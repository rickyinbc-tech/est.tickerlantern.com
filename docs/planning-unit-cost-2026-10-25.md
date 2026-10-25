# Equal cash purchases and unit-weighted cost

The English guide `/research/equal-cash-purchases-unit-weighted-average-cost` adds four charts/tables covering acquired quantities, distinct cash/unit shares, price statistics and marked portfolio value. SEC Investor.gov and FINRA's 19 May 2026 educational article were reviewed on 25 October 2026. All price observations, purchase amounts and computations here are original hypothetical examples.

Each equal CAD purchase becomes available at its date. There is no opening lump sum, no starting investment and no comparative trading strategy with advance knowledge of prices. One hypothetical unit class permits arbitrary fractional purchases without fees, spreads, distributions, tax, FX or corporate actions. Average cost is total purchase cash divided by total units, equivalently the harmonic mean of four positive execution prices under these assumptions. The arithmetic mean weights dates instead of units.

All accumulated units are marked at each new entered price immediately after that date's purchase. Final marked value minus contributions is a dollar result, not a performance rate, sale-proceeds estimate or tax adjusted-cost-base calculation. A lower final price can buy more units and still leave a loss. Cash and unit composition charts use their separately named denominators.

Validation:

- 1,049 full Node tests passed.
- Six focused tests verify the independent harmonic mean and weighted-price identities, all unit/cash balances, flat-price equality, cash/price scaling invariants, a final-loss scenario and supported bounds.
- The build and four SEO checks passed.
- `tests/browser_unit_cost.py` passed at desktop and 390px mobile, checking all four figures/tables, accessible descriptions, bounded labels, a lower-price/more-units loss scenario, invalid-input retention, reset and average-cost table values.
- The mobile price-measure comparison was visually inspected. Quantity bars use the existing optional right-padding setting so larger unit-count axis labels have space.
