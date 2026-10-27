# Eligible dependant amount (line 30400), 2026

One English article dated 26 October 2026 with six figures, chart data tables and six editable inputs, plus a Simplified Chinese edition:

- `eligible-dependant-amount-single-parent-line-30400` (`eligibleDependant`): the 2026 federal amount for an eligible dependant for a claimant with no spouse they live with or support. Line 30400 = claimant's basic personal amount (CAD 16,452 to CAD 181,440, falling to CAD 14,829) + CAD 2,740 for an infirm dependant − dependant's net income; line 30425 top-up for an infirm dependant 18+ (lesser of CAD 8,773 and CAD 29,374 − income, less line 30400); line 30500 CAD 2,740 for an infirm own child under 18. Credit 14%, limited to federal tax left after the claimant's basic, Canada employment, base CPP and EI credits. Figures: amount by dependant income (three profiles), waterfall to the credit used, credit by claimant income, heatmap by dependant type and claimant income, stacked bars of where the amount goes, CRA 2024 line 30400 claims per 1,000 returns. Distinct from the DTC transfer (line 31800/30450) and spousal transfer (line 32600) guides, which it cross-links.

## Sources (26 Oct 2026)

- CRA line 30400 page (modified 20 Jan 2026, 2025 year), line 30425 page, Canada caregiver credit page, Schedule 5 2025 (5000-S5; local copy in ignored `qa/dtc-next/sources`).
- Income Tax Folio S1-F4-C2 (updated 17 Apr 2025): ¶2.24, 2.40–2.46, 2.54–2.57 (shared custody of two or more children), 2.59.
- CRA indexation page (12 Mar 2026): BPA/ED 16,452–14,829; infirm ED 19,192; caregiver threshold 20,601; infirm child 2,740.
- ITA s. 118 (Justice Laws); T4127 Jan 2026.
- CRA Individual Income Tax Return Statistics 2024, Table 2, item 64: 1,002,220 returns, CAD 14,970,423 thousand (ranges sum to 1,002,240 because of rounding to tens); items 63 and 65 for comparison.

## Calculations

Defaults (claimant CAD 52,000 employment, child under 18 with no income): line 30400 16,452; credit 2,303.28; tax room 4,311.81; full use from CAD 36,643 of employment income. Teen earning 6,000 → 10,452 / 1,463.28. Infirm parent with 18,000 → 1,192 + 7,581 = 8,773 / 1,228.22; non-infirm parent with 15,000 → 1,452 / 203.28. Claimant at 20,000 → room 126.59, 2,176.69 lost; at 28,000 → 1,172.90. Lines 30400 + 30425 = max(line 30400, caregiver amount) for every income (asserted in tests). Cross-checked with 40-digit half-up Decimal arithmetic in `qa/eligible-dependant-next/check.py` (ignored).

## Checks

- `npm test`: 1,755 tests, 0 failures; `python3 -m unittest discover -s tests -p 'test_*.py'`: 135 OK. `npm run zh:refresh`: missing 0 units, numeric guard 0 of 43,108. 182 Chinese units written directly (no external service), merged after numguard and identical-markup checks.
- Built-in browser on a local static server: EN page 375 px and 1,024 px with no horizontal overflow, 6 SVG figures, 9 tables, no NaN/undefined; editing the inputs to an infirm parent with CAD 18,000 updated the metrics to 1,192 / 7,581 / 1,228.22 / 29,374. ZH page 375 px: no overflow, 6 figures.

## Release status

Base `a93c8a2b` (origin/main at start). `npx --yes wrangler deploy` was denied by the auto-mode permission classifier in this unattended run, so this guide and the earlier pushed-but-undeployed guides are not live until a deploy is run from this checkout.
