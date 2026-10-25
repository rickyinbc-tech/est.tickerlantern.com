# Progressive fee slices and whole-balance bands

The English guide `/research/progressive-fee-slices-whole-balance-bands-minimum-charge` adds four charts and tables. Investor.gov's adviser and Form ADV explanations and NASAA's project-group discussion of fee disclosure were reviewed on 25 October 2026. Only general agreement/formula context is used; no provider price, market-average fee, US legal duty or regulatory reasonableness threshold is transplanted into the hypothetical CAD example.

The fixed slice boundaries are CAD 100,000 and CAD 500,000. Progressive pricing caps each actual slice before applying its rate. Whole-balance pricing retains the lower band at the exact threshold and uses the next rate only above it. For both schedules, the minimum applies to the asset charge first, followed by the fixed annual fee once. The open hypothetical account has no zero-balance waiver. Effective ratios stay undefined at zero. Rates may be edited in any order.

Default annual charges are CAD 1,670 and CAD 1,370 at a constant CAD 250,000 base. Two CAD 100 threshold crossings compare explicit independent quotes, not a smoothed path. Fees are payable outside the modeled base; no fee deduction, portfolio projection, investment return, tax or service-equivalence judgment is calculated.

Validation:

- All 1,228 Node tests passed after the rendering fix.
- Eight focused tests cover allocation and sums, exact and fractional-dollar threshold boundaries, an independent CAD 100 block summation over the full million-dollar range, minimum order, zero denominators, zero charges, reversed rate rankings, exact threshold-crossing changes, matrix/comparison assumptions, supported bounds and four accessible figures/tables.
- The build and four SEO checks passed.
- `tests/browser_fee_slices.py` passed at desktop and 390px mobile: English, four figures/tables, SVG descriptions/text bounds, no overflow, live threshold repricing, positive charge with zero-base N/A, invalid input retention, reset and the itemized data table.
- Mobile threshold and ratio charts were visually inspected. Inspection caught adjacent zero/tiny-positive endpoint axis labels. Signed bars now prioritize zero by omitting a nonzero tick within 34 SVG units of it, including an endpoint; exact bar values remain visible. A rendering assertion and actual browser bounding-box comparison verify the repair. The fee matrix explicitly labels its fee/base ratio rather than inheriting a returns caption.
