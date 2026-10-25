export const buybackDilutionGuides = [
  {
    "slug": "buybacks-dilution-per-share-value",
    "category": "Company analysis",
    "title": "Buybacks and dilution: what changes for each share?",
    "description": "Use five charts to reconcile repurchases and issuance, time-weight the EPS denominator, and distinguish EPS growth from a conditional equity-value-per-share result.",
    "takeaway": "The repurchase announcement is the beginning of the analysis. The price paid, net share reduction and source of funding determine the economics.",
    "related": [
      "earnings-quality-cash-flow",
      "portfolio-concentration-overlap"
    ],
    "sections": [
      {
        "id": "denominator",
        "title": "Start with earnings and the share denominator",
        "html": "\n        <p>When a company earns the same profit with fewer shares outstanding, earnings per share can rise without any improvement in total operating profit. This is arithmetic, and it can be economically useful. It does not establish that the repurchase price was attractive.</p>\n        <p>The <a href=\"https://www.sec.gov/about/reports-publications/beginners-guide-financial-statements\">SEC financial-statement guide</a> describes the relationship between earnings and shares and points readers to stock-option disclosures. In a full issuer analysis, use the reported weighted-average basic and diluted share counts, and distinguish them from the shares outstanding at the reporting date.</p>\n        <div class=\"guide-formula\">EPS growth factor = net-income growth factor ÷ share-count growth factor</div>\n        <p>For example, 6% net-income growth and a 2% decline in the comparable share denominator produce 1.06 ÷ 0.98 − 1 = 8.16% EPS growth. Adding 6% and 2% is a rough approximation. The exact calculation preserves the interaction.</p>"
      },
      {
        "id": "worked",
        "title": "Reconcile the gross buyback with net dilution",
        "html": "\n        <p>Our invented company begins with 100 million shares and annual net income of 500 million. It spends 300 million to buy six million shares at 50 each, while adding two million fully issued shares with zero modeled cash proceeds. Assume all changes happen at the start of the modeled year and profit is unchanged.</p>\n        <div class=\"guide-table\" role=\"region\" aria-label=\"Hypothetical share-count reconciliation\" tabindex=\"0\"><table><caption>Worked example · simplified full-year effects</caption><thead><tr><th scope=\"col\">Measure</th><th scope=\"col\">Calculation</th><th scope=\"col\">Result</th></tr></thead><tbody><tr><th scope=\"row\">Opening shares</th><td>Given</td><td>100 million</td></tr><tr><th scope=\"row\">Repurchased shares</th><td>300 ÷ 50</td><td>6 million</td></tr><tr><th scope=\"row\">Newly issued shares</th><td>Given</td><td>2 million</td></tr><tr><th scope=\"row\">Closing modeled shares</th><td>100 − 6 + 2</td><td>96 million</td></tr><tr><th scope=\"row\">EPS before</th><td>500 ÷ 100</td><td>5.00</td></tr><tr><th scope=\"row\">EPS after</th><td>500 ÷ 96</td><td>5.2083</td></tr><tr><th scope=\"row\">EPS increase</th><td>100 ÷ 96 − 1</td><td><strong>4.17%</strong></td></tr></tbody></table></div>\n        <p>The gross repurchase removed 6% of opening shares. Net shares declined 4%. Neither figure is the same as the 4.17% EPS increase. A research note should state which quantity it means instead of calling all three “buyback yield.”</p>\n        <p>Actual weighted-average share counts reflect transaction dates. Potential dilution can depend on award terms and the applicable accounting method. Our simplified closing-share calculation is a teaching scenario, not a reconstruction of a company’s reported diluted EPS.</p><p>For the interactive extension, monetary totals are CAD millions, share counts are millions and prices/EPS are CAD per share. The issued-share input does not calculate an award’s value, service cost, vesting or accounting expense. Repurchased shares leave the modeled outstanding count; legal retirement or treasury treatment requires the actual issuer’s reconciliation and jurisdiction.</p>"
      },
      {
        "id": "period-weighting",
        "title": "Period-end shares are not automatically the EPS denominator",
        "html": "<p>The <a href=\"https://www.ifrs.org/issued-standards/list-of-standards/ias-33-earnings-per-share/\">IFRS Foundation’s public IAS 33 summary</a> identifies weighted-average shares and separate basic/diluted EPS calculations. The timeline here is much simpler: both modeled count changes occur at one instant, and the resulting count applies for the entered fraction of the earnings period.</p><p>At the default full-period fraction, 96 million shares apply throughout, so 500 ÷ 96 = 5.2083. If that same count applies for half the period, weighted-average shares are 100 × 0.5 + 96 × 0.5 = 98 million. Modeled period EPS is then 500 ÷ 98 = 5.1020. The period-end snapshot still contains 96 million shares.</p><p>At a zero fraction, the changes have no weight in that simplified earnings period, so period EPS stays at 5.00 even though ending shares have changed. The dashed line shows net income divided by ending shares as a snapshot proxy. It must not be relabeled as actual reported diluted EPS.</p><p>The model contains no preference claims, splits, options, unvested awards or multiple transaction dates. Its weighted denominator teaches the timing distinction, rather than implementing a complete accounting-standard calculation.</p>"
      },
      {
        "id": "funding",
        "title": "Charge the repurchase for its funding",
        "html": "\n        <p>In a separate invented funding case, assume borrowing of 300 million costs 6% annually and a fictional 25% offset reduces that cost. This is a numerical assumption, not a claim that interest is tax-deductible in an actual case. The annual after-tax interest cost is 13.5 million. Under the same immediate-timing assumption, net income falls to 486.5 million and EPS becomes 486.5 ÷ 96 = 5.0677. EPS accretion falls to 1.35%.</p>\n        <p>That calculation omits issuance fees, refinancing risk, changes in credit quality, and any operating effect of the awards. It isolates the funding cost. If cash funds the repurchase, test foregone after-tax interest or the value of an alternative use of that cash rather than assuming a zero opportunity cost.</p>\n        <p>Debt maturity and liquidity matter independently of EPS. A small per-share earnings improvement can coexist with a weaker ability to withstand a downturn. Extend the model through a lower-profit year and a higher refinancing rate before treating leverage as a permanent enhancement.</p><p>This funding calculation is separate from the interactive controls, which hold annual net income fixed at 500 and assume cash is already available. Changing transaction timing there changes the share weighting only; it does not calculate interest, tax, foregone cash income or a new earnings forecast.</p>"
      },
      {
        "id": "coherent-value-input",
        "title": "Add a stated value assumption before comparing per-share outcomes",
        "html": "<p>The interactive charts extend the original EPS case with a new assumption: pre-event total common-equity value is 5,000 million, including the cash available for the 300 million repurchase. With 100 million opening shares, that assumed value is 50 per share.</p><p>Spending 300 leaves total assumed equity value of 4,700. After repurchasing six million shares and adding two million, 96 million shares remain. Value per share in this static thought experiment is 4,700 ÷ 96 = 48.9583, a decline of about 2.08%, while the full-period EPS calculation rises about 4.17%.</p><p>That contrast is conditional arithmetic. The 5,000 input is not a measured intrinsic value, enterprise value, book-equity balance or a predicted market capitalization. Annual profit of 500 is not added again to this independently assumed transaction snapshot. Sufficient cash for the repurchase is assumed separately; equity value alone cannot establish liquidity.</p><p>The new shares bring zero modeled cash proceeds and no separate value is assigned to employee services or other consideration. This limitation does not imply that real services have no economic value. The <a href=\"https://www.ifrs.org/issued-standards/list-of-standards/ifrs-2-share-based-payment/\">IFRS Foundation’s public IFRS 2 summary</a> describes share-based payment as a financial-reporting matter; an issued-share count alone cannot reconstruct its expense.</p>"
      },
      {
        "id": "price",
        "title": "Compare the repurchase price with a value range",
        "html": "\n        <p>A separate, deliberately simplified thought experiment shows why the price matters. Assume total common-equity value is 1,000 million, including 200 million of excess cash, and there are 100 million shares. The starting assumed value is 10 per share. Ignore tax, signaling, transaction costs, and any change in operating value.</p>\n        <p>Spending 200 million at 8 per share removes 25 million shares from the modeled outstanding count. Remaining equity value is 800 million across 75 million shares: 10.67 per share. Spending the same cash at 12 removes only 16.67 million shares from that count, leaving approximately 9.60 of value per remaining share.</p>\n        <p>The total assumed equity value has fallen by the cash spent in both cases. The different per-share outcomes arise from the price paid. This is our own conditional valuation example; it does not establish an observable intrinsic value or justify a company-specific price target.</p><p>The 1,000 equity/200 cash/100 shares thought experiment is a separate original case. It does not supply the 5,000 total-equity input added to the interactive EPS example, and its repurchase prices of 8 and 12 must not be confused with the other case’s price of 50.</p>"
      },
      {
        "id": "chart-comparisons",
        "title": "Compare the quantities without adding them into an extra return",
        "html": "<p>The share bridge reconciles opening, repurchased and newly issued shares. The separate equity bridge deducts the same cash payout from the assumed value once. The EPS timeline changes a period denominator; the value matrix changes the assumed repurchase price and issuance at a transaction snapshot.</p><p>The signed bars compare percentage changes from each measure’s own starting baseline. They are separate quantities, with different definitions, rather than components to add into shareholder return. Neither is a historical observation or a recommendation to buy at a stated price.</p><p>The controls impose numerical boundaries so the company never repurchases all opening shares before issuance and the modeled equity value remains positive. Those are computational limits, not recommended payout ratios. There is no financing, cash-interest, tax, valuation-response or price-impact model behind the controls.</p><p>A no-issuance repurchase at the initial assumed value per share is neutral for that assumed value under these conditions. Adding zero-cash shares can offset that benefit, while changing the value input can change the conclusion. This dependence is why EPS growth alone cannot settle whether an actual repurchase improves continuing shareholders’ economics.</p>"
      },
      {
        "id": "double-count",
        "title": "Keep the return model internally consistent",
        "html": "\n        <p>If forecast EPS already includes the assumed decline in shares, terminal EPS multiplied by an exit P/E already reflects that per-share benefit. Adding a separate repurchase yield as an extra shareholder return can count the same mechanism twice.</p>\n        <p>Alternatively, begin with aggregate earnings, model the cash allocated to repurchases, estimate the price paid each year, and calculate the resulting share path. Reconcile this with dividends, reinvestment, and debt changes. A dollar cannot simultaneously fund a dividend, an acquisition, and a repurchase.</p>\n        <p>Authorization is also different from execution. Record the announced capacity, actual spending, average price, period-end shares, and diluted weighted-average shares as separate fields. A large remaining authorization alone is weak evidence for future share reduction.</p>"
      },
      {
        "id": "questions",
        "title": "Questions to answer before rewarding the buyback",
        "html": "\n        <ol><li>How much of gross repurchasing offsets employee issuance or other dilution?</li><li>What earnings and cash-flow assumptions fund the program?</li><li>How does the price paid compare with a defensible range of estimated value?</li><li>What changes in debt, liquidity, and financial flexibility?</li><li>Does the EPS forecast already incorporate the share-count effect?</li></ol>\n        <p>Track the answers over several reporting periods. A disciplined program can reduce purchases when valuation is demanding and increase them when cash is truly surplus and the price is attractive. The useful evidence is the realized allocation record and its effect on continuing owners, assessed alongside the business’s investment needs.</p>"
      }
    ],
    "sources": [
      {
        "title": "CFA Institute · Analysis of Dividends and Share Repurchases",
        "url": "https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/analysis-of-dividends-and-share-repurchases",
        "note": "Public 2026 introduction/summary reviewed 25 October 2026. Used for repurchase, funding and per-share distinctions; the full reading was not accessed. No issuer figures or historical returns are reproduced."
      },
      {
        "title": "IFRS Foundation · IAS 33 Earnings per Share",
        "url": "https://www.ifrs.org/issued-standards/list-of-standards/ias-33-earnings-per-share/",
        "note": "Public summary reviewed 25 October 2026. Supports weighted-average shares and basic/diluted distinctions. The simplified timeline does not implement the full standard."
      },
      {
        "title": "IFRS Foundation · IFRS 2 Share-based Payment",
        "url": "https://www.ifrs.org/issued-standards/list-of-standards/ifrs-2-share-based-payment/",
        "note": "Public summary reviewed 25 October 2026. Used to distinguish issued-share arithmetic from compensation expense and award accounting. No award valuation is calculated."
      },
      {
        "title": "SEC · Beginners’ Guide to Financial Statements",
        "url": "https://www.sec.gov/about/reports-publications/beginners-guide-financial-statements",
        "note": "Canonical page reviewed 25 October 2026; current body displays 12 January 2014 and last review 6 February 2017. Introductory EPS, statement and footnote context only. All examples here are independently invented."
      }
    ],
    "planning": "buybackDilutionPlanning"
  }
];
