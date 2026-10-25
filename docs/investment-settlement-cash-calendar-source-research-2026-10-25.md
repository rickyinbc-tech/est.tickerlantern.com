# Investment settlement and bank receipt before a bill

Review date: 2026-10-25. This note supports a distinct English financial-planning guide using public primary HTML and an entirely invented business-day calendar. No private records, PDFs, CIRO material, security prices, tax calculations or actual holiday calendar were used.

## Scope and duplication check

At review, HEAD was `152aef4` and origin/main was `c5c8ed4`. All `*guides.js` slug inventories were checked: 171 at HEAD and 176 on origin/main. No guide had the proposed investment-execution → settlement → spending-bank timing scope. Two related guides should remain and be linked:

- `/research/investment-sale-proceeds-tax-earmark-cash-goal` in `src/planning-commitments-guides.js` sizes a sale using market value, allocated cost base, selling costs and an assumed tax earmark. The new example starts with independently entered **net proceeds**, without recalculating those items.
- `/research/account-access-interruption-authorized-bill-payer` in `src/planning-access-rent-guides.js` examines ownership, payer authority and an independently assumed interruption in access. The proposed guide concerns operational stages after an assumed executed investment sale; it does not assess anyone's legal authority.

The useful new question is: **On which day does cash reach the account that must pay the bill?** A sufficient eventual amount can coexist with an earlier bank-account funding gap.

## Verified primary-source facts

**Canadian transition date.** CSA announced on May 27, 2024 that amendments supporting the shorter cycle for equity and long-term debt trades came into force that day. Its release discusses National Instrument 24-101 and institutional trade matching; it is evidence of the transition, not a retail bank-withdrawal service guarantee. It also distinguishes the U.S. transition on May 28, 2024. [CSA: Canadian securities regulators announce move to T+1 settlement cycle](https://www.securities-administrators.ca/news/canadian-securities-regulators-announce-move-to-t1-settlement-cycle/)

**Listed-stock/ETF scope and exceptions.** CCMA's May 31, 2024 implementation release confirms Canada's change to one business day after the trade date on May 27. It expressly includes exchange-traded securities such as ETFs. Its footnote distinguishes new/when-issued transactions, ETF creation/redemption transactions, special terms and issuer-defined settlement arrangements. Thus the teaching case should be an ordinary secondary-market sale of a Canadian-listed stock/ETF **subject to the applicable regular T+1 cycle**, rather than every investment transaction. Do not generalize to all mutual fund redemptions or cross-border/foreign-currency transactions. [CCMA: Capital markets transition to shorter securities settlement a success](https://ccma-acmc.ca/en/ccma-says-capital-markets-transition-to-shorter-securities-settlement-a-success/)

**Execution and settlement are separate.** CCMA FAQ 6 defines T by trade execution and settlement by the exchange of payment and securities. Its older FAQ contains planning projections from 2021–2023; use only this basic definition, together with the later implementation release, rather than treating every old projected product scope or rollout date as current. [CCMA: FAQs](https://ccma-acmc.ca/en/resources-ressources/faqs/)

**Broker balances differ.** Wealthsimple's current public sale-help body, displaying October 20, 2026, says stock/ETF trades take one full business day to settle and distinguishes cash balance, available-to-trade balance and available-to-withdraw balance after a sale. This is first-party evidence about that broker, not a promise about all brokers. An order submitted and an order executed must also not be treated as identical events. The model therefore begins with an assumed completed execution, not order submission. [Wealthsimple: Sell a stock or ETF](https://help.wealthsimple.com/hc/en-ca/articles/4415333826715-Sell-a-stock-or-ETF)

**Settlement does not determine external-bank arrival.** Wealthsimple's withdrawal-help body, displaying October 24, 2026, identifies unsettled proceeds, recent deposits and reserved funds as reasons available balance can differ from total balance. It lists separate withdrawal processing timelines by account and notes that some withdrawals take longer. This supports a separate post-settlement wait and qualified language, without reproducing a broker-specific timetable as the model's default. [Wealthsimple: Learn about withdrawing funds](https://help.wealthsimple.com/hc/en-ca/articles/360058451453-Learn-about-withdrawing-funds-from-your-account)

**Eligibility, cutoff and processing checks remain separate.** Another Wealthsimple help body, displaying October 2, 2026, describes account-dependent withdrawal timing and daily processing cutoffs. It also broadly says funds must have been in an account for five business days before withdrawal, whereas the sale/withdrawal articles separately describe one-business-day sale settlement. Do not resolve that wording into an invented universal extra hold or a universal exemption. Real eligibility must be checked for the actual account, deposit history and withdrawal. [Wealthsimple: Timelines for moving your funds](https://help.wealthsimple.com/hc/en-ca/articles/360059463853-Timelines-for-moving-your-funds)

For the proposed article, label the second delay **“assumed post-settlement wait until bank receipt”**. It can include separately verified broker availability/processing and transfer transit. If an illustration instead says the transfer request begins on settlement day, explicitly assume withdrawal eligibility is already satisfied and the request meets the relevant cutoff. Do not say settled proceeds automatically become spendable bank cash.

## Invented calendar and advance rule

This is a mathematical schedule, not an actual 2026 calendar. Day 1 is a fictional Monday. Days 6/7 and 13/14 are weekends. An optional fictional closure on Day 8, the second Monday, removes that day from the one shared model business-day calendar. Actual securities-settlement, broker and bank calendars/cutoffs can differ; a single synthetic calendar does not reproduce them.

Use a clearly stated rule:

```text
advanceBusinessDays(start, 0) = start
advanceBusinessDays(start, n > 0):
  examine calendar days strictly after start
  count only weekdays that are not the fictional closure
  return the day on which n counted open days have elapsed

settlement day = advanceBusinessDays(execution day, assumed settlement count)
bank receipt day = advanceBusinessDays(settlement day, assumed transfer count)
```

The start day is excluded when the count is positive. T+1 is not simply “24 hours later.” Counts must be finite nonnegative integers. The execution day itself must be open; if a more flexible closure selector conflicts with the selected trade day, reject that combination or explicitly roll and display a changed execution day. Never silently treat an execution as occurring on a closed day. The fixed optional Day-8 closure avoids conflict with first-week Monday–Friday trade choices.

Model execution choices can be Days 1–5; bill date can be any Day 1–14. The bill is a scheduled cash outflow on the selected calendar day even if that is a weekend. This is an explicit household scenario assumption, not a claim that a biller or bank processes on that day. Do not shift it to another day without an independently defined rule.

Continue counting beyond Day 14 when necessary. An arrival on Day 17 must remain Day 17 and be labelled beyond the displayed window, not clipped to Day 14 or discarded. Suggested finite stress controls: settlement count 1–3 and post-settlement wait 0–6 business days. The count of 1 represents the stated regular T+1 context; higher values are operational stress assumptions. If a zero settlement count is offered for comparison, label it a hypothetical immediate-settlement benchmark, not an alternative ordinary Canadian listed-stock rule.

## Cash-stage accounting and posting order

Let P be independently assumed net proceeds, O opening bank cash, B the bill, T execution day, S settlement day, A bank receipt day and D bill day. Amounts are nonnegative. Before execution, P is only a planned receipt, not a second bank balance or a measured value for the unsold investment.

After execution, put each dollar of P in exactly one stage:

```text
T <= day < S: sale receivable = P
S <= day < A: settled proceeds still off bank = P
day >= A: received sale component in bank = P
```

The off-bank label can encompass the transfer pipeline; it must not assert that money remains a withdrawable brokerage ledger balance after a transfer debit. If the chart separately depicts broker cash and funds in transit, split that off-bank amount into mutually exclusive stages. Never add P as a receivable, settled cash and bank receipt simultaneously. The sale and transfer change the location/form of household assets; they do not create P of earned income.

Within the synthetic day, process settlement and assumed bank receipts **before the bill**. With this stated receipt-before-bill convention:

```text
scheduled bank cash at day end = O + P × indicator(A <= day) − B × indicator(D <= day)
required opening bank cash = max(0, B − [P if A <= D, otherwise 0])
additional cash gap = max(0, required opening bank cash − O)
```

The equations describe this one-bill partial plan only. A signed negative cash position is the amount of an unfunded scheduled payment; it does not authorize overdraft, pay a real bill or make a later receipt retroactively available. Explain this where negative chart values appear. A bill debited before a same-day receipt can require more cash even if closing balance is positive; actual posting order must be checked separately.

## Reviewed original example

Assume O = 1,000, P = 5,000, B = 4,000 on Day 10, execution Friday Day 5, settlement count 1 and post-settlement wait 2. These numbers are invented and are not a broker quote.

| Event/result | No fictional closure | Fictional closure on Day 8 |
|---|---:|---:|
| Execution | Friday, Day 5 | Friday, Day 5 |
| Settlement | Monday, Day 8 | Tuesday, Day 9 |
| Bank receipt | Wednesday, Day 10 | Thursday, Day 11 |
| Bank cash just before Day-10 bill | 6,000 | 1,000 |
| Scheduled cash just after Day-10 bill | 2,000 | −3,000 |
| Additional bank cash needed to cover the gap | 0 | 3,000 |
| Day-14 bank cash if scheduled amounts are reconciled | 2,000 | 2,000 |

The identical endpoint 1,000 + 5,000 − 4,000 = 2,000 does not erase the closure scenario's earlier gap. Moving the bill to Day 9 also produces a 3,000 gap without a closure because receipt is still Day 10. With the Day-8 closure and transfer wait raised to six business days, receipt is Day 17: Day-14 scheduled bank cash is −3,000 and 5,000 remains off bank. Do not claim endpoint invariance when one receipt is outside the selected horizon.

Four figures can cover: a stage timeline; a fourteen-day bank-cash line with the bill and receipt highlighted; a day-specific allocation of the sale amount among receivable/off-bank/bank stages; and a trade-weekday versus transfer-wait sensitivity grid showing additional bank cash needed. Show weekend/closure cells visibly and label the grid an invented timing comparison, not a distribution of actual broker outcomes or a probability of on-time receipt.

## Real checks and evidence files

For a real plan, verify the executed trade confirmation and settlement date, eligible withdrawable balance, account restrictions and deposit holds, request cutoff, any currency conversion or fees, transfer method, receiving-bank usability, and bill debit date/posting order. Confirm net spendable proceeds separately using the linked sale/tax-earmark guide. This model neither prices a security nor decides how much to sell, estimates taxes, sells an investment, guarantees timely settlement, or determines registered-account withdrawal consequences.

`qa/settlement-cash/source-manifest.json` records source URLs, UTC retrieval times and SHA-256 hashes. Three source articles were successfully captured as raw HTML (CCMA official release, CCMA FAQ and the CCMA-authored Newswire release). CSA's direct retrieval returned a small HTTP-307 interstitial; three Wealthsimple curl attempts returned 403. Their original successful public web-tool responses are separately saved as `verified-public-web-tool-responses.json`, clearly identified as tool text. No access control was bypassed. TMX/CDS T+1 URLs currently showed security-maintenance pages, so their cached search snippets were not accepted as current page evidence. A BC Laws result was explicitly a 2018 consolidation and was not used as current authority.

`qa/settlement-cash/validate.py` independently compares day-by-day business-day advancement with selecting the nth future open day, then checks stage exclusivity, conservation and bank-gap formulas. Result: PASS, 451 advance comparisons, 13,440 cash-ledger scenarios, five saved evidence-body hashes verified (including the unusable CSA interstitial, classified as such), and explicit cases for zero waits, Friday/weekend crossing, closure, closed trade day, same-day receipt-before-bill, zero proceeds/bill, and beyond-window arrival. `reviewed-extract.json` contains the example's fourteen-day rows and sensitivity fixtures. All raw captures and validation artifacts are ignored under `qa/settlement-cash/`. No app code, tests, registry, build file, README, commit or deployment was changed.

## Implemented five-chart scope

The new route is
`investment-sale-settlement-bank-receipt-bill-calendar`, with a signed14-day
bank ledger, receipt-stage snapshots, a two-week open-day matrix, a fixed
zero-versus-one-closure arrival comparison and an opening-cash-gap matrix.
Controls use the reviewed CAD1,000/CAD5,000/CAD4,000 Day10 bill fixture. A
separate closure count permits0–3 consecutive fictional weekdays beginning
Day8. All first-week executions remain open; no real holiday dates are used.
The fixed closure comparison always replaces this count with0 or1, explicitly.

Receipt snapshots classify the same gross entered proceeds before bill
allocation. A zero bank wait makes the settled snapshot already received in
bank, rather than inventing an off-bank interval. The separate bank ledger
posts the receipt once and deducts the bill once. A zero-proceeds scenario
retains the modeled arrival date and does not falsely claim an after-window
receipt occurred inside Day14. Nine topic tests cover independently selected
future open days, all three closure-count boundaries, receipt ordering,
exclusive stage accounting, zero amounts, whole-day validation, beyond-window
arrivals and five finite chart/table pairs.
