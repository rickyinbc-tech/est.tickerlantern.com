# FHSA over-contribution guide (2026-10-27)

Route: `/research/fhsa-over-contribution-1-percent-highest-monthly-excess-designated-withdrawal` · model `fhsaExcess`
(`src/planning-fhsa-excess-models.js`, `src/planning-fhsa-excess-guides.js`, `tests/planning-fhsa-excess.test.mjs`).

## Sources (reviewed 2026-10-27)
- Income Tax Act s. 207.021 (1% of the HIGHEST excess FHSA amount in each month), s. 207.01(1) (excess FHSA amount
  A + B + C − D − E − F; designated amount capped at the excess when designated), s. 146.6(1) (annual limit, FHSA
  carryforward); Act current to 2026-09-30. Captures and SHA-256 in `qa/fhsa-excess-next/sources/`.
- CRA pages: excess FHSA amounts (page details 2026-02-02; examples Ridwan, Cole, Carolyn, Cristina, Bailey, Derek),
  participating in your FHSAs (2026-09-17; Karla, Julie, Tony), FHSA taxes payable (2026-02-02; RC728 by 30 June,
  waiver RC729, RC4288 for penalties/interest).
- CRA First Home Savings Account Statistics, 2024 tax year (page details 2026-10-14; processed to 2026-06-30).
  Table 1 CSV SHA-256 250cd93cbe4b58ab25f68a876af3ea0ae1356d24d87f5391f43b26f14c2a5b99; Table 2 CSV SHA-256
  6642cd7e474989ff5d024ef31505e16d2be025164452fc500de89ec3c9decd6c. Canada: 1,455,280 holders, 1,680,490 accounts,
  1,038,540 contributors, CAD 6,470,717 thousand.
- Statistics Canada, The Daily 2025-04-01 Table 7 (2023 FHSA contributors 484,320, median CAD 8,000).

## Model
- Monthly ledger January 2026 to December 2027 for one person across all FHSAs: entered 2026 room, monthly
  contribution, one lump sum or RRSP transfer, one withdrawal (designated or taxable) after that month's contributions,
  2027 monthly contribution. Highest excess in a month = excess after its contributions, before the withdrawal.
- 1 January 2027: excess carried in (A); new room = re-participation room + min(8,000 + carryforward (unused 2026 room,
  max 8,000), 40,000 − net lifetime contributions after designated amounts).
- Reproduces CRA examples: Carolyn CAD 40 and 2026 room 6,000; Karla 3,000; Julie 11,000; Tony 9,500 (re-participation
  1,500); Ridwan CAD 30; Cole CAD 30.
- Not modelled: growth, several withdrawals, designated transfers, qualifying withdrawals, maximum participation period,
  F element, withholding, penalties and interest. Contributions and RRSP transfers are treated alike.

## Verification
- `qa/fhsa-excess-next/check.py` (40-digit Decimal): default CAD 65; none CAD 105 + 15; September CAD 60; July CAD 80 + 5;
  taxable CAD 5,000 CAD 65; Carolyn CAD 40; Ridwan CAD 30.
- `npm test` 1,828 passed; Python unittest 135 OK; `npm run zh:refresh` missing 0, numeric guard kept English for 0 of
  45,000 units; 170 Chinese units written directly, merged after number and tag checks.
- Built EN and ZH pages: 4 figures, 7 tables, 10 inputs, no NaN/undefined; homepage, research index, Chinese homepage,
  search index and sitemap (732 URLs) entries present.
- Local browser preview was declined in this unattended run; checks were done on the live page instead.

## Deployment (2026-10-27)
Pushed 70d6e1c2 and 4cc9c206 to main (fast-forward from af529b21) and deployed the existing `tickerlantern-est` Worker
with `npx wrangler deploy` (version 4ad2c7a6; custom domains kept). Live EN and ZH routes 200 with 4 figures, 10 inputs
and no NaN; homepage, research index and Chinese homepage link the guide; live sitemap 732 URLs; live model module
SHA-256 matched dist. A live 375px check found overlapping month ticks on the ledger chart; reduced to five ticks
(4cc9c206) and rechecked. The same deploy also put the earlier pending RRSP over-contribution, TFSA staging and
crash-exit guides live (all EN/ZH routes 200).
