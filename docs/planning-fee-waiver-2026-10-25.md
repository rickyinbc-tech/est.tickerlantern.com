# Bank-fee waivers and additional-balance opportunity cost

One detailed English guide adds four interactive figures and inspectable data
tables: equal-resource paths, a reconciliation waterfall, qualifying-month
comparisons and a signed balance/yield matrix. All amounts, yields and account
qualification patterns are original hypothetical assumptions. No private
account, client, email or research archive is used.

## Public source scope

FCAC's Chequing accounts HTML and Account maintenance fees chapter of its
Review of banking fees in Canada were checked on 25 October 2026. The latter
official page is dated 23 October 2026. The former supports the warning that
even a one-day balance dip may trigger a monthly fee. The review supports
minimum-balance opportunity cost and checking account features separately.
Original public HTML, retrieval timestamps and SHA-256 hashes remain ignored
under qa/bank-fee-next. The article links the official pages directly.

No bank-specific fee, daily threshold, yield quote, current product table or
recommendation is encoded. Qualification is supplied independently, rather
than inferred from the amount entered or a monthly average. Only the first
selected months of each repeated year qualify; this explicitly declared
ordering is a scenario convention, not an actual account calendar.

## Equal resources and timing

Both strategies receive identical initial additional funds B and outside
monthly budget F. Common operating cash is excluded from both. A retains B
in non-interest chequing, spends F in nonqualifying months and saves F at
month-end in qualifying months. B invests the original B and spends its
outside F on the fee each month. B's fee is never deducted again from its
invested balance. A's unused budget builds resources only if actually saved.

The assumed net effective annual yield r converts to monthly m=(1+r)^(1/12)-1.
At N=12Y months, B's resources equal B(1+r)^Y. A's resources equal B plus the
future value of its qualifying month-end deposits. The difference equals
saved fee principal plus its growth minus B's forgone growth. The input yield
already represents a net assumption; there is no additional tax calculation,
inflation adjustment, rate forecast or account-feature valuation.

Default B=CAD 5,000, F=CAD 16, r=3%, Y=5 and all months qualifying give A
CAD 6,033.30 and B CAD 5,796.37, a CAD 236.93 difference. Both receive CAD 960
of outside budget; A saves it, while B spends it on fees. Saved-fee growth is
CAD 73.30 and forgone growth on B is CAD 796.37.

For a positive yield, the break-even B equals the future saved-fee value
divided by (1+r)^Y-1. For every month qualifying this simplifies to F/m,
approximately CAD 6,487.53 at the defaults. It is a modeled equal-resources
threshold, not a bank eligibility requirement. A repeated partial-year pattern
has its own threshold. At zero yield, any saved fees favor A for every finite
B; if there are no saved fees either, all balances tie. No division by zero
or artificial infinite numeric value is rendered.

## Verification

Ten focused tests check independent month-end cash sums, both fee budgets,
analytical thresholds, partial-year patterns, zero cases, monotonicity,
waterfall and matrix reconciliation, finite boundary rendering and invalid
whole-year/month inputs. All supported input minima and maxima are exercised.

Full JavaScript suite: 1208 passed. Python suite: 122 passed.
Browser checks at 1440, 390 and 320 pixels verify four figures/tables, no page
overflow, zero-yield labels, zero qualifying months, a negative resource
difference, invalid fractional input retention, reset and data disclosure.
All four default mobile figures are visually inspected. The matrix uses three
balance scenarios so signed values remain readable on the narrow screen.
