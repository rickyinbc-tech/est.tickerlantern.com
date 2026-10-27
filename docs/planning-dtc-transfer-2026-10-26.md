# Disability tax credit transfer to a supporting person, 2026

One English article dated 26 October 2026 with six figures, chart data tables and eight editable inputs, plus a Simplified Chinese edition:

- `disability-tax-credit-transfer-supporting-person-caregiver-amount` (`dtcTransfer`): the 2026 federal disability amount (line 31600) transferred to a supporting relative (line 31800) using the Federal Worksheet chart, the under-18 supplement and its care-expense reduction, the Canada caregiver amount for an infirm dependant 18 or older (line 30450), splitting between supporters, credit lost when the supporter has too little federal tax, and CRA 2024 claim statistics. Distinct from the medical expense credit, Canada Disability Benefit, RDSP and caregiving cash-plan guides; cross-links the first two and the caregiving guide.

## Dated sources (reviewed 26 October 2026)

- CRA line 31800 page (modified 20 January 2026, written for 2025): relationships, support test, line 30400/30450 condition, spouse exclusion, splitting, child-support exceptions.
- CRA Federal Worksheet 5000-D1 (2025): line 31600 chart (base 10,138, supplement 5,914, care threshold 3,464, maximum 16,052) and line 31800 chart (lesser of disability amount and disability amount + dependant's line 98 − taxable income).
- CRA T1 return 5006-R (2025): line 98 = lines 85 + 96 + 97 (lines 30000–31400).
- CRA Schedule 5 (2025): line 30450 = 28,798 − dependant net income, maximum 8,601.
- CRA adjustment of personal income tax and benefit amounts (page details 12 March 2026): 2026 indexation 2.0%; disability 10,341; supplement 6,032; care threshold 3,533; caregiver 8,773 from 20,601; child caregiver 2,740.
- CRA T4127 122nd edition (January 2026): brackets, BPA, CEA 1,501, CPP 4.95% / 3,500, EI 1.63% (reused from the METC module).
- CRA attendant care and care in a facility page and RC4065 (2025): disability amount vs full-time care; attendant-care wages up to 10,000 (20,000 in year of death) alongside it.
- CRA Individual Income Tax Return Statistics, 2024 tax year, Table 2 (data as of 30 November 2025): item 78 1,197,810 returns / CAD 11,843,401 thousand; item 79 402,330 / 5,579,058; item 63 344,670 / 2,248,484. 19 ranges grouped into 11; grouped line 31800 counts and amounts sum exactly to CRA totals.
- PDF copies and SHA-256 under ignored `qa/dtc-next/sources/` (the Table 2 hash equals the copy used for the METC guide).

## Calculations (defaults)

Adult dependant, net 24,000 (employment 18,000); supporter net and employment 85,000; 100% share; caregiver claimed.

- Dependant line 98 = 16,452 + 1,501 + CPP 717.75 + EI 293.40 = 18,964.15; transfer = min(10,341, 10,341 + 18,964.15 − 24,000) = 5,305.15; kept 5,035.85, worth 705.02 = dependant's federal tax before DTC.
- Caregiver = 8,773 − (24,000 − 20,601) = 5,374. Supporter claim 10,679.15 × 14% = 1,495.08; supporter tax room 10,457.64. Family value 2,200.10.
- Dependant with no income: 19,114 → 2,675.96. Child under 18, no income: 16,373 → 2,292.22; with 5,000 care expenses 14,906 → 2,086.84. Supporter at 20,000: room 126.59, 1,368.49 lost. 50/50 split: 5,339.58 and 747.54 each. Transfer reaches zero at 29,305 (with 18,000 employment).
- 2025 cross-checks: 10,138 + 5,914 = 16,052 and 8,601 + 20,197 = 28,798 match the printed forms.

All reproduced with Python Decimal (`qa/dtc-next/check.py`, ignored) and asserted in `tests/planning-dtc-transfer.test.mjs`.

## Checks

- `npm test`: 1,736 tests, 0 failures; `python3 -m unittest discover -s tests`: 135 OK. `npm run zh:refresh`: 0 missing units, numeric guard 0 rejections. The 198 Chinese units were written directly and merged after numguard and identical-markup checks (`qa/dtc-next/merge_zh.py`).
- Built HTML: English and Chinese pages, research hub, Chinese hub and sitemap entries present; six figures, eight inputs; six SVG charts render at 360 px without NaN/undefined in tests.
- Browser QA: the local preview server start was declined in this unattended run, so no browser or mobile pass is claimed.

## Release status

Not live until a Wrangler deploy runs; the unattended run's permission policy blocked `wrangler deploy` (Production Deploy).
