export const currencyTranslationGuides = [
  {
    "slug": "currency-cad-hedging",
    "category": "Global investing",
    "title": "Currency and CAD returns: understand what you actually own",
    "description": "Use four interactive charts to distinguish trading currency from exposure, invert currency quotes correctly, and find a conditional CAD break-even rate.",
    "takeaway": "The currency on the trading screen tells you how you pay. The assets and hedge policy determine the currency exposure you carry.",
    "related": [
      "foreign-investment-local-return-cad-currency-translation",
      "etf-tracking-difference-costs",
      "foreign-currency-goal-budget"
    ],
    "sections": [
      {
        "id": "currency-labels",
        "title": "Separate the different currency labels",
        "html": "\n        <p>A Canadian investor can purchase a CAD-listed fund that owns foreign assets. Paying in Canadian dollars does not by itself eliminate the effect of exchange rates. A USD trading line likewise does not tell you the full economic currency exposure of the companies inside it.</p>\n        <p>Record four fields: the currency in which you trade, the currency used to report fund values, the currencies of the underlying assets, and the fund’s hedge target. For multinational businesses, revenues, costs, and financing can introduce additional economic exposures beyond the currency of a share listing.</p>\n        <p><a href=\"https://www.investor.gov/introduction-investing/investing-basics/investment-products/international-investing\">Investor.gov’s international-investing overview</a> identifies exchange-rate changes as one source of international investment risk. The CAD calculations below apply that general mechanism to an invented Canadian-dollar example; they do not forecast an exchange rate.</p><p>The <a href=\"https://www.ssga.com/uk/en_gb/institutional/insights/considerations-for-non-us-investors-us-etfs-vs-irish-ucits\">State Street issuer explanation</a> distinguishes an ETF’s trading currency from its underlying currency exposure. Its publication is international context; no product, domicile or tax comparison from that article is modeled here. A fund return measured in USD may already reflect several underlying currency moves. Translating that USD performance into CAD is a measurement conversion, not proof that all holdings have one economic USD exposure.</p>"
      },
      {
        "id": "formula",
        "title": "Use an exchange-rate quote with explicit units",
        "html": "\n        <p>Define S as Canadian dollars per one US dollar. An increase in S means one US dollar buys more Canadian dollars. If R<sub>USD</sub> is the investment’s USD total return and all wealth is measured at the beginning and end, the unhedged CAD return is:</p>\n        <div class=\"guide-formula\">1 + R<sub>CAD</sub> = (1 + R<sub>USD</sub>) × (S<sub>end</sub> ÷ S<sub>start</sub>)</div>\n        <p>This convention assumes any distributions remain within the USD investment and are reflected in its total return. If dividends are converted into CAD on their payment dates, translate those cash flows separately. A single ending exchange rate would otherwise misstate their timing.</p>\n        <p>If your data source instead quotes US dollars per Canadian dollar, invert the relevant ratio. Writing the units beside both exchange rates is an inexpensive way to prevent a sign error.</p><p>The controls use <strong>FCU</strong> for one selected foreign-currency unit. The worked USD example is one instance of that convention. A foreign-unit ledger begins with CAD wealth divided by the starting CAD-per-FCU quote. Apply the foreign-currency total return to those units, then multiply by the ending CAD-per-FCU quote to obtain ending CAD wealth. Never add CAD and FCU amounts or translate a performance number already reported in CAD a second time.</p>"
      },
      {
        "id": "worked",
        "title": "Work through a gain, a headwind and a break-even point",
        "html": "\n        <p>Begin with CAD 10,000 at CAD 1.25 per USD. Ignoring conversion costs, you acquire USD 8,000 of assets. Assume the USD investment earns 8% with distributions reinvested, leaving USD 8,640. Translate the ending wealth under three hypothetical exchange rates.</p>\n        <div class=\"guide-table\" role=\"region\" aria-label=\"Hypothetical Canadian-dollar investment returns\" tabindex=\"0\"><table><caption>Same USD return · different ending exchange rates</caption><thead><tr><th scope=\"col\">Ending CAD per USD</th><th scope=\"col\">Ending CAD wealth</th><th scope=\"col\">CAD return</th></tr></thead><tbody><tr><th scope=\"row\">1.15</th><td>9,936</td><td>−0.64%</td></tr><tr><th scope=\"row\">1.25</th><td>10,800</td><td>+8.00%</td></tr><tr><th scope=\"row\">1.35</th><td>11,664</td><td>+16.64%</td></tr></tbody></table></div>\n        <p>In the first row, the foreign asset rises while the USD buys fewer Canadian dollars. The currency move is −8%, but 8% + (−8%) is not the final return. Multiplication produces −0.64% because the translation also affects the investment gain.</p>\n        <p>The break-even ending rate is 1.25 ÷ 1.08 = approximately 1.1574 CAD per USD. This threshold is conditional on the assumed 8% investment return and zero costs. It is a sensitivity result, not an estimate of where the currency should trade.</p>"
      },
      {
        "id": "reciprocal-change",
        "title": "An 8% move does not become the opposite 8% when you invert it",
        "html": "<p>The default quote falls from 1.25 to 1.15 CAD per FCU, a decline of 8%. The reciprocal rises from 0.80 to approximately 0.869565 FCU per CAD, an increase of about 8.70%. The two percentage denominators differ. They describe the same conversion in different units, not independent gains and losses.</p><div class=\"guide-formula\">Reciprocal quote change = 1 ÷ (1 + original quote change) − 1</div><p>When Q is quoted in FCU per CAD, the correct CAD growth factor is (1 + foreign asset return) × (Q<sub>start</sub> ÷ Q<sub>end</sub>). Using Q<sub>end</sub> ÷ Q<sub>start</sub> would reverse the economic direction. Put units beside every input before comparing performance statements.</p><p>The reciprocal bars isolate this quote-reading issue. The separate <a href=\"/research/foreign-investment-local-return-cad-currency-translation\">foreign-investment return guide</a> shows the asset–currency interaction in a waterfall and compares repeated annual scenarios. This page’s ending-quote curve holds the foreign wealth fixed instead of extending a repeated annual forecast.</p>"
      },
      {
        "id": "break-even-curve",
        "title": "A break-even quote is conditional on the asset result",
        "html": "<p>The final curve solves for the quote change that makes ending nominal CAD wealth equal starting CAD wealth. Its formula is 1 ÷ (1 + foreign asset return) − 1. At an 8% asset gain, a 7.4074% quote decline reaches break-even; an 8% decline goes further and produces the default 0.64% CAD loss.</p><p>After a 20% foreign asset loss, a 20% quote increase is insufficient: 0.80 × 1.20 − 1 equals −4%. A 25% increase is required to restore the starting nominal CAD amount. The resulting curve is asymmetric because the percentage base changes, not because an assumed market relationship has been discovered.</p><p>The curve spans foreign asset returns from −50% to +50%. A −50% asset result requires a 100% quote increase, which exceeds the quote-change control’s maximum; it remains visible on the curve rather than being clipped to the control range. A complete 100% unlevered asset loss cannot be repaired by any finite positive exchange rate. That boundary is excluded from the controls and curve.</p><p>All thresholds exclude costs, taxes and inflation. They also assume no contributions, withdrawals or interim CAD conversion of distributions. None is a forecast, a likelihood, a trading signal or a hedge recommendation.</p>"
      },
      {
        "id": "hedging",
        "title": "What a hedge attempts to change",
        "html": "\n        <p>A currency hedge takes an offsetting position intended to reduce specified exchange-rate movements. Funds commonly use foreign-exchange forwards and reset positions periodically. The actual coverage can differ from the target as asset values and cash flows change.</p>\n        <p>Read the current prospectus for the hedge target, reset frequency, instruments, and residual exposure. Hedging one reporting currency is not automatically the same as hedging all of the currencies associated with the underlying holdings.</p>\n        <p>A hedged return is not simply the local-market return less a fixed fee. <a href=\"https://www.cmegroup.com/education/courses/introduction-to-fx/importance-of-fx-futures-pricing-and-basis\">CME’s FX pricing explanation</a> connects forward and futures pricing with interest-rate differences. Implementation, trading, collateral, and imperfect coverage can also affect results. A hedge can remove a favorable currency contribution as well as an unfavorable one. It does not remove the market risk of the assets.</p><p><a href=\"https://www.vanguard.ca/en/tools-and-resources/faqs\">Vanguard Canada’s FAQ</a> describes extra expenses, an imperfect offset and the loss of favorable currency benefits as possible implications of hedging. An unchanged exchange-rate reference in an illustration is therefore not the performance of a real hedge. The charts here calculate unhedged translation only; they do not evaluate a forward contract, a hedge ratio or a hedged fund’s return.</p>"
      },
      {
        "id": "decision",
        "title": "Connect currency exposure with the spending liability",
        "html": "\n        <p>Start with what the portfolio must eventually pay. A CAD expense due soon and a flexible foreign-currency expense decades away create different problems. Evaluate the asset’s role, the size of its currency sensitivity, and how much uncertainty the spending plan can absorb.</p>\n        <p>For a hypothetical 20,000 allocation, an isolated 10% translation move is about 2,000 before interactions with the asset return. Write that amount beside the relevant spending goal. Then test a joint scenario in which the asset falls and the currency moves against the investor.</p>\n        <p>Partial hedging can leave part of the translation exposure in place, but its implementation still needs a stated policy. There is no universal hedge ratio on this page. Select and review a policy against the portfolio’s actual obligations instead of treating a recent currency trend as a complete investment thesis.</p>"
      },
      {
        "id": "checklist",
        "title": "Checks before comparing hedged and unhedged funds",
        "html": "\n        <ol><li>Confirm that the funds hold comparable assets and follow comparable benchmarks.</li><li>Identify the target currency, hedge policy, fees, and distribution conventions.</li><li>Compare returns in the same investor currency over the same dates.</li><li>Separate fund hedge implementation from your brokerage conversion cost.</li><li>Model both favorable and adverse currency outcomes with the spending goal in view.</li></ol>\n        <p>The index workbench on TickerLantern uses normalized currency-neutral scenarios. Its result is not automatically a CAD forecast. To build one, translate the modeled wealth or each dated cash flow under explicit exchange-rate assumptions and include the chosen hedge implementation consistently.</p>"
      }
    ],
    "sources": [
      {
        "title": "Investor.gov · International Investing",
        "url": "https://www.investor.gov/introduction-investing/investing-basics/investment-products/international-investing",
        "note": "General international-investment and currency risks. US investor context; CAD examples are original calculations. Reviewed 25 October 2026."
      },
      {
        "title": "CME Group · The Importance of FX Futures Pricing and Basis",
        "url": "https://www.cmegroup.com/education/courses/introduction-to-fx/importance-of-fx-futures-pricing-and-basis",
        "note": "Reviewed 25 October 2026 for the qualitative connection between spot rates, interest-rate differences and forward/futures pricing. No sample numerical quote or sign convention from its basis example is copied; the CAD quote equations are independently derived."
      },
      {
        "title": "Vanguard Canada · Frequently asked questions",
        "url": "https://www.vanguard.ca/en/tools-and-resources/faqs",
        "note": "Reviewed 25 October 2026. The currency-hedging FAQ supports the qualified discussion of expenses, imperfect offset and foregoing favorable currency moves. No fund return, fee or hedge payoff is reproduced."
      },
      {
        "title": "State Street Investment Management · Trading currency and underlying exposure",
        "url": "https://www.ssga.com/uk/en_gb/institutional/insights/considerations-for-non-us-investors-us-etfs-vs-irish-ucits",
        "note": "Issuer education dated 2 June 2026; reviewed 25 October 2026. Used solely for the distinction between trading currency and underlying exposure. Domicile, product and tax comparisons are outside this page."
      },
      {
        "title": "OSC Investor Office · Why does risk matter in investing?",
        "url": "https://www.getsmarteraboutmoney.ca/learning-path/understanding-risk/why-does-risk-matter-in-investing/",
        "note": "Updated 15 January 2026; reviewed 25 October 2026. Currency-risk explanation supports the direction of foreign-to-CAD translation. All rates and returns in the charts are invented."
      }
    ],
    "planning": "currencyQuotePlanning"
  }
];
