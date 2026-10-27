# First-time home buyers' GST rebate guide (2026-10-27)

Route: `/research/first-time-home-buyers-gst-rebate-1-million-phase-out-upgrade-cost` · model `fthbGst`
(`src/planning-fthb-gst-models.js`, `src/planning-fthb-gst-guides.js`, `tests/planning-fthb-gst.test.mjs`).
Also in this batch: month ticks on the RRSP and TFSA over-contribution ledger charts reduced to [1, 7, 13, 19, 24] so
labels do not overlap at phone width (same fix as the FHSA guide).

## Sources (reviewed 2026-10-27)
- Excise Tax Act s. 254(2) and (2.1), Justice Laws, current to 2026-09-30, last amended 2026-06-18: FTHB amount up to
  CAD 1,000,000 = lesser of CAD 50,000 and tax paid, less the s. 254(2) rebate (paid in addition to it); CAD 1,000,000
  to 1,500,000 = that lesser amount × (1,500,000 − total consideration) ÷ 500,000; agreement after 2025-03-19 and
  before 2031; construction begun before 2031 and substantially completed before 2036; transfer before 2036.
- CRA RC4028 (25) GST/HST New Housing Rebate (first-time buyer conditions, one claimant, builder may pay or credit,
  pre-2025-03-20 agreement limitations, Ontario NHR maximum CAD 24,000); RC7190-WS (25) lines 1–4 and 12–14; GST190
  (25). PDFs and SHA-256 in `qa/fthb-next/sources/`. canada.ca timed out from the shell on 2026-10-27; the copies were
  downloaded earlier the same day.
- PBO RP-2526-001-S (2025-06-11) Table 2: projection, not observation; 71,711 rebates 2025–2030, average CAD 26,832,
  CAD 1.9 billion; assumed agreements after 2025-05-26.

## Model
- Federal 5% only (or federal part of HST). New housing rebate 36%, max CAD 6,300, phased out CAD 350,000–450,000.
  FTHB total = RC7190-WS line 14; shown as NHR plus (line 14 − NHR).
- Eligible when status = 1 and years since living in an owned home (self or spouse) ≥ 5.
- Mortgage payment: fixed rate compounded half-yearly; loan = price + GST payable − down payment.
- Not modelled: provincial HST part and provincial rebates, owner-built/co-op/leased-land types, agreement and
  construction dates, first-occupant test, closing costs, default insurance.

## Verification
- `qa/fthb-next/check.py` (40-digit Decimal): 1.1M → CAD 15,000; +50k → +7,500; payment 4,512.7292, +289.9239;
  +50k from 900k/950k/1.0M/1.45M/1.5M → 0/0/7,500/7,500/2,500; other buyer at 300k/400k/600k/1.1M/1.25M/1.4M.
- `npm test` 1,841 passed; Python unittest 135 OK; `npm run zh:refresh` missing 0; 175 + 3 Chinese units written directly,
  merged after number and tag checks. Rebuilt on main 4b06bb43 (concurrent inflation-window and spousal loan guides).

## Deployment (2026-10-27)
Pushed cc9931ba and c758b418 to main (fast-forward from 4b06bb43) and deployed the existing `tickerlantern-est` Worker
with `npx wrangler deploy` (versions 2103429d, then 31e46400; custom domains kept). Live EN and ZH routes 200 with 4
figures, 7 inputs and no NaN; homepage, research index and Chinese homepage link the guide; live sitemap 738 URLs;
live model modules (FTHB, RRSP, TFSA) SHA-256 matched dist. The same deploy put the pending inflation-window and spousal
loan guides live (EN/ZH 200). A live 375px check found overlapping CAD price ticks on the two line charts; shortened to
0/500k/1M/1.5M with the currency in the axis title (c758b418), rechecked with no overlaps and no horizontal scroll, and a
typed price of CAD 1.25 million updated the metrics to the table values. canada.ca could not be reached from the shell
in this run, so the CRA PDF links were not re-fetched live (local copies from earlier today are hashed).
