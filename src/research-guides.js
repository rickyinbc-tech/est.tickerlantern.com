export const reviewedAt = "2026-10-25";
export const guides = [
  {
    "slug": "buybacks-dilution-per-share-value",
    "category": "Company analysis",
    "title": "Buybacks and dilution: what changes for each share?",
    "description": "Reconcile repurchases, new issuance, EPS growth and financing costs before deciding whether a buyback improves the economics for continuing shareholders.",
    "takeaway": "The repurchase announcement is the beginning of the analysis. The price paid, net share reduction and source of funding determine the economics.",
    "related": [
      "earnings-quality-cash-flow",
      "portfolio-concentration-overlap"
    ],
    "sections": [
      {
        "id": "denominator",
        "title": "Start with earnings and the share denominator",
        "html": "\n        <p>When a company earns the same profit with fewer shares outstanding, earnings per share can rise without any improvement in total operating profit. This is arithmetic, and it can be economically useful. It does not establish that the repurchase price was attractive.</p>\n        <p>The <a href=\"https://www.sec.gov/investor/pubs/begfinstmtguide.htm\">SEC financial-statement guide</a> describes the relationship between earnings and shares and points readers to stock-option disclosures. In a full issuer analysis, use the reported weighted-average basic and diluted share counts, and distinguish them from the shares outstanding at the reporting date.</p>\n        <div class=\"guide-formula\">EPS growth factor = net-income growth factor ÷ share-count growth factor</div>\n        <p>For example, 6% net-income growth and a 2% decline in the comparable share denominator produce 1.06 ÷ 0.98 − 1 = 8.16% EPS growth. Adding 6% and 2% is a rough approximation. The exact calculation preserves the interaction.</p>"
      },
      {
        "id": "worked",
        "title": "Reconcile the gross buyback with net dilution",
        "html": "\n        <p>Our invented company begins with 100 million shares and annual net income of 500 million. It spends 300 million to buy six million shares at 50 each, while issuing two million new shares through employee awards. Assume all changes happen at the start of the modeled year and profit is unchanged.</p>\n        <div class=\"guide-table\" role=\"region\" aria-label=\"Hypothetical share-count reconciliation\" tabindex=\"0\"><table><caption>Worked example · simplified full-year effects</caption><thead><tr><th scope=\"col\">Measure</th><th scope=\"col\">Calculation</th><th scope=\"col\">Result</th></tr></thead><tbody><tr><th scope=\"row\">Opening shares</th><td>Given</td><td>100 million</td></tr><tr><th scope=\"row\">Repurchased shares</th><td>300 ÷ 50</td><td>6 million</td></tr><tr><th scope=\"row\">Newly issued shares</th><td>Given</td><td>2 million</td></tr><tr><th scope=\"row\">Closing modeled shares</th><td>100 − 6 + 2</td><td>96 million</td></tr><tr><th scope=\"row\">EPS before</th><td>500 ÷ 100</td><td>5.00</td></tr><tr><th scope=\"row\">EPS after</th><td>500 ÷ 96</td><td>5.2083</td></tr><tr><th scope=\"row\">EPS increase</th><td>100 ÷ 96 − 1</td><td><strong>4.17%</strong></td></tr></tbody></table></div>\n        <p>The gross repurchase removed 6% of opening shares. Net shares declined 4%. Neither figure is the same as the 4.17% EPS increase. A research note should state which quantity it means instead of calling all three “buyback yield.”</p>\n        <p>Actual weighted-average share counts reflect transaction dates. Potential dilution can depend on award terms and the applicable accounting method. Our simplified closing-share calculation is a teaching scenario, not a reconstruction of a company’s reported diluted EPS.</p>"
      },
      {
        "id": "funding",
        "title": "Charge the repurchase for its funding",
        "html": "\n        <p>Suppose the entire 300 million is borrowed at 6% and interest is deductible at an assumed 25% tax rate. The annual after-tax interest cost is 13.5 million. Under the same immediate-timing assumption, net income falls to 486.5 million and EPS becomes 486.5 ÷ 96 = 5.0677. EPS accretion falls to 1.35%.</p>\n        <p>That calculation omits issuance fees, refinancing risk, changes in credit quality, and any operating effect of the awards. It isolates the funding cost. If cash funds the repurchase, test foregone after-tax interest or the value of an alternative use of that cash rather than assuming a zero opportunity cost.</p>\n        <p>Debt maturity and liquidity matter independently of EPS. A small per-share earnings improvement can coexist with a weaker ability to withstand a downturn. Extend the model through a lower-profit year and a higher refinancing rate before treating leverage as a permanent enhancement.</p>"
      },
      {
        "id": "price",
        "title": "Compare the repurchase price with a value range",
        "html": "\n        <p>A separate, deliberately simplified thought experiment shows why the price matters. Assume total equity is worth 1,000 million, including 200 million of excess cash, and there are 100 million shares. The starting estimated value is 10 per share. Ignore tax, signaling, transaction costs, and any change in operating value.</p>\n        <p>Spending 200 million at 8 per share retires 25 million shares. Remaining equity value is 800 million across 75 million shares: 10.67 per share. Spending the same cash at 12 retires only 16.67 million shares, leaving approximately 9.60 of value per remaining share.</p>\n        <p>The estimated value of the whole company has fallen by the cash spent in both cases. The different per-share outcomes arise from the price paid. This is our own conditional valuation example; it does not establish an observable intrinsic value or justify a company-specific price target.</p>"
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
        "title": "SEC · Beginners’ Guide to Financial Statement",
        "url": "https://www.sec.gov/investor/pubs/begfinstmtguide.htm",
        "note": "EPS, financial-statement relationships, financing cash flows, and stock-option footnotes. All repurchase scenarios and valuations on this page are original hypothetical calculations."
      }
    ]
  }
];
