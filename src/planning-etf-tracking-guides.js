export const etfTrackingGuides = [
  {
    "slug": "etf-tracking-difference-costs",
    "category": "ETF research",
    "title": "ETF tracking: the gap between the index and your return",
    "description": "Use four charts to compare matched NAV and index returns, separate annual and cumulative gaps, and distinguish tracking difference from tracking error.",
    "takeaway": "Compare the exact benchmark with fund NAV total return first. Then account for the price, spread and conversion costs of your own transaction.",
    "related": [
      "currency-cad-hedging",
      "portfolio-concentration-overlap",
      "etf-bid-ask-spread-order-commission-cash",
      "investment-fees-long-term-plan"
    ],
    "sections": [
      {
        "id": "three-returns",
        "title": "Keep three return records separate",
        "html": "\n        <p>An index return describes a calculation maintained by an index provider. A fund’s NAV total return describes the performance of its net assets with the stated distribution-reinvestment convention. Your account return additionally reflects the prices and dates of your trades, your cash flows, and any investor-level costs.</p>\n        <p>Write all three on separate lines. Comparing your brokerage account gain with a headline price index can mix distributions, purchase timing, and fund implementation in one unexplained difference. A reliable comparison starts with matching dates, currency, benchmark version, and return definition.</p>\n        <p>The <a href=\"https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/exchange-traded-funds-mechanics-applications\">CFA Institute’s ETF overview</a> discusses tracking, trading costs, and premiums or discounts. Those are related dimensions, but they require different measurements.</p>"
      },
      {
        "id": "difference",
        "title": "Tracking difference measures the return gap",
        "html": "\n        <p>On this page, tracking difference means fund NAV total return minus benchmark total return over the same interval. Some publishers reverse the sign, so check the stated convention. If the benchmark returns 8.00% and the fund returns 7.72%, the difference is −0.28 percentage points, or −28 basis points.</p>\n        <div class=\"guide-formula\">Tracking difference = fund NAV total return − matching benchmark total return</div>\n        <p>Do not subtract the fund’s expense ratio again from a published return that is already net of those expenses. Doing so would charge the same cost twice. Similarly, if the benchmark has a net-dividend convention, do not assume the resulting gap is entirely caused by withholding tax.</p>\n        <p>For a multi-year comparison, state whether you subtract annualized returns or compare cumulative wealth. These produce different-looking numbers. An eight-year cumulative shortfall cannot be labelled an annual cost without a suitable annualization.</p><p><a href=\"https://www.vanguard.ca/en/tools-and-resources/etf-fundamentals/management/index-tracking\">Vanguard Canada’s index-tracking explanation</a> uses this fund-minus-index convention and distinguishes the gap from its standard-deviation measure. The <a href=\"https://www.getsmarteraboutmoney.ca/tool-embeds/etf-facts/\">OSC Investor Office’s ETF Facts sample</a> describes displayed performance as net of expenses, supporting the check against deducting an embedded expense twice. Read the actual return definition before applying that check to a real statement.</p>"
      },
      {
        "id": "cumulative-gap",
        "title": "A small annual gap compounds into a different cumulative comparison",
        "html": "<p>The controls start both references at CAD 10,000. The benchmark’s hypothetical annual total return is 8.00%, and the fund’s annual NAV total return is 7.72%. The annual fund-minus-benchmark tracking difference is therefore −0.28 percentage points. These are assumed net NAV results; no separate expense-ratio subtraction follows.</p><p>After ten identical annual factors, benchmark reference wealth is about CAD 21,589.25 and fund NAV wealth is about CAD 21,036.01. The signed fund-minus-benchmark wealth difference is approximately negative CAD 553.24. Relative to the same initial CAD 10,000, that is a <strong>−5.5324 percentage-point difference between the two cumulative returns</strong>.</p><p>That cumulative return gap is neither the annual −0.28 percentage-point gap nor the percentage by which ending fund wealth is below ending benchmark wealth. Each comparison uses a different denominator or horizon. Dividing −5.5324 by ten would not recover the annual rate difference.</p><p>The signed bars state each horizon explicitly. Changing the annual gap to a positive value lets the hypothetical fund exceed the benchmark; this is a sensitivity, not evidence that a real fund can repeatedly achieve that result. The benchmark wealth reference is also a calculation, rather than a directly investable account with no implementation costs.</p>"
      },
      {
        "id": "error",
        "title": "Tracking error measures how variable the gap is",
        "html": "\n        <p>Tracking error is commonly the annualized standard deviation of periodic fund-minus-benchmark returns. It asks how much the gap fluctuates. It does not directly measure how much return the investor lost over the whole period.</p>\n        <div class=\"guide-table\" role=\"region\" aria-label=\"Hypothetical tracking difference and variability\" tabindex=\"0\"><table><caption>Four invented monthly active returns · percentage points</caption><thead><tr><th scope=\"col\">Month</th><th scope=\"col\">Fund A minus index</th><th scope=\"col\">Fund B minus index</th></tr></thead><tbody><tr><th scope=\"row\">1</th><td>−0.02</td><td>+0.10</td></tr><tr><th scope=\"row\">2</th><td>−0.02</td><td>−0.14</td></tr><tr><th scope=\"row\">3</th><td>−0.02</td><td>+0.10</td></tr><tr><th scope=\"row\">4</th><td>−0.02</td><td>−0.14</td></tr></tbody></table></div>\n        <p>Both series have an arithmetic mean gap of −0.02 percentage points per month. Fund A has zero variability in this deliberately artificial sample; Fund B does not. This is a demonstration of the distinction, not enough history for a useful tracking-error estimate. Equal arithmetic mean gaps also do not guarantee equal compounded wealth.</p>\n        <p>In a real study, record daily or monthly frequency, the sample period, the standard-deviation convention, and the annualization factor. Compare like with like rather than ranking incompatible published statistics.</p><p>The monthly chart uses the exact four observations in this table, independent of the annual controls. The two artificial series have the same simple mean and different dispersion, but the page does not present their annualized standard deviations as useful estimates. A four-observation pattern illustrates a definition; it does not establish a fund’s likely future tracking error.</p><p>Do not compound the active-return differences by themselves to reconstruct fund wealth. You would also need the benchmark’s return for each matching month, then compound the fund and benchmark series separately. The monthly pattern and the annual wealth path are deliberately separate examples.</p>"
      },
      {
        "id": "explain",
        "title": "Build an explanation instead of guessing from the fee",
        "html": "\n        <p>Suppose a hypothetical one-year gap is −0.28 percentage points. An analyst’s illustrative reconciliation might assign −0.15 to operating expenses, −0.06 to portfolio trading, −0.08 to unrecovered taxes, +0.03 to net lending revenue, and −0.02 to other implementation effects. The sum is −0.28.</p>\n        <p>This is an invented attribution, not a claim that public reports reveal each component exactly. In actual research, label observed expenses separately from inferred residuals. Sampling, cash balances, valuation timing, index changes, and the treatment of corporate actions can also require investigation.</p>\n        <p>A one-year favorable residual is not automatically a repeatable skill. Read the fund’s reports, benchmark methodology, replication policy, and lending disclosures before extrapolating it. Avoid choosing a fund because of a tiny return advantage that cannot be explained or survives only over one chosen interval.</p>"
      },
      {
        "id": "trading",
        "title": "Your entry and exit add another layer",
        "html": "\n        <p>The <a href=\"https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins-24\">SEC ETF bulletin</a> explains that exchange prices can differ from NAV and that the bid–ask spread affects investor costs. These trading effects sit outside a clean NAV-to-index comparison.</p>\n        <p>Imagine an unchanged order book with a bid of 49.95 and ask of 50.05. Buying 200 units at the ask costs 10,010. An immediate sale at the bid returns 9,990, a loss of 20 before commissions. Relative to the 50 midpoint, the initial purchase costs 10 and the sale another 10. This full round-trip spread is 0.20% of the 10,000 midpoint value.</p>\n        <p>A limit order controls the worst price you accept, but it can remain unfilled. Compare the quote with current underlying-market conditions; yesterday’s closing NAV may be a poor intraday fair-value reference when the underlying market is closed or moving quickly.</p><p>The separate <a href=\"/research/etf-bid-ask-spread-order-commission-cash\">ETF bid–ask spread and order-cost guide</a> diagrams investor execution cash. Those costs belong to your trade record. They must not be inserted into fund NAV tracking difference as though every investor incurred the same execution price or commission.</p>"
      },
      {
        "id": "chart-scopes",
        "title": "Read the four figures as two controlled and two fixed examples",
        "html": "<p>The first two figures share the controls: they compare annual NAV and benchmark growth factors, then show their cumulative return differences at stated horizons. The final two figures retain the original article’s independent examples: four monthly active returns and a one-year attribution that sums to −0.28 percentage points.</p><p>A change to the annual-gap input does not rewrite the fixed monthly pattern or scale the invented attribution components. That would imply a relationship which the example has not established. Their purpose is to show the difference between a measured gap, its variation and a proposed explanation.</p><p>The attribution waterfall uses percentage points throughout. A positive lending-revenue entry offsets part of the negative entries; it is not a separate return to add again to the ending wealth line. Real disclosures may support some components better than others. Leave an unexplained residual visible instead of presenting an exact-looking invented explanation as measured evidence.</p>"
      },
      {
        "id": "compare",
        "title": "A comparison sheet that can be checked",
        "html": "\n        <ol><li>Identify the legal fund, exact share class, benchmark, and hedging policy.</li><li>Compare fund NAV and matching benchmark total returns over identical periods.</li><li>Record operating expenses and realized tracking differences without subtracting costs twice.</li><li>Inspect spread, premium or discount history, brokerage charges, and currency-conversion costs.</li><li>Check holdings, replication, lending, and the explanation for persistent residuals.</li></ol>\n        <p>For a long holding period, a persistent annual gap can outweigh a modest one-time trading cost. For frequent transactions, spreads and commissions can matter much more. Estimate both using the intended behavior, and keep that estimate separate from the fund’s published performance record.</p>"
      }
    ],
    "sources": [
      {
        "title": "CFA Institute · Exchange Traded Funds: Mechanics and Applications",
        "url": "https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/exchange-traded-funds-mechanics-applications",
        "note": "Accessible public 2026 refresher-reading summary reviewed 25 October 2026. Supports tracking, trading costs and multiple implementation factors. The signed-in full reading was not accessed; the edition is not treated as a publication date. All chart calculations are invented."
      },
      {
        "title": "Investor.gov · Updated Investor Bulletin: Exchange-Traded Funds",
        "url": "https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins-24",
        "note": "US ETF market-price, NAV, spread and disclosure mechanics. Published 23 February 2023; jurisdiction-specific provisions are not Canadian rules. Reviewed 25 October 2026 via the public web page; direct anonymous HTML retrieval returned403."
      },
      {
        "title": "Vanguard Canada · Index tracking",
        "url": "https://www.vanguard.ca/en/tools-and-resources/etf-fundamentals/management/index-tracking",
        "note": "Reviewed 25 October 2026. Used for the explicit fund-minus-index tracking-difference convention and the annualized standard-deviation definition of tracking error. The guide does not adopt its later negative-tracking-error wording or infer a probability interval from its illustrative discussion."
      },
      {
        "title": "OSC Investor Office · Interactive ETF Facts sample",
        "url": "https://www.getsmarteraboutmoney.ca/tool-embeds/etf-facts/",
        "note": "Reviewed 25 October 2026. The sample explains performance net of expenses, NAV and fund-paid MER. No performance number from the sample is reproduced; all chart returns are invented."
      },
      {
        "title": "Vanguard Canada · The costs of ETFs",
        "url": "https://www.vanguard.ca/en/tools-and-resources/etf-fundamentals/basics/costs-of-etfs",
        "note": "Reviewed 25 October 2026 for the distinction between fund operating costs and investor trading commissions, spreads and premiums/discounts. No named product or fee quote is used."
      }
    ],
    "planning": "etfTrackingPlanning"
  }
];
