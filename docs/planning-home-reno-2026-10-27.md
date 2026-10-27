# Home accessibility vs multigenerational renovation credit guide (2026-10-27)

Route: `/research/home-accessibility-multigenerational-renovation-tax-credit-limits-medical-double-claim` · model
`homeRenoCredit` (`src/planning-home-reno-models.js`, `src/planning-home-reno-guides.js`,
`src/planning-home-reno-data.js`, `tests/planning-home-reno.test.mjs`). Reuses `METC_2025` / `METC_2026` thresholds
from `planning-metc-claim-models.js`.

## Sources (reviewed 2026-10-27, read online)
- ITA s. 118.041 (consolidated to 2026-09-30): HATC = appropriate % × min(20,000, qualifying expenditures); (5) limits
  per qualifying individual and per dwelling; qualifying-expenditure para. (k), added by 2026, c. 3, s. 42, excludes
  amounts included in a s. 118.2 (METC) deduction; old (4) repealed.
- ITA s. 122.92: MHRTC deemed overpayment = appropriate % × min(50,000, expenditures); one qualifying renovation per
  qualifying individual for life; secondary unit definition; renovation-period taxation year.
- CRA line 31285 (page details 2026-07-24, tax year 2025): double claim with METC allowed for 2025; prior-year limits.
- CRA line 45355 pages (2026-01-20): 14.5% for 2025, max 7,250; MHRTC expenses cannot also be METC or HATC.
- CRA Budget 2025 select measures (2026-04-17): METC/HATC double claim ends for 2026 and later years.
- CRA current-year rates (2026-06-25): lowest federal rate 14% for 2026.
- CRA T1 final statistics Table 2 (all of Canada), 2018–2023 tax years, PDFs hashed in the data module:
  HATC returns 25,550 / 27,330 / 29,880 / 42,560 / 47,130 / 37,410; amounts (CAD thousands) 106,690 / 117,515 /
  124,472 / 184,108 / 278,800 / 229,297. MHRTC 2023: 6,040 returns, CAD 22,032 thousand of credit.

## Model
- Three buckets at the same rate r (14.5% 2025, 14% 2026): MHRTC (refundable, cap 50,000), HATC (cap 20,000),
  METC (above min(3% net, 2,834 / 2,890), incremental to other medical expenses). Non-refundable total ≤ tax entered.
- 2025: medical dollars outside the MHRTC count for both HATC and METC; 2026: each to one.
- Best split: grid search in CAD 500 steps plus exact cap/endpoint values; 2026 HATC/METC breakpoints for medical.
- Not modelled: several claimants, provincial credits, eligibility decisions, which items are medical expenses.

## Verification
- `qa/home-reno-next/check.py` (exact decimals, exhaustive CAD 100 grid): 8,400 / 9,526.50 / 8,000 / 3,458 /
  4,306.50 / 8,400 — matches the model and the article table.
- `npm test` 1,865 passed; Python `test_*.py` 135 OK; 195 Chinese units written directly, number/tag guard 0
  rejections; `zh:refresh` missing 0. Built EN/ZH pages: 6 figures, 8 tables, 8 inputs, no NaN/undefined/Infinity.
  Node boundary fuzz (every field at min and max, 17 valid cases): finite.
- Local browser preview was declined in this unattended run; browser checks remain for the live site.
- Known site-wide cosmetic: the input help text formats year ranges with a thousands separator ("2,025 to 2,026").
