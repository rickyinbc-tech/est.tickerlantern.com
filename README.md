# TickerLantern global index scenario workbench

Audited 23 October 2026 · `tickerlantern-forward-timing-v2`.

[Full audit](docs/full-model-audit-2026-10-23.md) · [Five-year timing and all anchors](docs/five-year-forecast-policy.md) · [Dividend policy](docs/dividend-policy.md).

The website compares 21 exact benchmarks and always models five holding years. It supports conditional scenario exploration, not an underwritten point forecast or a uniform return ranking. Source observations retain their dates, definitions and freshness warnings.

## Run and verify

The household-saving guide separates twelve official quarterly observations and
a verified pension-adjusted accounting bridge from a hypothetical personal
cash budget. Verify source bytes and all 60 source rows with
`python3 scripts/check-planning-saving-rate-source.py <csv-path>`.


New cash-mechanics guides cover mortgage payment frequency, savings-promotion windows
and foreign-card purchase/refund conversion, with twelve interactive figures.


New editorial work focuses on **financial planning explained in English through
charts**. The library now leads with 259 visual planning guides and 1066 charts, with editable assumptions and inspectable data tables.
charts, with editable assumptions and inspectable data tables.
charts, with editable assumptions and inspectable data tables.
New guides cover job-offer cash and commuting costs, losses before a
fixed goal deadline, and retirement spending-adjustment rules. Interactive scenarios cover saving, inflation, reserves, debt, retirement,
mortgage renewal, family protection, education funding, net worth, RRSP/TFSA
tax timing, CPP start ages, renting versus buying, longevity, recurring fees,
periodic-bill calendars, car ownership, insurance deductibles and planned
work breaks, employer matching, consolidation, variable income, federal tax
brackets, an ordinary-case FHSA calendar, moving-home cash release, retirement
income bridges, caregiving cash needs, estate liquidity timing, disability-income
schedules, foreign-currency goals, annuity cash-flow trade-offs, repayment order,
shared-budget goal deadlines, ordinary RRIF withdrawals versus spending,
TFSA recontribution calendars, RESP withdrawal sources and mortgage prepayments
versus liquid savings, tuition benchmarks and student budgets, promotional
balance transfers, insurance reimbursement timing, home-purchase cash requirements,
shared household bill assignments, interest-free student-loan repayment,
self-employed cash ledgers, recurring home-replacement reserves and charitable
giving cash schedules, RRSP withholding versus final tax, a dated OAS recovery
calendar, return-to-work cash budgets beside child-care expense observations,
one-name deposit coverage with retained interest, refinancing cost recovery and
separate cash budgets for a household separation, incremental energy-upgrade
payback, lease-return versus buy-and-sell car costs and retirement survivor
income receipt gaps, overlapping instalment purchases, new-money allocation
maintenance and parental-leave household cash comparisons, GIC maturity calendars,
basic CESG catch-up and HBP repayment obligations, HELOC interest-only versus
principal repayments, pension-indexing caps and a daily biweekly-pay calendar.
The latest additions examine dated wealth medians versus liquid cash, career
retraining opportunity costs and pension service buyback cash flows.
Joint-loan payment takeovers, annual-versus-monthly subscription commitments and
investment-sale cash goals add twelve more figures. Their models separate
remaining debt from future instalments, unused prepaid service from an assumed
refund, and adjusted cost base from spendable sale proceeds. All three use
hypothetical scenarios with official public sources for the general mechanics.
Payment-option guides add cash-back caps and annual fees, cash discounts versus
interest-free instalments, and international-transfer costs. A small attributed
FCAC worked-example extract uses quotes recorded on 23 June 2026; it stays fixed
while the separate hypothetical transfer budget changes. Verify the source with
`python3 scripts/check-planning-remittance-source.py <saved-source.html>`.
Income-ledger guides distinguish rental cash from an operating subtotal, annual
certificate-interest receipts from consumption and reinvestment, and two card
balance buckets from their combined debt. Their models use independent cash
inputs, explicit accrual conventions and incomplete-projection flags.
Rate-and-benchmark guides add seven checked 2024 CIS after-tax income medians,
explicit 365-day short-term return annualisations and balloon-payment funding.
Survey medians remain fixed while an independent cash budget changes. Verify
the extract with `python3 scripts/check-planning-income-source.py <source-table.zip>`.
Balloon required saving rounds up to cents; the debt graph ends before the balloon.
Return-reading guides reconcile per-unit distributions, retained cash and
reinvested resources, then compare time-weighted and money-weighted returns
using one dated contribution. Payout schedules and external contributions are
kept separate from investment profit; all return paths are hypothetical.
Trading-and-equity guides reconcile ETF spreads and flat commissions against
executed cash, then track capitalized-interest borrowing and a signed future
home-sale residual. All quotes, loan rates, draws and property paths are
hypothetical; neither fills nor lending availability are predicted.
A mortgage-premium guide combines three checked CMHC premium-on-total-loan
bands with financed-principal interest and closing-cash ledgers. It does not
assess loan eligibility or provincial tax. Verify the source HTML with
`python3 scripts/check-planning-premium-source.py <source-page.html>`.
An accrued-interest guide keeps a locked compound investment separate from
outside tax cash, new reserve allocations and the maturity inflow. Annual
funding dates and tax rates are explicit hypothetical assumptions, with the
pre-maturity gap preserved even when the final cash endpoint is positive.
An investment-borrowing guide compares net positions using matched monthly
household cash. Interest reduces the borrowing case’s new investing cash,
principal is repaid once, and signed differences are retained. Constant returns
exclude tax deductions, margin calls and any strategy suitability finding.
A card-grace guide separates posting, statement closing and a common due day
inside a numbered thirty-day example. Full-payment reserves and funding gaps
are independent from minimum payments or actual charged interest. Required
daily saving rounds up to cents; actual issuer dates remain outside the model.
Debt-statistics guides distinguish holding shares, conditional medians and
whole-population means. Ten 2023 SFS estimates retain twenty confidence bounds;
interval bars and accessible tables display the published 95% intervals.
Verify with `python3 scripts/check-planning-debt-denominators-source.py <source-table.zip>`.
Pension-expiry, withdrawal-allocation and mortgage-life guides add twelve
interactive charts. The pension ledger makes a temporary bridge ending visible
before separately entered CPP cash begins. Withdrawal sources use the smaller
remaining portfolio and report a separate residual rebalance. Insurance curves
separate declining debt, flat assumed premiums and conditional claim destinations.
See `docs/pension-withdrawal-protection-2026-10-25.md` for public sources and checks.
New guides can set `publishedAt` and `reviewedAt` independently; legacy articles
retain their existing dates rather than being redated at every build.
An RDSP guide separates a hypothetical permitted gross beneficiary payment
from ordinary assistance repayment and the remaining plan value. It uses an
entered issuer-confirmed AHA, excludes exceptional cases and payment eligibility,
and keeps plan outflow separate from combined household resources.
A fund-cost guide reconciles reinvested distributions, positive cash return
of capital and the adjusted cost base before an all-unit sale. Units, NAV,
retained cash and gain are separate records; no personal tax or inclusion rate
is calculated. Fractional units keep full precision until display.
Advice-fee, refundable-booking and renewing-GIC-income guides add twelve
interactive charts. Eight checked FCAC advice-source observations stay fixed
while independent fee schedules change. The other models separate conditional
refunds from weighted costs, and renewed principal from spendable interest.
Source scopes and checks are recorded in `docs/advice-booking-ladder-2026-10-25.md`.
A gain-timing guide compares annual realization with one final sale using
a common opening investment and an assumed tax fraction on full gains. Both
endpoints deduct remaining modeled tax, each case reconciles its own growth,
and interim liquidation values are distinct from actual tax payments.
A return-shape guide compares two completely specified discrete distributions
with identical mean and standard deviation. Outcome probabilities, CDF steps,
expected wealth and goal failure remain separate. All probabilities are
original assumptions, verified through deterministic outcome enumeration.
A tuition-credit guide adds four graphics separating eligible tuition, baseline
credit value, tax capacity and matched prepayment refunds. It excludes complete
return calculations, top-up rules, transfers and carryforward balances; its
source scope and checks are recorded in `docs/tuition-credit-capacity-2026-10-25.md`.
A purchase-average guide follows equal monthly cash through fractional units,
security spending and fixed fees. Arithmetic quoted-price averages remain
separate from harmonic purchase-price averages and all-in household cash per
unit. A separate valuation and signed matrix keep losses visible.
A homeownership-age guide retains twelve dated household rates from the
2022 Statistics Canada release. A separate cash accumulation model uses no
ownership rates as probabilities or personal deadlines. Verify the twelve
cells with `python3 scripts/check-planning-homeownership-age-source.py <source.csv>`.
An annuity-payment-term guide distinguishes a minimum guarantee period in
a lifetime contract from a fixed payment term. Recipient ledgers, death-date
conditions and truncated display windows reconcile to scheduled instalments.
No purchase premium, mortality weighting or contract-price comparison is made.
A price-basis guide values the same spending schedule using matched nominal
and real cash and discount rates. Exact growth-factor conversion reconciles
both present costs; signed bars expose the two mismatched-convention errors.
It calculates a valuation, without treating a chosen rate as an assured yield.
A coupon-accrual guide separates clean quote, purchased accrued coupon and
fees in settlement cash. A before/after coupon transfer preserves combined
value, and an independent sale-plus-coupon ledger reconciles the final cash
result. The invented 180-day period is not a market day-count implementation.
Use official statistics where they answer the question;
keep observed data, dates and population separate from hypothetical scenarios.
Every article chart includes a data table and visible assumptions. All site
copy, controls, labels and article text are in English.

The latest three guides compare annual versus monthly insurance payments,
lump-sum versus phased investment timing and renovation payment calendars.
Each has four interactive graphics with explicit cash ledgers and accessible
data tables. Payment percentages, returns and overruns are hypothetical;
source notes identify the public mechanics reviewed. The premium equivalent
rate is a mathematical IRR comparison, not a disclosed APR. Phased investment
values include retained cash interest, and renovation gaps use the lowest
balance rather than the final balance alone.

`src/planning-guides.js` composes the article modules named
`planning-*-guides.js`. `planning-models.js` composes the topic models, whose
files are named `planning-*-models.js`, and owns the dated Statistics Canada
spending rows. `planning-charts.js` renders the figures on the server and in
the browser. `planning-ui.js` handles edits, validation and responsive sizing.
Financial arithmetic is checked independently in `tests/planning*.test.mjs`.
The maturity model is a run-off schedule with bills after annual maturities,
not a renewing ladder or an offered rate. Basic CESG projections construct an
explicit earlier contribution history and apply annual, lifetime and age-16/17
constraints. HBP projections start from a separately confirmed required year;
income inclusions reduce the HBP ledger without restoring an RRSP contribution.
The HBP tax percentage is a budget allowance, not a tax-return calculation.
The homepage and library derive article and chart counts from the content.
Job comparisons use independently entered take-home pay and show commuting
hours without assigning them a cash value. Goal stress tests apply one loss
before the selected month’s deposit; the contribution solver also stresses
earlier deposits. Retirement rules keep all dollars and returns real, apply
one persistent flexible-spending cut per triggered annual review, and retain
unpaid essentials separately from deliberately forgone consumption.
The federal bracket illustration is explicitly fixed to 2026 and excludes
credits and other taxes. The FHSA calendar models an ordinary new-account
case only; it does not determine personal eligibility or current account room.
`planning-life-data.js` holds a small attributed public Statistics Canada snapshot
(preliminary 2022–2024, Canada). Reproduce it with
`python3 scripts/extract-planning-life-table.py --archive qa/statcan-life-table.zip`.
The extraction checks dimensions, units, missingness, duplicates and monotonicity;
raw public downloads remain ignored under `qa/`.
`planning-care-data.js` holds four attributed 2022 Canadian Social Survey
categories, including the source confidence intervals. Validate the extract with
`python3 scripts/check-planning-care-source.py qa/caregiving-statcan-2024.html`.
The caregiving budget is a separate hypothetical scenario. The retirement bridge
does not calculate pension start-age adjustments or expenses beyond its horizon;
the estate ledger does not determine legal authority, taxes or distributions.
Disability benefits are entered net of taxes and coordination, without claim
assessment. The currency-goal tool uses hypothetical CAD-per-FCU rates and one
terminal conversion. The annuity tool uses hypothetical gross payments,
conditional on survival, and does not equate payout ratios with investment yield.
Debt-order schedules hold total budget fixed and stop at repayment or 120 months;
partial interest is labelled separately. Multiple-goal rules freeze funding at
each goal’s deadline. The RRIF tool is a one-year All other RRIFs illustration;
its tax allowance is not actual withholding or final tax. Validate its public
factor snapshot with `python3 scripts/check-planning-rrif-source.py` followed by
the saved CRA and Justice Canada HTML source paths under ignored `qa/`.
The TFSA calendar caps modeled deposits and treats the next-year new-room amount
as an assumption. The RESP ledger assumes promoter-confirmed capacity and does
not determine eligibility or actual student tax. Mortgage prepayment comparisons
preserve the same monthly budget and save unused payments after payoff; they
assume the lump sum is permitted without penalty.
`planning-tuition-data.js` contains twelve public Table 37-10-0045-01 observations
for preliminary 2026/2027 tuition. Reproduce the dated extract with
`python3 scripts/extract-planning-tuition.py --archive qa/statcan-tuition-37100045.zip`.
The extractor checks coverage, duplicates, missingness, units and metadata-based
preliminary/weighting status; the raw source stays ignored. Official tuition
charts remain fixed while the student-budget assumptions change. Card promotions
use one hypothetical rate bucket; claim cash needs include bills before month-end
resources, not only ending balances.
The self-employment ledger distinguishes invoice-based profit from collected and
uncommitted cash using a hypothetical held tax earmark. The home reserve repeats
component replacements over twelve years and funds every event date; routine
upkeep is paid separately. Giving schedules receive one independently entered
usable first-year tax saving in year two, without calculating a tax credit.
RRSP cash assumes one ordinary request outside Quebec and keeps withholding
separate from the independent incremental final-tax assumption. The OAS
illustration fixes 2025 income and separately labels later monthly deductions.
`planning-childcare-data.js` preserves 3 national and 13 regional public
observations from the 21 October 2025 release. Reproduce it with
`python3 scripts/extract-planning-childcare.py --release qa/childcare-2025-release.html --chart qa/childcare-2025-chart.csv`.
The extract excludes 2022 territory footnote cells from dollar observations.
Two dated observation graphics stay fixed while the return-to-work budget changes.
Deposit coverage assumes one category and two distinct CDIC member institutions,
without verifying actual membership or eligibility or forecasting future limits. Refinancing retains
the same principal and amortization and pays fees from cash, separating payment
relief from interest-cost advantage. Separation budgets assume independently
confirmed net transfers and cash access; they do not calculate legal entitlements.
Energy-upgrade cash recovery is separate from nominal discounted value. Car
comparisons sell the owned vehicle and repay principal at the lease-return date
so both cases finish without a car or loan. Survivor income is independently
entered, without statutory benefit percentages or automatic arrears receipts.
BNPL examples aggregate three hypothetical four-payment contracts. Buy-only
allocation keeps prices and existing holdings fixed, with no tax or security
recommendation. Parental-leave examples keep published gross percentages
separate from independent net cash inputs over a common 78-week window.

`planning-budget-exposure-data.js` retains nine public 2025 annual-average CPI
observations from Statistics Canada Table 18-10-0005-01. The new guides explain
personal spending-basket exposure, automatic-saving transfer dates and operating
cash, and the interaction of net-pay growth, price changes and lifestyle expansion.
The budget applies observed rates once to hypothetical amounts. The transfer
comparison preserves annual pay and saving across different saving dates. The
income-growth tool records unfunded living costs separately from its conditional
positive-surplus investment balances.

Verify the public CPI extract against the saved original accessible HTML table:

```sh
python3 scripts/check-planning-cpi-source.py qa/cpi-2025-components.html
```

`planning-wealth-flex-models.js` adds home/pension group comparisons, retirement
spending-cut rules and family gifts. Six public medians are checked with
`python3 scripts/check-planning-housing-wealth-source.py qa/statcan-wealth-2023.html`.
Observation charts stay fixed when the separate cash controls change.

`planning-access-rent-models.js` adds three visual guides on account-access
interruptions, unused credit limits versus cash reserves, and asking-versus-paid
rental statistics. The access delay is hypothetical and establishes no legal
authority. The borrowing exercise separates an unpaid bill from debt actually
drawn. `planning-access-rent-data.js` holds ten public Q2 2026 observations for
five selected CMAs, with asking and paid rental populations kept distinct.
Verify the source extract with:

```sh
python3 scripts/check-planning-rent-source.py qa/access-rent-sources/rent-q2-2026-chart.html
```

The public research library at `/research/` adds six educational guides on
earnings quality, buybacks and dilution, bond duration, ETF implementation,
CAD currency returns, and portfolio concentration. Original hypothetical
examples are distinguished from public source evidence. Article content and
source notes live in `src/research-guides.js`; `scripts/build-research.mjs`
renders the hub and article pages with `src/research-guides.css`. The normal
build links the guides from the homepage and includes their canonical paths in
the sitemap. The restored Royal Bank research remains hash-verified separately.

Node.js 20+ and Python 3 are sufficient for the static report:

```sh
npm test
python3 -m unittest discover -s tests -p 'test_*.py'
npm run build
npm run preview
```

The preview serves `dist/` on port 8764. Browser verification additionally requires `agent-browser`:

```sh
python3 tests/browser_five_year.py http://127.0.0.1:8764/
```

Tests cover all benchmark defaults, protected custom inputs, source changes, legacy settings, model/source provenance, missing inputs and actual CSV downloads. Source-parser dependencies are pypdf 6.14.2, Pillow 12.3.0, curl, Poppler and Tesseract; optional hosted anonymous browser transport uses Playwright 1.64.1. Review captures, downloaded publisher documents and local QA remain ignored under `qa/`.

## Model and assumptions

`src/model.js` owns the synthetic annual price, distribution, cash-flow IRR and reinvestment arithmetic. Starting wealth is 100; synthetic initial forward earnings are `100 / entry PE`. Exactly five annual factors reach terminal earnings. Dividends use the prior earnings anchor, with annual year-end reinvestment and zero interest on uninvested cash. The fixed 25× to 20×, 6% growth, 30% payout teaching example is separate from the active benchmark. No official index level, EPS series, daily total return, investor FX, taxes, fees or drawdown distribution is replicated.

`src/five-year-growth.js` permits a uniform-accrual calendar-to-forward bridge only where CY growth, rolling-12-month valuation and a recorded valuation date are explicit. This currently applies to S&P 500 and MSCI Japan. The recorded date is a timing proxy where separately observed market/estimate dates are undisclosed. Six underlying CY rates create five forward-earnings transitions, never six holding years. All derived rates are labeled model estimates. The other 19 benchmarks use their own editorial normalized EPS assumptions; published estimates remain separately visible as context. No generic CY/FY/publisher-horizon conversion is presumed.

`src/dividend-policy.js` calibrates an eligible cash-dividend anchor to the synthetic earnings denominator: payout percent equals source dividend-anchor percent times active entry P/E. This is not a publisher-reported payout or a matched-period D/E statistic. Twenty defaults have eligible anchors. STOXX 600’s 2.8% net-return-spread reference cannot seed cash dividends; its default cash model is unavailable until the reader supplies an explicit assumption. The universe CSV retains all 126 entry/year rows, including six explicitly unavailable STOXX rows with blank computed results.

Historical means retain their own dates. Six compatible pairs allow an explicitly illustrative mean-reversion exit; 15 qualified references cannot seed a direct comparison or historical exit. Where history is ineligible, unlocked exit P/E follows the active entry. Neither policy establishes fair value. Growth/distribution funding feasibility and share-count effects require separate evidence; no additional buyback yield is added.

## State and controls

`src/scenario-state.js` saves independent benchmark settings in browser local storage. Every mode, preset, sensitivity and export keeps five years. Edits remain protected. Source mode follows the current modeling policy; custom constant/annual paths remain reader assumptions. Legacy untouched source paths migrate once to timing-v2, including paused paths; modern paused scenarios freeze their saved rates. Custom payout edits survive migration. An ineligible cash source cannot retain an unlocked automatic cash calibration.

Restore valuations preserves custom growth/payout. The dividend-default button clears dividend overrides. Reset affects only the selected benchmark. Compression sets exit P/E to 80% of active entry, minimum 1×; constant P/E uses active entry; no-dividends zeros the active dividend input. Sensitivity cells change only growth/exit assumptions and do not assign probabilities.

## Sources and publication

The audit checked 63 market observations and 49 published growth points. All growth values agree with their original public sources. Of the market observations, 58 were freshly re-read; five retain dated source evidence where live access returned 403/429. No numeric transcription correction was justified. Economic input use, timing, source permissions and completeness defects were corrected instead. See the full audit for evidence and remaining limitations.

`.github/workflows/index-data.yml` runs configured valuation and growth adapters daily at 23:15 UTC. Seven dividend references require separate manual review and are not covered by that scheduled job. Observation dates, retrieval checks and semantic snapshot versions are independent. Failed checks retain prior verified values with visible warnings. Fresh retrieval never turns dated evidence into current market data.

Public adapters include FactSet, MSCI, JPM, Nasdaq, LSEG, Raymond James, Edelweiss and named public research references. Exact benchmark/column/period checks are mandatory. No trailing P/E, CAPE, median, related-index or ETF distribution yield substitutes for a requested metric. Hosted Nasdaq/Edelweiss failures also use the existing 13:00 Vancouver browser check, dependent on the owner’s Mac and Codex. See [browser source runbook](docs/browser-source-runbook.md). No access challenge is bypassed.

Cloudflare Workers serves `dist/` at **https://tickerlantern.com/**. The former `est.tickerlantern.com` address and `www.tickerlantern.com` permanently redirect to the HTTPS apex, preserving paths and queries. All asset requests run through the Worker so these redirects also cover static files. The GitHub repository and snapshot URL retain their existing names. The narrow read-only `/api/indices` endpoint reads the public GitHub snapshot with a validated bundled fallback. Worker, GitHub, edge and client polling caches can compound; loading the snapshot does not force a new publisher observation. Authenticate through Wrangler’s normal credential store, then deploy with `wrangler deploy`. Merge the current `origin/main` before publishing. Wrangler runs `npm run build` for each deployment so the asset bundle reflects the merged source rather than an earlier build. No credentials, neighboring private files, source PDFs, client records or account holdings belong in the publication.

The same host serves structured-note research at `/notes/research`, its screener
and detail pages at `/notes` and `/notes/RBC…`, and the equity-linked GIC study at
`/gics`. Indices, probabilities, scenarios, methodology, sources and downloads
retain their study paths on the apex domain. The `NOTES_RESEARCH` binding calls
the existing `tickerlantern-notes` Worker; its reviewed datasets and publication
gate remain independent. Study bundles use `/notes-app/assets/`, avoiding the
index workbench's files. The index snapshot API stays at `/api/indices`; study
health is `/api/notes/health`. The old notes host is retained only for permanent
redirects, with its homepage mapped to `/notes/research`.

## Job-loss, retirement-category and event-payment guides

Three additional English guides and twelve interactive charts explain a job-loss
cash runway, retirement spending phases and a wedding/event payment calendar.
`planning-runway-spending-models.js` owns the original hypothetical arithmetic.
The job-loss ledger receives independent net cash amounts and does not assess EI.
Care prices inflate from retirement start, including before care begins; summed
annual funding gaps are not a required starting portfolio. The event deposit is
paid at time zero, and saving transfers end before the event-month opening bill.
Each article includes six explanation sections, dated official reference links,
visible assumptions and a data table for every chart.

Run `node --test tests/planning-runway-spending.test.mjs` for the independent
financial checks and `python3 tests/browser_runway_spending.py <origin>` for real
input, invalid-input retention, reset, table, responsive and runtime checks.

## Employer risk and purchase financing

Two English guides add eight hypothetical charts. Employer-share losses are
tested alongside interrupted take-home pay, with bills before income. Cash
purchase and financing use equal resources and retain any funding gap.
See `docs/planning-wealth-choice-2026-10-25.md` for assumptions and verification.

## Canadian bank equity research

`/research/banks` links the restored RBC note and four new senior analyses for TD, BMO, Scotiabank and CIBC (25 October 2026). The new pages use 23 October TSX CAD closes and July-quarter issuer actuals, plus explicit original assumptions. `src/banks/*.json` owns public-source facts, prose and assumptions; `model.js` owns the linked FY2026–FY2028 earnings model, scenario returns, credit stress, steady-state book diagnostic and separate five-year cash-flow model. `scripts/build-bank-research.mjs` renders the articles, comparison hub, source/input JSON and forecast CSVs.

The base valuation horizon is October 2027 using FY2027 modeled EPS. The five-year illustration starts separately from adjusted trailing EPS. TD insurance service expenses are deducted explicitly. Scotiabank's announced Chile tax-asset charge reduces modeled Q4/FY2026 adjusted earnings once, after tax. Source-specific non-GAAP definitions and distinct share-count dates remain visible. The aggregate model does not supply a full CET1, OCI or common-book bridge. No private files or downloaded issuer PDFs are part of the build.

## Overdraft ledgers and housing statistics

Two English guides add eight interactive charts on overdraft fees and daily
borrowing, and housing-affordability statistics versus household cash budgets.
The thirty-day overdraft ledger charges each arrangement’s own fees into its
daily balance, accrues simple daily interest and posts it at month-end. All
amounts and rates are hypothetical. The housing module preserves 28 official
Canadian Housing Survey percentages across seven rows and four cycles, with
source hashes and explicit conditional denominators. Its editable budget stays
separate from the fixed observations.

Run `python3 scripts/check-planning-housing-source.py` with the original CSV and
release HTML retained under ignored `qa/` to verify all source values and notes.
Run `node --test tests/planning-banking-housing.test.mjs` and
`python3 tests/browser_banking_housing.py <origin>` for mathematical and rendered
checks. The existing savings-promotion guide is retained as the single article
on that topic.

## Benefit caps, credit snapshots and paired-return compounding

Three further English guides add twelve interactive figures on annual insurer
benefit caps and reimbursement receipts, dated credit-utilization ratios, and
arithmetic versus compound return. The benefit cap uses service-year benefit
dollars, with a separate receipt lag and pre-receipt funding check. Credit
snapshots use an independently assumed day and never estimate a credit score.
The paired-return example holds the arithmetic mean fixed over complete
two-year pairs, with no later contributions or withdrawals. A native signed-bar
figure preserves negative returns to the left of a visible zero axis.

Run `node --test tests/planning-benefits-credit-growth.test.mjs` for independent
financial identities, boundary cases and signed-bar geometry. Run
`python3 tests/browser_benefits_credit_growth.py <origin>` for real interactions
and normal/narrow rendered checks. All amounts and paths are hypothetical.

## Tax-instalment reserves and return order during saving

Two further English guides add eight figures. The fixed 2026 instalment
calendar separates month-end reserve transfers from four independently
confirmed payment amounts, retains real event dates and tests the lowest
reserve balance. It applies the ordinary March weekend adjustment but does not
assess personal eligibility, payment amounts, final tax or processing time.
The ten-year contribution illustration applies each annual total return before
an equal year-end deposit and compares exactly reversed return lists. Its
principal ledger, signed growth chart and delay matrix preserve the shared
cash-flow schedule. Neither return path is market data or a forecast.

Run `node --test tests/planning-tax-contribution.test.mjs` and
`python3 tests/browser_tax_contribution.py <origin>` for mathematical, date,
input, table and responsive checks.


### Emergency-savings statistics and loss-recovery arithmetic

- `/research/emergency-savings-survey-payment-choice-available-cash` retains six 2025 U.S. SHED savings-capacity bands and two question-specific indicators. Official observations use USD and U.S. adult survey weights; an independent editable CAD ledger deducts already committed cash before funding a shock.
- `/research/investment-loss-recovery-purchasing-power-deposits` compares nominal and inflation-adjusted recovery requirements after an immediate loss, with a separate contribution ledger and surplus/shortfall matrix. All paths are deterministic illustrations.

Source extract: `src/planning-emergency-recovery-data.js`. Original public HTML snapshots remain ignored in `qa/`; `python3 scripts/check-planning-emergency-source.py` checks their hashes, published table cells and methodology against the bundle. The build requires no source fetch. Model tests use closed-form compound sums, contribution-timing checks and cash conservation; `tests/browser_emergency_recovery.py [origin]` checks real controls, reset, accessible tables and responsive chart text.


### Income-group spending shares and utility settlements

- `/research/household-spending-income-quintiles-consumption-shares` compares dated 2023 SHS consumption shares and annual means for the lowest and highest income quintiles, with an independent monthly cash model. The consumption and income denominators remain separate; a ratio can rise while the cash remainder improves.
- `/research/utility-equal-payments-annual-settlement-reserve` distinguishes a generic twelve-instalment payment plan, authored seasonal cost allocation, provider balance and a separate household settlement reserve. Provider credits never become assumed cash refunds. It does not replicate BC Hydro tariff or review mechanics.

`scripts/check-planning-spending-utility-sources.py` verifies six quintile shares, two annual means, release context and utility-plan context against the original public HTML snapshots and their hashes. Raw snapshots remain ignored in `qa/`. `tests/planning-spending-utility.test.mjs` checks cash conservation, zero denominators, denominator effects, annual allocation, settlement identities and credit treatment. `tests/browser_spending_utility.py [origin]` checks real inputs, reset, tables and responsive chart bounds.


### Taxable interest and purchasing power

`/research/taxable-interest-after-tax-inflation-purchasing-power` follows fully taxable interest through a simplified annual tax payment from the same accessible savings account, then deflates its balance into starting-date CAD. It separates the before-tax reference, nominal after-tax balance, real balance and required break-even gross rate. No personal tax brackets, product yields or current CPI values are inferred.

`tests/planning-taxable-real.test.mjs` compares the ledger with independent compound and geometric-sum formulas, checks rate/valuation invariants and contribution-free cash reconciliation, and tests supported input limits. `tests/browser_taxable_real.py [origin]` checks real controls, whole-year validation, reset, tables and responsive chart text. CRA and Bank of Canada source context was reviewed on 25 October 2026.


### Loan proceeds and family-benefit cash dates

- `/research/loan-upfront-fee-net-advance-effective-cost` separates contract principal from fee-withheld proceeds, reconciles principal and interest, and computes a separately defined effective annual cash-flow rate. It does not calculate statutory disclosed APR or validate an actual loan offer.
- `/research/child-benefit-2026-payment-calendar-budget-cash` retains the official twelve-date 2026 CCB calendar and two base-tax-year blocks, with independently entered half-year receipt amounts. It models first-of-month bills, other dedicated funding and a calendar-day receipt lag, separating year-end cash from any 2027 collection-only runoff. It does not determine entitlement or low-entitlement lump sums.

`python3 scripts/check-planning-ccb-source.py` validates the bundled dates, base-year mappings and source context against the original public HTML hash; raw source remains ignored in `qa/`. `tests/planning-loan-family.test.mjs` checks discounted payment sums, closed-form debt balances, cash conservation, independent required-buffer formulas, same-day ordering and post-year receipts. `tests/browser_loan_family.py [origin]` checks real inputs, whole-number validation, reset, tables and mobile chart bounds.


### Planned allocations and dollar exposure

`/research/target-date-glide-path-equity-dollar-exposure` traces an original linear allocation path beside a contribution-only balance. It compares equity percentages and dollars, finds the peak whole-year equity exposure, and applies separate one-time equity shocks to start/peak/target snapshots. Other assets staying unchanged is an authored assumption, and the example does not predict fund returns or retirement adequacy.

`tests/planning-glide-exposure.test.mjs` checks annual asset reconciliation, an independent quadratic-vertex peak solution, proportional snapshot changes, endpoint-matrix invariants, whole-year validation and supported boundaries. `tests/browser_glide_exposure.py [origin]` verifies real inputs, reset, tables and responsive chart text. Investor.gov’s March 2025 target-date bulletin supplies general context; no actual fund path or allocation recommendation is encoded.

The analytical wealth-distribution guide adds a pointwise percentile fan. It
assumes independent normal log gross returns and exposes the expected simple
return and log-return standard deviation separately. No return parameters are
fitted to securities or historical observations. Quantiles are analytical;
conditional probabilities use a tested normal-CDF approximation. The percentile
bands describe each date, not the probability that an entire path stays inside.

## Everyday capital planning

Three English guides cover owner-level assessment reserves, the nominal and
real burden of fixed debt, and weekly versus batched purchase fees. See
`docs/planning-everyday-capital-2026-10-25.md` for sources and verified checks.

The `planning-funding-boundaries` guides add a rising goal-price solver, a
single-balance earmark calendar and a leveraged-loss stress illustration.
Each has four interactive graphics and data tables. The goal solver reprices
the deadline, the earmark ledger checks the lowest balance against a floor,
and the loss example retains unchanged debt and all outside interest costs.

Optional loan-insurance illustrations hold usable loan proceeds constant,
keep premium principal separate from financing interest, and do not assume
equivalent coverage across independently entered premium quotes. Premium-related
cash schedules exclude the common base loan payment. No claim, premium refund
or policy eligibility is calculated.

`planning-access-bridge-cover-models.js` adds ordinary RDSP payment/repayment
cash, temporary pension bridge endings and hypothetical rebuilding coverage
gaps. See `docs/planning-access-bridge-cover-2026-10-25.md` for source scope,
explicit contract assumptions and validation.

## Inflation order and rate conventions

Two English guides add nine charts on the order of price increases during
withdrawals and on nominal versus effective annual rate conventions. See
`docs/planning-timing-conventions-2026-10-25.md` for sources and checks.


### Insurance renewal budgets and deposit access

- `/research/term-life-renewal-premium-household-reserve` follows two independently entered equal premium periods, a recurring household assignment and a separately held reserve. Cash retained before a hypothetical renewal can fund later premiums; it is not a policy cash value or a premium refund. No renewal right, quote or insurance recommendation is inferred.
- `/research/cashable-locked-deposit-earlier-bill-bridge-cost` compares two hypothetical deposits at a common day365 endpoint after the same earlier bill. The locked route explicitly requires a separately available bridge, whose principal and simple interest are repaid from maturity proceeds. A negative endpoint remains an outside funding need. No actual issuer withdrawal terms or credit approval is established.

`tests/planning-renewal-access.test.mjs` checks independent phase-endpoint reserve formulas, daily-principal interest sums, equal-expense reconciliation, no-bill cases, settlement shortfalls and supported timing/balance limits. `tests/browser_renewal_access.py [origin]` verifies real controls, reset, whole-number validation, accessible tables, mobile chart text and a negative maturity scenario. FCAC source context was reviewed on 25 October 2026; all model amounts and conventions are authored assumptions.

The vacation-commitment illustration compares the same nights actually used,
keeps annual dues payable in zero-use cases, separates a possible assessment,
and distinguishes nominal cash costs from discounted totals. The reporting
window does not establish contract termination, resale value or cancellation
rights. No proceeds from unused rights, exit receipt or property value is added.

### Renewal rates, pension quote price years and personal time

Three four-chart guides compare a five-year deposit with repeated one-year renewals, distinguish a later pension quote from its purchasing power in the first modeled year, and reconcile DIY cash costs with displaced paid work and separately valued personal time. All entered amounts and rates are hypothetical. The pension illustration separates a temporary supplement from a later payment and does not calculate benefit entitlement or required retirement capital.

`tests/planning-renewal-supplement-time.test.mjs` checks independent deposit endpoints, renewal-rate equality, future quote discounting, annual component boundaries, and cash/time reconciliation. `tests/browser_renewal_supplement_time.py` checks real controls, reset, data tables and 320/390-pixel chart labels.

`planning-rpp-statistics` adds four official count charts with reference-year
filtering. Reproduce forty observations with `scripts/extract-planning-rpp-statistics.py`;
see `docs/planning-rpp-statistics-2026-10-25.md` for scope and validation.

## Advice sources and service-fee budgets

An English guide pairs selected official 2024 FCAC survey observations with
independent hypothetical project/review and annual-retainer fee calendars. See
`docs/planning-advice-cost-2026-10-25.md` for sources and checks.


### Charitable-donation claim statistics

`/research/charitable-donation-statistics-claimants-medians-means` presents a fixed official 2022/2023 extract with a source-year selector: jurisdiction claimant counts, conditional medians, nominal claimed totals and age-group median/derived-mean comparisons. Canada is separate from the thirteen provinces and territories; age data uses only the Both sexes section. Derived means are clearly labelled approximations from published rounded totals. No personal giving target, tax-credit calculation or missing year is inferred.

`python3 scripts/check-planning-charitable-source.py` checks 126 source values, header units, both-sex grouping, cross-table national totals, release scope and three original HTML hashes; raw source remains ignored in `qa/`. The new `statistics` explorer mode identifies source-year controls, and a dedicated count formatter plus billion-CAD compact labels preserve full values in accessible tables. `tests/planning-charitable.test.mjs` and `tests/browser_charitable.py [origin]` verify data selection, unsupported years, units, source-mode wording, reset and mobile chart bounds.

The two-income household guide adds an exact four-state probability grid, cash-severity bars and separate frequency and severity curves. Its feasible-overlap stress control preserves both marginal probabilities and is not an estimated correlation. Window risks are original assumptions; expected unfunded dollars are not a sufficient reserve target. Mobile interaction, probability bounds and cash arithmetic are verified.

### Asset-resilience definitions and essential-expense targets

`/research/asset-resilience-statistics-household-emergency-target` pairs two fixed Statistics Canada interval charts with two separate hypothetical household cash-target charts. The selected national person-based observations retain reference years, supplied 95% bounds, source units/precision, vectors, coordinates, flags and the public download hash. Ten-province coverage excludes the territories. The invented benchmark is not an official current LIM or a classification of the reader.

Reproduce the source snapshot with `python3 scripts/extract-asset-resilience.py <11100082-eng.zip>` using the official CSV ZIP identified in the data module. The extractor rejects duplicate/missing grains, changed latest-year coverage, flagged observations, invalid units and unordered intervals. Tests verify the independent hub controls, household reconciliation and fixed-source behavior; `tests/browser_asset_resilience.py` exercises real controls, invalid-input retention, reset, data tables and mobile SVG labels.

## Card purchases and household bookkeeping

Five charts reconcile purchases, card repayments and internal savings transfers. See
`docs/planning-card-ledger-2026-10-25.md` for sources and checks.

`planning-illness-cash` adds independent benefit cash calendars; see
`docs/planning-illness-cash-2026-10-25.md` for scope and validation.

The extended-warranty guide separates whole-window repair probability, conditional eligibility and the capped provider payment in five interactive charts. All probabilities and contract terms are hypothetical. The model counts the upfront price once in every state, distinguishes expected cost from an actual repair reserve, and handles infeasible cost-equality thresholds explicitly. State arithmetic, boundary cases and mobile chart layout are verified.

## Warranty costs and repair-day reserves

Four charts separate expected repair costs from the cash required in each outcome. See
`docs/planning-warranty-risk-2026-10-25.md` for sources and checks.

`planning-billable-capacity` adds billable hours and annual cash allocation; see
`docs/planning-billable-capacity-2026-10-25.md` for scope and validation.

### Upfront receipts and dated payment value

`/research/cash-now-future-payments-present-value-receipt-calendar` separates actual receipt dates, present value and cumulative receipts in four original hypothetical charts. Payments at year zero receive no extra discount period; delayed streams preserve their payment count. No reinvestment, spending, borrowing or life contingency is silently added. Independent annuity formulas, date shifts, zero-rate controls and immediate single-payment boundaries are checked by `tests/planning-payment-value.test.mjs`; the browser companion checks real controls, data tables and responsive labels.

The disability-prevalence guide uses a dated Statistics Canada all-gender extract with the exact published 2017/2022 estimates and asymmetric 95% confidence limits. Its separate invented age-mix illustration preserves fixed subgroup rates, excludes youth explicitly, and does not infer aggregate intervals, individual transition risks or insurance-claim probabilities. Source units, percentage-point differences, weighted arithmetic and mobile controls are verified.

## Fraud-reporting statistics

Three charts separate CAFC reported losses, counts and derived category ratios. See
`docs/planning-fraud-2026-10-25.md` for sources and checks.


### Inflation-indexed bond cash flows

The English guide `inflation-linked-bond-principal-coupon-maturity-cash` uses four original interactive USD figures to separate adjusted principal, semiannual coupon receipts, redemption and purchase outlay. A hypothetical smooth index permits inflation and deflation; the original-face floor applies only to maturity principal, while coupons continue to use adjusted principal. A principal-only matrix keeps purchase premiums separate from total cash returns. TreasuryDirect sources explain the real TIPS mechanism; no actual security, CPI observation, yield quote, tax result or CAD hedge is modeled. Data tables and accessible chart descriptions identify USD explicitly.

### Project draw timing and borrowed cash

`/research/project-loan-staged-draws-idle-borrowed-cash-interest` compares a full time-zero draw with three project-bill draws. Separate debt, project cash and unused-limit paths reconcile to the same ending principal, while an explicit monthly convention traces borrowing interest, fees and separately paid cash interest. The illustration assumes future draws remain available; it does not reproduce daily lender billing or infer project resale value. Independent tranche-period sums and a balance-month identity are checked by `tests/planning-staged-draw.test.mjs`; `tests/browser_staged_draw.py` covers real controls, reset, data tables and mobile labels.

The repair-or-replace guide compares forward cash from one decision date through a common service horizon and exit. Its unrecoverable original-price input changes context only. Current sale proceeds are counted once, final receipts occur only at the exit, and discounted and nominal ledgers reconcile independently. Four responsive charts retain signed receipts, with verified zero-discount and negative-net-cost boundaries.

## Multiple IRRs and later obligations

Three charts retain a later required payment and inspect multiple IRR solutions. See
`docs/planning-multiple-irr-2026-10-25.md` for sources and checks.

`planning-age-income` adds dated source income counts and conditional summaries; see
`docs/planning-age-income-2026-10-25.md` for scope and validation.

## Statistical methodology software reference

The return-shape modeling workflow used the statistical-analysis skill for
explicit population estimands, assumption scope and reproducible verification.
Methodology acknowledgement: Kassis, T., Agarwal, V., He, Y., Patel, D., and
Brueckner, A. M. (2026). [Scientific Agent Skills: A Library of Procedural
Knowledge for Research Agents](https://doi.org/10.48550/arXiv.2609.00065).
Latest verified arXiv revision: v2, 2 September 2026. This is a software-workflow
reference, not financial evidence or a market-data source.

The savings-sensitivity guide introduces a native accessible tornado chart with filled/open input-endpoint markers, an explicit zero reference and a complete tested-input data table. Original one-at-a-time ranges are separated from probabilities, and a two-input matrix and sequential combined-case bridge expose interactions. The monthly ledger, ranking changes, zero ranges, signed endpoints and responsive rendering are verified.

### Temporary card authorizations and usable credit

`/research/credit-card-authorization-holds-available-capacity-calendar` traces two requested incidental holds, posted debt and one usable-credit payment date. It tests a separate planned purchase without posting it or simulating issuer approval. Negative headroom describes excess requested capacity; hold release restores credit capacity without creating cash income. Tests preserve release-day boundaries, capped debt repayment, absent purchases and never-fitting transactions; the browser companion checks controls, tables, reset and 320/390-pixel labels.

## Credit usage and the tax-return settlement

Four charts separate credit usage from the final settlement of prior tax payments. See
`docs/planning-credit-settlement-2026-10-25.md` for sources and checks.


### Employee option grant cash planning

The English guide `employee-stock-options-vesting-exercise-cash-spread` separates granted and vested units, current intrinsic spread, hypothetical exercise-and-sale proceeds and exercise-and-hold strike funding. Four original interactive figures use a fixed authored 48-month schedule with a 12-month cliff, whole-unit rounding and independently entered cash. Only vested units enter the sale illustration, which assumes a permitted immediate sale at the entered price and shows no transaction at or below strike. All scenarios are hypothetical CAD arithmetic, excluding actual employer terms, full option valuation, tax, fees, expiry and settlement. Public Investor.gov and current Fidelity stock-plan sources support the conceptual distinctions. No option exercise or sale is initiated.

`planning-rrif-kind` separates securities received from assigned bank cash; see
`docs/planning-rrif-kind-2026-10-25.md` for scope and validation.

The wealth-concentration guide retains dated Q4 2024/Q4 2025 official group means and rounded changes. Approximate wealth shares use explicit 40/20/20/20 household weights and normalise the rounded weighted sum, disclosing the Q4 2025 20-cent reconciliation difference. Its cumulative chart contains only the published group boundaries, without inventing a lowest-quintile point, within-group Lorenz detail, Gini coefficient or confidence bounds. Source-year switching and mobile layout are verified.

## Equal cash, different unit quantities

Four charts connect equal cash purchases with units, weighted cost and marked value. See
`docs/planning-unit-cost-2026-10-25.md` for sources and checks.

### Collateral-ratio adjustments and outside funding

`/research/collateral-equity-ratio-cash-loan-repayment-asset-sale` compares three invented balance-sheet treatments in five charts. Direct loan repayment, extra held collateral and asset-sale repayment use different denominators; subtracting new outside cash preserves the original post-price equity. The held-cash arrangement and required ratio are explicit hypothetical assumptions, not broker procedures or Canadian regulatory requirements. Sale-only repair is unavailable for a remaining funded account with nonpositive equity. Independent ratio equations, negative equity and near-zero numerical stability are checked in `tests/planning-collateral-repair.test.mjs`; the browser companion verifies controls, tables and mobile labels.

The collateral guide uses a fictional loan-to-value covenant to separate positive equity from a funding test. It calculates outside debt repayment, fully eligible collateral additions and internal sales using distinct equations, with an explicit no-partial-sale boundary when debt reaches collateral value. No lender or regulatory margin rule is implemented. Transfer accounting, signed equity, exact-limit and zero-debt cases, and mobile controls are verified.

## Client-name deposits across channels

Four charts group client-name eligible deposits by issuing member and category. See
`docs/planning-deposit-map-2026-10-25.md` for sources and checks.

### Elapsed unemployment and future reserve horizons

`/research/unemployment-duration-elapsed-weeks-future-cash-reserve` retains eight disjoint 2025 LFS duration categories, the separate long-duration aggregate and two 2015–2025 mean series with their original top-code definitions. It distinguishes annual-average stocks, unknown duration and elapsed weeks from an independently selected future household funding horizon. Public observations retain units, flags, coordinates, vectors and ZIP hash; no confidence bounds are invented. Reproduce with `python3 scripts/extract-unemployment-duration.py <14100057-eng.zip>`. Financial and source tests cover the national controls, category reconciliation, fixed-source behavior and zero-deficit boundary; the browser companion covers real controls, tables and mobile labels.


### Retirement-age survey statistics

The English guide `canada-retirement-age-statistics-mean-median-planning-date` presents a fixed corrected 2021–2025 extract from Statistics Canada table 14-10-0060-01. Four interactive figures distinguish total mean/median history, worker-class snapshots, differences between rounded mean and median, and changes between annual class medians. The source-year filter selects official observations, with no invented 2026 estimate or personal retirement-age target. The 64–66-year line axis is explicitly truncated; bars start at zero and signed differences retain negative values. A separate authored bridge example is identified as fictional. The public-source checker verifies all 40 CSV cells, dimensions, units, flags, correction metadata and original ZIP hash. Shared chart rendering gains optional plain-language value units for line descriptions and optional heatmap row labels and precise signed-axis ticks, preserving defaults.

## Matching real and nominal valuation bases

Four charts compare consistent nominal/real valuation with deliberate basis mismatches. See
`docs/planning-discount-basis-2026-10-25.md` for sources and checks.

The lease-distance guide compares hypothetical full-term kilometre allowances, distinct excess-distance rates and an additional monthly payment. Five charts retain exact allowance breakpoints, separate cash dates and show a signed cost-difference curve so both default crossovers are legible on mobile. Published manufacturer prices are not used. The two equality points, full-term allowance convention, final charge counting and zero-rate cases are verified.

### Performance fees and loss recovery

`/research/performance-fee-high-water-mark-loss-recovery-cash` compares two invented annual fee bases across the same four gross returns. The mark rule retains the prior highest post-fee annual balance; the annual-reset rule carries no loss forward. Five charts trace returns, net balances, actual charges and the subsequent-return effect on deducted fees. Tests independently compound each actual fee through its remaining periods, including later negative returns, and check zero-rate, no-capital and all-loss cases. The browser companion verifies real controls, reset, fee tables and mobile SVG labels. No fund contract, eligibility rule, actual performance or fee quote is applied.

The family-loan guide separates accessible lender cash from an unpaid-principal record, comparing on-schedule and shifted receipts against the lender’s own bill. Negative ledger dates represent unfunded amounts rather than automatic borrowing; later receipts do not erase an earlier funding need. Capped final repayments, zero repayment, events beyond the reporting window, underlying deficits and the independent receipt-count reconciliation are verified, alongside mobile controls.

`planning-fee-waiver` compares equal starting funds and outside monthly budgets,
with saved waived fees and the opportunity cost of an additional balance; see
`docs/planning-fee-waiver-2026-10-25.md`.

## Consumer expectations and separate household price scenarios

Five charts preserve official survey medians and independent household price assumptions. See
`docs/planning-expectations-2026-10-25.md` for sources and checks.

`planning-tfsa-kind` separates contribution-date FMV, allocated cost, gain/loss
and room capacity while conserving gross market value; see
`docs/planning-tfsa-kind-2026-10-25.md`.

## Progressive fee slices and whole-balance bands

Four charts explain annual fee allocation, minimums, fixed charges and threshold repricing. See
`docs/planning-fee-slices-2026-10-25.md` for sources and checks.

The inventory cash-cycle guide models identical batches over a fixed 365-day window, separating sale recognition from supplier and customer cash dates. Five charts distinguish a fixed per-batch timing interval, cumulative simplified profit, net trading cash, a funding trough and inventory/receivable/payable reconciliation at a selected day. Trade balances reconcile every modeled day, all supported events close within the year, and payment-term changes preserve fixed-year margin and overhead. Mobile snapshot and funding controls are verified.

## Promotional credit payoff conditions

Four charts separate principal, an unposted interest memo and the final conditional assessment. See
`docs/planning-promo-condition-2026-10-25.md` for sources and checks.

### Inventory profit, receivables and owner withdrawals

`/research/business-profit-inventory-receivable-owner-withdrawal-cash` follows a one-batch business through inventory purchase, a half-batch credit sale, operating cost, customer collection and one owner transfer. Five charts reconcile operating profit and cash while computing funding from every ordered event, including deficits hidden by positive month-end balances. Funded asset stacks identify their assumed new opening owner capital explicitly. Tests check event order, cash/stock/receivable identities, cost recognition, timing changes and zero-amount boundaries; the browser companion checks controls, tables and mobile labels. No actual business records, financial statements, loan approvals or tax treatment are applied.


### Disability-benefit offsets and retroactive awards

The English guide `disability-benefit-offset-retroactive-award-repayment-cash` uses four original interactive CAD figures to separate ongoing coordination, past overlapping benefit periods, a retroactive award and an unpaid repayment earmark. Two independently entered trailing payment windows determine overlap; Plan A reductions are capped at its initial amount. A day-end ledger keeps cash, unpaid repayment and residual separate, including immediate same-day repayment. A matrix varies the offset and B's covered months while retaining A's history. All amounts are before tax, and the example estimates no eligibility, actual contract terms, overall-income cap or tax result. Current public FCAC, TBS and Service Canada HTML supports the conceptual context; the federal plan's individual-policy exception remains explicitly plan-specific.

`planning-cpp-amounts` retains dated new-beneficiary means and new-start maxima
beside a separate editable household cash ledger; see
`docs/planning-cpp-amounts-2026-10-25.md`.

## Flat and reducing-balance interest bases

Four charts compare explicit loan interest bases and payment-date equivalents. See
`docs/planning-flat-loan-2026-10-25.md` for sources and checks.

The reward-redemption guide separates matched cash outlay, purchasing missing points and the chosen other-use value of existing points consumed. Four charts keep actual payments apart from opportunity-value deductions and display implied cents per required point with a native precise cents format. No card or program quote is used. Partial/full/zero balances, double-counting checks, matching-price changes and responsive controls are verified.

Two new long-term investing companions add eight editable charts on balanced-fund
crash stress, inflation, account wrappers, regular contributions and the separate
exit/re-entry decisions in market timing. All return paths are explicitly hypothetical.
See [the source and calculation note](docs/balanced-investing-timing-2026-10-25.md).

## Repeated independent events and reserve coverage

Four charts separate repeated-event probabilities, average costs and reserve shortfalls. See
`docs/planning-repeat-risk-2026-10-25.md` for sources and checks.
