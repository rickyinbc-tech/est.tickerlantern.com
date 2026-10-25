# Rental moves: overlapping rent, deposits and refund timing

Research reviewed and public sources retrieved **25 October 2026**. Scope is ordinary residential tenancies to which **British Columbia's Residential Tenancy Act applies**, not every housing arrangement or a Canada-wide rule. This supports an English cash-calendar guide, not a determination of entitlement, valid notice, damages, permitted deductions or the outcome of a dispute. No personal records, accounts or PDFs were used.

The three RTB information pages below display **4 March 2026** as their update date. The BC Laws consolidation states it is current to **20 October 2026**. Those dates describe different source types; retrieval does not make an older calculator a new legal authority.

## Verified BC context, with conditions preserved

**Deposit amounts and treatment.** RTB describes a security deposit capped at half the first month's rent and a separate pet damage deposit capped at half a month's rent. A security deposit's amount does not rise automatically with later rent increases. Tenants cannot apply deposits to rent without the landlord's written permission. RTB's detailed return section identifies written tenant permission or an RTB order as grounds for retaining an amount; its short introductory sentence is less complete and should not be copied alone. Deposit interest depends on the holding period and applicable rates. Use the official calculation for a real claim; the article should accept a stated refund amount rather than infer it from the original deposit or one year's interest rate. [RTB tenancy deposits and fees, “Security deposits,” “Pet damage deposits,” and “Returning security and pet damage deposits”](https://www2.gov.bc.ca/gov/content/housing-tenancy/residential-tenancies/starting-a-tenancy/deposits-fees).

**The 15-day rule has two dates and exceptions.** RTA section 38(1) generally requires repayment with applicable interest or an application claiming against the deposit within 15 days after the **later** of tenancy end and the landlord's receipt of the tenant's written forwarding address. Sections 38(2)–(5) preserve exceptions involving lost inspection rights, existing orders and written consent to retention. Section 39 addresses failure to provide that address within one year. Sections 38(6) and 38.1 address doubling/orders in specified circumstances; a cash illustration must not automatically award or collect double. Section 20 prohibits multiple pet deposits for one agreement regardless of pet count. These are conditional statutory provisions, not a promise that a bank account receives a full refund on day 15. [Current RTA, sections 20, 38, 38.1 and 39](https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/02078_01/).

**Inspection records matter.** RTB says a tenant should have two opportunities to participate in a move-in inspection, with written notice of the final opportunity, and that failure to participate may affect deposit-return rights. The landlord must provide a copy of the move-in report within seven days. Keep the inspection arrangements, completed report and evidence of its delivery; a model cannot decide whether a party's rights were extinguished. [RTB move-in condition inspection, tenant and landlord responsibilities](https://www2.gov.bc.ca/gov/content/housing-tenancy/residential-tenancies/starting-a-tenancy/move-in-condition-inspection).

RTB also addresses move-out inspections, cleaning, reasonable wear and tear and proper notice. Leaving early or without proper notice may create compensation exposure. These issues can affect a real settlement; the model should use separately confirmed rent obligations and an independently stated refund expectation. It should not calculate legal rent proration, declare a deduction justified or assume that physically moving ends the old tenancy. [RTB moving out of rental units, “Giving notice,” “Cleaning the rental,” and “Condition inspections”](https://www2.gov.bc.ca/gov/content/housing-tenancy/residential-tenancies/ending-a-tenancy/moving-out-of-rental-units).

**Service and cash arrival are different.** The official deposit-return calculator asks for the tenancy-end date, forwarding-address delivery information and delivery method. Its introductory text describes when the landlord must initiate a return, obtain permission or apply to RTB. This supports keeping the actual/expected cash-arrival date separate from legal process dates. The captured HTML includes a March 2021 footer and static demonstration placeholders, including an old sample deadline. No calculator was submitted, and no sample deadline is evidence for this article. [RTB deposit-return calculator, introductory instructions](https://www.housing.gov.bc.ca/rtb/WebTools/ReturnTenantDeposit.html).

Some RTB information-page reads returned HTTP 502 through the web tool, while anonymous direct retrievals returned successful HTML. The source text and visible update dates were inspected in those original captures; the current Act was also read successfully through the web tool. No authentication or access-control workaround was used.

## Keep law separate from the fictional calendar

The guide can explain the BC rule in prose while taking these **independent scenario inputs**:

- Cash already available for this move, excluding old deposits still held and money reserved for other obligations.
- Old and new rent amounts and each actual payment date, including any overlap.
- New security and optional pet deposit amounts and dates, entered from the proposed agreement.
- Moving/setup costs and payment dates, excluding anything already inside rent or another line.
- Expected old-deposit cash refund, including any separately verified interest or agreed adjustments, and its assumed arrival date.
- A later arrival or no receipt within the chart horizon as alternative assumptions.

An expected refund is not accessible cash. A valid legal claim is also not a completed payment. The tool should not derive the arrival day as `tenancy end + 15`, decide when service legally occurred, apply deemed-service rules, calculate penalties, or convert a disputed claim into certain cash. For a disputed amount, allow the expected receipt to be reduced or set to zero during the horizon without deciding the eventual legal result.

Use a discrete dated cash ledger: `cash after event = prior cash + actual/assumed receipts − payments`. Include the balance before the first event. Define the additional opening cash required as the positive amount needed to eliminate the lowest signed balance. A negative point is an unfunded planned payment, not an approved overdraft, a suggested missed rent payment or permission to use another person's funds.

If several events share one date, their end-of-day net may hide an earlier shortage. Either process payments before receipts as a disclosed conservative convention or collect actual availability times. A cheque's delivery, deposit and spendable balance need not be the same modeling event. No processing-time prediction is made here.

## Reviewed original cash example

These dates, prices and receipts are **fictional**, not statutory deadlines or records of a tenancy. Assume the new tenancy starts 15 November and the old tenancy ends 30 November; the rent amounts and payment dates are simply entered obligations. The model does not establish that a specific lease can be ended on those terms.

Opening accessible move cash is **CAD 8,500**, immediately before 1 November 2026. An old **CAD 1,100** security deposit is already held elsewhere and is excluded from that cash. The new rent is CAD 2,600 and its entered security deposit CAD 1,300; no new pet deposit is selected. No income, other household bills or interest is included in this limited reserve ledger.

| Date | Assumed event | Cash movement | Cash afterward |
| --- | --- | ---: | ---: |
| 1 Nov 2026 | Last entered old-home rent | -2,200 | 6,300 |
| 5 Nov 2026 | New security deposit | -1,300 | 5,000 |
| 15 Nov 2026 | First entered new-home rent | -2,600 | 2,400 |
| 20 Nov 2026 | Moving cost | -700 | 1,700 |
| 5 Dec 2026 | Assumed old-deposit receipt | +1,100 | 2,800 |
| 15 Dec 2026 | Next entered new-home rent | -2,600 | 200 |

At a 20 December horizon, total outgoing cash is **CAD 9,400**, the assumed receipt is CAD 1,100 and the net reduction in accessible cash is **CAD 8,300**. The smallest balance is CAD 200. If the refund instead arrives on **5 January 2027**, the displayed horizon includes no refund cash: the lowest and ending balances are **negative CAD 900**. With these exact event dates, the opening-cash requirement rises from CAD 8,300 to CAD 9,400. A later refund cannot pay the 15 December bill without a separate identified source in the interim.

Do not label that assumed January receipt an unlawful delay or infer fault from it; the example does not specify valid service, inspection rights, consent, orders, an application or all other relevant facts. Conversely, choosing 5 December does not guarantee that date under BC law.

If an additional CAD 1,300 pet deposit is assumed paid on 5 November, both paths require another CAD 1,300 of cash at that date. That is a scenario amount consistent with half the stated new monthly rent, not a finding that a particular landlord may require it. Any applicable service/guide-animal or other exception must be checked separately; the calculator should not assess eligibility or entitlement.

## Cash use is not identical to expense or income

For the full-refund example, old rent, two new-rent payments and moving cost total **CAD 8,100** of modeled consumed costs. The new CAD 1,300 deposit remains held outside accessible cash. The old CAD 1,100 comes back from a previously held amount; its return is not new income in this teaching ledger.

The bookkeeping check is `ending cash + new deposit held = opening cash + old deposit held − modeled consumed costs`: `200 + 1,300 = 8,500 + 1,100 − 8,100`. This is original scenario accounting, not an assertion that every deposit will be fully recovered or a tax classification. Any actual retained amount, interest, compensation or disputed receivable needs separate treatment. Do not add the old deposit to opening bank cash and then add its refund again.

Paying both homes during the overlap can be an actual cash/consumption cost under the assumed obligations. Deposits can create a temporary liquidity requirement even when eventually returned. The refund delay changes the calendar without necessarily changing the eventual total refund. It will increase the worst shortfall only when its position relative to other cash events makes that happen; do not hard-code an automatic increase for every later date.

## Real-world information to verify, without adjudicating it

Confirm that the applicable BC tenancy regime covers the arrangement, who the legal tenants and landlord are, written lease terms, permitted pets, deposit receipts/holding dates, rent dates, proper notice, the old tenancy's actual end, keys/possession arrangements and any negotiated overlap or proration. Keep move-in and move-out reports, participation offers, photographs and records of delivery. Verify the written forwarding address, permitted service method and legally relevant receipt date. Identify written deduction consent, existing orders, a filed dispute/application, the amount actually returned and payment availability. Confirm any interest with the official calculator and current rules. This checklist identifies evidence a cash plan needs; it does not resolve a claim.

## Scope overlap and chart opportunities

The local source tree and `origin/main` at **8332e76** were searched for rental moves, overlapping rent, security/pet deposits and deposit refunds. No existing rental-move deposit guide was found. `moving-home-cash-release` in `src/planning-tax-home-guides.js` concerns property sale/purchase settlements and mortgages. `home-purchase-down-payment-cash` concerns a purchase deposit credited toward a home price. Those do not cover a rental deposit held and later returned. Preserve the utility research note locally; its topic now has an upstream guide and should not be duplicated.

Six distinct graphics could show dated payment/receipt bars; baseline and delayed signed cash paths; old/new rent overlap; accessible cash versus deposits still held; a total cash-use waterfall; and a matrix of refund amount and arrival date showing the largest unfunded balance. Label every modeled date and amount hypothetical. The cash/deposit chart must never present a deposit still held as spendable money, and the sensitivity must not predict a legal outcome or probability.

## Capture and arithmetic verification

Ignored `qa/rental-move/retrieval-manifest.json` records five original successful public HTML captures, response headers, retrieval timestamps and SHA-256 hashes. No PDFs or private sources were retrieved. `qa/rental-move/validate_research.py` checks those hashes, source-text anchors and the baseline/delayed event arithmetic and bookkeeping identity; results are in `qa/rental-move/validation-results.json`. No application, model, registry, test, commit or deployment changes are part of this task.
