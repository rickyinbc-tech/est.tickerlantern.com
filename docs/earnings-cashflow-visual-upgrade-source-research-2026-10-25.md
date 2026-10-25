# Earnings-to-cash visual upgrade: reviewed evidence and invented arithmetic

Review date: 2026-10-25. Recommendation: upgrade the existing `/research/earnings-quality-cash-flow` route, retaining its useful sections. This is generic education using a fictional manufacturer, not company analysis, a valuation or an investment recommendation.

## Existing scope

At review, HEAD was `80c1ebc` and origin/main `7c35143`. Slug inventories across guide files contained 180 and 186 entries respectively; no duplicate interactive earnings-to-operating-cash/financing bridge was found. The static guide in `src/research-guides.js` already contains a coherent indirect bridge: net income 100, D&A 25, stock compensation 10, receivables increase 30, inventory increase 20, payables increase 15, operating cash 100, cash capex 45 and simplified free cash flow 55. All amounts are millions for the same invented year and reporting perimeter.

Preserve the working-capital, maintenance-spending, adjusted-earnings and sector-limit explanations. The later revenue/receivables illustration is a **separate case**: revenue 800→1,000 and receivables 80→150 imply a 70 receivables increase, not the main bridge's 30. Do not combine that example with the cash bridge as if they were one statement. A new opening/closing receivables chart tied to the main fixture can instead use 80→110.

## Primary evidence and source dates

- **Statement roles and cash-flow classification:** SEC's beginner guide distinguishes balance-sheet dates from income/cash-flow periods; its cash-flow section describes noncash adjustments, changes in operating assets/liabilities, asset purchases and financing receipts/repayments. It explains adding depreciation back in the indirect reconciliation. The current canonical body displays January 12, 2014 and last review February 6, 2017. Replace the existing source note's February 4, 2007 attribution with the displayed dates, or omit an unverified original-publication claim. [SEC: Beginners' Guide to Financial Statements](https://www.sec.gov/about/reports-publications/beginners-guide-financial-statements)
- **Free cash flow needs a definition:** SEC staff Q102.07 describes the common operating-cash-less-capex calculation, says the term is not uniformly defined, and warns against presenting it as unrestricted discretionary cash because obligations may remain. Q102.07 is dated May 17, 2016; the page displays June 7, 2021 and last review December 13, 2022. Its separate recurring-expense guidance can remain in the original adjusted-earnings section, explicitly identified as U.S. disclosure guidance. [SEC: Non-GAAP Financial Measures](https://www.sec.gov/rules-regulations/staff-guidance/corporation-finance-interpretations/non-gaap-financial-measures)
- **Link the statements and respect the framework:** CFA Institute's public 2026 reading introduction discusses cash receipts/payments and reconciling cash between balance-sheet dates; its public learning outcomes distinguish direct/indirect methods and IFRS/U.S. GAAP comparison. These introductory statements support a simplified teaching reconciliation, not a claim that our few lines reproduce every reporting framework. Only public text was accessed. [CFA: Analyzing Statements of Cash Flows I](https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/analyzing-statements-of-cash-flows-i)
- **Cash-flow measures answer different questions:** The second public 2026 introduction discusses sources/uses and cash-flow analysis; its learning outcomes separately identify free cash flow to the firm and equity. Do not label our simple CFO-minus-cash-capex measure either of those valuation measures. The full reading was not accessed. [CFA: Analyzing Statements of Cash Flows II](https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/analyzing-statements-of-cash-flows-ii)

## Exact original convention and sign rules

Use one fictional year, amounts in millions of the same currency, and opening/closing balances at that year's boundaries. Define each delta as **closing minus opening**. Let NI be net income and N noncash expenses already included in NI (25 D&A + 10 stock compensation = 35 here).

```text
net working-capital cash use = Δreceivables + Δinventory − Δoperating payables
operating cash = NI + N − Δreceivables − Δinventory + Δoperating payables
illustrative free cash flow = operating cash − total cash capex
cash change = operating cash − cash capex + new borrowing − debt principal − dividends
closing cash = opening cash + cash change
```

These are explicitly limited model identities. Assume no acquisitions, disposals, foreign-exchange effects, write-offs, noncash balance-sheet reclassifications, other operating accruals or omitted cash flows. Operating payables exclude debt and capex creditors. Other expensed outlays are paid within the year, so no additional interest/tax timing adjustment is needed. Debt **principal** is distinct from any interest already represented in operating cash. Restrict this exercise to the manufacturer; do not apply it mechanically to banks or insurers.

A receivables increase means recognized sales exceed corresponding collections; an inventory increase means purchases exceed cost consumed/sold; an operating-payables increase means some purchases remain unpaid. Under these assumptions, the first two increases reduce cash relative to profit and the last increases it. Negative deltas reverse those adjustments. This does not establish whether a movement is healthy, persistent or repeatable.

The noncash add-backs are reconciliation adjustments, **not receipts of 35**. They reverse expenses that reduced NI without the corresponding current-period cash payment. They do not erase economic costs or prove assets never need replacement. Keep the original warning that noncash share compensation can affect ownership. A user changing an add-back while holding NI fixed is changing a reconciliation assumption, not demonstrating a free method of generating cash.

## Independently verified defaults

| Reconciliation, all millions | Amount |
|---|---:|
| Net income | 100 |
| D&A and stock-compensation add-backs | +25 +10 |
| Receivables increase | −30 |
| Inventory increase | −20 |
| Operating-payables increase | +15 |
| Operating cash | **100** |
| Total cash capex | −45 |
| Defined illustrative free cash flow | **55** |
| New borrowing | +20 |
| Debt principal repayment | −30 |
| Dividends | −25 |
| Cash change | **20** |
| Opening cash / closing cash | **40 / 60** |

The borrowing, principal, dividends and opening cash are new invented extension assumptions. They are not extra adjustments to reported profit. Net financing is −35, so 55 −35 =20 and 40 +20 =60. Optional debt balances of 200 opening and 190 closing reconcile 200 +20 −30; do not subtract interest or dividends from that principal balance.

A separately reconstructed direct-cash fixture verifies the bridge: sales 1,000; cost of sales 600; other expensed cash outlays 265; D&A 25; stock compensation 10; receivables 80→110; inventory 100→120; operating payables 60→75. Thus NI =1,000 −600 −265 −25 −10 =100. Collections are 970; inventory purchases are 620; supplier payments are 605. Operating cash =970 −605 −265 =100. These supporting figures are invented consistency checks, not published company accounts.

With all working-capital changes set to zero, operating cash becomes 135 and defined FCF 90. Reversing the original three changes gives operating cash 170. Neither alternative is evidence that cash will repeat. A stressed ΔAR = 90, Δinventory = 60 and Δpayables = 15 leaves operating cash zero; with opening cash zero, capex 45, no new borrowing, principal 30 and dividends 25, closing cash is −100: an unfunded hypothetical plan, not an authorized negative bank balance.

## Maintenance assumption and charts

If the assumed maintenance portion M is 25 out of actual entered cash capex 45, cash after assumed maintenance is 100 −25 =75. The other assumed capex portion is 20. **All 45 was still paid**, so defined FCF remains 55 and closing cash 60. Allow M from0 to total capex; changing only the label/split must not change actual cash change. Present 75 as a separate analytical scenario before other claims, not a second reported FCF or a measured maintenance requirement. Depreciation 25 does not establish maintenance capex 25.

Suggested five figures:

1. NI-to-operating-cash waterfall, distinguishing noncash adjustments from actual receipts.
2. Opening/closing working-capital balances and their cash adjustments, keeping stocks and flows clearly labelled.
3. Operating-cash-to-closing-cash waterfall including total capex and financing; add opening cash once and never add NI again.
4. Cash-after-assumed-maintenance sensitivity beside the unchanged total-capex FCF reference.
5. Receivables/inventory-change grid showing defined FCF or closing cash, with payables and financing assumptions stated.

Use signed axes and retain negative values. An optional operating-cash/NI ratio equals100% at defaults, but show unavailable at zero or negative NI rather than divide by zero or label a misleading quality score. Different profit/cash measures are views of one business, not amounts to add together. Ending cash is a stock; the 20 increase is a flow. Borrowing can improve closing cash without improving operating cash or the defined FCF.

## Evidence and independent checks

Ignored `qa/earnings-cashflow/` contains two successful CFA raw HTML captures, failed SEC curl403 records, and separately saved original successful SEC public web-tool responses. `source-manifest.json` records precise URLs, UTC retrievals and SHA-256 hashes; no access-control bypass occurred. No full CFA reading, PDF or private archive was used.

`python3 qa/earnings-cashflow/validate.py` passes 486 exact-rational grid cases plus independent direct reconstruction, one-unit sign sensitivities, losses/zero-denominator cases, capex-split invariance, financing reconciliation and negative-cash shortfall. Three saved evidence-file hashes are verified. `reviewed-extract.json` records defaults and the supporting original balances. No application source, tests, registry, build, README, commit or deployment was changed.

## Implemented upgrade

The existing URL and all six original sections are retained; two added sections
reconcile financing and define the scope of the free-cash-flow measure. The
interactive convention explicitly chooses CAD millions for this invented
manufacturer. The main controls change net income, three operating deltas and
the assumed maintenance portion of the fixed45 cash capex. Noncash adjustments,
opening cash and financing stay fixed at the reviewed fixture values.

Five figures show the operating-cash waterfall, opening/closing operating
balances, closing-cash waterfall, maintenance-assumption sensitivity and
working-capital stress matrix. Delta minima keep closing receivables, inventory
and payables nonnegative. Negative operating/closing cash is retained; zero or
negative net income leaves cash conversion unavailable. The main default
receivables stock is80→110, and the original80→150/revenue case is expressly
separate. All claims use public sources; the canonical SEC guide link and its
displayed dates replace the old unverified publication date.
