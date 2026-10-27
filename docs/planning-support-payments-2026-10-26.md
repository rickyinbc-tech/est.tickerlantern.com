# Spousal and child support and tax (lines 21999/22000, 12799/12800), 2026

One English article dated 26 October 2026 with six figures, chart data tables and nine editable inputs, plus a Simplified Chinese edition:

- `spousal-child-support-tax-deductible-priority-rule-lines-22000-12800` (`supportPayments`): federal treatment of support under an order or written agreement made after April 1997. Child support is neither deductible nor taxable; spousal support stated separately is deducted on line 22000 and included on line 12800. Payments are allocated to child support arrears, then current child support, then spousal support (paragraph 60(b) priority rule). Federal tax on each side uses 2026 brackets with the basic personal amount, Canada employment amount and base CPP/EI credits (shared `taxRoom` from the METC model). Year-of-separation option compares the deduction with a line 30400 credit for a child with no income (CAD 16,452 × 14% = 2,303.28). Figures: tax saved/added by deductible amount, priority-rule stacked bars, where payments end up after tax, net-change heatmap by both incomes, separation-year crossover, CRA 2024 item 37 deductions per 1,000 returns. Cross-links the separation cash plan, eligible dependant and RRSP room guides.

## Sources (26 Oct 2026)

- CRA pages: lines 21999/22000, lines 12799/12800, support payments amount to claim or report (all modified 20 Jan 2026); line 30400 page.
- Income Tax Folio S1-F3-C3 (updated 16 May 2019): ¶3.7–3.9 (90 days), 3.13, 3.17–3.18, 3.31, 3.38–3.46, 3.50–3.61 (20% limit), 3.65; claims re-read from the live Folio on 26 Oct 2026.
- ITA ss. 56.1, 60, 60.1, 118(5), 118(5.1); T4040; CRA indexation page (12 Mar 2026); T4127 Jan 2026.
- CRA Individual Income Tax Return Statistics 2024, Table 2, item 37: 51,360 returns, CAD 1,123,949 thousand. All 19 range values re-extracted from the PDF (SHA-256 a9a1eed6…304ab3b, local copy in ignored `qa/support-payments-next`); grouped ranges sum to 51,390 / 1,123,951 because of rounding.

## Calculations

Defaults (payer CAD 110,000, recipient CAD 35,000, child 12,000 + spousal 18,000 owed and paid): deduction 18,000; payer saves 3,690 (20.5%); recipient pays 2,520 (14%); net 1,170; payer cost 26,310, recipient keeps 27,480; RRSP room ±3,240. Paid 24,000 → deduction 12,000, saving 2,460. Paid 10,000 → no deduction, 2,000 child support carried forward. Separation-year break-even 11,235 (2,303.28 / 0.205); at 8,000 spousal the credit (2,303.28) beats the deduction (1,640). Deduction = max(0, paid − child support owed) asserted across a sweep.

## Checks

- `npm test`: 1,764 tests, 0 failures; Python 135 OK. `npm run zh:refresh`: missing 0 units, numeric guard 0 of 43,547. 207 Chinese units written directly (no external service), merged after numguard and identical-markup checks.
- Built pages checked statically (EN and ZH: 6 figure SVGs plus icon, 9 tables, 9 inputs, no NaN/undefined, canonical URLs, hub/sitemap/search entries; dist model module loads and reproduces the defaults). The built-in browser preview server was declined in this unattended run, so no rendered desktop/mobile check was done.

## Release status

Base `fc6aefa9` (origin/main at start). Deployment status is recorded in `qa/editorial-continuation.json`.
