# Buybacks, issuance and per-share arithmetic: upgrade research

Reviewed 2026-10-25. Upgrade `/research/buybacks-dilution-per-share-value` in `src/research-guides.js`; retain its URL and useful funding, disclosure and double-counting explanations. No actual company, security, tax rule, price target, PDF or private archive is used.

## Scope check and source-backed distinctions

At review, HEAD was `80c1ebc` and origin/main `05c7860`. All guide slug inventories were checked: 180 and 192 respectively. No duplicate interactive repurchase/issuance/per-share guide was found. Preserve links to the existing earnings-quality and portfolio-concentration routes.

- CFA Institute's public 2026 summary treats repurchases as a corporate payout mechanism and distinguishes the potential EPS effects of surplus-cash versus debt funding. It also distinguishes effects on book value per share. Use those concepts, without copying historical return figures or treating a change in EPS as evidence of a desirable repurchase price. Only public introduction/summary text was accessed. [CFA: Analysis of Dividends and Share Repurchases](https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/analysis-of-dividends-and-share-repurchases)
- IFRS Foundation's public IAS 33 summary explicitly identifies the weighted-average shares denominator, separate basic/diluted calculations and potentially dilutive instruments. A period-end outstanding count is not automatically a period's EPS denominator. This summary supports the distinction; no full standard was accessed. [IFRS Foundation: IAS 33 Earnings per Share](https://www.ifrs.org/issued-standards/list-of-standards/ias-33-earnings-per-share/)
- SEC's beginner guide supplies introductory statement, EPS and stock-option-footnote context. Its short EPS description is not a complete weighted-average/diluted-EPS method. The current canonical page displays January 12, 2014 and last review February 6, 2017; use these displayed dates if adding dates to citations. [SEC: Beginners' Guide to Financial Statements](https://www.sec.gov/about/reports-publications/beginners-guide-financial-statements)
- IFRS Foundation's public IFRS 2 summary treats share-based payment as a financial-reporting matter that can affect profit/loss and financial position, including employee awards. Actual compensation expense cannot be reconstructed from our issued-share count and assumed cash proceeds alone. Those inputs contain no award valuation, service period, vesting or settlement-accounting calculation. [IFRS Foundation: IFRS 2 Share-based Payment](https://www.ifrs.org/issued-standards/list-of-standards/ifrs-2-share-based-payment/)

Terminology limit: the public IAS 32 history expressly refers to guidance for reacquired own equity instruments/treasury shares. That does **not** establish a universal legal retirement, cancellation or reissuance rule. Use “repurchased shares removed from the modeled outstanding count”; if retaining “retired,” label retirement an explicit teaching assumption. For an actual issuer, inspect the issued/outstanding/treasury reconciliation and applicable jurisdiction. This task did not verify jurisdiction-specific corporate law or detailed treasury-stock accounting. [IFRS Foundation: IAS 32 public history](https://www.ifrs.org/issued-standards/list-of-standards/ias-32-financial-instruments-presentation/)

## Exact existing fixtures: keep the cases separate

All money totals and share counts below are in millions; prices and EPS are currency units per share.

**Original full-year EPS case:** opening shares 100; net income 500; repurchase spending 300 at 50 buys 6 shares; new fully issued shares 2; closing shares 96. All transactions occur at the start of the year and net income is unchanged. EPS goes from 500/100 =5 to 500/96 =5.208333333333, an increase of 4.166666666667%. Gross shares repurchased are 6% of opening shares; net reduction is 4%. These quantities are not the same percentage.

**Original separate borrowing-cost illustration:** 300 ×6% ×(1−25%) =13.5 assumed annual funding cost; net income 486.5; EPS 486.5/96 =5.067708333333, an increase of 1.354166666667% from 5. The 6% and 25% are fictional rate/offset assumptions, not a statement about tax deductibility or anyone's tax rate. Keep the case separate from an unchanged-income cash-funded illustration; it is not a tax calculator.

**Original separate value thought experiment:** assumed total equity value 1,000 includes 200 of excess cash; shares 100; initial assumed value 10 per share. Spending 200 at 8 buys 25 shares, leaving equity 800 and shares 75:10.666666666667 per share. Spending 200 at 12 buys 16.666666666667 shares, leaving 83.333333333333:9.60 per share. At 10, the neutral comparison is 800/80 =10. The assumed operating value does not change. “Whole-company value” should be tightened to **total assumed equity value**, avoiding confusion with enterprise value or operating value.

**Original growth-factor identity:** 1.06/0.98−1 =8.163265306122%. It uses comparable earnings/share denominators and is exact arithmetic, not a return prediction.

The price 50 in the EPS case and starting assumed value 10 in the value case belong to different examples. Do not silently combine them into one chart scenario.

## Coherent interactive extension and formula limits

Let E be independently assumed opening total equity value, S opening outstanding shares, C cash spent, P repurchase price, I newly outstanding shares and G independently assumed cash proceeds from issuance. These are original assumptions, not observed intrinsic value, book equity or a market forecast. Assume sufficient cash is separately available; E alone does not demonstrate liquidity. Transactions are immediate, fractional shares are allowed, and all other assets, liabilities, operating prospects and transaction costs are unchanged.

```text
repurchased shares R = C/P
ending outstanding shares S1 = S − R + I
ending assumed total equity value E1 = E − C + G
net cash movement = −C + G
assumed value per share before/after = E/S and E1/S1
snapshot earnings per ending share = unchanged NI/S1
```

Adding G to E assumes one-for-one cash value and no issuance costs or other consideration. Shares issued for zero modeled cash add no modeled value; the exercise does not estimate services received or compensation expense. Fully issued shares are distinct from unvested awards, options or other potential dilution. Do not call NI/S1 actual reported diluted EPS.

One coherent **new extension of the original EPS case** assigns E=5,000, including the 300 available for repurchase, while keeping S = 100, C 300, P 50, I 2, G 0 and NI 500. This additional E assumption was not in the original article. E1=4,700, S1=96, value per share 50→48.958333333333 (−2.083333333333%), while the full-year toy EPS rises 4.166666666667%. With no issuance, the repurchase at the initial assumed value 50 would leave that value per share unchanged. The contrast demonstrates the stated model arithmetic, not measured value destruction at an actual company.

An alternative is to base the interactive default on the original 1,000/100/200/8 value case, adding clearly labelled NI/issuance assumptions. Choose one coherent fixture and keep its units and assumptions consistent across the charts.

## Timing, boundaries and charts

If both share changes occur halfway through the original EPS year, weighted-average shares are 100×0.5 +96×0.5 =98 and period EPS is 500/98 =5.102040816327; the ending-share run-rate remains 5.208333333333. An end-of-year change has effectively no weight in that simplified year's denominator, so period EPS remains 5 despite closing shares 96. More generally, with separately assumed remaining-year fractions w_R and w_I, weighted shares are S−R w_R+I w_I. This is an invented simple timeline, with no splits, preference claims or complex instruments.

Enforce positive E/S/P, nonnegative C/I/G, positive remaining shares, and a positive weighted denominator. With repurchase before issuance, require C/P <S; do not let later new shares justify repurchasing more opening shares than exist. Require C≤E for this nonnegative static-value exercise and separately assume cash availability. G must be 0 when I=0. Reject invalid scenarios rather than silently cap purchases. Purely numerical chart bounds can keep C≤40% of E and P between 0.5× and 2× initial assumed value, which retain at least 20% of opening shares before issuance. These are computational limits, not corporate-finance recommendations.

Zero spending and zero issuance must reproduce the start. Issuance can exceed repurchases, producing net dilution. Show EPS amounts for zero/negative income, but suppress a growth percentage whose zero/negative starting denominator would mislead. An EPS increase from a smaller denominator does not establish growth in total earnings or a higher future share price. Keep the original warning against adding a second buyback-return allowance to a forecast that already incorporates the share-count effect.

Five figures can show: the outstanding-share bridge; assumed equity-value/cash bridge; EPS versus independently assumed value per share; repurchase-price/issuance sensitivity; and a start/mid/end-year timing comparison. Label stocks versus flows, snapshot versus period measures, and every invented valuation assumption. No historical performance series or issuer attribution is needed.

## Verification artifacts

`qa/buyback-dilution/source-manifest.json` records URLs, UTC retrievals and hashes. Four public CFA/IFRS HTML captures succeeded. SEC curl returned 403; its separately saved successful public web-tool response is identified as tool text, not raw HTML. No full/paywalled standard or CFA reading was accessed.

`python3 qa/buyback-dilution/validate.py` passes 648 exact-rational grid cases plus the original fixtures, borrowing arithmetic, weighted timing, pure-repurchase value identity, zero/negative income handling and invalid-input rejection. Five evidence-file hashes are verified. `reviewed-extract.json` preserves exact fractions and decimals; the new 5,000 equity extension is explicitly labelled. Captures/checks are ignored under `qa/`. No application code, tests, registry, build, README, commit or deployment was changed.

## Implemented five-chart upgrade

The original URL and all six original sections are retained, with three added
sections on weighted timing, the new coherent value input and interpretation.
The five figures reconcile shares, show EPS by period weight, compare separate
EPS/value changes, reconcile assumed equity after the cash payout and test
price/issuance scenarios. The default is the new5,000equity extension above,
with all money totals in CAD millions and EPS/price in CAD per share. The
separate original1,000equity value case and borrowed-funding case remain prose
examples and are not merged into that extension.

The share-period input is a fraction of the period at the post-event count;
both changes share one event time. End-count EPS is explicitly a snapshot
proxy. Controls keep repurchase cash0–500, repurchase price10–100, opening
assumed equity1,000–10,000 and issued shares0–20, so repurchases cannot reach
all100opening shares and modeled equity remains positive. Cash availability
is an independent assumption, not inferred from the equity input. No actual
award expense, reporting-standard implementation, tax treatment or stock-price
return is calculated.

The original prose registry is now empty after migration of its last route.
The build hides its empty section and jump link; it retains the registry for
future prose articles and preserves every published canonical route.
