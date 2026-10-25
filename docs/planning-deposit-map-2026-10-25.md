# Client-name brokered deposits and a member/category map

The English guide `/research/client-name-brokered-gic-direct-deposit-member-category-map` adds four charts and tables. Current CDIC coverage, GIC, one-name, TFSA and member-list pages were reviewed on 25 October 2026. They support the selected limit and client-name aggregation mechanics; no publisher worked example or actual bank/brand mapping is reproduced.

The snapshot assumes one depositor, two genuinely distinct hypothetical CDIC members and two qualifying categories per member. All eight channel inputs are eligible deposits, correctly recorded in client name, and include accrued interest through one common date. Each direct/broker pair is combined before applying its own CAD 100,000 principal-plus-interest cap. Nominee/trust deposits, other ownership categories, FX conversion and provincial schemes are outside the calculation. No real account eligibility, TFSA contribution permission, transfer, member failure or payout date is determined.

Within-limit amounts are summed after each cell is capped. Above-cap amounts are not predicted losses. Positive headroom elsewhere does not net against a negative cell. The chart sources and prose distinguish a coverage snapshot from future interest growth and contractual access dates.

Validation:

- 1,072 full Node tests passed.
- Six focused mathematical tests check source-limit arithmetic, channel-only invariance, nonfungible headroom, cell/global conservation, issuer/category mapping, the total bridge and every supported balance limit.
- The build and four SEO checks passed.
- `tests/browser_deposit_map.py` passed at desktop and 390px mobile, checking four figures/tables, accessible descriptions, bounded labels, channel-only reclassification with unchanged coverage, invalid-input retention, reset and signed matrix data.
- The mobile headroom matrix was visually inspected; signed amounts remain explicit alongside its colour scale.
