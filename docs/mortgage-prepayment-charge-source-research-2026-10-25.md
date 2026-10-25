# Mortgage prepayment charges: primary-source research

Reviewed live official Canadian HTML on **October 25, 2026**. Scope: charge mechanics and sensitivity, not a transaction quote or a prediction that refinancing is advantageous. No private records or source PDFs were used. Original public HTML captures, response headers, retrieval times and SHA-256 hashes are confined to `qa/mortgage-charge/`.

## Existing-site distinction

Read `src/planning-protection-transition-guides.js`, article `mortgage-refinancing-fees-cost-recovery`: it treats the break charge as an external quote and compares payment relief, interest and fees, and remaining debt over a common window. Read the `mortgage-prepayment-liquid-savings` description: its lump sum is explicitly assumed penalty-free. The new article can explain **how an illustrative charge changes with the amount prepaid, rate gap and remaining term**, then explain the inputs a real quote needs. Avoid repeating amortizing-refinance recovery schedules or treating this charge tool as a refinancing recommendation.

## Verified contract facts

| Topic | Narrowly supported fact | Controlling source |
| --- | --- | --- |
| Open versus closed | FCAC says an open mortgage can be broken without a prepayment penalty; a closed mortgage normally triggers a penalty when broken. Other fees may still apply. | [FCAC, Breaking your mortgage contract, “Cost to break”; October 15, 2025](https://www.canada.ca/en/financial-consumer-agency/services/mortgages/break-mortgage-contract.html) |
| What triggers a charge | Prepaying above the allowed amount, breaking the contract, moving the mortgage to a different lender before term end, or repaying it early, including on a sale, can trigger a charge. “Prepayment penalty”, “prepayment charge” and “breakage cost” are terms for this fee. | [FCAC, Mortgage prepayment: know your rights; October 15, 2025](https://www.canada.ca/en/financial-consumer-agency/services/rights-responsibilities/rights-mortgages/rights-prepayments.html) |
| Privileges | The contract may permit payment increases or lump sums without a charge. Lenders' permitted amounts, dates and conditions differ; an annual allowance is often linked to original principal, not the current balance. Unused allowances generally cannot be carried forward. | [FCAC, Mortgage fees: Prepayment penalties, “What is a prepayment privilege”; October 15, 2025](https://www.canada.ca/en/financial-consumer-agency/services/mortgages/reduce-prepayment-penalties.html) |
| Cost variables | FCAC identifies the amount prepaid, months remaining in the **term**, interest rates and lender methodology as cost drivers. The term is distinct from remaining amortization. | [FCAC, Mortgage fees: Prepayment penalties, cost section](https://www.canada.ca/en/financial-consumer-agency/services/mortgages/reduce-prepayment-penalties.html); [FCAC, Choosing a mortgage, term/amortization definitions](https://www.canada.ca/en/financial-consumer-agency/services/mortgages/choose-mortgage.html) |
| Porting | A portable mortgage may transfer its balance, rate and terms to another property. Eligibility and restrictions must be checked. A smaller new mortgage can still trigger a penalty; portability is not an unconditional fee waiver. | [FCAC, Choosing a mortgage, “Portable mortgages”; October 15, 2025](https://www.canada.ca/en/financial-consumer-agency/services/mortgages/choose-mortgage.html) |
| Other cash costs | Breaking a contract can involve administrative, appraisal, reinvestment and discharge fees, and repayment of a mortgage cash-back incentive. These are additional to the break-charge calculation. | [FCAC, Breaking your mortgage contract, cost list](https://www.canada.ca/en/financial-consumer-agency/services/mortgages/break-mortgage-contract.html) |
| Discharge | Removing the lender's registered security is a separate process. Lender discharge charges and professional fees may apply, depending on the contract and province/territory. Paying off principal does not itself automatically remove the registered security. | [FCAC, Discharging a mortgage; September 25, 2025](https://www.canada.ca/en/financial-consumer-agency/services/mortgages/mortgage-discharge.html) |

Open/closed describes prepayment flexibility; fixed/variable describes interest-rate behaviour. Avoid using “variable” as a synonym for “open”.

## Three months of interest versus IRD: scope matters

FCAC describes the penalty as **usually** the greater of three months of interest and IRD. The rate pair varies: original posted or contract/discounted rate, versus a comparable remaining-term posted rate with or without the original discount. A new advertised rate is not automatically the correct comparison rate. [FCAC, Mortgage fees: Prepayment penalties, IRD section](https://www.canada.ca/en/financial-consumer-agency/services/mortgages/reduce-prepayment-penalties.html)

For an explicit **lender example**, RBC's live Canadian consumer page says its closed variable-rate charge is three months of interest on the amount prepaid, using the mortgage interest rate. For a closed fixed-rate mortgage it describes the greater of three months of interest and IRD. Its IRD comparison uses the posted rate on the prepayment date for a similar remaining term and prepayment options, less the original rate reduction. RBC says the actual calculation incorporates present value and a balance declining with scheduled payments; it directs borrowers to obtain the exact cost. [RBC, Understanding Mortgage Prepayment Charges, variable/fixed calculation sections; reviewed October 25, 2026, no clear publication date displayed](https://www.rbcroyalbank.com/mortgages/understanding-mortgage-prepayment-charges.html)

Do **not** turn this into “Canadian variable mortgages always cost exactly three months' interest.” FCAC's current illustrative information box for a **variable** mortgage actually shows a greater-of-three-months/IRD clause. It is an example disclosure, not an actual offer or a rule establishing every variable contract's economics. This makes the need to verify the signed contract especially clear. [FCAC, Variable mortgage information-box example; October 7, 2025](https://www.canada.ca/en/financial-consumer-agency/services/industry/bulletins/information-box-examples/credit-variable-fixed-mortgage.html)

A lender's own online result may also be only approximate. Scotiabank's calculator says its IRD estimate will in most cases exceed its actual charge, that rate/comparable-term changes matter, and that some mortgage types are excluded. Its default partial-prepayment allowance is not proof that a customer's contract has that allowance. Its HTML also contains static example figures; do not publish those as today's actual rates or quotes. [Scotiabank, Mortgage Prepayment Charge Calculator, disclaimer; reviewed October 25, 2026](https://dmts.scotiabank.com/tools/prepayment/en/index.html)

## Explicitly hypothetical simple arithmetic

Use fictional inputs and an upfront label such as **“Simplified illustration — not a lender payout quote.”** The calculations below assume a chargeable amount `P`, constant annual rates expressed as decimals, and `m` months left in an unexpired term. They hold the amount constant and ignore present value, scheduled principal reduction, exact day counts, rate-term buckets, contract exceptions and quote validity dates.

```text
three-month-interest illustration = P × contract rate × 3/12
positive illustrative rate gap = max(0, contract rate - comparison rate)
simple IRD illustration = P × positive rate gap × m/12
hypothetical fixed-charge illustration = max(three-month-interest illustration, simple IRD illustration)
```

The zero floor on the rate gap and greater-of selection are **declared model assumptions**, not a replacement for a lender's algorithm. `P` means the amount actually subject to a charge, which must be confirmed. Do not automatically subtract an annual privilege from a full payout or treat every dollar of current principal as chargeable in a partial-prepayment example. Nor should three calendar months automatically be equated with a specific contractual number of days.

For an open-mortgage scenario, the prepayment penalty is zero under FCAC's stated principle, but independently entered discharge/other costs can remain. At term maturity, FCAC says a lump sum may be made without a prepayment penalty; do not extrapolate a three-month floor into a maturity event. Privilege and early-renewal exceptions near maturity still require the actual contract. [FCAC, Prepayment penalties, “Wait until the end of your term”](https://www.canada.ca/en/financial-consumer-agency/services/mortgages/reduce-prepayment-penalties.html)

### Original checked example

Fictional inputs: `P=$400,000`, contract rate `5.5%`, comparison rate `3.5%`, `m=24`, other cash costs `$1,500`.

| Item | Calculation | Result |
| --- | --- | ---: |
| Three-month-interest illustration | $400,000 × 0.055 × 3/12 | $5,500 |
| Positive rate gap | 5.5% − 3.5% | 2 percentage points |
| Simple IRD | $400,000 × 0.02 × 24/12 | $16,000 |
| Hypothetical selected fixed charge | max($5,500, $16,000) | $16,000 |
| Charge plus assumed other cash costs | $16,000 + $1,500 | $17,500 |

These figures were independently calculated with decimal arithmetic. They do not replicate RBC, Scotiabank or any other lender's exact quote.

The **charge-method crossover** has a precise meaning in this limited model. For `P>0` and positive rate gap `g`, equality occurs when `g × m = 3 × contract rate`. The example crosses at **8.25 months** when the 2-point gap is held fixed. At 24 months, it crosses at a gap of **0.6875 percentage points**. This is equality between two hypothetical charge methods, not an economic refinancing break-even point.

Varying `m` while holding all other inputs fixed is a set of independent scenarios. It is not a forecast of a customer's future charge: the actual balance, available comparable term, comparison rate and contract options can change with the payout date. RBC specifically identifies these as reasons for a changed charge. [RBC, “Why can the prepayment charge change?”](https://www.rbcroyalbank.com/mortgages/understanding-mortgage-prepayment-charges.html)

## Upfront cash and any recovery threshold

An educational cost stack can add the assumed penalty, administrative/discharge/professional costs and cash-back repayment. Label only charges and costs as expenses. **Mortgage principal repaid is a reduction in debt**, not another break fee. A real payout also needs accrued interest and any secured linked-product amounts, which this simple charge model does not calculate.

If adding a sixth “recovery requirement” chart, use a transparent mathematical threshold, for example:

```text
constant monthly net benefit required to recover cost in H months = upfront cost / H
```

In the fictional example, `$17,500 / 24 = $729.17` per month. This does not assert that the borrower will achieve that benefit. It ignores discounting and assumes the stated net benefit continues for the selected period. Do not call a lower mortgage payment itself an interest saving, because changed principal repayment and amortization can alter payments. Full refinancing benefit calculations belong in the existing common-window refinancing guide. The standalone penalty tool cannot determine a financially optimal break date or whether a new loan will be approved.

## What requires a dated contract quote

- The mortgage's open/closed status, fixed/variable/capped/special-product terms, borrower-specific exceptions and payout date.
- The chargeable full/partial prepayment amount, unused privilege, annual reset definition and any restriction on using a privilege shortly before payout.
- The original posted rate, contract rate and original discount; the current comparable-term rate, how its term is selected, and which discounts are applied.
- Day-count and rounding rules, actual scheduled declining balances, present-value formula, and any near-maturity/early-renewal or portability provisions.
- The exact charge, cash-back clawback, discharge/administration/professional fees, other secured amounts, and how long the statement remains valid.

FCAC says federally regulated lenders must explain calculation components. Under the mortgage-prepayment code followed by participating banks, a written prepayment statement includes the applicable charge, calculation explanation, any validity period, factors that can change it and other payable amounts. Preserve this scope; do not say every Canadian lender follows the same code. [FCAC, Mortgage prepayment: know your rights, information and code sections](https://www.canada.ca/en/financial-consumer-agency/services/rights-responsibilities/rights-mortgages/rights-prepayments.html)

FCAC's older CG-9 disclosure guidance discusses complex calculations including present-value components, but it expressly says the current Financial Consumer Protection Framework takes precedence where inconsistent. The current consumer-rights page is the cleaner reader-facing source. [FCAC CG-9, notice and calculation-components discussion](https://www.canada.ca/en/financial-consumer-agency/services/industry/commissioner-guidance/guidance-9.html)

## Suggested six-chart coverage

1. Compare the three-month and simple-IRD amounts, with the hypothetical selected charge identified.
2. Plot independent remaining-term scenarios, holding the prepaid amount and rates fixed and explaining that this is not a future quote forecast.
3. Plot rate-gap scenarios and identify the arithmetic charge-method crossover.
4. Use a remaining-months × comparison-rate sensitivity grid, with explicit percentage-point units.
5. Stack penalty and separately assumed other cash costs; omit repaid principal from fee totals.
6. Show the constant net monthly benefit required to recover those costs over alternative horizons, without predicting an achieved saving or duplicating an amortization model.

Use official sources for contract mechanics and fictional inputs for every plotted rate, dollar value and horizon. No observed lender rates, recommended lender, universal penalty formula or actual customer charge has been established by this research.
