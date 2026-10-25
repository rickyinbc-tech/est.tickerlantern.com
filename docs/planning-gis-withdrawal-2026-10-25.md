# GIS and RRSP/TFSA withdrawal timing

This guide separates source treatment from the calendar used for a later GIS
review. Its five CRA and Service Canada HTML snapshots, retrieval date and
SHA-256 hashes are retained privately under `qa/gis-next/`; no private account,
client, email, archived PDF or private research source was used.

## Official observations and rules

The Service Canada page updated 13 October 2026 publishes October–December
2026 monthly GIS maxima of CAD 1,138.90 for a single, divorced or widowed
person; CAD 685.56 when a spouse receives full OAS; CAD 685.56 when the spouse
receives the Allowance; and CAD 1,138.90 when the spouse receives neither. The
same page lists annual income ceilings of CAD 23,112, CAD 30,528, CAD 42,768
and CAD 55,392. Partner amounts use combined income. These maxima are dated,
conditional reference amounts, not a payment forecast or full-year estimate.
Amounts can adjust quarterly.

Service Canada says annual GIS reviews use the federal tax return and the July
letter gives a decision. It identifies previous-year income as a calculation
factor and combined income when there is a spouse or common-law partner. If
income falls because of retirement or pension reductions, contact Service
Canada; it may use estimated current-year income instead. CRA says a regular
RRSP withdrawal is included in income for its withdrawal year. CRA says TFSA
income and withdrawals do not affect federal income-tested benefits, including
GIS.

## Original hypothetical model

The reader can choose one gross cash need, income year and withdrawal month.
The model displays the same withdrawal amount as regular RRSP income in that
calendar year, while the TFSA federal income-tested-benefit effect is zero. It
maps the ordinary annual review to July of the following year through June of
the year after that. The month-start sensitivity is 18 months for a January
withdrawal and 7 months for December. Those dates are a calendar illustration,
not a processing-time claim.

No actual GIS income base, marital-status determination, eligibility, tax,
withholding, benefit amount, benefit reduction, other program or optimal
withdrawal order is calculated. The fixed reference table is explicitly dated
October–December 2026. The RRSP rule is scoped to an ordinary withdrawal, not
Home Buyers' Plan or Lifelong Learning Plan withdrawals or another exception.

## Verification

Nine focused tests pass. The integrated full JavaScript suite passes 1621 tests and the Python suite passes 122. The merged build generated 309 static pages with four charts for this guide. The browser check passed at 1440, 390 and 320 CSS-pixel viewports,
including source data tables, 2025 income to the July 2026–June 2027 review
window, changing the year/month, January/December month intervals, the maximum
withdrawal boundary, invalid-input retention and reset. The four mobile charts
were inspected after concise household and source labels were applied. The
integrated full suite and live deployment checks remain pending.
