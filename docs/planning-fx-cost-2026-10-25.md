# Dated USD acquisition cost and CAD disposition arithmetic

One detailed English article adds four interactive figures/data tables: the
direct dated-CAD reconciliation, a price/currency decomposition, equal-USD
proceeds/cost stresses and a signed proceeds/rate matrix. Every amount and
rate is an original hypothetical input. No private account, client, tax
return, email, archived PDF or research material is used.

## Source scope

CRA Calculating and reporting capital gains and losses and Bank of Canada
Daily exchange rates were reviewed on 25 October 2026. CRA's page is modified
5 February 2026 and contains 2025-return examples. Its conversion framework
uses the sale-date rate for proceeds, acquisition-date rate for ACB and the
expense-date rate for disposition expenses. The Bank's page supports the
CAD-per-unit-of-foreign-currency convention and identifies its published rates
as indicative averages. No actual daily rate, annual average, market forecast
or executable bank quote is encoded. Public HTML, source URLs, retrieval times
and content hashes remain ignored under qa/fx-cost-next.

The model assumes a single purchase of eligible USD capital property, a full
disposition and no later ACB adjustments. Eligible same-date acquisition costs
are included in the original USD cost. Disposition expenses are separately
supplied already in CAD. It does not select lots, rebuild a pooled ACB, process
reinvestment or later adjustments, determine income-account/registered-account
treatment, calculate inclusion or personal tax, or establish loss eligibility.

## Independent identities

Let C be original USD acquisition cost, P USD gross proceeds, a acquisition
CAD/USD rate, s sale CAD/USD rate and E the already converted CAD expense.
Historical CAD cost=Ca; translated proceeds=Ps; arithmetic CAD gain/loss=Ps-Ca-E.
The independent decomposition is (P-C)s+C(s-a)-E. The first component already
uses the full sale rate; no further price/currency interaction is added.

Default C=USD 10,000, P=USD 12,000, a=1.25, s=1.35 and E=CAD 50 give CAD
12,500 historical cost, CAD 16,200 translated proceeds and CAD 3,650 gain
before inclusion. Decomposition: CAD 2,700 USD-change contribution plus CAD
1,000 original-cost currency contribution less CAD 50. Each expense is
deducted once and is never multiplied by either exchange rate again.

Setting P=C=USD 10,000 produces a zero USD difference but CAD 950 arithmetic
gain at the default rates/expense. Alternative sale rates 1.00, 1.25 and 1.50
give CAD -2,550, -50 and +2,450 respectively. Equal acquisition/sale rates
remove the original-cost currency contribution. These are accounting cases,
not a measured hedge payoff or independent cash deposits.

The sensitivity rows use 80%, 100% and 120% of the acquisition rate plus the
selected sale rate; the matrix uses 80%/120% and the selected sale rate. Rates
are rounded to four decimals before each stress calculation. Matrix USD
proceeds use 75%, 100% and 125% of the selected proceeds, rounded to cents
before calculation. Duplicate cases are removed. Labels therefore describe
the exact scenario values used, including under higher-precision reader
inputs. The main dated ledger retains the original input precision.

CAD translation for a record does not itself execute a currency exchange.
USD settlement cash, later cash dispositions, conversion spreads, receipt
dates and household spending require separate records. Negative results are
arithmetic losses, not determinations of claimability or a tax refund.

## Verification

Eleven focused tests verify direct versus decomposed identities over signed
and zero cases, dated-rate independence, zero USD change, equal rates,
single-count CAD expenses, both waterfalls, stress-row/matrix formulas,
rounded-label consistency at high precision, all supported field extrema,
finite accessible rendering, invalid inputs and editorial limits.

Full JavaScript suite: 1386 passed. Python suite: 122 passed.
Browser checks at 1440, 390 and 320 pixels verify four figures/data tables,
no page overflow, equal USD proceeds, unchanged historical cost under sale
edits, equal rates, expense-only loss, zero result, collapsed zero-proceeds
matrix, invalid-rate retention, reset and disclosure. All four default mobile
figures are visually inspected before publication.
