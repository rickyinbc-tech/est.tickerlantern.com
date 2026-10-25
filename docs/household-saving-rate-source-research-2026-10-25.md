# Canadian household saving rate: reviewed source evidence

Reviewed and retrieved **October 25, 2026**. Intended use: an English financial-planning guide explaining what Canada's aggregate household saving rate measures and why it does not establish an individual's appropriate savings target. The observations below are official published data, not estimates constructed for the guide.

## Controlling current source and vintage

- **Statistics Canada table 36-10-0112-01**, “Current and capital accounts - Households, Canada, quarterly”, formerly CANSIM 380-0072. Geography: Canada. Frequency: quarterly. Current table release date in retrieved HTML: **2026-08-28**. [Official table](https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=3610011201)
- Download obtained through the [official WDS CSV-download endpoint](https://www150.statcan.gc.ca/t1/wds/rest/getFullTableDownloadCSV/36100112/en), which returned [the complete official CSV ZIP](https://www150.statcan.gc.ca/n1/tbl/csv/36100112-eng.zip). Metadata identifies the cube as current and available publicly, with coverage from 1961-01-01 through 2026-04-01. The final reference date represents **2026 Q2**, not April-only data. [CSV and metadata ZIP](https://www150.statcan.gc.ca/n1/tbl/csv/36100112-eng.zip)
- The associated Daily release was published **August 28, 2026** and its page was modified August 31. It reports the latest household saving rate as **3.7% in Q2 2026**, states that Q1 estimates were revised, and schedules Q3 GDP income/expenditure data for November 30, 2026. [Official release, headline and Note to readers](https://www150.statcan.gc.ca/n1/daily-quotidien/260828/dq260828a-eng.htm)

These are the latest observations in the retrieved current cube. The table page's automatically updated footer says October 25; that footer is **not** the table's release date. Do not label these figures “October's saving rate”.

## Exact selected dimensions

The extract uses only `GEO=Canada`, `DGUID=2016A000011124`, and `Seasonal adjustment=Seasonally adjusted at annual rates`. It does not mix unadjusted observations. The source CSV has 25,152 data rows and these columns: `REF_DATE`, `GEO`, `DGUID`, `Seasonal adjustment`, `Estimates`, `UOM`, `UOM_ID`, `SCALAR_FACTOR`, `SCALAR_ID`, `VECTOR`, `COORDINATE`, `VALUE`, `STATUS`, `SYMBOL`, `TERMINATED`, `DECIMALS`. [Official machine-readable source](https://www150.statcan.gc.ca/n1/tbl/csv/36100112-eng.zip)

| Exact source estimate label | Vector | Coordinate | Unit / scalar | Decimal places |
| --- | --- | --- | --- | ---: |
| Household saving rate | v62305984 | 1.1.33 | Percent / units | 1 |
| Household disposable income | v62305981 | 1.1.30 | Dollars / millions | 0 |
| Less: household final consumption expenditure | v62305982 | 1.1.31 | Dollars / millions | 0 |
| Plus: change in pension entitlements | v105775422 | 1.1.48 | Dollars / millions | 0 |
| Equals: household net saving | v62305983 | 1.1.32 | Dollars / millions | 0 |

The saving-rate row has `UOM_ID=239`, `SCALAR_ID=0`; the dollar rows have `UOM_ID=81`, `SCALAR_ID=6`. These dimension values were verified against all selected source rows and the downloaded metadata.

## Reviewed 12-quarter row set

All dollar columns below are **millions of Canadian dollars, seasonally adjusted at annual rates**. They are not the literal cash dollars collected/spent during that quarter. The percentage column is the published saving/income ratio, not a yield and not a quarter-over-quarter growth rate. Source for every observation: [Statistics Canada 36-10-0112-01, complete CSV](https://www150.statcan.gc.ca/n1/tbl/csv/36100112-eng.zip).

| Quarter | CSV REF_DATE | Saving rate % | Disposable income | Consumption expenditure | Pension adjustment | Net saving |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| 2023 Q3 | 2023-07 | 3.4 | 1,620,528 | 1,609,692 | 43,548 | 54,384 |
| 2023 Q4 | 2023-10 | 3.5 | 1,641,912 | 1,628,576 | 43,576 | 56,912 |
| 2024 Q1 | 2024-01 | 3.5 | 1,658,352 | 1,646,216 | 45,556 | 57,692 |
| 2024 Q2 | 2024-04 | 5.0 | 1,702,296 | 1,667,484 | 50,548 | 85,360 |
| 2024 Q3 | 2024-07 | 5.9 | 1,748,196 | 1,694,808 | 49,872 | 103,260 |
| 2024 Q4 | 2024-10 | 5.5 | 1,765,468 | 1,715,372 | 47,152 | 97,248 |
| 2025 Q1 | 2025-01 | 5.3 | 1,776,756 | 1,731,684 | 48,244 | 93,316 |
| 2025 Q2 | 2025-04 | 4.3 | 1,775,844 | 1,754,424 | 54,468 | 75,888 |
| 2025 Q3 | 2025-07 | 4.4 | 1,790,264 | 1,765,256 | 53,980 | 78,988 |
| 2025 Q4 | 2025-10 | 3.7 | 1,801,452 | 1,793,576 | 59,344 | 67,220 |
| 2026 Q1 | 2026-01 | 3.3 | 1,821,552 | 1,813,436 | 52,760 | 60,876 |
| 2026 Q2 | 2026-04 | 3.7 | 1,860,216 | 1,844,124 | 51,828 | 67,920 |

Within this displayed window, the observed maximum is 5.9% and the latest is 3.7%, a decline of **2.2 percentage points**, not a 2.2% decline. The latest quarter increased **0.4 percentage points** from revised Q1. These comparisons are arithmetic derived from this reviewed row set, not causal explanations.

## Definitions and sector coverage

1. **Household disposable income** comprises employee compensation, net mixed income and net property income, plus current transfers received minus current transfers paid to other sectors. Payments include income taxes and social-security-related transfers; receipts include employment-insurance and social-security benefits. It is an accounting aggregate with a broader construction than an individual's deposited take-home pay. [Statistics Canada, Canadian/U.S. income reconciliation update, “Differences due to definition”](https://www150.statcan.gc.ca/n1/pub/13-605-x/2015013/article/14304-eng.htm)
2. **Household sector coverage** in Canada's accounts includes unincorporated businesses and excludes non-profit institutions serving households (NPISH). Do not silently substitute an OECD household-plus-NPISH measure or the U.S. personal-saving series. The definitional explanation is dated 2015; the current cube separately identifies transfers to/from NPISH and includes net mixed income. [Statistics Canada, “Differences due to institutional composition”](https://www150.statcan.gc.ca/n1/pub/13-605-x/2015013/article/14304-eng.htm); [Canadian institutional-sector classification](https://www.statcan.gc.ca/en/concepts/ccius/intro)
3. **Net saving** in the selected current-account rows equals disposable income **less final consumption expenditure plus the change in pension entitlements**. The pension adjustment must not be omitted when reproducing the published saving amount. The source metadata groups these measures under “Current accounts: Use of disposable income account”; the identity also reconciles exactly in all 12 reviewed quarters. [Current source table and metadata](https://www150.statcan.gc.ca/n1/tbl/csv/36100112-eng.zip); [Statistics Canada current-account classification hierarchy](https://www23.statcan.gc.ca/imdb/p3VD.pl?CLV=1&CPV=1&CST=01012019&CVD=1227434&D=1&Function=getVD&MLV=5&TVD=1227433&db=IMDB)
4. **Household net saving rate** is household net saving divided by household disposable income, multiplied by 100. It differs from an economy-wide national saving measure. [Statistics Canada, National saving study release, explicit distinction between the measures](https://www150.statcan.gc.ca/n1/daily-quotidien/140626/dq140626c-eng.htm)
5. **Seasonally adjusted** series remove estimated seasonal and other calendar effects and retain irregular movements. They can be revised even when raw observations have not changed, because new observations improve seasonal estimates. [Statistics Canada, Seasonal adjustment: Concepts and interpretation, 2026, sections 1.6–1.9](https://www150.statcan.gc.ca/n1/pub/19-20-0001/192000012026001-eng.htm)
6. The August release states that the rate aggregates across income brackets and that saving rates are generally greater in higher income brackets. It explicitly includes revised Q1 estimates incorporating new/revised source data and updated seasonal information. [Statistics Canada, Q2 2026 release, “Household saving rate up” and “Revisions”](https://www150.statcan.gc.ca/n1/daily-quotidien/260828/dq260828a-eng.htm)

## Validation performed

Reproducible command, from the worktree root:

```bash
python3 qa/saving-rate/validate_extraction.py
```

Result: **60 selected original rows**, five measures × **12 consecutive quarters**, with zero duplicate period/measure keys and no missing, suppressed, preliminary, revised-status, or terminated flags in the selected rows. An empty revised-status field does not mean that no historical revision has occurred; the release describes revisions.

For each quarter the script verified the exact vector, coordinate, geography, unit, scalar and decimal metadata, then checked:

```text
disposable income - consumption + pension adjustment = net saving
round(100 × net saving / disposable income, 1 decimal) = published saving rate
```

Both checks passed in **12/12** quarters. For Q2 2026, `67,920 / 1,860,216 × 100 = 3.651189...%`, which rounds to **3.7%**. Annualizing both dollar flows cancels in their ratio; do not multiply the saving-rate percentage by four.

Audit files are confined to `qa/saving-rate/`: original ZIP, byte-preserving extracted CSV/metadata, official HTML captures and response headers; source retrieval log; selected original CSV rows; extraction/validation script and JSON results. No public data module was created.

ZIP retrieved at **2026-10-25 17:10:39 UTC** (**10:10:39 America/Vancouver**) according to the preserved HTTP response header; server `Last-Modified` is **2026-08-28 13:33:13 GMT**. Other source retrieval timestamps and hashes are recorded in `qa/saving-rate/source-retrieval-log.json`.

| Original artifact | SHA-256 |
| --- | --- |
| 36100112-eng.zip | b577daa453e1527602f55000d301624143bdaf3dba87bfbd458f44d6ab797d1e |
| 36100112.csv | 5cfe7a3c5a9cd3610faa2d7fd19b591b1cfed01750d0c493568f0c1f25cc7d97 |
| 36100112_MetaData.csv | d0f54406531db5637e8d3828c46d44d907748e2937ee2a9b205ede3aab59a030 |

## Editorial implications, clearly distinguished from source rules

- **Inference:** this aggregate ratio cannot establish a suitable personal target. It pools households with different incomes, ages, pension arrangements and spending needs; it does not report the median person's saving rate or a recommended minimum.
- Call the chart **“Canada's household saving rate”**, not simply “national saving rate”: the latter can denote an economy-wide national-accounts measure with another denominator.
- A bank-transfer-only personal savings rate and the national-accounts ratio use different concepts. Any budget example should define its own numerator and denominator and carry an “illustrative household” label. Do not imply that transferring 3.7% of a paycheque reproduces the statistical measure.
- Use the historical chart for economic context; use separately labelled fictional household scenarios to explain goal-based targets. Do not convert the aggregate into rankings or judge a reader's adequacy from it.
- Label the observed chart **“Quarterly, seasonally adjusted; percent of household disposable income. Table released August 28, 2026; retrieved October 25, 2026. Historical values can be revised.”** The source dimension is SAAR; the percentage is a ratio, not an annual investment return.
- Preserve the entire release vintage when updating. Do not append a new quarter from another release to unrevised old values without retrieving and checking the historical series again. Do not claim household distribution, bank balances, emergency-fund adequacy or causes of every historical movement from this aggregate alone.

The table's browser fetch timed out in the web research tool, but direct HTTPS retrieval with the system-trusted `curl` client successfully captured the official HTML, complete CSV and metadata. There is no unresolved numerical access gap for this reviewed row set.
