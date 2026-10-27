# Canada training credit guide (2026-10-27)

Route: `/research/canada-training-credit-limit-refundable-tuition-half` · model `ctcClaim`
(`src/planning-ctc-claim-models.js`, `src/planning-ctc-claim-guides.js`, `tests/planning-ctc-claim.test.mjs`).

## Sources (reviewed 2026-10-27)
- CRA Canada training credit page (page details 2026-01-20, 2025 tax year).
- Income Tax Act s. 122.91 (current to 2026-09-30).
- CRA Schedule 11 for 2025 (5000-S11 e-text): line 5 credit to line 45350; line 6 = line 1 − line 5.
- CRA indexation page (2026-03-12): CTC working income CAD 12,058 / net income CAD 177,882 (2026);
  CAD 11,821 / CAD 173,205 (2025). CRA current-year rates (2026-06-25): 14% lowest rate; 26% bracket ends CAD 181,440.
- CRA eligible tuition fees page (2026-05-15).
- CRA Individual Income Tax Return Statistics, Table 2, item 102, 2022–2024 tax years (2024 PDF SHA-256
  a9a1eed688f9cfd3667c65e83601419ccc801f5ed8182743c293eafcc304ab3b, same file already used by the METC guide).

## Model
- Limit for a year is nil unless 26 ≤ age < 66 at year-end; otherwise min(previous limit + 250 if the income
  test was met − previous claim, 5,000 − all earlier claims). The 2026 limit is entered from the notice of
  assessment and cannot exceed CAD 1,750 together with earlier claims.
- Each study year claims min(limit, 50% of eligible Canadian fees); the tuition amount is fees − credit and is
  valued at the 2026 federal rate of 14% (non-refundable, shown at full value).
- Start-year input is "years from 2026" (0–14) to avoid the site-wide number formatting of year ranges
  (existing calendar-year fields render help text such as "Range 2,019 to 2,023").
- Not modelled: provincial/territorial tuition amounts, ability to use the tuition credit, carry-forward and
  transfer, bankruptcy, death.

## Verification
- `qa/ctc-next/check.py` (40-digit Decimal): default CTC 2,000, tuition credit 560, total 2,560, without 840,
  limit left 250; one-year CAD 1,200 case 684; 2030 start 3,420; 2030 start with 3% fee growth fees 6,854.3487,
  relief 3,539.6088; age 65 case 2,130; start-year totals 2,000 → 3,000 by 2030.
- CRA band sums reconcile to 643,900 returns and CAD 249,406 thousand (±5 rounding).
