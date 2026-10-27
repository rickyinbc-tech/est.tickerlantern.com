# RRSP over-contribution guide (2026-10-27)

Route: `/research/rrsp-over-contribution-2000-cushion-1-percent-month-end-tax-t1-ovp` · model `rrspExcess`
(`src/planning-rrsp-excess-models.js`, `src/planning-rrsp-excess-guides.js`, `tests/planning-rrsp-excess.test.mjs`).

## Sources (reviewed 2026-10-27)
- Income Tax Act s. 204.1(2.1) and (4), s. 204.2(1.1) and (1.2) (current to 2026-09-30): tax = 1% of the cumulative
  excess at the END of each month; cumulative excess = undeducted premiums − (A + B + R + C + D + E), C = CAD 2,000 if
  18 in a preceding year. Captures in `qa/rrsp-excess-next/sources/`.
- CRA excess contributions page (2026-09-17), T1-OVP determination page (2026-01-29; default months: first 60 days →
  January, rest → March, withdrawals → December), T1-OVP and RC2503 form pages (2025-07-30), T4040 Rev. 25, limits
  page (2025-12-01: RRSP limit CAD 33,810 for 2026, CAD 35,390 for 2027). canada.ca blocked curl from this machine,
  so these were read through a fetch tool and not hashed.
- Statistics Canada Table 11-10-0044-01 (released 2025-04-01; latest year 2023). ZIP SHA-256 7f98df0083d2fc3a3da8c61898c1101ce370c1b672893775b0e5fca7b1513c68, CSV SHA-256 cb644264ff1a266f7777e590255c26e562a316535ce4352517f43c7e20c55612.

## Model
- Monthly ledger January 2026 to December 2027: carried-in undeducted amount, monthly contribution, one lump sum,
  one withdrawal, new 2027 room. Month-end excess = max(0, undeducted − room − cushion); tax 1% of each month-end.
- The 2026 deduction claim cancels out of the 2027 test (it lowers undeducted premiums and room equally).
- CRA default-month variant moves deposits earlier and withdrawals later, so it never lowers the tax (tested).
- Not modelled: D and E, PA/PAR computation, growth, several withdrawals, HBP/LLP, transfers, penalties, interest;
  a person turning 18 during 2026 is not separated from the yes/no input.

## Verification
- `qa/rrsp-excess-next/check.py` (40-digit Decimal): default CAD 30; no withdrawal CAD 150 + CAD 50; withdrawn in
  August nil; CRA default months CAD 450; no cushion CAD 280; CAD 3,000 carried in CAD 360.
- `npm test` 1,814 passed; Python unittest 135 OK; `npm run zh:refresh` missing 0, numeric guard kept English for
  0 of 44,594 units; 142 Chinese units written directly and merged after number and tag checks.
- Built EN and ZH pages: 4 figures, 6 tables, 10 inputs, no NaN/undefined; homepage, research index, Chinese homepage,
  search index and sitemap (726 URLs) entries present.
