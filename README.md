# TickerLantern global index scenario workbench

Audited 23 October 2026 · `tickerlantern-forward-timing-v2`.

[Full audit](docs/full-model-audit-2026-10-23.md) · [Five-year timing and all anchors](docs/five-year-forecast-policy.md) · [Dividend policy](docs/dividend-policy.md).

The website compares 21 exact benchmarks and always models five holding years. It supports conditional scenario exploration, not an underwritten point forecast or a uniform return ranking. Source observations retain their dates, definitions and freshness warnings.

## Run and verify

New editorial work focuses on **financial planning explained in English through
charts**. The library now leads with thirty-three visual planning guides and 127
interactive figures, covering saving, inflation, reserves, debt, retirement,
mortgage renewal, family protection, education funding, net worth, RRSP/TFSA
tax timing, CPP start ages, renting versus buying, longevity, recurring fees,
periodic-bill calendars, car ownership, insurance deductibles and planned
work breaks, employer matching, consolidation, variable income, federal tax
brackets, an ordinary-case FHSA calendar, moving-home cash release, retirement
income bridges, caregiving cash needs, estate liquidity timing, disability-income
schedules, foreign-currency goals, annuity cash-flow trade-offs, repayment order,
shared-budget goal deadlines and ordinary RRIF withdrawals versus spending.
Use official statistics where they answer the question;
keep observed data, dates and population separate from hypothetical scenarios.
Every article chart includes a data table and visible assumptions. All site
copy, controls, labels and article text are in English.

`src/planning-guides.js` composes the article modules named
`planning-*-guides.js`. `planning-models.js` composes the topic models, whose
files are named `planning-*-models.js`, and owns the dated Statistics Canada
spending rows. `planning-charts.js` renders the figures on the server and in
the browser. `planning-ui.js` handles edits, validation and responsive sizing.
Financial arithmetic is checked independently in `tests/planning*.test.mjs`.
The homepage and library derive article and chart counts from the content.
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

Cloudflare Workers serves `dist/` at **https://tickerlantern.com/**. The former `est.tickerlantern.com` address and `www.tickerlantern.com` permanently redirect to the HTTPS apex, preserving paths and queries. All asset requests run through the Worker so these redirects also cover static files. The GitHub repository and snapshot URL retain their existing names. The narrow read-only `/api/indices` endpoint reads the public GitHub snapshot with a validated bundled fallback. Worker, GitHub, edge and client polling caches can compound; loading the snapshot does not force a new publisher observation. Authenticate through Wrangler’s normal credential store, then deploy with `wrangler deploy`. No credentials, neighboring private files, source PDFs, client records or account holdings belong in the publication.

The same host serves structured-note research at `/notes/research`, its screener
and detail pages at `/notes` and `/notes/RBC…`, and the equity-linked GIC study at
`/gics`. Indices, probabilities, scenarios, methodology, sources and downloads
retain their study paths on the apex domain. The `NOTES_RESEARCH` binding calls
the existing `tickerlantern-notes` Worker; its reviewed datasets and publication
gate remain independent. Study bundles use `/notes-app/assets/`, avoiding the
index workbench's files. The index snapshot API stays at `/api/indices`; study
health is `/api/notes/health`. The old notes host is retained only for permanent
redirects, with its homepage mapped to `/notes/research`.
