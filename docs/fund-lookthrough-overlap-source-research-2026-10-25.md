# Fund look-through: overlapping holdings and distinct exposure maps

Reviewed/retrieved **25 October 2026**. Public primary investor-education HTML only. No real securities, tickers, fund recommendations, performance assumptions, private portfolios, PDFs, CIRO materials or bank-product archives are used. This note supports an **upgrade of the existing route**, rather than another overlapping article.

## Existing-guide comparison and recommended scope

At `origin/main` **70a3175**, `src/research-guides.js` already contains `portfolio-concentration-overlap`, titled “Portfolio concentration: count exposures, not fund names.” The existing `/research/portfolio-concentration-overlap` route explains fund overlap, the weighted issuer formula, a 26.6% Company X example, a conditional shock, distinct exposure maps, incomplete holdings and dated evidence. A search confined to planning-guide filenames would miss it.

Recommended upgrade: preserve the route and useful explanations, add a complete fixed fictional Fund A/B/C holdings matrix and adjustable current balances, then reconcile five visual views of the same portfolio. Do not claim overlap itself is a new site topic. Existing rebalancing, fees, fund-distribution/return and employer-stock articles address different questions; this extension should focus on the composition of a specified portfolio at one assumed instant, without recommending a trade or calculating expected loss, volatility or suitability.

## Narrow facts verified in official education sources

**Several funds do not establish different underlying investments.** Investor.gov explains diversification across and within asset classes and warns that a narrowly focused mutual fund or ETF may not supply diversification. Even with several funds, investors should check their largest holdings to see whether the exposures differ. Thus fund count alone does not demonstrate the desired diversification. This is general SEC investor education, not a legal portfolio-concentration limit or a recommendation to hold a particular number of funds. [Investor.gov, “Asset Allocation and Diversification,” diversification section](https://www.investor.gov/introduction-investing/getting-started/asset-allocation). No explicit page publication/update date was established; read on the review date.

**Asset, industry and geography are distinct diversification views.** OSC Investor Office education describes spreading investments across and within asset classes, industries and international markets. It also explains that diversification cannot remove all investment risk and that diversified portfolios can lose value in extreme market conditions. A count or allocation graphic is therefore not proof against loss. [GetSmarterAboutMoney, “What diversification means for your investments,” updated 14 October 2026](https://www.getsmarteraboutmoney.ca/learning-path/understanding-risk/diversification/).

**Account type is different from the assets held.** The OSC education page explains that a TFSA can contain cash, GICs, bonds, stocks and mutual funds. This supports distinguishing an account wrapper from its contents; the TFSA label does not itself supply an asset mix. A portfolio split across accounts can still repeat the same investments. The latter is a direct inference from the distinction, not a tax or transfer recommendation. No contribution-room, withdrawal or tax modeling is needed here. [GetSmarterAboutMoney, “What is a TFSA and how does it work?”, updated 2 January 2026](https://www.getsmarteraboutmoney.ca/learning-path/tfsas/what-is-a-tfsa-and-how-does-it-work/).

**Holdings are dated observations with a defined denominator.** OSC's interactive Fund Facts explanation identifies its top-investment list as the ten largest investments **as of the displayed date**, with percentages of fund net asset value. It describes separate investment-mix breakdowns by asset class, geography or industry. The embedded `20XX` example is educational, not an actual dated fund dataset. Read the date for the specific holdings/mix field; a web retrieval date does not make those holdings current. [OSC interactive Fund Facts sample](https://www.getsmarteraboutmoney.ca/tool-embeds/fund-facts/).

The accompanying OSC article says Fund Facts gives an overview of top investments and overall mix, and cautions that a risk rating is not necessarily a measure of suitability; historic volatility cannot predict future behaviour. The toy weights below do not reproduce a Fund Facts risk rating or evaluate a household's capacity for loss. [GetSmarterAboutMoney, “Understanding Fund Facts,” updated 26 February 2025](https://www.getsmarteraboutmoney.ca/learning-path/mutual-funds-segregated-funds/understanding-fund-facts/).

OSC pages identify their provider as the OSC Investor Office and distinguish their educational information from official OSC policy. These sources support the explanation; they do not endorse the fictional allocation or this website.

## Original model definition

Everything from this section onward is **authored teaching arithmetic**, not sourced fund holdings. Funds are unlevered, long-only and fully allocated to the listed underlying positions. There is no cash residual, short position, derivative, nested fund, tax, fee, currency conversion or price change. Current fund balances and direct holdings share one hypothetical valuation instant and one CAD basis. Each fund's underlying percentages total exactly 100%.

For fund `f`, current balance `V[f]`, and issuer `i` with internal fraction `h[f,i]`:

`issuer exposure dollars[i] = direct holding dollars[i] + sum(V[f] × h[f,i])`.

`portfolio total T = sum(fund balances) + sum(direct holdings)`.

`issuer portfolio weight[i] = issuer exposure dollars[i] / T`, when `T > 0`.

These are market-value allocation shares within the selected toy portfolio, not the percentage of an issuer's outstanding securities owned, a legal ownership analysis, an investment return or a probability. The fund values are the input view; underlying exposures are the alternative explanation of those same dollars. **Do not add both views into the portfolio total.** A fund-dollar is allocated once among its underlying positions.

Use non-negative balances. If every balance is zero, show “No portfolio entered” or unavailable percentages; do not divide by zero or present an empty portfolio as diversified. A zero balance in one fund contributes no issuer dollars. Doubling every balance doubles all exposure dollars while leaving all percentages unchanged. Splitting an unchanged holding between two account labels leaves the combined exposures unchanged; this is an accounting comparison, not an instruction to transfer assets.

## Optional complete fictional matrix and reviewed example

These names identify invented positions only. Country tags are explicit toy classifications of the issuer, not a claim about exchange listing, trading currency, revenue sources, currency hedging or economic sensitivity. Bond Issuer D and Bond Issuer E are separate fictional issuers. All Company A entries refer to the same invented issuer, including the optional direct position.

| Underlying position | Asset class | Geography tag | Fund A | Fund B | Fund C |
| --- | --- | --- | ---: | ---: | ---: |
| Company A | Equity | US | 40% | 30% | 0% |
| Company B | Equity | US | 30% | 20% | 0% |
| Company C | Equity | Non-US | 20% | 10% | 40% |
| Bond Issuer D | Bond | Non-US | 10% | 0% | 40% |
| Bond Issuer E | Bond | US | 0% | 40% | 20% |
| **Total** | | | **100%** | **100%** | **100%** |

This is one possible reviewed fixture; integration may choose another fully disclosed fictional matrix. It deliberately has only five underlying issuers so the calculation can be inspected. It is not a suggested allocation or evidence that five issuers provide adequate diversification.

At Fund A CAD 40,000, Fund B CAD 30,000, Fund C CAD 20,000 and direct Company A CAD 10,000, the total is **CAD 100,000**:

| Issuer | From Fund A | From Fund B | From Fund C | Direct | Combined dollars | Portfolio share |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Company A | 16,000 | 9,000 | 0 | 10,000 | 35,000 | 35% |
| Company B | 12,000 | 6,000 | 0 | 0 | 18,000 | 18% |
| Company C | 8,000 | 3,000 | 8,000 | 0 | 19,000 | 19% |
| Bond Issuer D | 4,000 | 0 | 8,000 | 0 | 12,000 | 12% |
| Bond Issuer E | 0 | 12,000 | 4,000 | 0 | 16,000 | 16% |
| **Total** | **40,000** | **30,000** | **20,000** | **10,000** | **100,000** | **100%** |

Company A's direct 10% position is only one source of its combined **35%** allocation. Its contribution from funds is 25 percentage points, not a separate extra portfolio asset. Holding the other balances constant while adding direct Company A changes the denominator as well as that issuer's dollars; an editable balance is not automatically a funded purchase, sale or rebalancing instruction.

The same default dollars produce four alternative complete partitions, each totaling 100%:

| View | Categories and amounts |
| --- | --- |
| Issuer | A 35%; B 18%; C 19%; D 12%; E 16% |
| Geography | US 69%; Non-US 31% |
| Asset class | Equity 72%; Bonds 28% |
| Joint geography × asset class | US equity 53%; Non-US equity 19%; US bonds 16%; Non-US bonds 12% |

The table has **four** alternative views, not one combined allocation. For example, the 16% in US bonds is included both in US 69% and bonds 28%. Summing US + Non-US + bonds would double count bonds. The joint four-category view is a valid single partition under the stated tags. A bond allocation also has issuer concentration; “bond” is not a promise of unchanged value or repayment.

## Evidence required before using real holdings

This section is a proposed evidence standard for a future real analysis, not a claim that a particular disclosure must follow one universal reporting schedule. Record balance valuation dates, fund holdings dates, source URLs, retrieval dates, exact share classes, identifiers and the measure represented by each weight. Keep values in one currency and distinguish issuer identity from security identifiers. Explain any mismatched dates rather than implying an exact common-date snapshot.

A top-ten list can establish known overlap, but **cannot prove zero overlap among omitted positions**. This is a logical coverage limit of a partial list. Do not normalize the disclosed ten positions to 100% and call it the full fund, or fill missing holdings with zero. Keep the unobserved share labeled unknown. The teaching fixture avoids that issue by publishing every invented position.

Nested funds require another explicitly documented allocation step; listing both an intermediate fund and its underlying assets as extra wealth double counts. For leveraged, short or derivative exposures, the simple long-only market-value model is outside scope. No claim is made that market-value weight measures all economic exposures in those products. Treat opaque holdings, cash, liabilities and incomplete coverage explicitly rather than silently forcing a total.

Issuer concentration, geography and asset mix answer different questions. Neither a large count of line items nor the toy shares calculate volatility, correlations, liquidity, duration, default risk, expected return or suitability. Do not label the matrix “risk score,” invent a safe concentration threshold, promise diversification benefits of a chosen percentage, or infer that two different issuers move independently. No recommendation to buy, sell or select a target mix follows from the results.

## Five-chart upgrade recommendation

1. Input holding balances: Fund A, B, C and optional direct Company A, reconciling to the selected total.
2. Fixed underlying-composition matrix: the complete fictional percentages, clearly separated from adjustable current balances.
3. Combined issuer dollars/shares: merge the same issuer across all funds and the direct holding.
4. Joint geography/asset-class allocation: four disjoint categories totaling the portfolio, with geography-only and asset-only subtotals explained.
5. Company A contribution bridge: add its Fund A, Fund B, Fund C and direct contributions to the combined amount without adding full fund balances again.

Retain the existing route's explanation that separate exposure maps must not be added together and that data quality constrains conclusions. If its existing conditional-shock example remains, keep it visibly separate from these no-return composition charts; the new model need not calculate a shock or expected loss.

## Capture and validation record

`qa/fund-lookthrough/retrieval-manifest.json` records **four successful OSC HTML captures**, response headers, timestamps and SHA-256 hashes. A direct anonymous Investor.gov retrieval returned HTTP 403; that failed attempt remains recorded. Investor.gov's public text was successfully read through the web tool and its original response is separately preserved in `qa/fund-lookthrough/investor-gov-web-response.json`, with its own hash. This is text evidence, not a successful raw HTML download; no access control was bypassed.

`qa/fund-lookthrough/validate_research.py` verifies successful capture hashes, source-text anchors, all complete fund totals, the default issuer allocation and alternative partitions, account-split/scaling invariance and the zero-total case. Results are retained in `qa/fund-lookthrough/validation-results.json`. No application/model/registry/test files, commits or deployment were changed by this bounded task.
