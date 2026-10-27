# Inflation over every window since 1914, and investing through a lower-earning spouse

Two English articles dated 27 October 2026, each with four figures, chart data tables and editable inputs, plus Simplified Chinese editions:

- `inflation-every-20-year-window-since-1914-purchasing-power-range` (`inflationWindows`, 7 inputs). Charts: (1) annual-average CPI inflation 1915–2025 with the user's assumption (official); (2) buying power left of CAD 1 at the end of every overlapping N-year window (derived from official CPI); (3) count of windows by average yearly inflation; (4) heatmap, share of past windows in which a constant return after the entered fee and yearly tax kept purchasing power, by return (0–8%) and window length (1–40 years). Themes: inflation and purchasing power, long-term balanced-fund investing, account vs investment tax treatment, paycheque saving vs an existing lump sum.
- `prescribed-rate-spousal-loan-or-tfsa-gift-fund-income-attribution` (`spouseLoan`, 8 inputs). Charts: (1) CRA prescribed rate by quarter 2021 Q4–2026 Q4 beside the 3-month T-bill yield for the first month of the preceding quarter (official); (2) household after-tax value at year N: own name (= gift outside a TFSA), whole amount lent, TFSA gift then loan, TFSA reference; (3) loan minus own name by year at 1/3/5/6% locked rates; (4) heatmap by spouse's marginal rate and prescribed rate. Themes: tax-efficient investing through funds and account wrappers, attribution, TFSA exception, 30 January interest rule, lump sum vs paycheque saving.

Topic selection: 362 guides in the library at start (342 planning slugs checked by grep plus the live sitemap). No existing guide covered rolling inflation windows back to 1914 (existing inflation guides use constant rates or post-1995 CPI) or attribution / prescribed-rate loans (only the spousal RRSP withdrawal calendar mentions attribution, and it does not model it). Other worktrees had no uncommitted work on these topics.

## Sources (reviewed 27 Oct 2026)

- Statistics Canada WDS `getDataFromVectorsAndLatestNPeriods`, vector 41690973 (table 18-10-0004-01, all-items CPI, 2002=100): 1,353 monthly values Jan 1914 (6.0) to Sep 2026 (170.0), 12 values in every year 1914–2025; SHA-256 dd3e814c…c148b440. Valet V41690973 starts in 1995 only (hash ae48c527…ce3c29e, same as earlier runs), so WDS was used. The Daily, CPI September 2026 (released 19 Oct 2026): 3.1% year over year; series 170.0 vs 164.9 = 3.09%.
- Bank of Canada inflation-control target page: adopted 1991, renewed Dec 2021 to end-2026, 2% midpoint of 1–3%.
- CRA prescribed interest rates, quarterly pages 2021 Q4 to 2026 Q4 (earlier quarter URLs return 404): 1,1,1,2,3,4,5,5,5,6,6,5,5,4,4,3,3,3,3,3,3%. 2026 Q4 page dated 2026-08-28. Income Tax Regulations s.4301 (current to 2026-09-30): base rate = mean 3-month T-bill auction yield in the first month of the preceding quarter, rounded up. Valet V122531 Jan 2021–Sep 2026, 69 values, SHA-256 aa007496…af8bf8f9. Rounding the monthly value up matches CRA in 19 of 21 quarters; 2024 Q2 (4.94 vs 6) and 2025 Q2 (2.89 vs 4) differ, disclosed in the chart note.
- Income Tax Act (current to 2026-09-30): s.74.1 (income/loss attribution to spouse), s.74.2 (capital gains), s.74.5(2) (loans for value: rate ≥ lesser of prescribed rate at the time and arm's-length rate; interest paid within 30 days after each year, every year), s.74.5(12)(c) (TFSA/FHSA exception absent excess), s.56(4.1) (flagged as not modelled). CRA line 22100 (dated 2026-01-20): interest on money borrowed to earn investment income deductible, not where only capital gains possible. CRA mutual funds tax page (2026-02-05) and What is a TFSA (2026-09-17), as recorded by earlier runs and re-cited.
- Raw downloads kept in session scratch only; nothing private used.

## Model and calculations

Windows: annual averages A(y) = sum/12; window s..s+N ratio A(s+N)/A(s), annualized ratio^(1/N)−1, buying power left 1/ratio. Kept share: (1+net)^N ≥ ratio, net = (r − fee)(1 − tax).
Spouse loan (annual): payout d·V reinvested (ACB +), taxed at m on (payout − interest); interest + tax paid by a grossed-up unit sale (gain on sale taxed at m/2); negative tax added back. Lender invests interest·(1 − mH) each year-end in a holding taxed at mH. End value = V − max(0, V − ACB)·m/2. Own name = gift outside TFSA (attribution). TFSA part grows at r untaxed. Break-even rate by bisection.

Independent check: Python Decimal (40 digits) from the raw WDS file, and a units × unit-price formulation of the fund holding, reproduced every default. Windows (20 years, from 1914, 2.5%, 4%): 92 windows; median 2.8171748509%; high 1971–1991 7.1279470095%; low 1920–1940 −1.7526592745%; above assumption 51/92; goal 81,930.82 / 198,164.41; kept 75%; 30-year kept 51/82 (62%); 10-year median 2.35%, worst 1972–1982 9.60%; 30-year median 3.07%, worst 1963–1993 5.72%. Yearly: high 17.96% (1917), low −12.11% (1921), 10 deflation years (last 1953), 1973–1982 all >7%, 2022 6.80%, 2025 2.07%. Spouse loan (100,000; 30,000 room; 3%; 6%; 2.5% payout; 48%/25%; 15 years): own 183,882.74; loan 192,056.05; TFSA+loan 206,335.98; diff 8,173.31; break-even 4.4057%; at 1% +19,801.75, 5% −3,455.13, 6% −9,269.35; payout 0% −1,277; payout 4% +12,644 (break-even 5.17%); return 3% −992; spouse 40% at 3% +2,660.

Two drafted claims were corrected before publishing after checking against the data: the yearly high/low (initially written as 1920/1932) and the September 2026 12-month change (initially computed from a wrong September 2025 level).

## Checks

- `npm test`: 1,835 tests, 0 failures (new `tests/planning-inflation-windows.test.mjs`, `tests/planning-spouse-loan.test.mjs`). Python unittest 135 OK. `npm run zh:refresh`: missing 0; numeric guard kept English for 0 of 45,000. 242 Chinese units written directly and merged after tag and number checks.
- Built HTML: EN and ZH pages each 4 figures and 4 tables (7 and 8 inputs); homepage, research index, Chinese home, search index and sitemap (736 URLs, 732 live before) entries present; both model modules emitted in `dist/research/` and imported by `planning-models.js`.
- 832 calculator cases (defaults, every field at min and max, 800 random) produced no NaN, Infinity or undefined.
- Local browser preview was declined by this unattended session; see the release section for live checks. No browser pass is claimed.
- Known cosmetic limit kept as elsewhere on the site: the year input's hint shows "Range 1,914 to 2,000" because the shared form formats ranges with thousands separators.
