# Medical expense tax credit, 2026

One English article dated 26 October 2026 with six figures, chart data tables and eight editable inputs, plus a Simplified Chinese edition:

- `medical-expense-tax-credit-2026-threshold-which-spouse-claims-12-month-window` (`metcClaimant`): the 2026 federal medical expense tax credit (lines 33099/33199/33200) and refundable medical expense supplement (line 45200). Compares each spouse as claimant, including whether federal tax is left to absorb the non-refundable credit, a 12-month window against calendar-year claims, a separate dependant threshold, the supplement phase-out and CRA 2024 claim statistics. Distinct from the pension-splitting, annual benefit-cap and pay-rise phase-out guides, which it cross-links.

## Dated sources (reviewed 26 October 2026)

- CRA lines 33099–33199 and line 45200 pages (modified 20 January 2026, written for 2025): any 12-month period ending in the year; lesser of 3% of net income and CAD 2,834; dependant threshold uses the dependant's net income; RMES conditions (18+, resident, CAD 4,390 working income, family income below CAD 63,374).
- CRA adjustment of personal income tax and benefit amounts (modified 12 March 2026): 2026 indexation 2.0%; METC CAD 2,890; RMES CAD 1,534 / 4,478 / 33,960; BPA CAD 16,452.
- CRA Income Tax Folio S1-F1-C1 (page details 15 August 2025): ¶1.9 12/24-month periods, ¶1.11 either spouse, ¶1.16–1.17 reimbursements, ¶1.148–1.153 RMES 25% / 5%.
- CRA T4127 122nd edition (January 2026): brackets 14% to 58,523, 20.5%, 26%, 29%, 33%; BPA 16,452–14,829 between 181,440 and 258,482; CEA 1,501; CPP base 4.95%, exemption 3,500, base maximum 3,519.45 (YMPE 74,600 implied); EI 1.63%, maximum 1,123.07 (MIE 68,900 implied).
- Finance Canada report on the lowest-rate reduction: 14.5% for 2025, 14% from 2026; most credits at the lowest rate.
- CRA Individual Income Tax Return Statistics, 2024 tax year, Table 2 (data as of 30 November 2025): item 84 medical expenses 5,828,020 returns, CAD 20,334,070 thousand; item 3, 31,564,160 returns. PDF fetched through WebFetch (shell `curl` to canada.ca stalled); copy and SHA-256 `a9a1eed688f9cfd3667c65e83601419ccc801f5ed8182743c293eafcc304ab3b` kept under ignored `qa/metc-next/sources/`. The 19 CRA income ranges are grouped into 11; grouped sums agree with CRA totals within rounding.
- Finance Canada Report on Federal Tax Expenditures 2026, part 2 (page details 22 May 2026): METC CAD 2,220m (2024) … 2,540m (2027); RMES 230–245m. The HTML table does not mark which years are estimates and which projections, so the article says only that later years are projections.

## Calculations (defaults)

Couple; A net 70,000 (employment 70,000); B net 26,000 (employment 20,000); family expenses 4,500; dependant expenses 1,800 with dependant net income 9,000.

- A: threshold 2,100; allowable 2,400 + 1,530 = 3,930; credit 550.20; tax left 7,414.52.
- B: threshold 780; allowable 3,720 + 1,530 = 5,250; credit 735.00; tax left 966.59 (gross 3,640 less 14% × (16,452 + 1,501 + CPP 816.75 + EI 326) = 2,673.41). B is better by 184.80.
- Window: 50/50 split across two calendar years gives 420 + 205.80 = 625.80 against 735 in one window (difference 109.20 = 780 × 14%).
- Counter-cases: A 40,000 / B 12,000 (6,000 employment), 6,000 expenses → A 672 credit + 298 RMES = 970; B 0 usable credit (789.60 wasted) + 508 RMES. Single 18,000 net / 9,000 employment, 3,000 expenses → 615 RMES, 344.40 wasted. A 150,000 / B no income → A 225.40; B 630 wasted.
- Derived: fixed threshold above net income 96,333.33; RMES ends at family income 64,640 (2025 check: 63,374 matches CRA).

All cases reproduced with 40-digit Python Decimal (`qa/metc-next/check.py`, ignored) and asserted in `tests/planning-metc-claim.test.mjs`.

## Checks

- `npm test`: 1,732 tests, 0 failures; Python unittest OK. `npm run zh:refresh`: 0 missing units, numeric guard 0 rejections. The 236 Chinese units were written directly (no external translation service) and merged only after numguard agreement and identical-markup checks (`qa/metc-next/merge_zh.py`).
- Built HTML: English and Chinese pages, research hub, Chinese hub and sitemap entries present; six figures, eight inputs.
- Browser QA: the local preview server start was declined in this unattended run and the page is not live, so no browser or mobile pass is claimed.

## Release status

Not live. `wrangler deploy` was again blocked by the unattended run's permission policy (Production Deploy).
