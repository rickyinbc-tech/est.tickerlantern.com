# Purchases, repayments and internal transfers

The English guide `/research/credit-card-purchases-repayments-savings-budget-double-counting` adds five charts and data tables. It extends the balance-sheet introduction with a complete twelve-month purchase cohort and a separate final settlement event.

Public FCAC budget, credit-card and financial-planning pages were reviewed on 25 October 2026. They supply general context, not transaction data or the assumed payment lag. All amounts are original hypothetical examples. The model makes no current rate, actual grace-period, statement-date, tax or credit-eligibility claim.

The card share applies to receipts remaining after direct chequing purchases; the savings-transfer share applies to the remaining economic surplus. These explicit nested denominators keep monthly consumption within receipts. Income arrives first, and opening card debt is zero. Each ordinary month pays the previous month's purchases. Position 13 settles the final bill without new income, consumption or transfers. No financing plug, negative bank asset, interest or acquired durable asset is introduced.

The consolidated net position includes both bank accounts less the card purchase liability, including an amount not yet due. It is not a complete household net-worth statement. Internal saving transfers and purchase-liability repayments have zero immediate effect on that consolidated amount. Monthly totals do not establish daily payment feasibility.

Validation:

- 822 full Node tests passed.
- Six focused tests independently check all monthly closed-form balances, nested denominator identities, total-consumption/payment reconciliation, settlement neutrality, saving-transfer invariance, double counting and supported limits.
- The build and four SEO checks passed.
- `tests/browser_card_ledger.py` passed at desktop and 390px mobile: five charts/tables, accessible descriptions, bounded SVG labels, real edited controls, invalid-input retention, reset and final-settlement balances.
- The mobile grouped-flow and net-position waterfall charts were visually inspected.

The full build also regenerates public chart-search thumbnails. Newly referenced SVG thumbnails are included with the generated search index so fresh checkouts do not require assets present only in one local deployment.
