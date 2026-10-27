# RRSP-to-FHSA transfer vs Home Buyers' Plan guide (2026-10-27)

Route: `/research/rrsp-to-fhsa-transfer-or-home-buyers-plan-room-deduction-repayment` · model `rrspFhsaTransfer`
(`src/planning-rrsp-fhsa-models.js`, `src/planning-rrsp-fhsa-guides.js`, `tests/planning-rrsp-fhsa.test.mjs`).
Does not duplicate `fhsaExcess` (over-contribution tax), `fhsaWithdrawal` (qualifying-withdrawal calendar) or
`hbpRepay` (HBP repayment ledger): this guide compares where RRSP savings go before a purchase.

## Sources (reviewed 2026-10-27, read online)
- CRA, Transfers into your FHSAs (page details 2026-08-17): RC720 direct transfer reduces unused participation room,
  must not exceed it, not deductible, does not restore RRSP deduction room; spousal RRSP restriction.
- CRA, Participation room (2026-09-17): 8,000 opening year; carryforward ≤ 8,000; 40,000 lifetime; contributions and
  RRSP transfers share room.
- CRA, The Home Buyers' Plan (2026-02-17): 60,000 limit; 15 years; relief to fifth year for first withdrawals
  2022–2025, stated as extended to 2026–2028 (2026 → first repayment 2031); HBP + FHSA for the same home.
- CRA, HBP repayments (2026-01-20): standard second-year start; only the 2022–2025 relief listed (discrepancy noted in
  the article; `rftRelief` switch); minimum = balance / years left; shortfall on line 12900; not deductible.
- CRA, FHSA Statistics 2024 tax year, Table 2 (2026-10-14): CSV in `qa/fhsa-excess-next/sources`, SHA-256
  6642cd7e474989ff5d024ef31505e16d2be025164452fc500de89ec3c9decd6c (checked). Withdrawals 146,400 holders,
  CAD 1,761,791,000.

## Model
- Start-of-year deposits, growth r to year end, purchase at the end of year 2025+N. Three strategies: cash only,
  cash then RRSP top-up, RRSP transfer first. Refund (tNow × cash contribution) lands in the TFSA the next January;
  the last refund counted without growth. HBP = min(target, 60,000, RRSP).
- Position = home cash + (1 − tRet) × RRSP left − tRet × HBP owed (HBP neutral by construction; tested).

## Verification
- `qa/rrsp-fhsa-next/check.py` (40-digit Decimal): default 41,731.78/43,728.51, 50,477.70/46,325.68,
  46,731.78/45,176.93; five other cases match model and article table.
- `npm test` 1,873 passed; Python 135 OK; 182 Chinese units written directly, number/tag guard 0 rejections;
  `zh:refresh` missing 0. EN/ZH pages: 6 figures, 8 tables, 10 inputs, no NaN/undefined/Infinity; 19 boundary
  input cases finite.
