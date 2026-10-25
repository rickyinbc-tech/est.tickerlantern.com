# Promotional payoff conditions

The English guide `/research/zero-interest-deferred-interest-payoff-condition-deadline` adds four interactive charts/tables. FCAC's BNPL page, CFPB's deferred-interest explanation (last reviewed 22 January 2024), and CFPB's archived 8 June 2017 zero/deferred-interest comparison were reviewed on 25 October 2026. Their role is conceptual context. No jurisdiction's minimum-payment, lateness or allocation rule and no publisher numeric example is copied into the model.

The two invented contracts share the same purchase principal and on-time end-of-month payments. The conditional contract records monthly opening principal × annual simple quote / 12, rounded to cents each month, as an unposted noncompounding memo. The final scheduled payment precedes an independently entered extra principal repayment and then the deadline assessment. Any remaining principal triggers the entire memo once; full payoff waives it. Other contract conditions are assumed satisfied. Inputs for purchase, regular payment, period and extra-payment percentage are whole numbers, preserving exact cent arithmetic for the top-up.

The default is CAD 2,400, twelve CAD 180 payments and a 24% annual quote: principal remaining CAD 240, memo CAD 338.40 and conditional balance after assessment CAD 578.40. A 99% top-up leaves CAD 2.40 and posts the same memo; a 100% top-up clears principal and waives all memo interest. The memo is never a cash debit during the promotion. The endpoint is debt owed, not an immediately demanded payment. No later interest, bank account, actual cash funding, fees or other purchases are modeled.

Validation:

- All 1,248 Node tests passed. Seven focused model tests and four SEO checks passed.
- Independent arithmetic-series and integer-cent calculations verify the memo, monthly timing/rounding, capped early payoff, noncompounding memo, principal conservation, exact and near-full payoff, zero purchase/rate, component totals, fixed earlier history and scenario-row assumptions.
- `tests/browser_promo_condition.py` passed at desktop and 390px mobile: English, four figures/tables, SVG descriptions and text bounds, no overflow, 99% remaining-principal assessment, 100% waiver, unchanged earlier charts, fractional-period rejection retaining results, reset and accessible component values.
- Mobile posted-balance and top-up charts were visually inspected. Full row names remain available in the data tables when drawing labels truncate.
