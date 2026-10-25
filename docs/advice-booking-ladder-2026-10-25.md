# Advice fees, refundable bookings and renewing GIC income

Three English articles add twelve interactive charts and data tables. All
household amounts and contracts are hypothetical; only the advice-source bars
are survey observations. All three articles have six substantive sections and
more than 850 words of explanation.

## Sources reviewed on 25 October 2026

- [FCAC advice-source research](https://www.canada.ca/en/financial-consumer-agency/programs/research/financial-advice.html), released 21 November 2025: eight overall 2024 CFCS observations, overlapping source use, February–March collection and nearly 8,000 participants. Do not mix these with the page’s separate recent-advice/payment questions. No category sample count, confidence interval or causal benefit is constructed.
- [FCAC advisor selection](https://www.canada.ca/en/financial-consumer-agency/services/savings-investments/choose-financial-advisor.html): questions about services, compensation, cost and the working relationship. The selected fee schedules do not price equivalent work or imply advice quality. The asset-linked charge is a separate hypothetical charge, rather than an all-in MER.
- [CTA traveler tips](https://protection-passager-passenger.otc-cta.gc.ca/en/know-before-you-go/tips-for-travellers), modified 14 January 2026: checking ticket conditions and tariff restrictions. The booking model does not determine any actual contract or statutory supplier-cancellation right.
- [Travel.gc.ca insurance guidance](https://travel.gc.ca/travelling/documents/travel-insurance), modified 2 September 2026: cancellation versus interruption/medical coverage and policy terms. The model includes no insurance claim or coverage decision.
- [OSC investment risks](https://www.getsmarteraboutmoney.ca/learning-path/understanding-risk/why-does-risk-matter-in-investing/) and [GIC mechanics](https://www.getsmarteraboutmoney.ca/learning-path/gics/what-is-a-gic-and-how-does-it-work/): reinvestment risk, interest-payment options, staggered maturities and choices at maturity. No yield forecast is taken from these pages.
- [FCAC GIC disclosure](https://www.canada.ca/en/financial-consumer-agency/services/rights-responsibilities/rights-investing/rights-guaranteed-investment-certificates.html), dated 15 October 2025: general applicable federally regulated institution disclosure context. No cancellation deadline, automatic renewal instruction or deposit-insurance entitlement is determined.

Raw downloaded public HTML and QA captures stay in ignored `qa/`. The eight
percentages are checked directly against saved live HTML with:

```sh
python3 scripts/check-planning-advice-source.py qa/planning-advice-cost/fcac-advice-source.html
```

The source SHA-256 is
`04300f606f2e30e04a2897bda89e1267474aafbcc6c2d06735f7589cfcd8010d`.

## Independent calculation checks

The advice-fee tests reconcile upfront and recurring bills using closed-form
totals and cumulative cash. The default twenty-four-month totals are CAD 2,500,
CAD 4,800 and CAD 6,400; outside opening-cash requirements are CAD 2,500,
CAD 1,200 and CAD 2,800. Fee assets calculate a bill and are not spent or
reduced by that same outside-paid bill. Historical survey bars remain fixed.

The booking tests check conditional costs, the probability-weighted formula,
the premium/refund-base relationship and exact refund timing. Default cash
prices are CAD 1,800 and CAD 2,100, with net refunds of zero and CAD 2,000.
Weighted cost equality is at the assumed 15% cancellation chance. A refund
cannot exceed its price, a retained fee cannot create an extra bill, and
probability never moves the conditional cash dates. No-crossing and
equal-everywhere cases retain explicit labels.

The renewal tests independently sum fifteen original-rate rung-years and
thirty-five renewed-rate rung-years across the ten-year window. CAD 50,000
split equally at initial 4% and renewed 2% produces CAD 13,000 total interest.
The CAD 100,000 gross principal rolled is reuse of the same capital, rather
than income. CAD 20,000 of spending requires CAD 7,000 of outside opening cash.
Rising-rate, zero-capital and equal-rate scenarios are also checked.

All three models render finite figures and accessible tables at defaults and
supported field extremes, with 300/760-pixel render widths. Calendar fields
reject fractional inputs and cross-links resolve.

## Rendered checks and publication

An isolated agent-browser session exercised all three local pages at 1440 and
390 pixels. The check verified four charts and four data tables on each page,
document width within the phone viewport and all SVG text within its view box.
Changed inputs, an invalid fractional fee horizon and reset behavior were
checked. Desktop and phone screenshots were inspected, and no page errors were
reported. Screenshots remain local and uncommitted.

Before publishing, merge a pinned latest upstream revision and rebuild all
generated pages while retaining other articles. After deployment, compare new
public pages and model modules with the build; verify the homepage, library,
sitemap and previous pension/withdrawal/protection pages. Preserve a local
release receipt with the deployment version and check results. The hourly
authoring continuation remains active after this batch.
