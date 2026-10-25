# Credit utilization and reporting dates: Canadian source research

Reviewed live official Canadian HTML sources on **October 25, 2026**. Scope: general consumer education about balance-to-limit ratios and different account/report dates. No private reports, account access, scoring model, or product recommendations were used.

## Verified utilization facts

- FCAC defines credit utilization as credit used compared with the credit limit. It advises trying to use **less than 30% of the total credit limit**, keeping monthly utilization low even when paying the balance in full, and avoiding going over a limit. It explains that regularly using much of the available credit may lead lenders to view a borrower as higher risk. These are guidance and qualitative observations; the page does not publish a guaranteed score change at a numerical threshold. [FCAC, Improving your credit score, “Using your credit wisely”; page date July 1, 2026](https://www.canada.ca/en/financial-consumer-agency/services/credit-reports-score/improve-credit-score.html)
- FCAC states that closing an older account reduces available credit. It suggests considering keeping an account open where it has no annual fee, is easy to manage, and can be kept active with occasional use. This is conditional guidance, not an instruction to retain every account. [FCAC, Improving your credit score, “Improving your credit history”; July 1, 2026](https://www.canada.ca/en/financial-consumer-agency/services/credit-reports-score/improve-credit-score.html)
- Closing an account does not mean its entire history immediately disappears: FCAC says positive closed-account information can remain up to 10 years at Equifax and up to 20 years at TransUnion. Avoid the claim “closing a card immediately deletes its age/history”. [FCAC, How long information stays on your credit report, “Positive financial information”; reviewed October 25, 2026](https://www.canada.ca/en/financial-consumer-agency/services/credit-reports-score/information-credit-report.html)

## Individual card versus combined portfolio: arithmetic, not a score model

For an explicitly defined group of ordinary open credit cards with positive stated limits and nonnegative balances, a consumer illustration can calculate:

```text
individual utilization (%) = card balance / card limit × 100
combined utilization (%) = sum(card balances) / sum(card limits) × 100
```

This is the balance-to-limit definition applied to one card or to the selected total. The combined ratio is a **limit-weighted** average of the individual ratios; it is not the simple average of their percentages. This mathematical result does not establish how a bureau or lender scores either figure. Do not label this limited-card calculator as a complete reconstruction of all credit-report utilization rules.

Fictional example, all balances and limits measured at one chosen moment:

| Account | Balance | Limit | Individual ratio |
| --- | ---: | ---: | ---: |
| Card A | $900 | $1,000 | 90% |
| Card B | $0 | $9,000 | 0% |
| Combined selected cards | $900 | $10,000 | 9% |

The combined 9% coexists with Card A's 90%. Closing the zero-balance Card B in this illustration leaves the same $900 debt but only $1,000 of available limits, producing a 90% combined ratio. This is an arithmetic consequence, not a forecast of any score movement. Paying $500 toward Card A, with no other changes, leaves $400: 40% on A and 4% across both open cards.

The Canadian consumer sources reviewed establish utilization as relevant but do **not** disclose exact account-level versus aggregate scoring weights, treatment of every product type, or a universally optimal ratio. Leave installment loans, mortgages, closed accounts with balances, missing/no-preset limits, and credit balances outside the model unless separately researched. If a denominator is zero, display the ratio as undefined rather than dividing by zero.

## The different dates and events

| Event | Narrowly supported explanation | Official evidence |
| --- | --- | --- |
| Billing period closes / statement is issued | A statement describes a completed billing period. For federally regulated issuers, FCAC says statements are sent after the last day of the billing cycle, generally at least monthly, subject to exceptions. They include opening/closing balances, end-of-period limit/available credit, minimum payment and due date. Do not assume the mailing/issue day is always identical to the cycle's last day. | [FCAC, Getting a credit card: know your rights, “Information in your credit card statement”; October 15, 2025](https://www.canada.ca/en/financial-consumer-agency/services/rights-responsibilities/rights-credit-cards/right-to-information.html) |
| A payment is initiated and processed | Payment method and issuer processing affect when the issuer considers a payment paid. FCAC says processing times differ and directs consumers to their issuer for the timing of each method. A click in a banking app is not a universal promise of immediate crediting. | [FCAC, Paying off your credit card, “Making your payments on time”; October 15, 2025](https://www.canada.ca/en/financial-consumer-agency/services/credit-cards/pay-off-credit-card.html) |
| Payment is due | The statement provides the minimum due and its due date, plus the amount required by a date for the purchase grace period. These payment obligations are distinct from a bureau's data-update event. | [FCAC, Getting a credit card: know your rights, statement-information section](https://www.canada.ca/en/financial-consumer-agency/services/rights-responsibilities/rights-credit-cards/right-to-information.html) |
| Lender supplies account information | TransUnion Canada says lenders provide account updates to at least one of Canada's two bureaus, may not report to both, and report at different times during the month. Thus reports can differ in both coverage and timing. | [TransUnion Canada, What is a credit report?, “How does information get on my report and is it updated regularly?”; reviewed October 25, 2026](https://www.transunion.ca/consumer/what-is-a-credit-report) |
| Credit report is updated | Current FCAC guidance says credit bureaus update a report at least once per month. This does not specify a universal day of the month or promise that each payment or account is reflected immediately. | [FCAC, Credit report and score basics, “What's included on your credit report”; July 1, 2026](https://www.canada.ca/en/financial-consumer-agency/services/credit-reports-score/credit-report-score-basics.html) |
| A score is calculated or displayed | TransUnion's Canadian FAQ says lender-requested scores are calculated using the information available in the file at request time. That is distinct from a consumer app's refresh schedule. | [TransUnion Canada FAQ, “Once my credit report is updated, how long before my score is updated?”; reviewed October 25, 2026](https://www.transunion.ca/consumer/support/faqs) |

**Timing limitation:** none of the reviewed Canadian primary sources establishes that every issuer reports the statement balance, reports on its statement date, reports on the payment due date, or reports to both bureaus simultaneously. Do not state any of these as a universal rule. Do not promise that paying a specified number of days before a statement closes will produce a particular reported balance or score.

For a visual timeline, all chosen dates and any reporting lag must be labelled **illustrative assumptions**. A responsible sequence can show a statement snapshot, later payment processing, and a separately assumed credit-report update. It must not present that example's gap as an official service standard. A real user would need the issuer's reporting practice and the relevant credit-report account's update information to verify their own timing.

## What can responsibly be said about scores

- FCAC states that lenders and bureaus use different scoring formulas and do not publish their exact details; the consumer-visible score may differ from a lender's score. [FCAC, Credit report and score basics, “What affects your credit score”; July 1, 2026](https://www.canada.ca/en/financial-consumer-agency/services/credit-reports-score/credit-report-score-basics.html)
- TransUnion Canada says several factors affect scores, that different models may weigh factors differently, and that bureau scores may differ because file information and models differ. [TransUnion Canada, Credit Score, “Why you may have multiple credit scores” and “Why your score may differ”; reviewed October 25, 2026](https://www.transunion.ca/consumer/credit-score)
- Therefore, show utilization percentages and changes in dollars/limits, **not** predicted score points, scoring-factor weights or approval odds. A 30% guide line can be identified as FCAC guidance; it should not be called a guaranteed scoring cliff, safe zone, target everyone must hit exactly, or permission to carry interest-bearing debt.
- Separate making required payments on time from choosing a lower balance-to-limit ratio. FCAC directs consumers to pay on time, at least the minimum when full repayment is not possible. No chart optimization should suggest missing a due date while waiting for a reporting event. [FCAC, Improving your credit score, “Paying your bills on time”](https://www.canada.ca/en/financial-consumer-agency/services/credit-reports-score/improve-credit-score.html)

## Review cautions

The live FCAC credit-report basics page now says **at least once per month**. Do not import the older “30 to 90 days” wording found in secondary articles as though it were the current wording. The TransUnion pages reviewed did not display clear publication/update dates, so retain the review date rather than inventing one. Only official Canadian FCAC and TransUnion consumer HTML pages support the factual claims above; no U.S. bureau guidance or industry-statistics PDF methodology has been silently generalized to Canadian consumer scoring.
