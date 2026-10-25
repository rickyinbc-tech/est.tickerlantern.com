# TickerLantern global index scenario workbench

Audited 23 October 2026 · `tickerlantern-forward-timing-v2`.

[Full audit](docs/full-model-audit-2026-10-23.md) · [Five-year timing and all anchors](docs/five-year-forecast-policy.md) · [Dividend policy](docs/dividend-policy.md).

The website compares 21 exact benchmarks and always models five holding years. It supports conditional scenario exploration, not an underwritten point forecast or a uniform return ranking. Source observations retain their dates, definitions and freshness warnings.

## Run and verify

New editorial work focuses on **financial planning explained in English through
charts**. The library now leads with 89 visual planning guides and 356
charts, with new guides on job-offer cash and commuting costs, losses before a
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
