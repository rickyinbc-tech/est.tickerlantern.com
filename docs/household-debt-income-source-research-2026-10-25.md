# Household debt and income: Canadian source research

Reviewed and retrieved **October 25, 2026**. Intended guide: distinguish Canada's aggregate outstanding-credit-to-income statistic from a fictional household's outstanding debt, monthly payments and take-home cash. This is not a mortgage qualification or affordability-threshold analysis. No private accounts, archives or source PDFs were used.

## Current controlling source

**Statistics Canada table 38-10-0238-01**, “Household sector credit market summary table, seasonally adjusted estimates”, formerly CANSIM 378-0127. Frequency: quarterly. Geography: Canada. **Released September 11, 2026**, with current coverage through **2026 Q2**. The displayed table footer's October 25 modification date is not the data-release date. [Official table](https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=3810023801)

Original machine-readable evidence is the [official complete CSV ZIP](https://www150.statcan.gc.ca/n1/tbl/csv/38100238-eng.zip), containing `38100238.csv` and `38100238_MetaData.csv`. The metadata labels this a current public cube, with two dimensions (`Geography`, `Categories`) and reference coverage from `1990-01-01` through `2026-04-01`. The entire table is seasonally adjusted: there is no additional seasonal-adjustment selector in its CSV. Its member note says “Seasonally adjusted at quarterly rates.”

The [September 11, 2026 Daily release](https://www150.statcan.gc.ca/n1/daily-quotidien/260911/dq260911a-eng.htm) reports a seasonally adjusted household credit-market debt stock of approximately **$3,280.9 billion** and a ratio of **176.4%** for Q2. The CSV preserves greater precision: **$3,280,888 million** and **176.37**. The release says Q1 estimates were revised and schedules the next balance-sheet/financial-flow release for **December 11, 2026**. Do not substitute Q1's originally released estimate or unadjusted indicators from another table.

## Exact series and interpretation

All selected debt-table rows use `GEO=Canada`, `DGUID=2016A000011124`.

| Exact category label | Vector | Coordinate | CSV unit / scalar | Decimals |
| --- | --- | --- | --- | ---: |
| Credit market debt to disposable income | v1038036698 | 1.11 | Ratio / units | 2 |
| Credit market debt - national balance sheet | v1038036700 | 1.13 | Dollars / millions | 0 |
| Consumer credit - national balance sheet | v1038036701 | 1.14 | Dollars / millions | 0 |
| Non-mortgage loans - national balance sheet | v1038036702 | 1.15 | Dollars / millions | 0 |
| Mortgages - national balance sheet | v1038036703 | 1.16 | Dollars / millions | 0 |
| Credit market debt - financial flow | v95701115 | 1.7 | Dollars / millions | 0 |

These are verified directly against the [official CSV and metadata](https://www150.statcan.gc.ca/n1/tbl/csv/38100238-eng.zip). The ratio has `UOM_ID=271`, `SCALAR_ID=0`; dollar series have `UOM_ID=81`, `SCALAR_ID=6`. Although its CSV unit is called **Ratio**, the published value **176.37** is expressed on a percent scale; it corresponds to **$1.7637 of debt per $1 of annualized income**, not $176.37 per dollar. StatCan's [official chart description](https://www150.statcan.gc.ca/n1/daily-quotidien/260911/cg-a003-eng.htm) labels the chart in percent and rounds Q2 to 176.4.

The denominator cross-check uses **table 36-10-0112-01**, exact estimate `Household disposable income`, `Seasonal adjustment=Seasonally adjusted at annual rates`, `VECTOR=v62305981`, `COORDINATE=1.1.30`, dollars/millions, zero decimals, Canada/DGUID as above. That current income table was released **August 28, 2026**. [Official income table](https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=3610011201); [official complete income CSV ZIP](https://www150.statcan.gc.ca/n1/tbl/csv/36100112-eng.zip)

## Definitions and boundaries

- **Credit-market debt** is consumer credit plus mortgage liabilities plus non-mortgage loans. It excludes trade payables, which are included in a broader total-household-debt concept. The separately named “consumer credit and mortgage liabilities” indicator excludes non-mortgage loans as well; it is not the same statistic. [StatCan, User Guide chapter 6, household financial indicators](https://www150.statcan.gc.ca/n1/pub/13-606-g/2016001/article/14621-eng.htm)
- **A stock** is measured at a point in time; the National Balance Sheet Accounts present assets and liabilities at the end of the accounting period. **A flow** accumulates transactions during a period. The financial-flow series is net borrowing, not the stock still owed or gross payments due. [Current National Balance Sheet Accounts program, Q2 2026 description](https://www23.statcan.gc.ca/imdb/p2SV.pl?Function=getSurvey&SDDS=1806); [StatCan stock/flow methodology](https://www150.statcan.gc.ca/n1/pub/13-605-x/2018001/article/54972-eng.htm)
- For the **seasonally adjusted debt/income ratio**, the numerator is seasonally adjusted debt stock and the denominator is the quarter's seasonally adjusted household disposable income at annual rates (SAAR). The older four-quarter moving-income approach should not be silently used to reproduce this series. StatCan documents the methodological change in its 2018 paper, corrected February 12, 2019. [StatCan, “Seasonally adjusted credit market debt as a proportion of disposable income”, including Box 3](https://www150.statcan.gc.ca/n1/pub/13-605-x/2018001/article/54972-eng.htm)
- **Household disposable income** is national-accounts income: employee compensation, net mixed income and net property income, plus net current transfers with other sectors. Transfers paid include income tax and social-security-related payments; receipts include benefits. It is not identical to the amount deposited into one worker's bank account. The Canadian household sector includes unincorporated businesses and excludes NPISH (non-profit institutions serving households). This scope/definition explanation is dated 2015; the current tables separately identify household and NPISH sectors, and current income rows preserve the accounting structure. [StatCan Canadian/U.S. reconciliation update, institutional composition and income definition](https://www150.statcan.gc.ca/n1/pub/13-605-x/2015013/article/14304-eng.htm)
- The aggregate **debt-service ratio** is another measure: obligated principal and interest payments divided by disposable income. It measures payments, unlike the stock-to-income ratio. Only this distinction is needed for the proposed guide; it should not imply that a fictional take-home-pay calculation is either the official statistic or a lender's GDS/TDS qualification ratio. [StatCan Q2 2026 release, “Growth in household credit market debt outpaced by income gains”](https://www150.statcan.gc.ca/n1/daily-quotidien/260911/dq260911a-eng.htm)

## Reusable reviewed observations

Source rows were selected from the current original CSVs. `REF_DATE` encodes quarter start: `2026-04` means **2026 Q2**, not an April-only observation. Debt stock is end-of-quarter, seasonally adjusted. Income is **annualized**; net borrowing is the **quarter's flow**, not annualized. All dollar columns below are millions of CAD. [Debt CSV](https://www150.statcan.gc.ca/n1/tbl/csv/38100238-eng.zip); [income CSV](https://www150.statcan.gc.ca/n1/tbl/csv/36100112-eng.zip)

| Quarter | REF_DATE | Debt/income % | Debt stock, SA | Disposable income, SAAR | Net borrowing, quarterly SA |
| --- | --- | ---: | ---: | ---: | ---: |
| 2023 Q3 | 2023-07 | 180.69 | 2,928,056 | 1,620,528 | 27,439 |
| 2023 Q4 | 2023-10 | 179.93 | 2,954,300 | 1,641,912 | 27,308 |
| 2024 Q1 | 2024-01 | 179.66 | 2,979,389 | 1,658,352 | 29,516 |
| 2024 Q2 | 2024-04 | 176.77 | 3,009,203 | 1,702,296 | 30,577 |
| 2024 Q3 | 2024-07 | 174.13 | 3,044,147 | 1,748,196 | 36,101 |
| 2024 Q4 | 2024-10 | 174.78 | 3,085,637 | 1,765,468 | 41,353 |
| 2025 Q1 | 2025-01 | 175.35 | 3,115,474 | 1,776,756 | 31,254 |
| 2025 Q2 | 2025-04 | 177.34 | 3,149,291 | 1,775,844 | 35,391 |
| 2025 Q3 | 2025-07 | 177.95 | 3,185,846 | 1,790,264 | 37,456 |
| 2025 Q4 | 2025-10 | 178.69 | 3,218,940 | 1,801,452 | 34,460 |
| 2026 Q1 | 2026-01 | 178.55 | 3,252,456 | 1,821,552 | 34,435 |
| 2026 Q2 | 2026-04 | 176.37 | 3,280,888 | 1,860,216 | 29,421 |

Checked identities, using original integers and decimal arithmetic:

```text
consumer credit stock + non-mortgage loan stock + mortgage stock = credit-market debt stock
round(100 × credit-market debt stock / SAAR disposable income, 2) = published ratio
```

Both passed **12/12** quarters. Q2: `100 × 3,280,888 / 1,860,216 = 176.371346...`, rounding to **176.37**. Do not multiply the stock by four or compare it with one quarter of unannualized income while preserving the published ratio.

The reviewed extraction contains **72 debt-table original rows + 12 income-table original rows**, with 12 consecutive quarters, unique date/measure keys, exact dimension checks, and no missing/flagged selected values. Debt components sum exactly. `STATUS`, `SYMBOL` and `TERMINATED` are empty in these rows; that does not establish that historical numbers were never revised.

Within the latest two reviewed quarters, debt stock **increased** by $28,432 million while the ratio **fell** by 2.18 percentage points because the denominator grew faster. This arithmetic demonstrates that a falling ratio does not require a fall in total debt. Also, the change in stock need not equal financial-flow borrowing: the accounts include other changes/revaluations in the stock-flow reconciliation. [StatCan stock-flow identity, Box 1](https://www150.statcan.gc.ca/n1/pub/13-605-x/2018001/article/54972-eng.htm)

## Original fictional-household calculations: separate from statistical rules

Suitable educational inputs are debt balances **as of a stated date**, monthly take-home income, and actual contractual monthly payments. Keep these three concepts visibly separate:

```text
illustrative debt / annual take-home income = debt balances / (12 × monthly take-home)
illustrative payments / monthly take-home = monthly debt payments / monthly take-home
cash remaining before other expenses = monthly take-home - monthly debt payments
```

All values, dates, constant-income assumptions and payment amounts in this part should be labelled fictional. Do not calculate payments from debt alone without additional contractual rates and amortization assumptions. A $200,000 balance does not determine one unique monthly payment. Do not add outstanding debt stock to monthly expenses as if it were all due immediately.

Example: $200,000 debt, $6,000 monthly take-home, $1,800 monthly payments. Annualized take-home is $72,000; the household's defined debt/take-home measure is **277.78%**, while monthly payments/take-home are **30%**, leaving $4,200 before living expenses and savings. These are different questions and neither percentage can be equated directly with Canada's official 176.37%. A fictional second household can have the same balance/income but different payment obligations; this requires explicit assumed payment inputs, not a score or qualification model.

FCAC supports inspecting both balances and cash obligations: it recommends listing each debt's total amount owed, minimum monthly payment and interest rate, then comparing monthly income and expenses. [FCAC, Paying back your debt, debt assessment and monthly budget sections; page date October 14, 2025](https://www.canada.ca/en/financial-consumer-agency/services/debt/paying-debt.html)

## What the statistic cannot establish

These are analytical limitations, not additional StatCan recommendations:

- The aggregate is a ratio of total stocks to total income, not the median household's ratio, a distribution of individual burdens, or a recommended personal maximum.
- It does not establish one person's required cash payment, credit-card utilization, mortgage qualification, default likelihood, emergency-fund adequacy, or ability to retire a debt in a particular number of years.
- “About $1.76 in debt per dollar of annualized disposable income” does not mean households pay 176% of their monthly income to lenders. The stock is outstanding at a moment; the payments are a flow.
- A personal take-home denominator does not duplicate the national-accounts income definition. The broader list of unpaid obligations used in a household budget may also differ from StatCan's credit-market debt scope.
- The aggregate rate can move because debt changes, income changes or historical data are revised. Do not infer every household's debt fell when the national ratio falls.

For publication, label observed charts **“Canada, quarterly, seasonally adjusted. Credit-market debt stock / household disposable income at annual rates. Released September 11, 2026; retrieved October 25, 2026; historical values may be revised.”** Keep fictional household examples in a separately labelled view. Do not present 176.37% as an affordability threshold or benchmark to copy.

## Revision, retrieval and audit record

The current balance-sheet program explains that later quarters can revise earlier quarters, annual revisions generally cover the previous three years, and comprehensive revisions can go further. The September release specifically describes revised Q1 data and notes that the normal annual revision window may be extended for data enhancements. [Current NBSA program, revisions section](https://www23.statcan.gc.ca/imdb/p2SV.pl?Function=getSurvey&SDDS=1806); [September 11 release, Note to readers](https://www150.statcan.gc.ca/n1/daily-quotidien/260911/dq260911a-eng.htm)

The 2018 stock/flow methodology is archived and corrected in 2019; use it for the documented definition, with the current table metadata and all 12 successful ratio reconciliations as the current evidence. Older articles using a four-quarter denominator or an unadjusted series are not interchangeable. The income and debt tables have different release dates; their currently retrieved vintages reconcile exactly here. Re-retrieve both when updating.

Original public files, byte-preserving extracted CSVs/metadata, response headers, SHA-256 hashes, retrieval times, selected original row CSVs, `reviewed-extract.json` and `validation-results.json` are stored only under **`qa/debt-income/`**. The reviewed JSON includes all 12 quarters, exact source-value strings, stock components, source hashes and vector/coordinate metadata. Reproduce it with `python3 qa/debt-income/validate_extraction.py`; this checks known source hashes before extracting and validates dimensions and identities. Direct system-trusted HTTPS retrieval succeeded even where the web text tool timed out. No private information or application data module was created.

| Artifact | SHA-256 |
| --- | --- |
| 38100238-eng.zip | 0006e91c81edbfc691392d0e373723a537f56e0d28350053d26bf80a80035631 |
| 38100238.csv | bdcb680c7320aa2e671463d4420160bb410b17c5dec6c745d771b96281ba6569 |
| 38100238_MetaData.csv | ee4e1309472c82a8d477bcda8f00c17b576257493c79841b933f2876cb7aa8fa |
| 36100112-eng.zip | b577daa453e1527602f55000d301624143bdaf3dba87bfbd458f44d6ab797d1e |
