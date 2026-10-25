# Payment frequency, promotional savings interest, and card FX: source research

Reviewed live official HTML sources on **October 25, 2026**. These findings support general English-language financial-planning education, with original hypothetical examples. They are not a product comparison or a quotation of rates available to a reader. No private account records or source PDFs were used.

## 1. Canadian mortgage payment frequency

### Verified facts

- FCAC defines monthly payments as one per month, regular biweekly as one every two weeks with payment `monthly payment × 12 ÷ 26`, and accelerated biweekly as one every two weeks with payment `monthly payment ÷ 2`. Semi-monthly is twice per month and therefore differs from biweekly. [FCAC, Choosing a mortgage that is right for you, “Payment frequency”](https://www.canada.ca/en/financial-consumer-agency/services/mortgages/choose-mortgage.html)
- FCAC explains that accelerated weekly or biweekly schedules commit more money than monthly payments: the equivalent of one additional monthly payment annually. This can reduce interest. [FCAC, Paying off your mortgage faster, “Choose an accelerated option”](https://www.canada.ca/en/financial-consumer-agency/services/mortgages/pay-mortgage-faster.html)
- Payment increases and lump sums are subject to the mortgage contract and its prepayment privileges; exceeding those limits can trigger penalties. FCAC also says a payment increase normally cannot be reduced until term end. [FCAC, Paying off your mortgage faster, “Making additional mortgage payments”](https://www.canada.ca/en/financial-consumer-agency/services/mortgages/pay-mortgage-faster.html)
- RBC's public fixed-rate payment-frequency example explicitly assumes a constant rate over the amortization and semiannual compounding, not in advance. Its accelerated biweekly payment is half the monthly amount. This supports using that convention in an explicitly labelled fixed-rate illustration; it does not establish a universal convention for every mortgage. [RBC, Accelerating your mortgage payment schedule, example and legal disclaimers 1 and 3](https://www.rbcroyalbank.com/mortgages/accelerate-mortgage-payment.html)

### Original model specification and mathematical derivation

Use a hypothetical loan, constant nominal annual rate `j` compounded twice yearly, remaining amortization `Y`, no fees, no property-tax component, no skipped payments, no renewals or rate changes. These are editorial assumptions, not lender promises.

For `f` equal payment periods annually, derive the periodic effective rate by equating annual growth:

```text
(1 + i_f)^f = (1 + j/2)^2
i_f = (1 + j/2)^(2/f) - 1
monthly rate i_12 = (1 + j/2)^(1/6) - 1
biweekly rate i_26 = (1 + j/2)^(1/13) - 1
```

Compute monthly principal-and-interest payment:

```text
N = 12 × Y
M = P × i_12 / [1 - (1 + i_12)^(-N)]
if j = 0: M = P/N
```

For FCAC-style schedules, hold `M` as the reference: monthly `M`, regular biweekly `M × 12/26`, accelerated biweekly `M/2`. Apply the corresponding periodic rate to the outstanding balance and cap the last payment at the remaining balance plus accrued interest. Under a 26-payment modelling year, annual scheduled commitments are `12M`, `12M`, and `13M`. Thus acceleration adds `M` annually, or **8.333...%** above the monthly annual commitment. These are arithmetic consequences of FCAC's definitions.

Do **not** recompute a fully amortizing 26-payment annuity and call that payment FCAC's regular biweekly convention: `P × i_26 / [1 - (1+i_26)^(-26Y)]` is a different calculation. Also avoid claiming that simply changing payment dates creates the same savings as committing more money.

Use 26 equal periods as an annualized comparison, not a literal dated calendar. A dated every-14-days calendar can occasionally contain 27 debits in a calendar year; handle actual dates separately if shown. A full-life constant-rate projection must be labelled an illustration because it assumes future renewals retain the same rate. Contract rounding, payment dates, and compounding can produce lender differences.

Suggested charts: annual scheduled cash commitment; outstanding balance over years; cumulative interest; annual interest versus principal. Display the additional annual cash commitment alongside any accelerated-interest saving.

## 2. Promotional savings-account rates

### Verified facts

- FCAC says savings rates are generally quoted annually. Financial institutions usually calculate interest daily and deposit it monthly; introductory rates last a limited time and may then fall. Different accounts may use different balance tiers and compounding arrangements. Withdrawal or transfer fees may apply. [FCAC, Savings accounts, “Interest rates”, “Service fees”, and “Annual interest rate and compounding”](https://www.canada.ca/en/financial-consumer-agency/services/banking/bank-accounts/savings-account.html)
- Tangerine's public offer terms identify the promotional rates as annualized, calculated daily and paid monthly. Eligibility depends on client/account conditions; eligible account types, promotional duration, opening-date timing, and aggregate balance caps matter. The FAQ says the posted rate applies after the promotional period. These are examples of conditions to inspect, not universal rules for all offers. [Tangerine, Savings account promotional offer, FAQs and legal terms](https://www.tangerine.ca/en/offers/savings-account-promo)
- Liquidity includes transfer and hold rules. Tangerine says electronic transfers usually arrive within one to two business days but arrival dates are not guaranteed. Its terms allow holds on certain incoming Canadian-dollar deposits, including EFTs, and limits or extended holds in specified circumstances. This is issuer-specific evidence against treating every savings balance as instantly spendable. [Tangerine, Account Terms, “Deposit and withdrawal transactions” and “Holds on your Account”](https://www.tangerine.ca/en/legal/account-terms)

### Original model specification and mathematical derivation

Use clearly fictional rates, balances, caps, dates, and promo lengths. A quoted `r` annual rate is not `r` earned during a short promotional window. For a simplified non-leap-year, constant-balance illustration without compounding:

```text
interest = eligible balance × annual rate × eligible days / 365
```

For a one-year comparison with a promo followed by a base rate:

```text
I = B × [r_promo × D/365 + r_base × (365-D)/365]
```

For a cap, use `min(B, cap)` only for the eligible promo balance and state how the remainder earns interest. If the promotional quoted rate includes the base rate, do not add the base again. If the offer advertises bonus-only interest, base plus bonus can be modelled only when the terms support that interpretation.

A richer simulation should accrue each day's eligible closing balance, then credit at the stipulated monthly posting date. Interest credited earlier may itself earn interest, but daily accrual is not the same as daily compounding. Define whether accrued but unpaid interest is included in displayed balances, whether the rate is a total or additional bonus, and whether the denominator changes for leap years. These are model choices that must match any real offer being analysed.

For a promotional comparison, show both promo-window dollars and a full-horizon outcome after expiry. Optional charts: annualized rate step-down; cumulative interest with expiry marker; cash interest across promo lengths; account balance under withdrawal scenarios. Avoid describing a high annualized quote as a guaranteed annual return.

### Source limitation

The live Tangerine page served unresolved dynamic rate placeholders and inconsistent numerical rate displays in the retrieved HTML. **Do not publish any numerical offer rate from this capture.** The mechanics above are supported by the textual terms, and the proposed article should use fictional rates. Offer conditions and transfer terms may change; recheck the applicable agreement before using a real account.

## 3. Foreign-currency card purchases and refunds

### Verified facts

- FCAC separates the exchange rate from the foreign-currency conversion charge. Conversion can be directly to CAD or via USD; its numerical example applies the percentage fee after conversion to CAD. FCAC says a foreign-currency refund may produce a different CAD amount because the refund-date exchange rate can differ. [FCAC, How credit cards work, “Using your credit card in a foreign country” and “Returning items”](https://www.canada.ca/en/financial-consumer-agency/services/credit-cards/credit-card-work.html)
- Mastercard's converter says its displayed amounts are indicative, banks may use another rate or add fees, and the network generally uses the authorization-time rate, falling back to processing time if needed. A merchant/ATM conversion replaces Mastercard conversion. Do not universalize an issuer's posting-date rule. [Mastercard, Currency converter, explanatory notes](https://www.mastercard.com/ca/en/personal/get-support/currency-exchange-rate-converter.html)
- Tangerine's card agreement, effective April 22, 2026, section 14, uses Mastercard's rate on the transaction posting date and says it may differ from the transaction-date rate. The agreement applies conversion fees to debit and credit transactions, does not reverse the original fee on cancellation/refund, and warns that the resulting credit can differ. Its statement exchange rate includes the network rate and issuer fee. This is a concrete issuer policy, not the rule for every card. [Tangerine, Credit Card Cardholder Agreement, section 14](https://www.tangerine.ca/en/legal/credit-card-cardholder-agreement)
- Visa describes dynamic currency conversion (DCC) as a merchant/ATM offer to bill in the cardholder's home currency with a conversion rate and additional fees. Visa requires disclosure of both currency amounts, the rate, and fees/markup, plus a choice to accept or decline; merchants must not choose for the customer. [Visa Canada, Dynamic Currency Conversion](https://www.visa.ca/en_CA/travel-with-visa/dynamic-currency-conversion.html)
- Bank of Canada exchange rates are indicative averages of aggregated financial-institution price quotes. Its daily average is not a promise of the rate a card transaction will receive. [Bank of Canada, Exchange rates](https://www.bankofcanada.ca/rates/exchange/)

### Original model specification and mathematical derivation

Define FX inputs as **CAD per one unit of foreign currency**, so the direction is unambiguous. Use hypothetical rates, with no interest, rewards, tax, disputed charges, merchant cancellation penalties, or partial-refund allocation unless expressly modelled.

```text
foreign purchase amount = F
purchase conversion rate = x_p CAD per foreign unit
refund conversion rate = x_r CAD per foreign unit
purchase fee rate = f_p
refund fee rate = f_r
CAD purchase = F × x_p × (1 + f_p)
CAD refund = F × x_r × (1 - f_r)
unrecovered amount = CAD purchase - CAD refund
```

The refund equation is an **explicit illustrative policy** that deducts a fee from a foreign-currency credit; actual agreements may calculate fees differently or waive them. Label separately whether the original purchase fee is returned. A slider with `f_r=0` means no separate refund fee; it does not automatically return the original purchase fee. If modelling return of the original fee, add that refund explicitly.

If the same foreign amount is fully returned and both fee rates are zero, the remaining CAD difference is `F × (x_p - x_r)`. It can be positive or negative: an FX-only refund can be smaller or larger in CAD. State that a merchant refund in foreign currency is not necessarily a full reversal of the original CAD debit.

For DCC, compare the **actual quoted CAD total** against the modelled local-currency transaction's CAD total, including issuer fees where applicable. Do not assume DCC is free, always cheaper, or always more expensive. Do not imply that paying in CAD guarantees exemption from every possible cross-border charge; card terms govern.

Suggested charts: purchase cost decomposition; CAD refund across refund FX rates; net unrecovered amount by purchase/refund fee policy; DCC quoted CAD amount versus local-currency route. Show a rate-unit label on every axis and identify fictional assumptions next to inputs.
