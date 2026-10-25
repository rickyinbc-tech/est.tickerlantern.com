# RRSP room, undeducted contributions and conditional excess reference

Reviewed 2026-10-25. **Recommended scope: a pure contribution-room/undeducted-record ledger, with sourced conditional tax discussion. Do not present a T1-OVP assessment or calculated penalty.** The limited monthly inputs cannot establish all relevant histories, deductions, qualifying arrangements and withdrawal treatment.

## Distinct scope

At review, HEAD was `6821749` and origin/main `9d7bd41`. All guide slug inventories were checked: 195 and 199 entries. No monthly RRSP excess/undeducted ledger was found.

Preserve/link `/research/rrsp-deduction-now-later-tax-saving-opportunity-cost`: it compares the cash value of claiming the same deduction at different dates, with room/eligibility assumed. Also preserve `/research/rrsp-tfsa-tax-timing`: it compares equal after-tax saving effort, with sufficient room assumed. The new guide would instead separate a deduction limit, contributions already made but not deducted, and remaining room for new contributions. It would not recommend deliberately using a cushion or postponing a deduction.

## Verified official CRA evidence

**Three separate quantities.** CRA's notice-of-assessment explanation says available contribution room is the deduction limit minus unused RRSP contributions reported in past years. The notice is based on information filed and on CRA's records; later unreflected transactions must still be reconciled. Its displayed/meta modification date is 2025-07-09. [CRA: Notices of assessment, RRSP statement section](https://www.canada.ca/en/services/taxes/income-tax/personal-income-tax/after-you-file/noa-nor.html)

**A deduction limit is not a new contribution balance.** CRA defines the deduction limit as the maximum contributions that can be deducted for a year, subject to its stated special-transfer qualifications. Its calculation uses prior unused deduction room and other adjustments. Do not derive an actual limit here from salary or reproduce a dollar-limit table; enter an already reconciled limit. Page modified 2026-01-29. [CRA: How contributions affect your RRSP deduction limit](https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/rrsps-related-plans/contributing-a-rrsp-prpp/contributions-affect-your-rrsp-prpp-deduction-limit.html)

**Unused means contributed, not unfilled room.** CRA identifies unused contributions as amounts already contributed but not deducted or designated as HBP/LLP repayments. It explains reporting undeducted contributions, where the previously reported amount appears, and that reassessments can change the record. Page modified 2026-01-29. [CRA: What to do with unused contributions](https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/rrsps-related-plans/contributing-a-rrsp-prpp/what-unused-rrsp-prpp-contributions.html)

**Deduction timing is separate.** CRA's questions/answers permit unused contributions to be deducted in a future return within the applicable deduction limit; they need not all be claimed at once. Its example also distinguishes being able to deduct existing amounts from being able to make new contributions after the relevant contribution-age limit. No age or deduction eligibility should be calculated by the proposed ledger. Page modified 2026-01-29. [CRA: Contribution questions and answers](https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/rrsps-related-plans/contributing-a-rrsp-prpp/questions-answers-about-contributing-rrsp.html)

**Conditional cushion and ordinary monthly tax.** CRA's excess page generally combines prior unused contributions and current-calendar-year contributions against the applicable deduction limit plus CAD 2,000; it describes ordinary tax of 1% per month beyond that threshold. Its current text is specifically framed for **2025** and says eligibility for the extra CAD 2,000 requires being 18 or older at some time in **2024**. Do not silently change this to “anyone aged 18 now” or claim the page is a complete 2026 eligibility algorithm. It also identifies exceptions involving withdrawal before the contribution month's end, qualifying group-plan amounts and pre-February-27-1995 contributions. HBP/LLP withdrawals may still leave tax payable. The source requires exact contribution/withdrawal months and treats waiver/cancellation as a request with conditions, not an automatic result. Page modified 2026-09-17. [CRA: Excess contributions](https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/rrsps-related-plans/contributing-a-rrsp-prpp/what-happens-you-over-your-rrsp-prpp-deduction-limit.html)

**Do not equate withholding relief with excess-tax relief.** CRA's unused-withdrawal guidance describes income inclusion, a possible offsetting deduction subject to timing and other conditions, and a separate process for withholding treatment. It does not say every RRSP withdrawal reverses the tax history or gives unrestricted replacement contribution room. The proposed ledger should omit withdrawals and link the process rather than treating a negative contribution entry as a universal fix. Page modified 2026-01-29. [CRA: Withdrawing unused contributions](https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/rrsps-related-plans/making-withdrawals/withdrawing-unused-contributions.html)

**Mandatory group plans need separate treatment.** CRA's HTML retirement guide defines qualifying group-plan amounts and explains why the general excess rules need more than an employer/group-plan checkbox. Its distinction between current-year mandatory amounts and later-year treatment is another reason to omit automated tax in this guide. This HTML guide is for the 2025 return, modified 2026-01-23; no source PDF or reproduced table was used. [CRA: RRSPs and other registered plans, qualifying group amounts and excess sections](https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/t4040/rrsps-other-registered-plans-retirement.html)

**Deductibility inference, explicitly identified:** the CAD 2,000 threshold does not raise the deduction limit. That conclusion follows from CRA's separate maximum-deduction definition and conditional excess-tax threshold; it is not a promise of an additional deductible contribution. Amounts above the limit would require applicable future deduction capacity before being deducted. Do not label the band “extra annual room,” “deductible cushion” or an automatic tax-free entitlement.

## Bounded original ledger

Use an invented adult scenario for which the reference band's applicability is **assumed, not determined**. The display is a synthetic twelve-month sequence, not a particular tax year's filing calculation. Begin with all prior undeducted amounts reconciled. Hold the entered deduction capacity constant. Include ordinary new contributions only, with no withdrawals, new annual room, reassessments, first-60-day allocation to a prior return, HBP/LLP, PRPP/SPP, qualifying group-plan adjustments or historical exceptions. Account market value and investment gains/losses are not modeled.

Let D be entered deduction capacity, U0 prior undeducted contributions, C_m cumulative new contributions and K = 2,000 the separately labelled conditional reference band:

```text
opening ordinary new-contribution headroom = D − U0
undeducted record before a current-return claim = U0 + C_m
signed ordinary headroom = D − U0 − C_m
amount beyond ordinary headroom = max(0, U0 + C_m − D)
amount above the conditional reference band = max(0, U0 + C_m − D − K)
```

The final expression is a **reference comparison**, not an assessed taxable excess. Do not multiply it by 1% in the published tool. Ordinary room can be shown as max(0, signed headroom), but retain a separate negative headroom/overage amount rather than hiding the overshoot. Prior undeducted contributions are not an account's current market balance and not cash waiting to be contributed.

## Reviewed invented fixture

Assume D = CAD 18,000, U0 = CAD 5,000 and twelve ordinary contributions of CAD 1,500. Opening room for new contributions is 13,000, not 18,000. The contribution schedule deliberately illustrates crossing thresholds; it is not a suggested deposit plan.

| Point | Cumulative new contributions | Undeducted record | Signed ordinary headroom | Above conditional reference band |
|---|---:|---:|---:|---:|
| Opening | 0 | 5,000 | 13,000 | 0 |
| Month 8 | 12,000 | 17,000 | 1,000 | 0 |
| Month 9 | 13,500 | 18,500 | −500 | 0 |
| Month 10 | 15,000 | 20,000 | −2,000 | 0 |
| Month 11 | 16,500 | 21,500 | −3,500 | 1,500 |
| Month 12 | 18,000 | 23,000 | −5,000 | 3,000 |

Being within the grey reference band does not make Month 9's contribution deductible above D or establish that tax is nil for a real person. The band's earlier use/history and eligibility cannot be inferred from the current deposit alone. The toy starting record expressly includes the prior CAD 5,000.

## A deduction must not create new room

Keep deduction claims outside the monthly deposit schedule. A bookkeeping allocation q against the same capacity reduces both remaining undeducted contributions and the capacity allocated to deductions:

```text
remaining undeducted amount = U0 + C − q
remaining capacity before any new-year adjustments = D − q
their difference = D − U0 − C, unchanged by q
```

At the fixture's end, q = 10,000 leaves undeducted 13,000 and capacity 8,000; q = 18,000 leaves undeducted 5,000 and capacity 0. Both preserve signed headroom −5,000. These are record-allocation identities, **not** a calculated next-year RRSP deduction limit or an assessment of claim eligibility. Subtracting a deduction from U while leaving the comparable D unchanged would falsely recreate contribution room. Deferring a deduction likewise does not postpone the original contribution's use of room.

Four figures can show the opening D/U/available-room bridge; monthly contributions and the combined undeducted record against D and the conditional reference line; remaining ordinary room versus overage; and deduction-allocation invariance or a contribution-size sensitivity. Include the ordinary 1%-monthly tax only in sourced prose beside the reference chart. Avoid penalties, interest, refunds, waiver odds or correction recommendations as calculated outputs.

## Evidence and verification

All seven CRA sources were captured successfully as public HTML in ignored `qa/rrsp-excess/`. The manifest records original URLs, UTC retrievals, modification metadata and SHA-256 hashes. `validate.py` checks 48 exact-arithmetic scenarios/624 monthly rows, the original fixture, prior overage, zero contributions, conditional-band separation and deduction-allocation invariance. Result: PASS; seven source hashes verified. `reviewed-extract.json` contains all thirteen default rows including opening, plus separate allocation examples. No monthly tax amount is calculated. No application code, tests, registry, build, README, commit or deployment was changed.

## Statutory follow-up: year-neutral age condition and q labels

Verified 2026-10-25 against Justice Laws HTML. The displayed consolidation is current to 2026-09-30, last amended 2026-06-18. In Income Tax Act subsection 204.2(1.1), variable C is CAD 2,000 where the individual **“attained 18 years of age in a preceding taxation year”**, and otherwise nil. Safe year-neutral wording: *The additional CAD 2,000 amount is conditional; its statutory age condition requires having turned 18 in an earlier taxation year.* This is verified statutory wording, not an inference from CRA's 2025 example. The formula also contains other variables, and subsection (1.2) has detailed premium exclusions and adjustments. Thus D + 2,000 is only the explicitly assumed reference in this frozen-basis illustration, not the implemented statutory excess calculation. [Income Tax Act, section 204.2](https://laws-lois.justice.gc.ca/eng/acts/I-3.3/section-204.2.html)

The ordinary post-1990 charging provision is subsection 204.1(2.1), which uses the statutory cumulative excess at month-end. Subsection 204.1(4) separately provides conditional ministerial waiver. This supports retaining month-end context while omitting assessed-tax and automatic-relief outputs. [Income Tax Act, section 204.1](https://laws-lois.justice.gc.ca/eng/acts/I-3.3/section-204.1.html)

For q, subsection 146(1)'s definition of year-end unused RRSP deduction room includes claimed deductions among its reductions; its separate RRSP deduction-limit definition includes other year-specific components. This supports the direction of the paired bookkeeping reduction, not a new monthly CRA limit. [Income Tax Act, section 146, definitions](https://laws-lois.justice.gc.ca/eng/acts/I-3.3/section-146.html)

Use **“unallocated model deduction capacity”** for D − q and **“unallocated modeled contributions”** for U − q. Their invariant difference is algebra under the frozen basis: (D − q) − (U − q) = D − U. Keep the original entered limit and contribution receipts intact. The statutory carry-forward treatment of undeducted premiums is also consistent with subtracting preceding-year deductions, but is not fully reproduced here. No actual newly issued deduction limit, first-60-day allocation, year transition, withdrawal restoration or individual tax assessment is calculated.

Three Justice Laws HTML captures were added under ignored `qa/rrsp-excess/` with URL/time/hash records. The unchanged independent arithmetic validator was rerun successfully: 48 scenarios, 624 rows and ten source hashes verified. The earlier seven-hash report above describes the original CRA-only research pass.


## Implemented publication scope

The English guide uses five interactive figures: opening headroom waterfall; monthly undeducted-record line with two distinctly labelled references; mutually exclusive contribution-record bands; paired deduction-allocation bars; and signed ordinary-headroom sensitivity. The monthly controls do not assess tax or eligibility. The allocation chart uses the bounded hypothetical q = min(10,000, D, U) and labels remaining capacity as a model record, not a new CRA assessment. All existing RRSP deduction-timing, withdrawal and equal-budget routes are preserved. Source captures and detailed QA remain in ignored `qa/rrsp-excess/`.

Independent rational validation passed 48 scenarios and 624 rows with ten public-source hashes. The application tests additionally check defaults, prior overage, record partition reconciliation, paired allocation invariance, fixed-grid substitution, integer-month validation and five finite accessible figures at boundary inputs. Desktop and 390-pixel mobile interactions cover changed inputs, invalid-input output retention, restore and native exact-value tables.
