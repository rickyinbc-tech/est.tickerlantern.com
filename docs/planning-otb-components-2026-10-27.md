# Ontario trillium benefit components and payment option

English article dated 27 October 2026, with four figures, chart data tables and eight editable inputs, plus a Simplified Chinese edition:

- `ontario-trillium-benefit-components-payment-option` (`otbComponents`): splits the 2026–27 Ontario trillium benefit (July 2026 to June 2027, based on the 2025 return) into the OEPTC, OSTC and NOEC; shows why rent counts at 20% and why the age-64 sheets matter; prices monthly payments against the single June 2027 payment. Distinct from the federal Groceries and Essentials Benefit, CWB, child benefit calendar and benefit phase-out guides, which it cross-links.

## Dated sources (reviewed 27 Oct 2026)

- CRA Province of Ontario page (page details 2026-07-30): OTB = OEPTC + NOEC + OSTC; payments on the 10th from July 2026; CAD 500 lump-sum threshold; single payment 10 June 2027 if chosen on the 2025 return; OSTC CAD 378 per adult/child, 4% over CAD 29,047 (single, no children) / CAD 36,309 (family); prior year CAD 371, 28,506 / 35,632.
- CRA 2026 OEPTC calculation sheets (index 2026-01-20; sheets 2026-07-30): occupancy cost = 20% rent + property tax; energy min(occ, 290); property tax min(occ, 73 + min(10% occ, 944)) under 64, min(occ, 617 + min(10% occ, 581)) at 64+; 2% reduction over 29,047 (single <64), 36,309 (family <64, single senior, single parent sole care), 43,571 (senior family); CAD 2 / CAD 10 rules.
- CRA 2026 NOEC calculation sheets (index 2026-01-20; sheets 2026-07-30): single CAD 189, 1% over 50,833; family CAD 290, 1% over 65,356; shared-care sheets split.
- Ontario.ca Ontario Trillium Benefit (updated 2026-04-27): maximums 1,307 / 1,488 / 290 / 25; NOEC 189 / 290; OSTC 378; northern districts. Ontario states 65+ for the senior maximum; CRA sheets use 64+ on 31 December 2025, which the model follows.
- CRA page bytes saved under ignored `qa/otb-next/sources/` with `SHA256SUMS`.

Shared custody, long-term care, reserve energy costs, student residences and the senior homeowners' grant reduction step are not modelled.

## Calculations (defaults)

Single renter under 64: rent 24,000, income 35,000. Occupancy 4,800; energy 290; property 553; OEPTC 723.94; OSTC 139.88; total 863.82 (71.985/month); interest given up by waiting at 2.5% = 9.85. Senior couple homeowner in the north: property tax 4,200, income 48,000 → OEPTC 1,238.42, OSTC 288.36, NOEC 290, total 1,816.78, interest 20.72. Northern family of four at 80,000 → NOEC only 143.56, July lump sum. Ceilings at rent 47,200 (<64) and 29,050 (64+).

Defaults and worked cases reproduced with 40-digit Python Decimal arithmetic (`qa/otb-next/check.py`, ignored) and asserted in `tests/planning-otb-components.test.mjs`, with CAD 2/10/500 boundaries and 300 mixed-input runs (finite, non-negative, within maximums).

## Checks

- `npm test`: 1,774 passed, 0 failed. Python unittest: 135 OK. `npm run zh:refresh`: 0 missing units; 122 Chinese units written directly and merged only after numguard and identical-markup checks.
- Built HTML: four figures, four tables and eight inputs on each English and Chinese page; homepage, research index, sitemap and search entries present; model module copied to `dist/research/`.
- Browser QA: file access in the in-app browser was declined in this unattended run, so no desktop/mobile visual pass is claimed.

## Release status

Base `59d675d2` (origin/main at start). `npx wrangler deploy` was blocked again by the unattended run's permission policy (production deploy). The guide, and every guide pushed since the last deployment, return 404 until an authorized `npx --yes wrangler deploy` is run from current `main`.
