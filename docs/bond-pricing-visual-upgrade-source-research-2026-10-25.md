# Bond pricing, duration and one-year return: visual upgrade research

Review date: 2026-10-25. Scope: public primary HTML education and independently checked invented arithmetic. No real securities, live yields, private archives, PDFs, market recommendations or Canadian quotation conventions are used.

## Existing-route comparison and recommendation

Upgrade `/research/bond-duration-yield-total-return` in `src/research-guides.js`; do not publish another route. At the initial review, HEAD was `b743a51` and origin/main was `c28fbc2`. The existing route is static: it distinguishes coupon, current yield and yield to maturity, then illustrates a first-order duration shock with a separately assumed annual cash amount. No interactive implementation of that route was found in the current guide sources.

Preserve and link `/research/bond-maturity-cash-goal-interest-rate-risk` in `src/planning-market-resilience-guides.js`. That existing interactive guide already discounts annual coupons and relates bond maturity to a household cash-goal horizon. Its default is face 10,000, coupon/initial yield 4%, maturity 10 years, cash goal in year 3 and reset yield 6%; it accumulates coupon cash without interest. The proposed upgrade instead derives duration from specified cash flows, compares an immediate exact price with its tangent approximation, and reconciles a one-year holding-period return. Avoid recreating the other guide's long-horizon goal-funding exercise.

## Verified public evidence

1. **Coupon, price and required yield are different quantities.** SEC's investor bulletin, dated June 26, 2013, explains the inverse relation between fixed-rate bond prices and market yields. Its examples distinguish the coupon from yield and reduce remaining maturity after one year. It also explains that sale value before maturity can change. Use those mechanics, without adopting its semiannual numerical examples as annual-payment calculations. [SEC: Fixed Income Investments—When Interest Rates Go Up, Prices of Fixed-Rate Bonds Fall](https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins-86)

2. **Current yield is not yield to maturity or a realized return.** Fidelity's education page distinguishes annual coupon cash divided by price from a yield calculation incorporating price, coupon and maturity. It also describes issuer credit and trading conditions as other pricing influences; an indicated valuation need not equal an executable sale price. These are reasons to label our discounted value an illustrative model price and exclude actual trading costs explicitly. No publication date was displayed in the reviewed body. [Fidelity: Bond & CD prices, rates, and yields](https://www.fidelity.com/learning-center/investment-products/fixed-income-bonds/bond-prices-rates-yields)

3. **Duration is a local sensitivity, not a full price calculation.** Fidelity's November 26, 2025 article distinguishes duration from maturity, describes coupon and maturity effects, and explains why a linear duration estimate is less accurate for larger yield changes because the price/yield relation is curved. It identifies credit, liquidity, inflation and call risk as additional considerations. Its hypothetical duration figures are separately assumed; do not reuse its 8.87-year illustration as the duration of our different fully specified annual-pay example. [Fidelity: Duration](https://www.fidelity.com/learning-center/investment-products/fixed-income-bonds/duration)

4. **Use yield duration for this fixed-cash-flow teaching example.** CFA Institute's public 2026 curriculum overview distinguishes certain-cash-flow sensitivity to a bond's own yield from other duration concepts, lists Macaulay and modified duration, relates modified duration to Macaulay duration and yield, and warns that linear estimates miss nonlinear price changes. Only the openly accessible overview was used; the full reading was not accessed. [CFA Institute: Yield-Based Bond Duration Measures and Properties](https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/yield-based-bond-duration-measures-and-properties)

5. **Annual-period relation.** Fidelity's openly accessible glossary gives modified duration as Macaulay duration divided by one plus yield. Its undated, versioned help URL is supplementary educational evidence, not a product fact sheet. The formula below explicitly uses one annual payment period and an annual yield. It must not silently be applied to a nominal semiannual quotation. [Fidelity: Research glossary, Fixed Income—Modified Duration](https://www.fidelity.com/webcontent/ap010098-etf-content/16.10/help/research/learn_er_glossary_2.shtml)

Source wording cautions: Fidelity's broad zero-coupon statement that duration equals maturity describes Macaulay duration; our modified duration is N/(1+y). CFA's overview describes modified duration as a slope; mathematically the normalized negative derivative is required: −P′(y)/P(y). The source descriptions support the concept, while the precise annual-convention identities below are independently derived. No source's illustrative bond is being represented as our fictional bond.

## Original teaching convention and exact formulas

All following values and examples are invented. Take positive face F, fixed annual coupon rate c, coupon C = Fc, annual effective required yield y, and N whole annual periods remaining. Assume an option-free bond with all scheduled cash flows paid, no default, no taxes, no commissions or bid/ask spread, and one flat required yield for discounting every payment. Purchase occurs just after a coupon date; the first new coupon is one year away. Sale occurs just after a later coupon. Accrued interest is zero at these selected boundaries, so this example has no clean/dirty price adjustment. This timing convention is not a claim about Canadian market practice.

Let CF_t = C for t < N and CF_N = C + F. Direct discounted-cash-flow arithmetic gives:

```text
P(y,N) = sum from t=1 to N of CF_t / (1+y)^t
D_Mac  = [sum t × CF_t / (1+y)^t] / P
D_Mod  = D_Mac / (1+y) = −P′(y)/P
approximate price return = −D_Mod × (new_yield − original_yield)
approximate new price = original_price × (1 − D_Mod × yield_change)
```

Macaulay duration is the present-value-weighted cash-flow time, expressed in years here. Modified duration converts that timing measure into local relative-price sensitivity under the stated annual-yield convention. A yield move from 5% to 7% is +2 percentage points, or +200 basis points, and enters the formula as 0.02. Coupon cash remains unchanged in this fixed-coupon exercise.

When y ≠ 0, an independent closed form is C[1 − (1+y)^−N]/y + F(1+y)^−N. At y = 0, use F + NC rather than divide by zero. The validator also prices by a separate backward recursion. These are mathematical models of the promised cash flows, not evidence that any issuer will pay or that a dealer will transact at that amount.

## Reviewed default and the two separate clocks

Default: F = 1,000, c = 5%, C = 50, original y = 5%, N = 10, new y = 7%. The initial exact price is 1,000. Values below retain extra digits for independent comparison; display dollars to cents and return units clearly.

| Quantity | Independently calculated value |
|---|---:|
| Macaulay duration at purchase | 8.107821675644 years |
| Modified duration at purchase | 7.721734929185 |
| Immediate 7% price, still 10 years remaining | 859.528369181348 |
| Exact immediate price return | −14.047163081865% |
| Duration approximate immediate price return | −15.443469858370% |
| Duration approximate immediate price | 845.565301416304 |
| Exact price minus approximation | +13.963067765044 |
| Exact return minus approximation | +1.396306776504 percentage points |
| Sale price just after year-one coupon, 9 years left, yield 7% | 869.695355024042 |
| Coupon received at year one | 50.00 |
| Coupon plus sale value | 919.695355024042 |
| One-year holding-period return from initial 1,000 | −8.030464497596% |

The first comparison is an **immediate shock** with ten years of future payments. The one-year example assumes that reset yield remains 7% and then advances the cash-flow clock one year. It receives the first coupon, removes that paid coupon from the remaining bond, and discounts nine remaining annual payments. Do not use the ten-year shocked price as the year-one sale price.

For N ≥ 2:

```text
year-one wealth = C + P(exit_yield, N−1)
one-year return = [C + P(exit_yield, N−1) − initial_price] / initial_price
```

The coupon arrives at the endpoint, so no coupon reinvestment rate is needed for this one-year result. This is a simple holding-period return, not a realized multi-year compound return or a forecast. With unchanged yield 5%, the remaining nine-year price is 1,000 and this example returns exactly 5%. In general under these exact conventions and unchanged yield, the one-year return equals the starting annual yield even if the initial price differs from face.

## Boundary checks and finite chart scope

The independent validation covers 108 combinations of face 100/1,000/100,000, coupon 0%/5%/12%, yield 0%/5%/15%, and N = 1/2/10/30. Each is checked against both the closed form and recursive price, with analytic and central-difference duration checks; additional exit yields test one-year accounting and convexity.

- **Zero coupon:** P = F/(1+y)^N, Macaulay = N, modified = N/(1+y). The price curve and duration remain defined.
- **Zero yield:** P = F + NC; Macaulay = [CN(N+1)/2 + NF]/(F+NC), and modified equals Macaulay. This boundary must not produce NaN.
- **One year remaining:** P = (F+C)/(1+y); Macaulay = 1 and modified = 1/(1+y). At the year-one endpoint, receive C+F and hold no remaining bond. Sale value is zero, principal is received once, and exit yield has no effect. Do not add both face repayment and a supposed zero-maturity sale asset.
- **Approximation limit:** For these positive cash flows the exact price is convex in yield and lies above its tangent. A large yield increase can make the linear approximation negative even while exact price remains positive. Do not clamp the approximation to zero or label it an executable value; identify breakdown or omit the invalid approximate point with an explanation.

Suggested bounded controls: positive face from 100 to 100,000 (or hold face at 1,000), coupon from 0% to 12%, initial and exit annual yields independently from 0% to 15%, and N from 1 to 30 whole years. Exact pricing is finite throughout these bounds. Restrict a close-up duration comparison to ±2 percentage points around the starting yield and the valid nonnegative-yield range; a broader exact-price chart can still show larger shocks. Bounded inputs ensure finite arithmetic, not approximation accuracy. Do not turn a negative yield entered outside the stated range into a different scenario silently.

## Four or five useful figures

1. Cash-flow timeline with coupon/principal components and their present values at the selected required yield. Separate nominal future cash from today's discounted price.
2. Exact price/yield curve with initial price and the local modified-duration tangent. Mark coupon-rate-equals-yield at par only under the stated model assumptions.
3. Immediate shock comparison: exact dollar/percentage change against the duration estimate, showing approximation error in percentage points. Keep the maturity clock fixed.
4. One-year bridge: initial purchase, coupon received, remaining-nine-year sale value, resulting gain/loss. When N = 1, replace sale with principal repayment and avoid double counting.
5. Optional one-year-return-by-exit-yield curve, distinct from the immediate price-change curve; label every panel's remaining maturity and endpoint coupon timing.

Keep current yield, coupon rate, required discount yield and holding-period return separately named. Do not present an individual bond illustration as a rolling bond fund forecast, a credit-risk model, a risk-free promise, or a calculation of actual future sale proceeds. Existing useful explanations of spreads, fund turnover and reinvestment can remain as context rather than being inferred from this one-rate model.

## Evidence files and verification

`qa/bond-pricing/source-manifest.json` records exact source URLs, UTC retrieval timestamps, HTTP outcomes, byte counts and SHA-256 hashes. Four sources returned successful raw HTML. SEC's direct curl attempt returned HTTP 403 and produced no successful raw body; the original successful public web-tool response is saved separately as `sec-fixed-rate-risk.web-tool-response.json` and identified as tool text, not raw HTML. No access controls were bypassed. CFA access was limited to its public overview.

`qa/bond-pricing/validate.py` uses Python exact rational arithmetic independently of application code; it validates source hashes and writes `reviewed-extract.json` containing 50-digit decimal representations, the original cash-flow row set and assumptions. Command: `python3 qa/bond-pricing/validate.py`. Result: PASS, 108 grid cases and five successful evidence-file hashes verified. All public captures and validation outputs are under ignored `qa/`; the only proposed tracked deliverable from this task is this source note. No application source, tests, registry, build file, README, commit or deployment was changed.

## Implemented visual upgrade

The existing URL and all six original sections are retained; three new sections
specify the bond, derive duration and distinguish the immediate versus one-year
cash-flow clocks. The original duration6/CAD400 portfolio table is explicitly
separate from the derived single-bond example. Five figures show promised
coupon/principal payments, exact price and the linear tangent, a coupon/maturity
repricing matrix, a one-year cash bridge and Macaulay/modified/maturity measures.
The matrix uses four maturity columns and one-decimal cell labels for readable
mobile output; its table retains two decimals. The broad tangent may become
negative and is explicitly identified as an invalid approximation rather than
a bond value. All exact promised-cash-flow prices remain positive.

The coupon input permits0%–15%; the positive-face and0%–15%yield limits and1–30
whole-year horizon keep exact pricing finite. At year-one maturity, sale value
is zero and principal redemption is a separate single receipt. An empty
remaining cash-flow schedule has no sale asset. The one-year bridge includes
that redemption only through its cash value and never adds a second principal.
Nine topic tests cover independent closed-form/recursive pricing, derivative
duration, zero coupon/yield, positive and negative approximation cases, the
unchanged-yield return identity, timing and route preservation. Desktop and
mobile checks cover input changes, invalid-input retention, restoration and
five native chart-data tables; the long cash-flow chart was inspected at both
its start and final principal payment.
