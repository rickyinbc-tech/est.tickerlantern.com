# Tuition-credit capacity and repayment of prepaid tax

One English article adds four interactive figures and data tables. Its six
sections contain more than 900 words. It separates a tuition amount, a baseline
credit value, tax capacity and a refund of matched tax prepayments. None of the
figures is a full return, actual refund estimate or statistical observation.

## Live public HTML reviewed on 25 October 2026

- [Finance Canada’s June 2026 report](https://www.canada.ca/en/department-finance/services/publications/report-impact-reducing-lowest-marginal-personal-income-tax-rate-non-refundable-tax-credits.html): the general 14% federal baseline, the non-refundable/refundable distinction and the Top-Up Tax Credit. The report confirms enactment of the top-up, rather than only an earlier proposal. The calculator does not implement the top-up or all return interactions.
- [CRA line 32300](https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-32300-your-tuition-education-textbook-amounts.html), page dated 26 November 2025: supporting tuition certificates, eligibility instructions and Schedule 11. Eligibility is assumed as an input here.
- [CRA tax-return lesson](https://www.canada.ca/en/revenue-agency/services/tax/individuals/educational-programs/completing-basic-return.html): tuition record mechanics, use of carried-forward amounts, tax deducted and the final settlement. The lesson’s separate 2025 rate examples are not applied as 2026 rates.

Downloaded HTML, retrieval timestamps and SHA-256 hashes stay private and
uncommitted in `qa/planning-tuition-credit-capacity/sources.json` and its linked
public source captures. No local private curriculum, account or client record
was used. The source check confirmed the 2026 baseline/top-up context, tuition
documentation and relevant prepayment mechanics against the current HTML.

## Mathematical scope

For assumed eligible tuition A, conversion factor r, tax otherwise payable T
and matching prepayments P:

```text
Baseline value V = A × r
Used relief U = min(V, T)
Remaining tax = T − U
Net settlement = P − (T − U)
Refund = max(0, net settlement)
Balance owing = max(0, −net settlement)
```

The default A = CAD 8,000 and r = 14% produce CAD 1,120. T = CAD 600 caps
the reduction at CAD 600. P = CAD 600 then produces a CAD 600 repayment of
prepaid tax. P = zero leaves the same reduction but no cash refund. The unused
CAD 520 baseline value is not a Schedule 11 carryforward balance or payment.

The exercise does not determine eligibility, transfer amounts, carryforward
balances, future values, provincial tax, Alternative Minimum Tax, other credit
ordering, refundable benefits, assessments, debt offsets or receipt dates.
Tax and prepayments must have matching scope. All example values are independent
hypothetical inputs, even when the baseline factor is source-supported.

## Verification

`tests/planning-tuition-credit-capacity.test.mjs` checks defaults, changes in
tax capacity and prepayments, zero cases and conservation across a grid of
inputs. Refunds never exceed matched prepayments, usable relief never exceeds
the entered tax or baseline value, and the net settlement improves by exactly
the absorbed relief. Chart scenarios preserve their units and distinct bases.
Four figures with tables render at defaults and supported field extremes at
300/760-pixel render widths. Cross-links and the article depth are checked.

The full suite passed 937 tests before final upstream integration. An isolated
agent-browser session checked 1440, 390 and 320-pixel layouts, changed inputs,
maximum prepayments, invalid input, reset and chart-table opening. No document
overflow, clipped SVG text or page errors were found. Phone and desktop
screenshots were visually inspected and remain in ignored `qa/`.

Before deployment, merge the latest pinned upstream while preserving every
other guide and rebuild. After deployment verify the new canonical page,
four figures/tables, model imports and entries in the homepage, library,
sitemap and search index; also check previous live guides. A local release
record retains the deployment version and final checks. The hourly authoring
heartbeat remains active after this publication.
