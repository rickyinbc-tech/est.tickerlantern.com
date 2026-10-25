export const bondPricingGuides = [
  {
    "slug": "bond-duration-yield-total-return",
    "category": "Fixed income",
    "title": "Bond duration: why yield is only part of the return",
    "description": "Use five charts to price annual coupons and principal, compare exact yield sensitivity with duration, and reconcile a one-year coupon plus sale return.",
    "takeaway": "A quoted yield describes a set of cash flows and pricing assumptions. Your realized return also depends on price changes, reinvestment, credit and the date you sell.",
    "related": [
      "bond-maturity-cash-goal-interest-rate-risk",
      "short-term-discount-yield-annualisation-cash",
      "currency-cad-hedging"
    ],
    "sections": [
      {
        "id": "definitions",
        "title": "Name the yield before comparing it",
        "html": "\n        <p>A bond with a 4% coupon pays 4 per year on 100 of face value under an annual-payment convention. If its market price is 95, its current yield is 4 ÷ 95 = 4.21%. That ratio describes coupon income relative to price. It leaves out the difference between the purchase price and the eventual repayment amount.</p>\n        <p>Yield to maturity is the discount rate that equates price with promised coupons and principal. Realizing that annualized compound rate requires the relevant payment and reinvestment assumptions, including no default. A fund’s distribution yield, portfolio yield to maturity, and historical total return answer different questions.</p>\n        <p>When reviewing two funds, write down the yield definition, observation date, currency, fee treatment, credit mix, and duration. A higher number can reflect a different calculation or more risk. It is not a sufficient basis for choosing the holding.</p>"
      },
      {
        "id": "specified-bond",
        "title": "Specify every cash flow before quoting a price",
        "html": "<p>The interactive example is an invented annual-pay, noncallable bond. Face value is CAD 1,000, its annual coupon rate is 5%, initial required annual yield is 5%, and ten full years remain. Purchase occurs just after a coupon date, so the first new coupon is one year away and no accrued-interest adjustment is needed at the selected boundaries.</p><p>It promises CAD 50 at each annual date and an additional CAD 1,000 of principal at the final date. Discounting every promised payment at 5% gives a price of CAD 1,000. If the required yield instantly changes to 7% before any payment, the same ten-year payment schedule is worth approximately CAD 859.53 under this model. The coupon does not change when the discount yield changes.</p><div class=\"guide-formula\">Price = sum of [promised cash flow at year t ÷ (1 + annual required yield)<sup>t</sup>]</div><p>The cash-flow chart shows future nominal payments, while the price curve shows their value at the purchase-date clock. Do not add the future coupons to the purchase price as extra wealth. Their present values are already inside that price. All promised payments are assumed to occur; the model does not establish an issuer’s creditworthiness or an executable market quotation.</p><p>These annual payment and annual compounding conventions are chosen for teaching. They are not a statement that all Canadian bonds use this quotation convention. For an actual security, verify payment frequency, yield convention, accrued interest, call terms and trade costs.</p>"
      },
      {
        "id": "duration",
        "title": "Translate a yield shock into a price estimate",
        "html": "\n        <p>For a small parallel change in yield, a common first-order estimate uses modified duration:</p>\n        <div class=\"guide-formula\">Approximate price return = −modified duration × change in yield</div>\n        <p>Write the yield change as a decimal. A rise of one percentage point is 0.01; a rise from 4% to 5% is not entered as 25%. A portfolio with duration 6 would have an estimated price change of −6 × 0.01 = −6%.</p>\n        <p><a href=\"https://www.fidelity.com/learning-center/investment-products/fixed-income-bonds/duration\">Fidelity’s duration guide</a> explains interest-rate sensitivity and why the estimate becomes less accurate for larger changes. Effective duration is commonly used when embedded options affect cash flows; read which measure a fund reports. Duration is not a maturity date or a guarantee of recovery by a particular year.</p>"
      },
      {
        "id": "derive-duration",
        "title": "Derive duration from the specified payments",
        "html": "<p>Macaulay duration is the average payment time weighted by each payment’s present value. For the default bond it is approximately 8.1078 years. Under this annual convention, modified duration divides that number by 1 + 0.05, giving approximately 7.7217. The <a href=\"https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/yield-based-bond-duration-measures-and-properties\">CFA Institute public duration overview</a> distinguishes these measures and explains the limits of linear price estimates.</p><p>A yield rise from 5% to 7% is a change of 0.02 in decimal form. The first-order price estimate is 1,000 × (1 − 7.7217 × 0.02), or about CAD 845.57. Exact discounted-cash-flow pricing gives about CAD 859.53. The approximation is therefore roughly CAD 13.96 below the exact result in this invented shock.</p><p>The curved exact-price line and straight duration line meet at the initial yield and diverge away from it. With sufficiently large changes, the straight-line estimate can even become negative while the price of the promised positive payments remains positive. That negative approximation is displayed as a failure of a local estimate, not a valid bond value or a possible contractual payment.</p><p>The duration comparison also distinguishes maturity from duration. A zero-coupon bond pays only at its final date, so Macaulay duration equals maturity. Modified duration is maturity divided by 1 + annual yield; it equals maturity only when that yield is zero. The coupon and maturity matrix separately reprices complete payment schedules rather than treating one duration number as an exact formula for every bond.</p>"
      },
      {
        "id": "scenario",
        "title": "Keep the separate first-order portfolio illustration in its own scope",
        "html": "\n        <p>Assume a hypothetical portfolio worth 10,000, modified duration of 6, and cash income of 400 over the next year. Hold duration fixed, apply one parallel yield shock, and ignore convexity, defaults, fees, reinvestment, currency, and all other price effects. These are mechanical illustrations, not bond-fund forecasts.</p>\n        <div class=\"guide-table\" role=\"region\" aria-label=\"Illustrative bond duration scenarios\" tabindex=\"0\"><table><caption>First-order price shock plus assumed cash income</caption><thead><tr><th scope=\"col\">Yield change</th><th scope=\"col\">Price effect</th><th scope=\"col\">Cash income</th><th scope=\"col\">Simplified total</th></tr></thead><tbody><tr><th scope=\"row\">−1 percentage point</th><td>+600</td><td>+400</td><td>+1,000 / +10%</td></tr><tr><th scope=\"row\">No change</th><td>0</td><td>+400</td><td>+400 / +4%</td></tr><tr><th scope=\"row\">+1 percentage point</th><td>−600</td><td>+400</td><td>−200 / −2%</td></tr><tr><th scope=\"row\">+2 percentage points</th><td>−1,200</td><td>+400</td><td>−800 / −8%</td></tr></tbody></table></div>\n        <p>The last row deliberately stretches a linear approximation. A proper repricing would discount each cash flow at the new curve and account for changing duration and convexity. The table shows why income does not eliminate mark-to-market losses; it cannot tell you the exact year-end value of a real fund.</p><p>This original portfolio table keeps its independently assumed duration of 6 and cash income of 400. Those are not the calculated duration and coupon of the single bond in the interactive controls. The table is retained to illustrate a simple first-order portfolio stress; it does not calibrate or reconcile the new cash-flow model.</p>"
      },
      {
        "id": "one-year-clock",
        "title": "Move the payment clock before calculating a one-year return",
        "html": "<p>An immediate price shock and a sale one year later use different remaining cash flows. At the default changed yield of 7%, the immediate ten-year price is CAD 859.53. One year later, just after the first CAD 50 coupon is paid, the bond has nine remaining annual payments. At the same 7% required yield, its modeled sale value is approximately CAD 869.70.</p><p>The year-one cash is the coupon plus that sale value: 50 + 869.695355 = approximately CAD 919.70. Relative to the original CAD 1,000 purchase, the one-year total return is about −8.0305%. Using the ten-year shocked price as the year-one sale price would retain a payment date that has already passed.</p><p>The waterfall starts with purchase cost, replaces it with the correctly aged sale or redemption value, then adds the first coupon once. It is a reconciliation of ending cash, not an assumption that purchase cost itself earns an additional payment. No reinvestment rate is required because the only received coupon arrives at the endpoint.</p><p>With exactly one year remaining at purchase, the final coupon and principal are both paid at year-end. No bond remains to sell, so changing the exit-yield control cannot change that assumed redemption cash. With unchanged required yield under the stated conventions, the one-year coupon-plus-exit return equals the initial annual yield; this does not make the same return certain when default, costs or other payment terms are possible.</p>"
      },
      {
        "id": "maturity",
        "title": "Distinguish an individual bond from a rolling portfolio",
        "html": "\n        <p>An individual noncallable bond has a specified principal repayment date, subject to the issuer meeting its obligations. A conventional open-ended bond fund typically replaces maturing or sold holdings. Its duration exposure can remain substantial even after you have held the fund for several years.</p>\n        <p>For a spending goal on a known date, compare the cash-flow schedule with the liability rather than assuming the word “bond” supplies a maturity match. A target-maturity fund has its own termination and distribution terms, which require separate inspection.</p>\n        <p>Holding an individual bond to maturity does not make its interim economic value stable. It can remove the need to realize a market loss through sale if the cash flows meet your needs and the issuer pays. It does not remove default, inflation, reinvestment, or opportunity-cost risk.</p>"
      },
      {
        "id": "other-risks",
        "title": "Separate government yields from credit spreads",
        "html": "\n        <p>A corporate bond’s yield can rise because the government yield curve rises, because its credit spread widens, or both. A single duration number cannot explain the cause. Credit deterioration can hurt a corporate portfolio even while government yields fall.</p>\n        <p>As an additional hypothetical stress, a spread duration of 4 and a 0.50-percentage-point spread widening imply approximately −2% from that spread move, before interactions and other effects. Do not add this to an all-in yield shock if the all-in shock already includes the same widening.</p>\n        <p>The <a href=\"https://www.investor.gov/introduction-investing/investing-basics/investment-products/bonds-or-fixed-income-products/bonds\">Investor.gov bond overview</a> identifies credit, interest-rate, inflation, liquidity, and call risks. In practice, ask which of these risks the holding is meant to carry and which could interfere with its role in the portfolio.</p>"
      },
      {
        "id": "review",
        "title": "A useful bond-fund review",
        "html": "\n        <ol><li>Record the fund’s role: near-term spending, diversification, income, or a deliberate rate exposure.</li><li>Match yield definitions and check whether fees have already been deducted.</li><li>Inspect duration, maturity distribution, credit quality, sector weights, and currency policy.</li><li>Stress parallel yields, curve shape, spreads, and liquidity separately.</li><li>Compare the resulting drawdown with the date and flexibility of the spending need.</li></ol>\n        <p>Higher reinvestment yields may help over time after rates rise, while lower reinvestment yields can reduce future income after rates fall. The realized path depends on when the moves occur and how the portfolio changes. A duration-only stress is an exposure estimate, not a complete reinvestment model or a promise about long-term recovery.</p>"
      }
    ],
    "sources": [
      {
        "title": "Fidelity · Duration: Understanding the relationship between bond prices and interest rates",
        "url": "https://www.fidelity.com/learning-center/investment-products/fixed-income-bonds/duration",
        "note": "Duration, maturity, and limits of the linear approximation. Article dated 26 November 2025. Reviewed 25 October 2026. Its general zero-coupon duration statement is treated as Macaulay duration; the separate annual modified-duration calculation is independently derived."
      },
      {
        "title": "Investor.gov · Bonds",
        "url": "https://www.investor.gov/introduction-investing/investing-basics/investment-products/bonds-or-fixed-income-products/bonds",
        "note": "Overview of bond cash flows and principal risk categories. Reviewed 25 October 2026. No actual issuer or market quote is used."
      },
      {
        "title": "CFA Institute · Yield-Based Bond Duration Measures and Properties",
        "url": "https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/yield-based-bond-duration-measures-and-properties",
        "note": "Public 2026 overview reviewed 25 October 2026; the full reading was not accessed. Supports the distinction between Macaulay and modified duration and limits of linear price estimates. The exact annual-pay formulas and model values are independently calculated."
      },
      {
        "title": "Fidelity · Bond and CD prices, rates, and yields",
        "url": "https://www.fidelity.com/learning-center/investment-products/fixed-income-bonds/bond-prices-rates-yields",
        "note": "Reviewed 25 October 2026 for coupon, current yield, yield to maturity and the distinction between a valuation and an executable transaction. US investor context; no tax or market convention is imported."
      },
      {
        "title": "SEC Investor.gov · Fixed-rate bond prices and interest-rate risk",
        "url": "https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins-86",
        "note": "Bulletin dated 26 June 2013; public page reviewed 25 October 2026. Supports the inverse price/yield mechanism and shorter remaining maturity after a year. Its semiannual numerical examples are not copied into the annual-pay model."
      }
    ],
    "planning": "bondPricingPlanning"
  }
];
