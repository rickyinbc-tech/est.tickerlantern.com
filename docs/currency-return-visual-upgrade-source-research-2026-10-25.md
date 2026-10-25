# Currency return translation: visual upgrade research

Reviewed/retrieved **25 October 2026**. Upgrade the existing `currency-cad-hedging` route; do not publish a duplicate. Public official education/issuer HTML only, with fictional returns and exchange-rate assumptions. No live exchange-rate series, real funds, hedge-contract payoff, product recommendation, private account, archive or PDF is used in the teaching model.

## Existing article reviewed

The article in `src/research-guides.js`, also present on `origin/main` at **1511412**, already distinguishes trading/reporting/underlying currencies and hedge policy. It defines CAD per USD, uses multiplicative translation, handles reinvested distributions and has a CAD 10,000 / 8% USD-return example with three ending rates. That example and its break-even calculation are correct. Retain its route and useful explanations, then add the interactive translation bridge, explicit interaction term, return grid and conditional break-even curve.

The new controls should say **“asset total return measured in the selected foreign currency”** and **“change in CAD per one foreign-currency unit.”** “Currency up 8%” alone is ambiguous. A global fund's USD-reported return may already reflect several underlying currencies; applying USD-to-CAD translation to that reported return is different from assuming that all its businesses have one economic currency exposure.

## Verified source support and qualifications

**Currency changes can raise or lower an investor-currency return.** SEC investor education identifies exchange-rate changes as a source of gains or losses in international-investment returns. It is US investor context; the CAD equations below are original unit-based arithmetic, not an SEC Canadian rule or forecast. [Investor.gov International Investing, currency-exchange-rate risk](https://www.investor.gov/introduction-investing/investing-basics/investment-products/international-investing). No explicit page publication/update date was established; read on the review date.

OSC education gives the Canadian example directly: a USD investment translates into fewer Canadian dollars when USD becomes less valuable relative to CAD. This supports the direction of the conversion, not an estimate of a future exchange rate. [OSC Investor Office, “Why does risk matter in investing?”, currency-risk section; updated 15 January 2026](https://www.getsmarteraboutmoney.ca/learning-path/understanding-risk/why-does-risk-matter-in-investing/).

**Trading currency is not the underlying exposure.** State Street Investment Management's public issuer explanation explicitly distinguishes the currency in which an ETF transaction occurs from the currency exposure of underlying assets, and separately notes hedged/unhedged share classes. Use only that distinction here; the article's tax, domicile and product comparisons are outside this guide. [State Street issuer education, “Considerations for non-US investors: US-domiciled ETFs vs. Irish-domiciled UCITS ETFs,” dated 2 June 2026](https://www.ssga.com/uk/en_gb/institutional/insights/considerations-for-non-us-investors-us-etfs-vs-irish-ucits).

**A hedge is not equivalent to deleting an FX term.** Vanguard Canada's public FAQ says foreign-currency movements affect unhedged foreign-security returns. Its hedge explanation expressly preserves three limitations: extra expenses, imperfect offset, and loss of benefits from favourable currency changes. This is a stronger narrow source for the upgrade than a promise of complete elimination. [Vanguard Canada FAQ, “What's the difference between a currency-hedged product and an unhedged product?”](https://www.vanguard.ca/en/tools-and-resources/faqs). No explicit FAQ update date was established. No fund or fee is quoted.

CME's official education explains that FX futures pricing depends on spot and short-term interest-rate differences, with positive or negative basis possible, and relates that mechanism to forward pricing. This supports preserving the existing warning against representing an actual hedged return as the local return minus one constant fee. No interest-rate, basis or contract-payoff calculation is added to the model. [CME, The Importance of FX Futures Pricing and Basis](https://www.cmegroup.com/education/courses/introduction-to-fx/importance-of-fx-futures-pricing-and-basis).

## Source inconsistencies and access limitations

The existing Vanguard Australia source is dated **February 2020** in the current public HTML. Its body simplifies hedging into complete protection against adverse exchange moves and says hedging always has a cost. Those statements should not be repeated as universal guaranteed outcomes or as proof that a hedged portfolio must underperform an unhedged one. Prefer the qualified current Canadian FAQ for expenses and imperfect offset, and keep favourable/adverse outcomes conditional. [Existing Vanguard Australia article](https://www.vanguard.com.au/personal/learn/smart-investing/etfs/hedging-in-etfs).

The web tool showed a JavaScript shell for that Australian article, but the complete article body was found and decoded from the `pi0-state` JSON already embedded in its successfully downloaded anonymous HTML. The original HTML and a traceable derived text file are preserved. This is not evidence from a private endpoint or an access-control workaround.

CME defines basis as futures minus spot. One later example sentence describes the reverse subtraction while assigning a negative result. Its numerical direction agrees with futures minus spot; the subtraction wording does not. Do not copy that sentence or its sample calculation as the sign convention. Use its qualitative pricing discussion only. This does not undermine the independent CAD translation identity below. [CME source, “Understanding FX Basis” and later “Shorter time” example](https://www.cmegroup.com/education/courses/introduction-to-fx/importance-of-fx-futures-pricing-and-basis).

## Exact quote direction and original derivation

Define `S0` and `S1` in **CAD per 1 FCU**, where FCU is the selected foreign-currency unit. Define `r` as the asset's foreign-currency total return and `x = S1 / S0 − 1` as the fractional change in that quote. A positive `x` means one FCU buys more CAD. For the same starting/ending foreign wealth, that improves its CAD translation. It is not a CAD appreciation.

Starting with `P` Canadian dollars, with no conversion cost:

`foreign starting wealth = P / S0`.

`foreign ending wealth = (P / S0) × (1 + r)`.

`ending CAD wealth = P × (1 + r) × (S1 / S0)`.

Consequently:

`R_CAD = (1 + r)(1 + x) − 1 = r + x + r×x`.

The third term is the **interaction**, not an extra fee, a separate currency trade, a causal attribution or income. If the two input moves have opposite signs, their interaction is negative; if both are negative, the interaction is positive even though the combined return may remain negative.

If a source instead gives `Q` in **FCU per 1 CAD**, then `S = 1/Q`, `S1/S0 = Q0/Q1`, and the CAD return is `(1+r) × (Q0/Q1) − 1`. If `u = Q1/Q0 − 1`, then `x = −u/(1+u)`, not generally `−u`. An 8% fall in CAD per FCU corresponds to an approximately **8.695652% rise** in FCU per CAD. Reversing quote units does not simply reverse the percentage's sign.

## Reviewed existing example and bridge choices

All figures are hypothetical. Start with CAD 10,000, `S0 = 1.25 CAD/FCU` and `r = 8%`. Foreign starting wealth is FCU 8,000; foreign ending wealth is FCU 8,640.

| Ending quote, CAD per FCU | Quote change `x` | Ending CAD wealth | CAD total return | Interaction |
| --- | ---: | ---: | ---: | ---: |
| 1.15 | -8% | 9,936 | -0.64% | -0.64 percentage points |
| 1.25 | 0% | 10,800 | 8.00% | 0.00 percentage points |
| 1.35 | 8% | 11,664 | 16.64% | 0.64 percentage points |

For the first row, an exact three-component CAD bridge is **10,000 + 800 − 800 − 64 = 9,936**: initial wealth, asset-only component `P×r`, FX-only component `P×x`, then interaction `P×r×x`. These are an algebraic decomposition of one result, not three independent investments. A return comparison can show +8%, −8% and −0.64% combined, with the interaction called out; the combined bar is not the sum of only the first two bars.

A different valid two-step bridge is **10,000 + 800 − 864 = 9,936**, applying the FX move to the post-asset-return amount, `P(1+r)×x`. Do not show both the full CAD −864 step and an additional CAD −64 interaction: that would count the interaction twice. Choose one bridge convention and explain it.

Calling the `x=0` scenario **“FX unchanged reference”** is precise. It is not an actual hedged return, a guaranteed currency-neutral product return or a claim that a real hedging program can be acquired at zero cost. No hedge ratio slider or contract is needed for this translation model.

## Break-even curve and model boundaries

For `r > −1`, nominal CAD break-even satisfies:

`x_break = 1/(1+r) − 1 = −r/(1+r)`;

`S1_break = S0/(1+r)`.

At +8% foreign return, the quote can fall by **7.407407…%** before the CAD result reaches zero; the ending quote is approximately **1.157407 CAD/FCU**. An 8% quote fall is beyond that threshold. At −20% foreign return, CAD break-even requires a +25% quote rise. A +20% quote rise is insufficient: `0.8×1.2−1 = −4%`.

At `r=−100%`, ending foreign wealth is zero, so no finite positive exchange rate restores the starting CAD wealth. Show break-even unavailable; do not plot division by zero or a finite clipped threshold. In the unlevered model, exclude returns below −100%, use strictly positive starting/ending quotes (`x > −100%`), and accept non-negative starting principal. With zero principal, dollar amounts are zero; a scenario return remains a rate calculation, not a realized return on invested money.

The assumptions require all investment distributions to remain in the foreign investment and be included in its total return, with no new contributions or withdrawals. If distributions are actually converted into CAD at intermediate dates, use a separate dated cash-flow calculation; one ending exchange rate cannot represent all those payments. Do not add dividends again to an input already defined as total return. Do not translate a performance number already reported in CAD a second time.

All returns here are nominal over one common hypothetical period, not annualized forecasts, inflation-adjusted purchasing-power outcomes, historical observations or probabilities. Conversion spreads, brokerage charges, withholding taxes, portfolio fees and actual hedge implementation are omitted. Any future inclusion needs an explicit, non-overlapping convention.

## Four-chart upgrade recommendation

1. CAD starting-to-ending waterfall using the disclosed three-component decomposition, including interaction.
2. Foreign-asset return, quote change and combined CAD return comparison, with an explanatory interaction label.
3. Grid of foreign-asset return and **CAD-per-FCU quote change**, each cell calculated multiplicatively. These are joint scenarios, not their likelihoods or assumed correlation.
4. Break-even quote-change curve across foreign returns, with the selected point and unavailable boundary handled explicitly.

Retain prose about trading currency and actual hedge limitations outside the model. None of these charts compares named products, determines whether to hedge, calculates a contract payoff or models suitability.

## Evidence and arithmetic verification

Ignored `qa/currency-translation/retrieval-manifest.json` preserves four successful anonymous HTML captures, including the Australian article's embedded body. Two direct retrievals failed: Investor.gov returned 403 and CME had a transport error. Both public sources were successfully read through the web tool, and their original text responses are preserved and hashed separately. Do not describe these two as successful raw HTML downloads.

`qa/currency-translation/validate_research.py` checks evidence hashes, embedded-source extraction, the existing three worked rows, exact return/cross-term identities, inverse quotes, both bridge conventions, break-even calculations and edge cases. Results are saved in `qa/currency-translation/validation-results.json`. No application, registry, test, commit or deployment changes are part of this research task.

## Implemented scope after concurrent-content review

A separate newly added `foreign-investment-local-return-cad-currency-translation`
guide already covers repeated annual factors, a one-year interaction bridge and
a joint-return matrix. Preserve it and cross-link it. The existing
`currency-cad-hedging` URL is upgraded rather than duplicated, retaining all six
original sections and its three USD worked rows. Two added sections explain
reciprocal percentages and conditional break-even asymmetry.

The four added charts show a foreign-unit ledger, reciprocal quote changes,
ending CAD wealth against ending quotes, and the break-even quote-change curve.
The controls use a positive CAD principal and starting quote, foreign asset
returns from −50% to +50%, and CAD-per-FCU quote changes from −50% to +50%.
The curve shows thresholds outside the quote-change control range explicitly,
including a +100% quote change after a −50% asset loss; no −100% division is
plotted. This is one common period, with no annualization or actual hedge.
The foreign-unit chart is labeled FCU, not CAD. Tests preserve quote inversion,
original USD examples, denominator direction and one occurrence of the original
URL. Local browser checks cover desktop/mobile rendering, input validation,
restoration and native chart-data tables.
