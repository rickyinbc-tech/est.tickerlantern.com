export const lookthroughGuides=[
  {
    "slug": "portfolio-concentration-overlap",
    "category": "Financial planning · Portfolio composition",
    "title": "Portfolio concentration in five charts: look through the fund names",
    "description": "Combine complete fictional fund holdings, reconcile issuer and asset-class allocations, and inspect overlapping exposures with five interactive charts and worked examples.",
    "takeaway": "Several holdings can carry the same underlying risk. A useful diversification review follows the assets and economic drivers through every wrapper.",
    "related": [
      "employer-stock-income-interruption-household-risk",
      "rebalancing-new-contributions-no-sales",
      "etf-tracking-difference-costs"
    ],
    "sections": [
      {
        "id": "problem",
        "title": "A long holdings list can hide a short risk list",
        "html": "\n        <p>Imagine a portfolio with a global equity ETF, a US large-company ETF, a technology fund, and direct shares in a familiar platform company. It has four line items, but the same company may appear in all four. Different fund names do not establish independent exposures.</p>\n        <p><a href=\"https://www.finra.org/investors/insights/concentration-risk\">FINRA’s concentration-risk overview</a> describes concentration through correlated assets, employer stock, performance drift, and overlapping funds. Use that as a prompt to inspect what you own underneath each wrapper.</p>\n        <p>The purpose of a look-through analysis is to identify the risk being taken deliberately. Concentration is not automatically a mistake, and broad diversification cannot prevent every loss. The useful question is whether one adverse event could damage several holdings and the spending plan at the same time.</p>"
      },
      {
        "id": "complete-fictional-matrix",
        "title": "Use a complete fictional matrix before changing the balances",
        "html": "<p>The interactive case starts with CAD 40,000 in Fund A, CAD 30,000 in Fund B, CAD 20,000 in Fund C and CAD 10,000 directly in Company A. Every name is invented. The four balances total CAD 100,000 at one hypothetical valuation instant. The worked amounts in this section describe the restored example; the charts follow your edited balances.</p><p>The matrix publishes every position in each fund, with no undisclosed remainder. Each column totals 100%. Company A is the same issuer wherever it appears, including the direct holding. Bond issuers D and E are distinct invented issuers.</p><div class=\"guide-table\" role=\"region\" aria-label=\"Complete fictional fund composition\" tabindex=\"0\"><table><caption>Fixed invented composition, separate from household balances</caption><thead><tr><th scope=\"col\">Position</th><th scope=\"col\">Asset / tag</th><th scope=\"col\">Fund A</th><th scope=\"col\">Fund B</th><th scope=\"col\">Fund C</th></tr></thead><tbody><tr><th scope=\"row\">Company A</th><td>Equity / US</td><td>40%</td><td>30%</td><td>0%</td></tr><tr><th scope=\"row\">Company B</th><td>Equity / US</td><td>30%</td><td>20%</td><td>0%</td></tr><tr><th scope=\"row\">Company C</th><td>Equity / non-US</td><td>20%</td><td>10%</td><td>40%</td></tr><tr><th scope=\"row\">Bond issuer D</th><td>Bond / non-US</td><td>10%</td><td>0%</td><td>40%</td></tr><tr><th scope=\"row\">Bond issuer E</th><td>Bond / US</td><td>0%</td><td>40%</td><td>20%</td></tr></tbody></table></div><p>Changing a balance creates an independent snapshot. It does not demonstrate how a purchase was funded or account for tax, fees or a sale elsewhere. The chosen mix is a calculation fixture, not a recommended allocation.</p>"
      },
      {
        "id": "combine-the-issuer",
        "title": "Combine Company A without adding extra portfolio wealth",
        "html": "<p>Company A contributes CAD 16,000 through Fund A, CAD 9,000 through Fund B and nothing through Fund C. The direct position adds CAD 10,000. The waterfall therefore reconciles CAD 35,000 of Company A, or 35% of the selected CAD 100,000 portfolio.</p><p>The direct holding alone is 10% of the total. Its label therefore omits another 25 percentage points of the same issuer allocation held through funds. Those fund portions are already inside the portfolio total; they are not another CAD 25,000 of wealth to add on top.</p><p>The combined issuer shares are A 35%, B 18%, C 19%, bond issuer D 12% and bond issuer E 16%. They total 100%. Doubling every input balance doubles the dollar allocations while preserving these percentages. With no balances entered, percentage allocations are unavailable; an empty portfolio is not evidence of diversification.</p>"
      },
      {
        "id": "alternative-partitions",
        "title": "Keep asset class, geography and account labels in separate views",
        "html": "<p>The underlying asset-class split is CAD 72,000 of equities and CAD 28,000 of bonds. Separately, the invented issuer geography tags produce CAD 69,000 classified as US and CAD 31,000 as non-US. Each is a complete alternative partition of the same CAD 100,000.</p><p>Do not add the 69% US figure to the 72% equity figure. Some of the same dollars appear in both. A mutually exclusive joint view would contain 53% US equity, 19% non-US equity, 16% US bonds and 12% non-US bonds. These tags do not establish trading currency, revenue geography, hedging or independent economic risks.</p><p>An account name is another layer. The <a href=\"https://www.getsmarteraboutmoney.ca/learning-path/tfsas/what-is-a-tfsa-and-how-does-it-work/\">OSC Investor Office explains</a> that a TFSA can hold different types of investment. Its registration label therefore does not supply an asset allocation. Splitting unchanged holdings between account labels does not change their combined underlying composition. No account transfer, tax result or contribution-room calculation is modeled.</p>"
      },
      {
        "id": "look-through",
        "title": "A separate worked example: Company X",
        "html": "\n        <p>In a separate example using different fictional funds, suppose a portfolio holds 50% in Fund P, 30% in Fund Q, and 20% in direct shares of Company X. Fund P has 6% in X and Fund Q has 12%. Assume cash-free, unlevered funds and aligned holdings dates.</p>\n        <div class=\"guide-formula\">Look-through issuer weight = direct weight + Σ (fund portfolio weight × issuer weight inside fund)</div>\n        <div class=\"guide-table\" role=\"region\" aria-label=\"Hypothetical portfolio look-through exposure\" tabindex=\"0\"><table><caption>Company X exposure across three holdings</caption><thead><tr><th scope=\"col\">Holding</th><th scope=\"col\">Portfolio weight</th><th scope=\"col\">X inside holding</th><th scope=\"col\">Contribution</th></tr></thead><tbody><tr><th scope=\"row\">Fund P</th><td>50%</td><td>6%</td><td>3.0%</td></tr><tr><th scope=\"row\">Fund Q</th><td>30%</td><td>12%</td><td>3.6%</td></tr><tr><th scope=\"row\">Direct X shares</th><td>20%</td><td>100%</td><td>20.0%</td></tr><tr><th scope=\"row\">Combined</th><td>100%</td><td>—</td><td><strong>26.6%</strong></td></tr></tbody></table></div>\n        <p>The direct position understates total issuer exposure by 6.6 percentage points. On a 100,000 portfolio, the combined economic allocation is 26,600. Adding the full value of the funds to this look-through position would double-count the wrappers; each portfolio dollar should be allocated only once at the selected analysis level.</p>"
      },
      {
        "id": "stress",
        "title": "Translate exposure into a conditional loss",
        "html": "\n        <p>If Company X falls 40% while every other underlying holding is unchanged, the first-order portfolio effect is 26.6% × −40% = −10.64%. For the 100,000 example, that is a loss of 10,640. This isolates issuer exposure and assumes no rebalancing, derivatives, distributions, or spillovers.</p>\n        <p>A more demanding scenario allows other companies with shared customers, financing needs, or valuation sensitivities to fall too. Assign shocks to mutually exclusive groups of underlying assets. Do not apply a sector loss and then add the same issuer loss again if that issuer was already included in the sector.</p>\n        <p>Scenarios reveal sensitivity; they do not supply probabilities. A precise-looking loss estimate remains conditional on the shocks selected. Record the assumptions and test several narratives rather than presenting one stress as the expected outcome.</p>"
      },
      {
        "id": "drivers",
        "title": "Map common drivers beyond the largest stock",
        "html": "\n        <p>Issuer weights are only one view. Add separate maps for sector, geography, currency, credit quality, interest-rate exposure, and liquidity. These maps answer different questions, so their totals should not be added together into one exposure percentage.</p>\n        <p>For example, holdings in several industries might all depend on inexpensive refinancing. A rise in borrowing costs can affect their earnings or valuations together. Equally, a domestic listing does not prove that revenue and costs are domestic. Label listing-based classifications separately from economic estimates.</p>\n        <p>Employer shares deserve a household view: employment income, future bonuses, and invested wealth may all depend on the same company. A real-estate-heavy household may also carry local economic exposure outside its brokerage account. These observations broaden the analysis without pretending that every household asset has a continuously observable market price.</p>"
      },
      {
        "id": "data",
        "title": "Preserve the limits of the holdings data",
        "html": "\n        <p>Use a dated holdings file for each fund and record whether it is complete. A top-ten list can establish some overlap but cannot establish the absence of other overlap. A fund-of-funds structure requires another look-through layer; align identifiers and avoid counting the intermediate wrapper as an additional asset.</p>\n        <p>For derivatives, short positions, or leveraged products, simple market-value weights may be misleading. Exposure may require notional, delta, or another measure suited to the contract. Keep those measures labelled and separate from ordinary unlevered cash-equity weights.</p>\n        <p>If one fund reports month-end holdings and another is daily, disclose the mismatch. Missing coverage should remain “unknown.” Filling it with an assumed zero can make a portfolio appear more diversified precisely where the evidence is weakest.</p>"
      },
      {
        "id": "policy",
        "title": "Turn a snapshot into a repeatable policy",
        "html": "\n        <ol><li>Define the portfolio and household assets included in the review.</li><li>Record dated values and look through funds using the best available holdings.</li><li>Calculate issuer and sector exposures, retaining unknown coverage.</li><li>Stress common drivers and compare losses with the capacity to meet planned spending.</li><li>Set review dates and explicit triggers for reassessing concentration.</li></ol>\n        <p>A trigger can lead to a review rather than an automatic sale. Taxes, transaction costs, liquidity, restrictions, and the purpose of the investment all affect the implementation. New contributions or staged changes may alter the exposure differently from a single trade.</p>\n        <p>The finished review should state the largest known exposures, the missing data, the tested scenarios, and the reason for any concentration retained. That record makes a later decision easier to evaluate when prices and portfolio weights change.</p>"
      }
    ],
    "sources": [
      {
        "title": "FINRA · Concentrate on Concentration Risk",
        "url": "https://www.finra.org/investors/insights/concentration-risk",
        "note": "Overlapping funds, correlated assets, employer concentration, and reviewing exposures. Published 15 June 2022. Rechecked 25 October 2026. Charts are original invented holdings, not observations from these sources."
      },
      {
        "title": "Investor.gov · Asset Allocation and Diversification",
        "url": "https://www.investor.gov/introduction-investing/getting-started/asset-allocation",
        "note": "General relationship between goals, time horizon, risk tolerance, asset allocation, and diversification. Rechecked 25 October 2026. Charts are original invented holdings, not observations from these sources."
      },
      {
        "title": "OSC Investor Office · What diversification means for your investments",
        "url": "https://www.getsmarteraboutmoney.ca/learning-path/understanding-risk/diversification/",
        "note": "Updated 14 October 2026; reviewed 25 October 2026. Distinct diversification views and the limits of diversification. No fictional weights are presented as a safety threshold or an estimate of future volatility."
      },
      {
        "title": "OSC Investor Office · What is a TFSA and how does it work?",
        "url": "https://www.getsmarteraboutmoney.ca/learning-path/tfsas/what-is-a-tfsa-and-how-does-it-work/",
        "note": "Updated 2 January 2026; reviewed 25 October 2026. Account wrapper versus investment contents. No TFSA room, tax or transfer advice is calculated."
      },
      {
        "title": "OSC Investor Office · Interactive Fund Facts sample",
        "url": "https://www.getsmarteraboutmoney.ca/tool-embeds/fund-facts/",
        "note": "Reviewed 25 October 2026. Holdings dates, top-investment percentages and separate investment-mix fields. Its educational sample is not a real fund dataset; every holding used by this calculator is invented."
      },
      {
        "title": "OSC Investor Office · Understanding Fund Facts",
        "url": "https://www.getsmarteraboutmoney.ca/learning-path/mutual-funds-segregated-funds/understanding-fund-facts/",
        "note": "Updated 26 February 2025; reviewed 25 October 2026. Overview and limitations of fund disclosures. A top-ten list is incomplete coverage, and this model calculates no suitability or risk rating."
      }
    ],
    "planning": "fundLookthroughPlanning",
    "chartScope": "Five composition charts use complete invented Fund A/B/C holdings and adjustable CAD balances at one assumed instant. They contain no actual securities, return forecast, concentration limit or suitability judgment. The separate Company X example later in the article uses different fictional Funds P and Q and its own stated shock assumptions."
  }
];
