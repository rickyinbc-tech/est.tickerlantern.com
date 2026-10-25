# ETF tracking: return measurement and visual upgrade research

Reviewed/retrieved **25 October 2026**. Upgrade `/research/etf-tracking-difference-costs`; do not create a duplicate. Public primary HTML education only. No actual funds, return histories, private portfolios, PDFs or archive sources are used. All numeric examples below are invented and independently checked.

## Existing route and scope boundary

`src/research-guides.js` already contains the static article with this route, including a return-gap definition, four invented monthly gaps and a separate invented attribution. A source/model search on `origin/main` at **836dd9e** found no existing interactive implementation of this route/scope.

The separate `etf-bid-ask-spread-order-commission-cash` guide in `src/planning-trading-equity-guides.js` already covers trade execution. Preserve/link it. This upgrade should concentrate on **matched benchmark versus fund NAV total return**, long-period compounding and the difference between average gap and variability. Its optional execution discussion can remain concise; do not duplicate the bid/ask/commission calculator.

## Verified primary-source support

**The return gap and its variability are different measures.** Vanguard Canada's index-tracking education defines tracking difference by subtracting index total return from ETF total return over a specified interval. It defines tracking error as annualized standard deviation of periodic tracking differences, while noting provider conventions vary. Its explanations identify fees, portfolio implementation, taxation and valuation among relevant factors; they do not establish that a fee alone equals the observed gap. [Vanguard Canada Index tracking](https://www.vanguard.ca/en/tools-and-resources/etf-fundamentals/management/index-tracking).

CFA Institute's accessible **2026 public refresher-reading summary** distinguishes holding-period performance deviations from the standard deviation of daily return differences and lists multiple sources of tracking deviation, including expenses, sampling, index changes, accounting, operations and tax requirements. Only that public HTML summary was read; the full reading requires sign-in and was not accessed. [CFA Institute, Exchange Traded Funds: Mechanics and Applications](https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/exchange-traded-funds-mechanics-applications).

**Avoid deducting embedded expenses twice.** OSC Investor Office's ETF Facts explanation says displayed performance returns are net of expenses, and its NAV explanation includes fees, expenses and taxes. Its MER section explains that these expenses are paid by the fund and reduce returns. Therefore subtracting the same expense again from a return already net of it double counts that cost. Verify the actual return definition before applying this principle to a real figure; the educational sample is not an actual fund return series. [OSC interactive ETF Facts sample, performance, NAV and MER sections](https://www.getsmarteraboutmoney.ca/tool-embeds/etf-facts/).

**Trading costs belong to a separate layer.** The SEC ETF bulletin distinguishes NAV from market prices and says brokerage commissions and additional trade costs may arise when buying/selling, in addition to fund expenses. US registration details are not Canadian rules; use only the general NAV/trading distinction here. [Investor.gov Updated ETF Bulletin, dated 23 February 2023](https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins-24).

Vanguard Canada likewise separates operating expenses from commissions, bid/ask spreads and changes in premiums or discounts. This supports a link to the existing execution guide rather than treating a fund's NAV/index gap as the investor's complete account return. [Vanguard Canada The costs of ETFs](https://www.vanguard.ca/en/tools-and-resources/etf-fundamentals/basics/costs-of-etfs).

No explicit publication/update dates were established for the Canadian Vanguard pages or embedded OSC sample. “2026” on the CFA reading is its stated reading edition, not a verified upload date. These mutable sources were read on the review date.

## Source terminology caution

Vanguard's index-tracking page gives a formal standard-deviation definition, but one later parenthesis calls a lower average return “negative tracking error.” Under the selected standard-deviation definition, tracking error cannot be negative; that wording should not be copied. A negative **tracking difference** is possible. Its illustrative two-thirds statement also must not become a promised probability interval in the new guide. No return distribution or prediction interval is estimated here. [Vanguard source](https://www.vanguard.ca/en/tools-and-resources/etf-fundamentals/management/index-tracking).

Keep the page's sign convention explicit even if another publisher reverses it. Use **fund minus benchmark**, reporting positive/negative differences in percentage points or basis points. In the wealth charts, a separate benchmark-minus-fund dollar difference has the opposite sign convention; label it accordingly.

## Match the two return records before calculating a gap

The proposed review standard is to record the exact fund/share class and benchmark version, identical beginning/end dates, reporting currency, hedge convention and distribution-reinvestment convention. Check price-return versus total-return data and gross/net dividend-tax conventions. Do not compare a NAV total return with an index excluding distributions and then label the whole gap a fee or management result. A change of benchmark, valuation time or return definition requires disclosure.

These are methodological requirements for a meaningful like-for-like comparison, not a claim that a named index uses any particular convention. No actual benchmark, withheld-tax rate, fund fee or securities-lending revenue is supplied in this task. A benchmark wealth line is a mathematical reference, not an investable account guaranteed to earn the assumed return.

## Original annual scenario: a constant percentage-point gap

Assume starting principal `P`, annual benchmark total return `b`, annual fund-minus-benchmark difference `d`, and `n` whole years. In the controls, a gap entered as **−0.28 percentage points** means `d = −0.0028`, not −0.28 and not a 0.28% reduction of the benchmark's return rate.

`fund annual NAV return f = b + d`;

`benchmark wealth[n] = P × (1+b)^n`;

`fund NAV wealth[n] = P × (1+b+d)^n`.

The toy fund return is already net at the NAV level. Do not deduct a separate MER or repeat the attribution components from it. No contributions, withdrawals, brokerage charges, conversion charges or investor tax are modeled, and distributions are assumed reflected/reinvested in both total returns. The identical annual return and gap are assumptions, not forecasts or a promise that an observed gap repeats.

For **CAD 100,000**, `b=8.00%`, `d=−0.28 pp`, hence `f=7.72%`:

| Years | Benchmark reference | Fund NAV reference | Benchmark minus fund |
| --- | ---: | ---: | ---: |
| 0 | 100,000.00 | 100,000.00 | 0.00 |
| 1 | 108,000.00 | 107,720.00 | 280.00 |
| 5 | 146,932.81 | 145,037.97 | 1,894.83 |
| 10 | 215,892.50 | 210,360.14 | 5,532.36 |
| 20 | 466,095.71 | 442,513.88 | 23,581.84 |

The year-ten comparison has three different units:

- Annual return difference: **−0.28 pp**, by assumption.
- Cumulative fund return minus cumulative benchmark return: approximately **−5.53236156 pp**, relative to the common starting principal.
- Fund ending wealth relative to benchmark ending wealth: approximately **−2.56255385%**.

The CAD 5,532.36 ending difference is not a separately deducted invoice or simply `10 × CAD 280`. It reflects two compounded paths. Nor is the cumulative difference an annual cost of 5.53%.

An independent multiplicative drag would be a different model: `(1+b)×(1−c)`. At `b=8%` and `c=0.28%`, that gives a 7.6976% annual return, **not 7.72%**. The upgrade should choose the additive annual percentage-point gap above and avoid calling it a fee percentage deducted from wealth.

For non-constant matched returns, compound each return record separately: `W_F=P×product(1+r_F[t])` and `W_B=P×product(1+r_B[t])`. Summing, averaging, or compounding periodic active differences alone does not generally produce the holding-period tracking difference. The relative wealth ratio is `product((1+r_F[t])/(1+r_B[t]))`, when denominators are positive; it is not generally `product(1+r_F[t]−r_B[t])`.

## Existing four-month illustration: arithmetic mean is not compounding

The existing invented gaps are correct as written:

| Month | Pattern A: fund minus index | Pattern B: fund minus index |
| --- | ---: | ---: |
| 1 | -0.02 pp | +0.10 pp |
| 2 | -0.02 pp | -0.14 pp |
| 3 | -0.02 pp | +0.10 pp |
| 4 | -0.02 pp | -0.14 pp |

Both arithmetic means equal **−0.02 pp per month**. Pattern A's four displayed values have zero dispersion. Pattern B ranges from −0.14 to +0.10 pp. A population standard deviation computed solely for those four invented values would be 0.12 pp for B; choosing sample rather than population standard deviation gives a different number. Prefer showing the pattern and mean without presenting an annualized tracking-error estimate from this tiny, authored set.

To demonstrate compounding independently, assume the **benchmark return is exactly zero in each of these four months**. Then fund monthly returns equal the gaps expressed as decimal returns. Pattern A's four-month factor is **0.9992002399680016**, or a −0.07997600319984% cumulative return. Pattern B's factor is **0.99919736112196**, or −0.080263887804% cumulatively. On CAD 100,000, A ends about **CAD 0.28788460** above B despite the equal arithmetic mean. This small difference is deliberate arithmetic, not material observed fund underperformance or evidence of an investable strategy.

Without the flat benchmark assumption, the active-return list alone is insufficient to calculate either fund's compounded wealth. Keep this fixed four-month panel separate from the adjustable constant-annual-return illustration. Do not repeat the four months to manufacture a long sample, infer a normal distribution, make a confidence claim or rank actual funds. Tracking error in a real analysis requires a documented measurement frequency, sufficiently informative history, standard-deviation convention and annualization method; none is estimated here.

## Existing attribution: exact invented percentage-point reconciliation

The original one-year waterfall sums correctly:

| Invented contribution | Percentage points | Basis points |
| --- | ---: | ---: |
| Operating expenses | -0.15 | -15 |
| Fund portfolio trading | -0.06 | -6 |
| Unrecovered taxes | -0.08 | -8 |
| Net lending revenue | +0.03 | +3 |
| Other implementation effects | -0.02 | -2 |
| **Total fund minus index** | **-0.28** | **-28** |

These are additive contributions **assigned by the author**, not measured attribution, amounts charged to a real investor, disclosed fee rates or a method to infer proprietary fund activity. They are not five cash deductions from the principal. The “other” amount is a chosen part of this example, not an independently verified residual explaining a real fund.

The components include a positive item and need not all be costs. Do not scale them into every future year as a verified explanation. If the annual gap control changes, keep this fixed waterfall explicitly labeled a **separate −0.28 pp example**; it no longer reconciles the selected gap. Alternatively, changing all contributions would require a different expressly invented scenario. It must never silently purport to explain whichever slider value is selected.

## Boundaries and chart recommendation

Use non-negative principal and a whole-year horizon including year zero. For an unlevered toy portfolio, benchmark and fund returns must not fall below −100%; reject incompatible return/gap combinations rather than clipping the fund return while retaining the requested gap. At exactly −100%, a positive-horizon wealth path becomes zero. If benchmark ending wealth is zero, a relative wealth ratio is unavailable. If principal is zero, dollar differences are zero but realized account-return ratios are unavailable. At year zero, no annualized realized comparison exists. A zero gap gives identical paths; a positive gap can put the fund above the index, so the benchmark-minus-fund difference can be negative. Do not always label it a positive shortfall.

Five suitable visual panels are:

1. Annual benchmark and net fund NAV wealth paths with matched conventions.
2. Ending benchmark-minus-fund dollar difference across selected horizons or annual gaps, using the same compound-factor model.
3. The two fixed four-month active-return patterns and their equal arithmetic means, without a claimed real tracking-error estimate.
4. The separate fixed attribution waterfall in **percentage points**, with its −0.28 pp total and invented status visible.
5. Optional cumulative-versus-annual comparison showing the different units, or a horizon/gap sensitivity grid. Negative/positive outcomes are scenarios, not forecasts.

Preserve the article's measurement checklist and links to currency translation, portfolio composition and the separate execution guide. No product selection, expected performance, personal suitability or statistical estimate follows from these charts.

## Captures and verification

Ignored `qa/etf-tracking/retrieval-manifest.json` contains four original successful public HTML captures with headers, dates and SHA-256 hashes. The anonymous SEC capture returned 403; its successfully read public web-tool text is preserved separately with its own hash. No sign-in, access-control bypass or PDF retrieval occurred.

`qa/etf-tracking/validate_research.py` verifies source hashes/text anchors, exact invented annual wealth factors, different gap units, monthly arithmetic means and compound factors, the attribution sum and domain edge cases. Results are saved in `qa/etf-tracking/validation-results.json`. No application/model/registry/test files, commits or deployment changes were made by this bounded research task.

## Implemented upgrade

The original URL and all six original sections are retained, with two explanatory
sections added. Four charts implement the matched wealth path, signed cumulative
return gap by horizon, the separate fixed monthly pattern and the separate fixed
attribution. The default principal is CAD10,000, one tenth of the derivation's
CAD100,000 case: year-ten fund wealth is CAD21,036.01381687 and the signed
fund-minus-benchmark amount is negative CAD553.23615586. This sign convention is
consistent across metrics and charts. Positive annual gaps and zero gaps remain
valid scenarios. Benchmark returns are bounded−20% to+20% and the signed annual
gap−2pp to+2pp, leaving every allowed unlevered fund growth factor positive.
The horizon is1–30whole years; the path includes its year-zero opening value.

The renderer uses explicit percentage-point labels and retains small0.02pp
values. The attribution's fractional signed scale uses its actual nonzero
range; a regression check prevents tiny components being compressed into a
one-unit minimum axis. All four charts include tables and were inspected at
390px and1440px, with valid edits, invalid-input retention and restore checked.
