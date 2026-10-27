# RRSP Lifelong Learning Plan guide (2026-10-27)

Route: `/research/rrsp-lifelong-learning-plan-withdrawal-repayment-start-shortfall` · model `llpRepay`
(`src/planning-llp-repay-models.js`, `src/planning-llp-repay-guides.js`, `tests/planning-llp-repay.test.mjs`).

## Sources (reviewed 2026-10-27)
- CRA LLP overview, repayments, cancellation and definitions pages (page details 2025-12-19);
  participation page (2026-09-16); withdrawals page (2026-09-17).
- Statistics Canada Table 37-10-0045-01, preliminary 2026/2027 tuition (released 2026-09-16), reused
  from the existing `src/planning-tuition-data.js` extract (retrieved 2026-10-25). No new download.

## Model
- Limits CAD 10,000 a calendar year and CAD 20,000 in total; two withdrawal years.
- First repayment year index = min(years of qualifying study + 1, 5), counting the first withdrawal year.
- Each year's requirement = balance at the start of the year / years left in the 10-year period.
  A shortfall is added to income (line 12900) and still reduces the balance by the full requirement.
- RRSP growth comparison: withdrawals at the start of their year, repayments at 31 December, constant
  assumed return; gap = value of withdrawals kept invested − value of repayments; lost growth = gap −
  unrepaid principal. Pre-tax RRSP dollars; education value and loan interest are not modelled.
- Not modelled: leaving the program, cancellation, programs under three consecutive months, death,
  emigration, age 71, overpayments in the calculator (the `llpRequiredSeries` helper reproduces CRA's
  overpayment example for tests).

## Verification
- CRA examples reproduced: Betty CAD 750, Josée CAD 1,000 / CAD 300 inclusion, Alexander CAD 325,
  Joseph and Sarah start years.
- Defaults checked with 40-digit Decimal (`qa/llp-next/check.py`): kept CAD 36,815.0547, repaid
  CAD 25,155.7851, lost growth CAD 11,659.2696; 70% case inclusion CAD 6,000, tax CAD 1,800, gap
  CAD 19,206.0051; one-year case lost growth CAD 5,380.6707.
