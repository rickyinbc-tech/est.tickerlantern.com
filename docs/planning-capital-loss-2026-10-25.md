# Capital-loss records, carryback capacity and cash

One detailed English guide adds four interactive figures and data tables:
same-year netting, prior-year gain capacity and illustrative allocation, the
remaining carryforward record and a loss/gain sensitivity matrix. All amounts
are original hypothetical inputs. No private account, client, tax return,
email or research archive is used.

## Public sources and historical scope

CRA Capital losses and Line 25300 pages were checked on 25 October 2026.
They describe the 2025 personal return. The latter is modified 5 February 2026.
Justice's Income Tax Act section 111 HTML states that its consolidation is
current to 30 September 2026, last amended 18 June 2026. The article preserves
that version limit and uses an explicitly historical 2025 worked case, rather
than determining a later-year transaction. Source URLs, original public HTML,
retrieval times and SHA-256 hashes remain ignored under qa/capital-loss-next.
All three retained source hashes were verified before authoring.

The CRA guidance supports same-year application, the 2022–2024 eligible
carryback destinations for a 2025 net capital loss, destination-year choice,
indefinite carryforward, taxable-gain deduction limits and the separate
priority of older loss vintages. It also distinguishes taxable-income from
net-income effects of applying net capital losses across years. No published
worked example is copied. No actual tax return or assessment is calculated.

## Original ledger

All losses are already allowable amounts and all gains taxable amounts on a
matching inclusion-rate basis. No inclusion percentage is applied again. The
case contains one loss vintage, no other adjustments and independently
verified available prior gain capacity. It excludes other vintages, rate
conversions, denied/superficial losses, special pre-1985 rules, LPP, business
investment losses and estate exceptions.

Same-year use=min(allowable loss, current taxable gain); net loss=max(0,
allowable loss-current gain). A requested carryback total then caps available
allocation. For illustration only, destination years are visited 2022, 2023,
2024. Each use is capped by that year's available gain and unallocated loss.
This is an authored destination convention, not a legal priority, required
carryback or tax optimization. Older loss-vintage ordering is a different
question and is not represented by this single-vintage model.

Default allowable loss CAD 12,000 less CAD 3,000 same-year use creates a
CAD 9,000 net capital-loss record. A CAD 7,000 requested allocation uses CAD
2,000, CAD 4,000 and CAD 1,000 against the respective prior capacities, leaving
CAD 2,000 unapplied. Reducing the request to CAD 3,000 allocates CAD 2,000 to
2022 and CAD 1,000 to 2023, leaving CAD 6,000. A CAD 20,000 request still uses
only CAD 7,000 at the default capacities. No excess gain or loss is invented.

The residual record plus all prior allocations plus same-year use equals the
entered allowable loss. Gains exceeding losses create a remaining gain and
zero loss record. The matrix reruns that complete ledger after replacing the
two current-year amounts. A larger unused record is not new household wealth.

No refund amount, receipt date, bank cash, tax rate, benefit change, future
gain or investment return is computed. Any tax/refund estimate and cash
calendar must be established separately. Claimable loss eligibility and prior
capacity are assumed facts, not conclusions from the tool.

## Verification

Ten focused tests pass: independent record conservation including decimals,
same-year and destination caps, requested/zero carryback, incomplete request,
zero/fully used losses, total-capacity identity, waterfall and matrix
reconciliation, collapsed zero scenarios, supported field extrema, finite
accessible rendering, invalid inputs and editorial boundaries.

Full JavaScript suite: 1330 passed. Python suite: 122 passed.
Browser checks at 1440, 390 and 320 pixels verify four figures/data tables,
no page overflow, partial/no carryback, a current gain that consumes the loss,
a collapsed all-zero matrix, invalid-input retention, reset and disclosure.
All four default mobile figures are visually inspected before publication.
