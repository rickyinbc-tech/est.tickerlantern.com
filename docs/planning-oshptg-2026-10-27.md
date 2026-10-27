# Ontario senior homeowners' property tax grant guide (2026-10-27)

Route: `/research/ontario-senior-homeowners-property-tax-grant-oeptc-step-5-income` · model `oshptgGrant`
(`src/planning-oshptg-models.js`, `src/planning-oshptg-guides.js`, `tests/planning-oshptg.test.mjs`). Reuses
`oeptcGross` and `otbParameters` from the trillium benefit module, so the senior OEPTC amounts stay in one place.

## Sources (reviewed 2026-10-27)
- Ontario.ca, Senior Homeowners' Property Tax Grant (updated 2026-01-02; local copy and SHA-256 in
  `qa/oshptg-next/sources/`): 64+, Ontario resident, owned and occupied principal residence on 31 December of the prior
  year; up to CAD 500; full to CAD 35,000 single / 45,000 couple, then −3.33% of the excess; nil at 50,000 / 60,000;
  one per couple; ON-BEN line 61120; paid 4–8 weeks after the notice of assessment.
- CRA, OSHPTG Questions and Answers (page details 2026-01-20; read online, canada.ca timed out from the shell):
  maximum = lesser of CAD 500 and eligible 2025 property tax; couple applicant rules; shares for co-owners, separation
  and moves; OEPTC affected only if its property tax component plus the grant exceeds the property tax paid; non-taxable.
- CRA 2026 OEPTC calculation sheets, single seniors and married/common-law seniors with no children (page details
  2026-07-30; copies in `qa/otb-next/sources/`): Step 5 for OSHPTG recipients.
- Statistics Canada 18-10-0005-01, annual CPI, Ontario all-items, 2010–2025 (released 2026-01-19; same archive hash as
  `planning-cpi-level-data.js`, 9b52900a…e8e0a). Observations; the restated CAD amounts are calculations.

## Model
- Grant = 0 at or above the cut-off, else max(0, min(500, P) − 0.0333 × max(0, I − threshold)).
- Senior OEPTC for a homeowner (occupancy cost = property tax): Step 4 = energy + property component − 2% over
  CAD 36,309 / 43,571. Step 5: C = max(0, max(0, Step 4 + grant − energy) − occupancy); OEPTC = Step 4 − C.
  Equivalent: with a grant, grant + OEPTC ≤ property tax + energy component.
- Extra-income bar uses an editable flat tax rate; OSTC, NOEC, age amount, GIS, OAS recovery not modelled.

## Verification
- `qa/oshptg-next/check.py` (40-digit Decimal, log in `check.log`): default 266.90 / 1,153.18 / 1,420.08; +5,000 →
  −266.50 (5.33%), kept 3,733.50; 30k/1,000 → Step 5 cut 217, total 1,290; couple 55k/4,800 → 167 / 1,158.42; Step 5
  boundary at 30k: cut 1.0 / 0.1 / 0 at tax 1,240 / 1,241 / 1,242; CPI 42.146%, CAD 710.73, 351.75, 49,751, 63,966.
- Tests sweep income 0–90,000 and tax 0–9,000 for both statuses: grant ≤ min(500, tax), OEPTC ≤ Step 4, Step 5 cap,
  totals never rise with income.
- `npm test` 1,851 passed; Python unittest 135 OK; `npm run zh:refresh` missing 0 after 197 Chinese units written
  directly and merged through the number and tag guard.
- Built-in browser could not open a local port in this unattended run (the usual 8764 belongs to another project's
  server and was left running); static checks only before deploy.

## Deployment (2026-10-27)
Pushed 1c9a2cef to main (fast-forward from concurrent 68d9e1c3) and deployed `tickerlantern-est` with
`npx wrangler deploy` (version 3a4eb4d3; tickerlantern.com, www and est custom domains kept). Live EN and ZH 200 with
5 figures and 5 inputs, no NaN; homepage, research index and Chinese homepage link the guide; live sitemap 744 = local;
live `planning-oshptg-models.js` and `planning-models.js` SHA-256 match dist. The same deploy put the concurrent
record-high and estate-account guides live (200). Live 375px check: no horizontal overflow; typing CAD 47,000 income
updated the grant to CAD 100.40 and the total to CAD 1,153.58, matching the article table. No physical-phone test.
