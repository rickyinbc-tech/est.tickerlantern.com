# Unequal service lives and equivalent annual costs

The English guide `/research/unequal-service-lives-equivalent-annual-cost-replacement-calendar` adds four charts/tables. ACCA's equivalent-annual-cost explanation was reviewed on 25 October 2026 for general valuation, timing and repeatability context. Publisher machine data, rates, worked tables and recommended replacement periods are not reproduced.

Both independently authored options provide the same required service. Prices are paid at cycle starts; running costs are paid at every completed year-end, including the last service year. Salvage is zero. Each replacement repeats the same nominal price, life and running cost; no inflation, tax, financing, uncertainty, quality difference or cash-funding account is modeled. An annual equivalent is a valuation, not a bill, depreciation or saving requirement.

One-cycle present cost is immediate price plus discounted year-end running costs. Dividing by that life’s annuity factor yields EAC. The common horizon is the least common multiple of the whole lives (maximum 56 under the controls). Purchases occur only before the final horizon; end-of-horizon running cost remains, but no unused replacement is bought. The cumulative cash chart uses steps at defined annual transaction dates.

Defaults: A price CAD 1,200/life 4/running 80, B price CAD 2,000/life 8/running 50, discount 4% effective annual. EACs CAD 410.5880544 and CAD 347.0556641; common eight-year present costs CAD 2,764.3846192 and CAD 2,336.6372437. Cumulative undiscounted outflows CAD 3,040 and CAD 2,400. B requires CAD 800 more initially despite lower EAC; no funding or affordability inference is drawn.

Validation:

- All 1,467 Node tests passed. Seven focused model tests and four SEO checks passed.
- Independent closed-form annuities verify factors; all 64 life pairs at three discount rates verify complete cycles, repeated-chain present values and EAC × common annuity-factor identities. Other checks cover transaction timing, no final unused purchase, final running costs, zero discount/cost, identical/scaled options, step chart semantics, matrix replacements and whole-life limits.
- `tests/browser_equivalent_cost.py` passed at desktop and 390px mobile: English, four accessible figures/tables, SVG descriptions/text bounds, no overflow, default valuations, zero-discount simplification, 56-year common horizon, fractional-life rejection retaining results, reset and actual-replacement/present-cost tables.
- The initial mobile axis caption was shortened after a text-bound failure; the full build, focused checks, browser verification and full suite then passed. Mobile annual-equivalent bars and cumulative-payment calendar were visually inspected.
