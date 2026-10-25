# Rights-issue value and subscription cash

The English guide `/research/rights-issue-theoretical-value-subscription-cash-funding` adds four charts/tables. FINRA's 27 December 2017 educational corporate-action article and ASX's current glossary were reviewed on 25 October 2026 for general proportional-subscription and renounceability terminology. No actual security, offer, deadline, market quote, source numeric example or jurisdictional filing/settlement rule is reproduced.

The independently authored benchmark assumes unchanged existing-business value, fully subscribed new shares and subscription cash adding value dollar for dollar. Rights are assumed transferable at theoretical value without costs; lapse receives no compensation. Eligible holdings are proportional mathematical quantities, with no broker rounding rule. Actual prices and offers can differ. No tax, cost basis, fee, borrowing, asset liquidation, receipt lag or transaction is calculated.

Defaults: 100 old shares at CAD 10, one new per four old, 40% subscription discount, CAD 150 outside cash. Subscription price CAD 6; theoretical ex-rights price CAD 9.20; 25 new shares require CAD 150. Old shares reprice to CAD 920 and their entitlement is worth CAD 80. Initial/funded-exercise/theoretical-sale resources are CAD 1,150, while uncompensated lapse gives CAD 1,070. With only CAD 100 cash, the funding gap is CAD 50 and the exercise-resource row is omitted rather than creating financing or a negative cash asset.

Validation:

- All 1,547 Node tests passed. Seven focused model tests and four SEO checks passed.
- Independent normalized-capital and per-old-share formulas verify prices and entitlements across holding/quote/ratio/discount combinations. Other checks cover total-resource conservation, lapse loss, exact/insufficient funding, mathematical fractional new shares, zero discount/holding/quote, free-subscription boundary, scale identities, matrix assumptions, whole holdings/ratios and four finite accessible figures/tables.
- `tests/browser_rights_cash.py` passed at desktop and 390px mobile: English, SVG descriptions/text bounds, no overflow, unchanged entitlement with a funding gap, exercise omission/reappearance, fractional new entitlement, invalid-ratio retention, reset and complete resource totals.
- Mobile price-basis and entitlement-waterfall screenshots were visually inspected.
