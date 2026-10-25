# Reverse mortgages and retirement home-equity cash: source research

Reviewed live official Canadian public sources on **October 25, 2026**. Scope: explain capitalized borrowing costs, net cash released and home-value scenarios. No private account, curriculum, source PDF, offered rate or product recommendation was used. Every proposed chart input is fictional; an unconstrained compound-interest calculation is not a lender quote or settlement statement.

## Distinct article angle

The existing HELOC guide compares interest-only payments with principal repayment; the home-wealth guide separates balance-sheet wealth from accessible cash; the moving-home guide models a sale and replacement purchase. This guide can instead follow a homeowner who **retains the property, receives a loan advance and makes no regular loan payments**, with interest added to the balance. Keep the initial cash bridge separate from later interest growth, and distinguish a hypothetical equity subtraction from actual contractual borrower liability.

## Verified Canadian mechanics

| Topic | Narrowly supported finding | Official source |
| --- | --- | --- |
| Eligibility context | FCAC describes reverse mortgages as usually available to homeowners aged 55 or older, commonly up to 55% of appraised home value. These are general descriptions, not a personal approval or universal statutory lending limit. | [FCAC, Borrowing against home equity, reverse-mortgage section; October 15, 2025](https://www.canada.ca/en/financial-consumer-agency/services/mortgages/borrow-home-equity.html) |
| Actual maximum and residence | Age of people on title, property condition/type/appraisal and lender affect the maximum. The property usually must be a primary residence, typically occupied at least six months annually. | [FCAC, Reverse mortgages, eligibility section; October 15, 2025](https://www.canada.ca/en/financial-consumer-agency/services/mortgages/reverse-mortgages.html) |
| Interest and payments | Interest accumulates; no regular mortgage payments are needed until the loan is due. FCAC says rates are typically higher than ordinary mortgages or HELOCs. | [FCAC, Borrowing against home equity](https://www.canada.ca/en/financial-consumer-agency/services/mortgages/borrow-home-equity.html) |
| Costs and proceeds | Appraisal, setup, legal/closing and early-prepayment costs may apply. Some fees may be added to debt and others paid upfront. | [FCAC, Reverse mortgages, costs section](https://www.canada.ca/en/financial-consumer-agency/services/mortgages/reverse-mortgages.html) |
| Advance pattern | Lump-sum, partial-lump-sum/later draws and regular advances can differ in costs; later advances may have fees or affect rates. | [FCAC, Reverse mortgages, receiving-money sections](https://www.canada.ca/en/financial-consumer-agency/services/mortgages/reverse-mortgages.html) |
| Existing secured borrowing | Existing mortgages/HELOCs may need repayment and closure, potentially using the reverse-mortgage proceeds. | [FCAC, Reverse mortgages, other considerations](https://www.canada.ca/en/financial-consumer-agency/services/mortgages/reverse-mortgages.html) |
| Ownership | The borrower still owns the home. HomeEquity Bank also states its CHIP product does not transfer title to the lender. | [FCAC, Reverse mortgages, pros](https://www.canada.ca/en/financial-consumer-agency/services/mortgages/reverse-mortgages.html); [HomeEquity Bank, ownership section](https://www.chip.ca/about-us/) |
| Repayment triggers | FCAC lists sale, moving out, last borrower's death and default as repayment triggers. Contract-specific deadlines matter; the estate may have limited time. | [FCAC, Borrowing against home equity](https://www.canada.ca/en/financial-consumer-agency/services/mortgages/borrow-home-equity.html); [FCAC, Reverse mortgages, repayment section](https://www.canada.ca/en/financial-consumer-agency/services/mortgages/reverse-mortgages.html) |
| Default and ongoing obligations | Disrepair and contract breaches can be defaults, with potential foreclosure. Ownership and no regular loan payments do not eliminate maintenance, tax, insurance or contract obligations. | [FCAC, Reverse mortgages, default section](https://www.canada.ca/en/financial-consumer-agency/services/mortgages/reverse-mortgages.html); [HomeEquity Bank guarantee conditions](https://www.chip.ca/about-us/) |

Do not assume that the first spouse's death or one person's temporary absence automatically determines a joint loan's repayment date. The actual title, borrower definitions, occupancy rules and due-event provisions need to be checked.

## Conditional no-negative-equity protection

HomeEquity Bank's current official **About us** page describes its CHIP loan as non-recourse and its **No Negative Equity Guarantee** as covering a home-value shortfall, subject to maintaining the property, paying property taxes and homeowners' insurance, and complying with mortgage obligations. Its footnote excludes **administrative expenses and interest accumulated after the due date**. The same page says funding and subsequent advances remain subject to agreement terms and underwriting. This is a specific lender's published protection, not a universal guarantee established for every Canadian product. [HomeEquity Bank, guarantee section and footnotes](https://www.chip.ca/about-us/)

This caveat directly governs chart wording. If the hypothetical balance exceeds the modeled property/sale value:

- Call the difference an **“uncapped arithmetic gap before contract protections”** or **“modeled balance above assumed home value.”**
- Do **not** call it the borrower's or heirs' actual personal liability, an actual estate cash shortfall, a bill they must fund, or a predicted deficiency judgment.
- Do not calculate a lender's settlement simply as `min(compounded balance, home value)` and label it a real guarantee. Eligibility, obligations, valuation, due date, excluded charges and post-due interest are not represented by that shortcut.
- A protection against owing above a specified value does not establish a fixed minimum inheritance or promise that selling costs, late charges and all other estate obligations disappear.

If charts omit contractual protection, label that omission **next to the displayed balance/equity result**, especially when it crosses below zero. A generic footer would not adequately distinguish the toy result from an actual liability.

## Original closing cash and debt bridge

Define the draw and fees unambiguously:

```text
A = hypothetical cash advance before repaying existing secured debt
F = separately financed setup/closing fees added to new debt
M = existing secured-debt payout, fully settled from the advance
U = fees paid immediately from the advance, not financed again

opening new reverse-loan balance = A + F
new cash available after closing = A - M - U
home equity after closing, before guarantees/selling costs = home value - (A + F)
```

The old secured debt is removed after settlement; do not retain it as another liability or subtract it again from new home equity. Conversely, do not present all of `A+F` as cash received. Financed fees increase debt without increasing spendable cash. Where `A-M-U` is negative, there is an outside-cash requirement or an unfunded example, not negative spendable proceeds.

Fictional example: home value **$800,000**, advance **$200,000**, financed fees **$3,000**, existing secured debt paid off **$50,000**, and immediately paid fees **$1,500**. Then:

| Closing item | Amount |
| --- | ---: |
| New reverse-loan opening balance | $203,000 |
| New spendable cash after settlement/fees | $148,500 |
| Home value less new balance | $597,000 |
| Home equity plus new cash | $745,500 |

Before closing the listed home equity was $750,000. The $745,500 endpoint is lower by the **$4,500 total fees**. Borrowing converted part of property equity into cash and a new liability; it did not create $200,000 of extra net worth. This identity is an original bookkeeping check, not an estimate of qualification or of every lender's fee handling.

## Explicitly fictional monthly-compounding path

For teaching purposes only, suppose the $203,000 starting balance has a **constant 7% nominal annual rate compounded monthly**, no further advances or fees, no regular payments, and no repayment/default event during the selected horizon:

```text
i = nominal annual rate / 12
unconstrained balance after n months = opening balance × (1+i)^n
capitalized interest = unconstrained balance - opening balance
```

Monthly compounding and a constant rate across many years are **model assumptions**, not verified product terms. Actual compounding, rate terms, renewals and advance conditions must come from the quote/agreement. Do not label this nominal rate as an effective annual rate or APR; fees and compounding affect those concepts differently.

| Years | Unconstrained modeled balance | Capitalized interest | $800,000 flat home value minus modeled balance |
| --- | ---: | ---: | ---: |
| 0 | $203,000.00 | $0.00 | $597,000.00 |
| 5 | $287,777.93 | $84,777.93 | $512,222.07 |
| 10 | $407,961.26 | $204,961.26 | $392,038.74 |
| 15 | $578,336.19 | $375,336.19 | $221,663.81 |
| 20 | $819,863.99 | $616,863.99 | −$19,863.99 |

Numbers were independently checked with high-precision decimal arithmetic. The negative final entry is the **uncapped subtraction before any contractual protection**, not an actual borrower/estate obligation. The table also does not promise a 20-year occupancy or rate commitment.

For a fictional home-value scenario, `home value at month n = initial value × (1+g)^(n/12)`, where `g` is a chosen annual growth/decline assumption. Show multiple paths; do not call them forecasts, statistical percentiles, appraisals or assured appreciation. Home value less the modeled loan is not automatically cash on demand, and sale proceeds after costs are a separate figure.

Cash released at closing should not be shown as still available years later unless a separate spending/interest schedule preserves it. If the cash is spent, count the spending once; do not simultaneously retain the entire advance as savings. Home taxes, insurance, maintenance, utilities and any retirement-income shortfall remain part of the household cash plan even when regular loan payments are zero.

## Contract evidence needed before a real decision

- Eligibility for the actual owners/borrowers, their ages and title, residence/absence conditions, property type/location and current appraisal; the approved advance and total loan amount including financed fees.
- Exact old mortgage/HELOC payout and closure requirements, liens and amounts withheld at closing, and the resulting cash deposited.
- Quote date/validity, interest-rate type and term, compounding and rate-reset method, setup/appraisal/legal fees, later-draw charges and restrictions, and permitted voluntary repayments or prepayment penalties.
- Ownership, property maintenance, insurance and tax obligations; any default trigger, occupancy or long-term-care rule, sale/transfer trigger, last-borrower provisions and repayment deadline after a due event.
- The actual no-negative-equity/non-recourse terms, compliance requirements, covered valuation, excluded fees and post-due interest. Do not infer an entire guarantee from a marketing headline.
- Ongoing living/home costs, accessible reserves, estate timing and the intended use of the cash. The teaching tool does not calculate benefit eligibility, tax consequences of future uses/investment earnings, legal estate obligations or a personal recommendation.

FCAC says independent legal advice may be required in some provinces/territories and that provider regulation/consumer protections differ. Those are further reasons to use the actual agreement for legal and eligibility questions rather than a chart's unconstrained arithmetic. [FCAC, professional advice and provider-regulation sections](https://www.canada.ca/en/financial-consumer-agency/services/mortgages/reverse-mortgages.html)

## Suggested chart coverage

1. Cash-release waterfall: advance, existing-debt payout, immediately paid fees and net cash.
2. Opening debt bridge: advance plus financed fees, distinguished from cash received.
3. Unconstrained balance and accumulated interest over time, with compounding assumptions visible.
4. Home-value scenarios beside the same modeled loan path.
5. Arithmetic value-minus-balance sensitivity, with conspicuous contract-protection wording whenever negative.
6. Rate/horizon sensitivity for the **unconstrained balance**, or a separately funded retirement-cash runway. Avoid presenting it as a product guarantee calculator or an actual estate settlement.

## Retrieval limitations and provenance

FCAC's reverse-mortgage and home-equity pages display **October 15, 2025** as their page dates and were rechecked October 25, 2026. Their original HTML, response headers and hashes are preserved in `qa/reverse-equity/`. The HomeEquity Bank page was read successfully through the web research tool; its original tool response is preserved as `chip-about-web-response.json`. Direct anonymous HTML download attempts to the lender returned transport errors, recorded in the manifest; no lender form was submitted and no authentication was used. The Equitable Bank FAQ could not be opened through the web tool (403), so no Equitable guarantee is relied upon. No private record or source PDF was accessed.
