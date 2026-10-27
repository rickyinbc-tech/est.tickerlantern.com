# TFSA staging of a lump sum, and the tax cost of a crash exit

Two English articles dated 27 October 2026, each with four figures, chart data tables and editable inputs, plus Simplified Chinese editions:

- `lump-sum-bigger-than-tfsa-room-move-in-each-january-non-registered-tax-drag` (`tfsaStageLump`, 9 inputs). Charts: (1) cumulative TFSA dollar limits to 2026 by the year room started (official CRA schedule); (2) stacked bars, TFSA vs non-registered balance by year; (3) stacked bars, tax on gains realized by January in-kind moves and distribution tax; (4) heatmap, after-tax gain from staging vs using only today's room by distributed share (0–4%) and years (5–30). Themes: tax-efficient investing through account wrappers, staging an existing lump sum vs paycheque saving (pay contributions use the same room), in-kind deemed disposition, superficial-loss caution.
- `sell-taxable-fund-before-feared-crash-capital-gains-tax-break-even-fall` (`exitTaxCrash`, 8 inputs). Charts: (1) yearly average 3-month T-bill yield, annual-average CPI inflation and real after-tax cash return 2006–2025 (official); (2) waterfall, fund value − capital gains tax + after-tax interest = cash to buy back; (3) line, selling minus staying after tax at year H by buy-back level (−50% to +30%), non-registered vs TFSA; (4) heatmap, fall needed by gain share (0–80%) and horizon (2–30 years, plus "never sell / same units"). Themes: market timing trade-offs, crash fear, tax on realization, value of deferral, TFSA contrast, deemed disposition at death.

Topic selection: about 351 guides checked. Accumulation-phase sequence risk was a first candidate and was dropped because `regular-contributions-return-sequence-risk` exists. Existing TFSA guides cover in-kind mechanics, January vs payday timing, asset location and limits, but not a multi-year migration of a lump sum; existing timing guides (exit/re-entry, crash warnings, best/worst months) do not price the capital gains tax of the exit. At start, other worktrees had only untracked files unrelated to these topics.

## Sources (reviewed 27 Oct 2026)

- CRA TFSA limits page (pspa, dated 2025-12-01): 2009–2026 limits, no 2027 limit. CRA Calculate your TFSA contribution room (2026-02-20). CRA Before you contribute to a TFSA (2026-02-20): in-kind = disposition at FMV, gain reportable, loss not claimable, contribution = FMV, qualified investments incl. mutual funds. CRA Opening a TFSA (2025-10-10): resident, 18+, SIN; newcomer room from year of residency. RC4466 now marked CANCELLED on canada.ca, so not cited.
- CRA Calculating and reporting capital gains (2026-02-05): 50% taxable in its example. CRA Tax treatment of mutual funds (2026-02-05). CRA Capital losses and deductions (2026-02-05): superficial loss 30 days, affiliated person; no TFSA mention on that page, so the article tells readers to confirm the TFSA case. CRA What is a TFSA (2026-09-17). CRA deceased capital gains page (2026-01-20): deemed sale just before death, spouse exception.
- Bank of Canada Valet V122531 (T-bill 3-month) Jan 2006–Sep 2026, 249 values, SHA-256 75a2f6ac…0565b; V41690973 CPI Jan 1995–Sep 2026, 381 values, SHA-256 ae48c527…ce3c29e. Both hashes match the files retrieved by earlier runs. Raw downloads kept in session scratch only.

## Model and calculations

Staging (annual): January year 1 fills today's room; rest non-registered with ACB = amount. From year 2 the room left after pay saving is filled in kind; disposition D = min(V, room/(1−qc)) with q = gain share, c = marginal/2; tax Dqc paid by selling extra units. Each year value grows by r; distributed d·V_start is reinvested (ACB +) and taxed at the distribution rate, paid by a grossed-up unit sale. End value = TFSA + V − (V−ACB)c.
Exit: tax = (V−B)c; cash grows w months at y(1−m); buy back at p; both grow (1+r)^(H−w). Compare after liquidation at H; break-even p solved piecewise (exact). Same-units fall = 1 − cash_at_buyback/V.

Independent check: a separate Python Decimal (40 digits) model tracking units and unit price instead of value/ACB reproduced every default. Staging defaults (120,000 lump, 45,000 room, 7,000/yr, 5% return, 2% distributed at 30%, 40% marginal, 20 years): staged 304,319.64; today-only 282,677.11; gap 21,642.52; move tax 3,656.54; distribution tax 3,872.10 vs 14,681.93; fully sheltered in year 16; whole-lump reference 318,395.72. Grid 5-yr max 1,052; 30-yr 31,953 (0%) to 75,556 (4%). 300,000 lump: non-registered still growing at year 20. Room 2009 start 109,000; 2020 start 45,500.
Exit defaults (100,000 value, 60,000 ACB, 40%, 2.4% cash, 12 months, −20% buy-back, 5%, 10 years): tax 8,000; cash 93,324.80; same-units fall 6.6752%; break-even fall by year 10 1.3048%; diff at −20% +23,201.87; at 0% −1,619.38; at +10% −14,030.01; TFSA break-even 2.4% higher. Grid never-sell column 80% gain 14.79%; 50% rate with ACB 20,000: tax 20,000, same-units fall 19.04%. Cash chart: real after-tax negative in 17 of 20 years; 2022 −5.08%; 2025 yield 2.5525%, real −0.53%.

## Checks

- `npm test`: 1,822 tests, 0 failures (new `tests/planning-tfsa-stage.test.mjs`, `tests/planning-exit-tax.test.mjs`). `npm run zh:refresh`: missing 0; numeric guard kept English for 0 of 44,830. 236 Chinese units written directly and merged after tag-count, number and CJK checks (`qa/tfsa-stage-exit-tax-2026-10-27/`, ignored).
- Built HTML: EN and ZH pages each 4 figures and 4 tables (9 and 8 inputs); homepage, research index, Chinese home, search index and sitemap entries present; both model modules emitted in `dist/research/` and imported by `planning-models.js`.
- Local browser preview was declined by the session's permission check; see release status for the public-URL checks.

## Release status

Pinned base `eee7bd12` (origin/main at start). Release details are recorded in the follow-up commit.
