# Vehicle trade-ins and negative equity: source research

Reviewed live official Canadian HTML on **October 25, 2026**. Intended guide: show how an old vehicle's loan payout and trade-in proceeds affect replacement financing, then distinguish a smaller payment from a smaller debt or lower total interest. All example prices, rates, fees, loan terms and value-loss paths below are fictional. No private documents, live products or source PDFs were used.

## Existing-site scope and distinct angle

Reviewed the car guide/model in `src/planning-life-events-guides.js` and `src/planning-life-events-models.js`: it already follows one vehicle's purchase financing, running costs, value/debt paths, and settlement at sale. Reviewed `car-lease-buy-common-exit-cost` in the home/car/survivor files: it compares a full-term lease return with buying and selling at the same date, including terminal loan settlement.

The new angle should be the **replacement transaction's balance bridge**: the dealer's gross trade allowance, the old lender's payout, the cash shortfall or positive equity, and the amount transferred into a replacement loan. Show the incremental financing burden of old debt and how a longer replacement term can mask it. Do not present this as another full ownership-cost or lease comparison, or as proof that replacing a car is preferable to keeping it.

## Verified primary-source facts

| Topic | Supported finding | Official source |
| --- | --- | --- |
| Negative equity | The vehicle is worth less than the amount owed on its loan. Selling/trading does not erase that shortfall. | [FCAC, Financial risks when buying a car, depreciation/negative-equity section; October 14, 2025](https://www.canada.ca/en/financial-consumer-agency/services/loans/financing-car/risks.html) |
| Carrying debt into the next purchase | Trading while owing more than the vehicle is worth can require borrowing for the replacement plus the old shortfall, producing a larger loan and more interest. | [FCAC, Financial risks when buying a car, financial risks of negative equity](https://www.canada.ca/en/financial-consumer-agency/services/loans/financing-car/risks.html) |
| Loan-term tradeoff | FCAC calls loans of 72 months or more long-term and explains that they may lower regular payments while increasing total interest and prolonging negative equity. Its numeric examples are illustrations. | [FCAC, Financial risks when buying a car, long-term loan sections](https://www.canada.ca/en/financial-consumer-agency/services/loans/financing-car/risks.html) |
| Depreciation | FCAC explains that cars lose value and that negative equity can persist when debt falls more slowly. This does not establish the future selling price of a particular vehicle. Do not turn its generic depreciation figures into a guaranteed personal value path. | [FCAC, Financial risks when buying a car, depreciation discussion](https://www.canada.ca/en/financial-consumer-agency/services/loans/financing-car/risks.html) |
| Trade-in rollover | BC's Vehicle Sales Authority identifies adding the old trade-in loan's negative equity to a new loan as a cause of negative equity. It emphasizes the vehicle's actual price, fees, financing costs and any balloon amount, rather than just a monthly payment. | [VSA, Negative Equity; reviewed October 25, 2026, no clear publication date displayed](https://vsabc.ca/consumers/get-information-about-vehicle-purchasing/consumer-protection-facts/negative-equity/) |
| Payout responsibilities | The VSA says an outstanding loan on a trade-in must be paid off, and the purchase agreement should describe the payout and lien-discharge terms. This is BC consumer guidance; do not silently apply detailed BC legal duties to every province. | [VSA, Terms of the pay out and discharge of the lien on trade-in](https://www.myselfhelp.vsabc.ca/S2-Q1-Q1A-S06-Q2-S7-Q3-S8-Q4-Q5-Q25-Q28-S46) |
| Lien evidence | FCAC explains that a lien is a registered lender claim and stays registered until the debt is fully paid; a vehicle can have multiple liens. Its guidance calls for verifying removal and obtaining written proof of repayment/removal when buying a used vehicle. | [FCAC, Risks associated with car liens; reviewed October 25, 2026](https://www.canada.ca/en/financial-consumer-agency/services/loans/financing-car/risks-car-liens.html) |

No source establishes that a lender will approve financing the shortfall, or approve the same rate, maximum loan amount or term as a replacement purchase without old debt. Keep that approval boundary explicit.

## Original balance bridge and naming

For a tax-excluded teaching transaction, define:

```text
L = old lender's dated payout amount
T = dealer's gross trade-in allowance, before settling old debt
P = replacement vehicle price before tax
F = separately entered fees assumed financed, excluding tax
C = new cash applied at closing

signed trade equity = T - L
old shortfall = max(0, L - T)
positive trade equity = max(0, T - L)

replacement amount to fund = P + F + L - T - C
                          = P + F + old shortfall - positive trade equity - C
```

The two final expressions are alternatives. Do not add `L-T` **and** the old shortfall, or subtract the full trade allowance and positive trade equity again. The car does not provide `T` of free cash while the old loan is left unsettled.

If the amount to fund is positive, it can be the assumed new principal, subject to lender approval. If zero or negative, show no borrowing and handle any unapplied cash/returned equity explicitly; do not create a negative loan or silently count an unused down payment as spent.

These are accounting definitions for the example, not a reconstruction of every dealer's finance document. `L` may need more detail than an app's principal display, and a gross trade offer is different from the net amount available after payout. Use the actual written quotes and agreement to reconcile them.

## Independently calculated fictional example

Assume a dated old-loan payout of **$25,000**, a dealer trade allowance of **$18,000**, a replacement vehicle priced at **$34,000 before tax**, **$1,000** of financed fees excluding tax, and **$3,000** cash applied. Old shortfall is **$7,000**; the replacement principal is **$39,000**.

```text
$34,000 replacement price
 $1,000 financed fees
$25,000 old payout
-$18,000 gross trade allowance
 -$3,000 cash applied
=$39,000 new loan
```

The replacement car's starting illustrative value is $34,000, not $39,000. Financing fees and old debt do not automatically increase its market value. Therefore opening negative equity on the replacement is **$5,000**, which differs from the old $7,000 shortfall because fees and cash also affect the bridge.

For an ordinary fictional fully amortizing loan, assume a constant **8% nominal annual rate divided by 12**, equal month-end payments and no balloon, payment holiday, tax, additional borrowing or prepayment charge. This monthly-rate convention is an explicit model choice, not a claim that every auto-loan quote uses the same interest or APR calculation.

| New principal | Repayment months | Monthly payment | Total interest over full term | Principal after 12 payments |
| --- | ---: | ---: | ---: | ---: |
| $39,000 | 48 | $952.10 | $6,700.99 | $30,383.36 |
| $39,000 | 72 | $683.80 | $10,233.34 | $33,723.77 |
| $39,000 | 84 | $607.86 | $12,060.44 | $34,669.14 |

These original figures were checked with high-precision decimal arithmetic, retaining unrounded values until display. A longer term reduces the payment here but leaves more debt after one year and creates more lifetime interest. The table is not a lender offer or an APR disclosure.

At the same fictional rate/72-month term, the $7,000 old shortfall adds approximately **$122.73 a month** and **$1,836.75 of interest**. This is the difference from an otherwise identical $32,000 loan, calculated before rounding. The $32,000 case would require funding that $7,000 elsewhere; its smaller principal is not debt forgiveness or a cost-free alternative.

If comparing “pay the shortfall in cash” with “roll it into financing”, match starting household resources. The cash option uses an additional $7,000 immediately. With identical initial resources, the rollover option retains that $7,000 as cash initially; its subsequent payments are higher. A comparison that omits the retained cash or the extra upfront outflow is incomplete. Isolating incremental interest is valid under the explicitly identical rate/term assumptions; declaring an overall winner needs liquidity and funding accounted for.

## Vehicle-value paths are scenarios

One optional fictional path is `value at month m = starting value × (1-d)^(m/12)`, where `d` is an entered effective annual decline. This is a smooth assumption, not an appraisal, distribution of resale outcomes, dealer guarantee or FCAC empirical series.

For example only, a 15% annual decline takes a $34,000 value to $28,900 after 12 months. Beside the fictional 72-month loan's $33,723.77 balance, that creates a $4,823.77 modeled shortfall. A different assumed value path can change the size and duration of negative equity. A chart crossing debt and value does not guarantee a future date when the car can be sold without additional cash; actual payout and net sale proceeds must be checked then.

Keep depreciation separate from the closing transaction. Do not count the old shortfall as new depreciation of the replacement, or add depreciation again to a cash ledger that already subtracts the car's sale proceeds.

## Tax and trade-in boundaries

The proposed teaching model can **exclude all GST/HST/PST/QST and tax credits** and say so beside the starting principal. The $39,000 example is a tax-excluded financing illustration, not the full amount a real purchase would necessarily finance.

There is no single universal tax shortcut to apply to `L-T`. CRA's current RC4022 guidance distinguishes trade-ins from customers who must charge GST/HST from trade-ins by customers who do not. In the latter case it describes tax on the selling price less the trade allowance; in the former it describes separate purchase and sale transactions. Do not substitute the negative-equity amount for the gross trade allowance in that rule. [CRA, General Information for GST/HST Registrants, “Trade-ins”](https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/rc4022/general-information-gst-hst-registrants.html#H2_280)

CRA also says GST/HST generally does not apply to a private sale by a non-registrant, but provincial motor-vehicle tax may still be payable on registration and is administered separately. It directs readers to the relevant province's rules. Dealer/private sale, registrant status, place of supply, provincial tax provisions and any exemptions therefore require separate review. No provincial rate, trade-in credit, exemption or tax calculation has been verified for this fictional transaction. [CRA, GST/HST and motor vehicles, private-sale section](https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/charge-collect-specific-situations/motor-vehicles.html)

For an actual transaction, obtain the dealer's itemized taxable price and trade-in treatment and verify them under the applicable federal/provincial rules. Do not hide a tax assumption in a fee slider described as “all in”. The narrative can identify taxes as excluded without pretending they are zero in the real world.

## What must come from real quotes

- **Old lender:** dated payout figure, validity date, accrued-interest treatment, charges or refunds included, payments pending, and settlement/lien-release instructions. Do not assume current displayed principal is the complete amount due on delivery day.
- **Dealer:** written replacement cash price, gross trade allowance and its conditions, separately itemized fees/add-ons, taxes, any rebate conditions, cash/deposit applied, old payout responsibility and financing amount.
- **New lender:** approved principal, interest-rate and APR disclosures, term, payment frequency and exact payment, fees, balloon/residual obligations, prepayment conditions and total borrowing cost. The model must not promise old-debt financing is available.
- **Transaction evidence:** who pays the old lender, when, how the lien is cleared, and how the settlement appears in the signed agreement. A dealer's promise to settle an old loan does not mean the shortfall was waived.
- **Vehicle value:** a real current trade-in offer/appraisal and a separate, cautious assumption about future sale proceeds after any selling costs. A fictional decline slider is not current resale evidence.

The VSA's agreement/payout guidance and FCAC's lien guidance support verifying settlement; the list above is a practical evidence checklist, not an assertion that identical disclosure duties apply in every jurisdiction. [VSA payout terms](https://www.myselfhelp.vsabc.ca/S2-Q1-Q1A-S06-Q2-S7-Q3-S8-Q4-Q5-Q25-Q28-S46); [FCAC car liens](https://www.canada.ca/en/financial-consumer-agency/services/loans/financing-car/risks-car-liens.html)

## Suggested visual coverage

1. Old payout versus gross trade allowance, showing signed equity and any cash shortfall.
2. Replacement-financing waterfall, with old payout and trade proceeds appearing once each.
3. Payment and lifetime-interest comparison across fictional replacement terms.
4. New-loan balance versus fictional replacement-value scenarios.
5. Incremental payment/interest from financing different old shortfalls at the same stated rate/term.
6. A sensitivity grid using trade offer and new-loan term, or a properly funded cash-versus-rollover comparison.

Show quote dates, tax exclusions, rate convention, financed-fee treatment and value assumptions near the charts. No statistical resale forecast, lender recommendation, credit approval or full keep-versus-replace decision is established by this research.

## Retrieval record

Seven official HTML captures and their response headers are preserved under **`qa/car-equity/`**, with exact source URLs, retrieval timestamps, byte counts and SHA-256 hashes in `retrieval-manifest.json`. FCAC financing-options and risks pages display October 14, 2025 as their page date; other undated pages should retain the October 25, 2026 review date. No PDF or private account information was retrieved.
