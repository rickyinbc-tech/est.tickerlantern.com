# TFSA over-contribution guide (2026-10-27)

Route: `/research/tfsa-over-contribution-1-percent-monthly-tax-highest-excess-withdrawal` · model `tfsaExcess`
(`src/planning-tfsa-excess-models.js`, `src/planning-tfsa-excess-guides.js`, `tests/planning-tfsa-excess.test.mjs`).

## Sources (reviewed 2026-10-27)
- Income Tax Act s. 207.01(1) and s. 207.02 (current to 2026-09-30): excess TFSA amount A − B − C − D − E, qualifying
  portion = lesser of the withdrawal and the excess just before it; tax 1% of the highest excess in each month.
- CRA over-contribution page (2026-01-06), contribution room page (2026-02-20; 2026 limit CAD 7,000).
- CRA RC4466 Rev. 25 (page 2025-01-24, marked cancelled but online): used only for examples restating the Act
  (Gilles qualifying-portion example, RC243 due 30 June, waiver factors). SHA-256 of capture in `qa/tfsa-excess-next/sources/`.
- RC243 and RC243-SCH-A pages (Schedule A page 2026-03-18).
- CRA TFSA Statistics 2024 tax year (page 2026-04-30), Tables 1A and 3A CSV (SHA-256 recorded in the qa folder).
- The 2027 TFSA dollar limit was not announced on 2026-10-27; the model takes it as an input (default CAD 7,000).

## Model
- Monthly ledger January 2026 to December 2027; events per month in order: January deposit, withdrawal, re-deposit,
  removal of the full excess. Monthly tax = 1% × highest excess in the month (removal month still taxed).
- 1 January 2027 room = room on 1 January 2026 − 2026 deposits + all 2026 withdrawals + 2027 limit; a negative value is
  an excess carried into 2027.
- Not modelled: growth, advantage tax on income from an excess, several transactions, transfers, survivors,
  non-residents, penalties and interest.

## Verification
- `qa/tfsa-excess-next/check.py` (40-digit Decimal): default CAD 200 (Jul–Oct × CAD 50), removed in July CAD 50,
  left in CAD 300; misread CAD 17,000 deposit CAD 1,200 + CAD 360, removed in March CAD 300; Gilles pattern CAD 160,
  1 January room CAD 7,700.
- CRA age groups reconcile to the published totals within rounding (holders 19,322,840 vs 19,322,830).
- `npm test` 1,805 passed; Python unittest 135 OK; `npm run zh:refresh` missing 0, numeric guard kept English for
  0 of 44,344 units; 170 Chinese units written directly and merged after number and tag checks.
- Built EN and ZH pages: 4 figures, 6 tables, 8 inputs, no NaN/undefined; homepage, research index, Chinese homepage,
  search index and sitemap (722 URLs) entries present.

## Deployment
Pushed 797bf64f to main and deployed the existing `tickerlantern-est` Worker (version 498ba33d-4aca-4b8c-97de-9547388d2d74),
keeping tickerlantern.com, www and est custom domains. Live checks 2026-10-27: EN and ZH routes 200 (4 figures,
6 tables, 8 inputs), hub/home/zh home link present, live sitemap 722 = local, model module and `planning-models.js`
SHA-256 match `dist`, all eight official sources 200. The local preview server was declined in this unattended run,
so no visual desktop/mobile pass was made.
