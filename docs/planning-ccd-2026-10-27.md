# Child care expense deduction guide (2026-10-27)

Route: `/research/child-care-expense-deduction-line-21400-lower-income-spouse-ccb-increase` · model `ccdDeduction`
(`src/planning-ccd-models.js`, `src/planning-ccd-guides.js`, `tests/planning-ccd.test.mjs`). Reuses
`childcareSource` (Statistics Canada, 2025 child care expenses) from `planning-childcare-data.js`.

## Sources (reviewed 2026-10-27, read online)
- CRA Income Tax Folio S1-F3-C1 (effective 2024-12-09): ¶1.38.1 annual amounts CAD 8,000 (under 7 at year end),
  5,000 (7–16 or older with infirmity), 11,000 (DTC); ¶1.40–1.41 two-thirds of earned income and its definition;
  ¶1.21 periodic amount = 1/40 of the annual amount.
- CRA line 21400 pages (page details 2026-01-20): lower-net-income person must claim; listed exceptions; no carry-forward;
  Form T778 parts A–D.
- CRA "How we calculate your CCB" (page details 2026-10-22): July 2026–June 2027, CAD 8,157 / 6,883; thresholds
  38,237 / 82,847; rates 7/13.5/19/23% and 3,123/6,022/8,476/10,260 + 3.2/5.7/8/9.5%. Bases equal r1 × band width (tested).
- Statistics Canada, The Daily 2025-10-21 (42-10-0053-01), already archived with hash in the childcare data module.

## Model
- Deduction = min(paid, 8,000 × under-7 + 5,000 × aged 7–16, 2/3 × earned income of the lower earner).
- Tax saved = editable rate × min(deduction, max(0, income − editable tax-free level)); default 19.55% (2025 federal
  14.5% + Ontario 5.05%), 16,129 (2025 federal BPA). Not a full tax calculation.
- CCB gain = CCB(AFNI − deduction) − CCB(AFNI), CCB children = under-6 count (≤ under-7) plus the rest as 6–17.
- Not modelled: DTC children, higher-earner weekly claims, single parents, provincial credits (Ontario CARE, Quebec),
  CDB, GST/HST credit, CWB.

## Verification
- `qa/ccd-next/check.py` (40-digit Decimal; `check.log`): default 12,000 / 2,346 / CCB 8,040.279 → +684 / 3,030 (25.25%);
  15k earner 10,000 / 0 / +1,181.716; family 50k +1,588.005; two under 6 16,000 / +912 / 4,040; two 7–16 10,000 / +570 / 1,955.
- Tests sweep limits and monotonic value. `npm test` 1,858 passed; Python unittest 135 OK; 173 Chinese units written
  directly, number/tag guard 0 rejections; `zh:refresh` missing 0.
- Local built-in browser at 375px (EN and ZH): 5 figures, 8 inputs, no NaN, no horizontal overflow; typing CAD 15,000
  earned income recalculated to 10,000 / 0 / 1,181.72 (matches the article table).

## Deployment (2026-10-27) — pending
Pushed d07778b2 to main (fast-forward from 47c913dc). `npx wrangler deploy` for the existing `tickerlantern-est` Worker
was refused by this unattended session's permission policy (production deploy), so the guide is in main but not live:
the live route returned 404 after the push. Next step: from this checkout at main, run `npx wrangler deploy` (keeps the
tickerlantern.com, www and est custom domains), then check EN/ZH 200, hub links, sitemap count and the
`planning-ccd-models.js` hash.
