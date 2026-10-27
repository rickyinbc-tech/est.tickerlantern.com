# Transferring a spouse's unused amounts on Schedule 2 (line 32600)

English article dated 26 October 2026 with six figures, chart data tables and ten editable inputs, plus a Simplified Chinese edition:

- `spouse-unused-credits-transfer-schedule-2-age-pension-disability` (`spouseTransfer`): the 2026 federal transfer of a spouse's or common-law partner's unused age, pension income, disability and current-year tuition amounts (Schedule 2, line 32600), beside the line 30300 spouse amount; the claimant's tax capacity; CRA 2024 line 32600 statistics. Distinct from the pension income splitting guide (T1032 election), the disability credit transfer guide (line 31800, non-spouse relatives) and the tuition credit capacity guide, which it cross-links.

## Sources (reviewed 26 Oct 2026)

- CRA line 32600 page (modified 31 Aug 2026): eligible lines 30100, 30500, 31400, 31600, 32300; year-end spouse; 90-day separation exclusion; no carried-forward tuition.
- CRA Schedule 2 2025 (5000-S2), Schedule 11 2025 (5000-S11), T1 2025 (5000-R): saved under ignored `qa/spouse-transfer-next/sources/` with SHA-256 (S2 `8f7d62c8…642f4`, S11 `3a4104e2…14f7cf`). Line 7 = taxable income, or line 76 ÷ lowest rate above the first bracket; line 11 = lines 30000 + 96 + 32300; line 13 = line 6 − line 12.
- CRA line 31400 (modified 20 Jan 2026): CAD 2,000 maximum; CPP/QPP/OAS not eligible; RRIF eligible from 65. CRA line 30300 (modified 20 Jan 2026).
- CRA 2026 indexation page (12 Mar 2026): BPA 16,452–14,829, age 9,208 from 46,432, disability 10,341, CEA 1,501, 58,523 first bracket top.
- CRA T1 final statistics 2024, Table 2 (data as of 30 Nov 2025): item 83 line 32600, 1,497,600 returns, CAD 10,665,312 thousand; grouped into the 11 ranges used by the DTC guide (count sum exact; amount sum 1 thousand lower from rounding).

## Calculations (defaults)

Spouse 67, net 20,000, eligible pension 4,000: age 9,208 + pension 2,000 = 11,208; line 12 = 20,000 − 16,452 = 3,548; transfer 7,660; credit 1,072.40. Claimant 68, 85,000 (40,000 pension): federal tax 13,621.005, own age 3,422.80, room 10,558.54. Zero point 27,660; with DTC 18,001 transfer (2,520.14), zero at 38,001. Spouse with no income: 9,208 + spouse amount 16,452 → 3,592.40. Student spouse (12,000 earnings, 8,000 tuition): base 18,569.35, transfers 5,000, carries 3,000; claimant at 70,000 employment: spouse amount 4,452, credit 1,323.28, room 7,414.52. Both at 20,000: credit wasted. Claimant fully uses the default credit from 35,320.

Reproduced with 40-digit Python Decimal (`qa/spouse-transfer-next/check.py`, ignored) and asserted in `tests/planning-spouse-transfer.test.mjs`.

## Checks

- `npm test`: 1,745 passed, 0 failed; Python unittest 135 OK. `npm run zh:refresh`: 0 missing units; numeric guard 0 of 42,689. The 216 Chinese units were written directly and merged after numguard and identical-markup checks (`qa/spouse-transfer-next/merge_zh.py`).
- Built HTML (EN and zh): 6 figures, 9 tables, 10 inputs; homepage, research index, Chinese hub, both search indexes and sitemap entries present; `dist/research/planning-spouse-transfer-models.js` emitted.
- 3,000 random valid input sets: no exceptions, no non-finite or negative metrics, no NaN/undefined in rendered 360px charts.
- Local browser access (file:// in the built-in browser) was declined in this unattended run; no desktop/mobile visual pass is claimed.
