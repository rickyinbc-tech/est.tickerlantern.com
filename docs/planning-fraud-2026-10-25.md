# Reported fraud categories: counts, losses and derived ratios

The English guide `/research/canada-fraud-reports-victims-losses-statistical-planning` adds three source-backed charts and an integer display control. The control selects a prefix of the CAFC top-ten dollar-loss ranking; it never changes observations. All charts share the selected category set. The derived-ratio chart has a deliberately different sort order.

The governing public CAFC page covers calendar 2025, was issued and modified on 25 February 2026, and was retrieved on 25 October 2026. `scripts/extract-planning-fraud-source.py` parses the original HTML, checks the two table structures and ordered category identities, preserves ten dollar-loss rows and three N/A loss entries, and records source precision, dates and SHA-256. Original downloaded HTML remains ignored in `qa/`.

Reports, listed victims and dollar losses retain separate definitions. No unique-person count across categories, exposure denominator, household incidence probability or typical-loss claim is inferred. Loss-per-listed-victim ratios use rounded category losses and are rounded to CAD 100. They are not medians. The all-category headline remains “more than” rather than becoming an exact denominator. Unavailable source losses remain null; they are never converted to zero.

The Competition Bureau's March release supplies underreporting/reporting context, but its narrative category ranking differs from the CAFC dollar-loss table. The CAFC table controls every chart; the two rankings are not blended. No underreporting multiplier is used. CAFC investment and bank-investigator pages were separately reviewed for the brief verification-process context. No caller, investment offer, reimbursement right or recovery prospect is assessed.

Validation:

- The extractor checks ten loss-ranked rows, three N/A entries, dates and the source hash.
- 923 full Node tests passed after the larger currency-axis spacing refinement, before a final visible source-rounding label was added; the final build and nine focused mathematical/SEO checks passed afterward.
- Five focused tests verify source grain, source immutability, stable selection, independent ratio rounding, category order and integer-control boundaries.
- `tests/browser_fraud.py` passed at desktop and 390px mobile, checking three figures/tables, accessible descriptions, SVG text bounds, the ten-row view, fixed lower-bound headline, fractional rejection, retained valid results and reset.
- Mobile reported-loss and derived-ratio charts were visually inspected. The reported-loss chart requests additional right-axis padding for long million-dollar labels; existing bar charts retain their previous default padding.
