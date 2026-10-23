# Global Index Valuations & Return Anatomy

An independent TickerLantern research website for **https://est.tickerlantern.com**.

The report explains EPS growth, terminal P/E, dividend cash flows and reinvestment, with a clickable 21-benchmark index desk. All 21 exact benchmarks have sourced forward P/E observations and ten-year forward-P/E references. Older dated references retain their original window-end dates and are not presented as current rolling averages. Unavailable observations remain null. Growth, horizon and custom inputs are scenario assumptions, not consensus forecasts. The original ChatGPT estimate is not reproduced or validated.

## Run locally

Requires Node.js 20+ and Python 3 for the optional local server. No package installation is needed.

```sh
npm test
npm run build
npm run preview
```

`src/model.js` contains the financial calculations. The build creates the complete static publication in `dist/`. `src/app.js` renders accessible SVG charts, scenario sensitivities, annual data, input validation and CSV export. Reading the article requires no JavaScript; model editing does.

## Scenario workbench

The explorer leads directly into assumptions, return metrics, wealth attribution and sensitivity. The navy/teal editorial style is retained in `src/workbench.css`, with a keyboard-operated section menu, larger labels, responsive SVGs, a mobile result summary, reduced-motion support and print-specific layouts.

`src/scenario-state.js` defines the state policy. Each benchmark retains its own growth schedule, holding period, valuation, payout, dividend convention and yield edits. New benchmarks resolve their own source values or explicitly labelled defaults; another benchmark's valuation is never inherited. Source checks preserve edited fields. Pausing source following keeps the manual scenario. **Restore source values** resumes following and restores valuations, convention and available yield while preserving growth, payout and horizon. **Reset scenario** resets the current benchmark to source/default inputs, 6% growth, five years and 30% assumed payout; other saved benchmarks are kept. Saved scenarios persist in this browser; other browsers and devices have separate settings.

Compression changes only exit P/E to 80% of active entry (minimum 1×); Constant P/E sets exit equal to entry. No dividends zeros the active payout or initial yield. The fixed 25× → 20× teaching example is separate from the active wealth bridge.

Sensitivity starts with 60%, 80%, 100%, 120% and 140% of entry P/E and growth offsets of −8, −4, 0, +4 and +8 percentage points. Axes stay within supported bounds, retain the exact anchor and fill clamped duplicates with intermediate cases. Editing entry or growth establishes a new range; selecting a cell holds the range fixed. An off-grid case is explicitly identified. Every cell calls the same `project` engine as the metrics, charts, annual table and export. This changes scenario exploration, not the documented financial calculations.

Verification includes the financial examples, low-P/E and boundary grids, stable selection, provenance, benchmark isolation, protected edits, presets, restore/reset rules and CSV endpoints. Run `npm test` and the Python source-parser tests below. Local browser QA covers source failure fixtures, 360/390/768/1440px layouts, 200% browser zoom, keyboard/focus, text contrast, actual CSV download and A4 print rendering. Review captures remain ignored in `qa/`.

## Publication

Source is maintained in GitHub. Cloudflare Workers serves `dist/` and a narrow read-only `/api/indices` endpoint at the explicit custom domain in `wrangler.jsonc`. The endpoint reads the current public GitHub observation snapshot, cached for up to five minutes, with the bundled snapshot as a labelled fallback. It does not upload neighbouring workspace directories. Authenticate through Wrangler's normal credential store, then run `wrangler deploy`. No credentials belong in this repository.

## Model

Price begins at 100, EPS at `100 / entryPE`. EPS grows annually; P/E moves geometrically from entry to exit. Each year's dividend is the payout ratio times the prior valuation date's EPS anchor, received at year-end. Terminal prices reflect distributions. Investor IRR includes annual dividends plus final sale proceeds; reinvested CAGR purchases additional units at each modeled year-end price. These are different return conventions. The model assumes growth is feasible with the selected payout; it does not enforce that feasibility.

Public references and exact formulas are included in the page. No raw conversation transcript, personal holdings, private archives, authentication material, or private source attachments are included.

## Independent yearly growth scenarios

In the scenario lab, choose **Different rate each year** to enter a separate EPS growth rate for every holding-period year. Each benchmark retains its own rates, horizon, dividend convention and protected valuation inputs. Charts, summary returns, annual calculations and CSV downloads use that same compounded EPS path. The annual table and CSV identify the rate used in each year. Dividends continue to use the prior-year EPS convention.

Settings persist in this browser’s local storage under `tickerlantern.est.scenarios.v1`; they are not synchronized across devices or browsers. Source refreshes and Restore source values preserve custom growth paths. Reset affects only the selected benchmark. Shortening the horizon keeps later rates for reuse. Added years use that benchmark’s default rate. The 6% starting rate remains an illustrative assumption, not a sourced earnings forecast. Sensitivity cells explicitly use constant annual growth and selecting one switches to constant mode while retaining the saved yearly path for switching back.

Optional browser regression checks require `agent-browser` and a running preview: `python3 tests/browser_growth_sync.py http://127.0.0.1:8764/`. They use a separate browser session, verify immediate mode switching, independent schedules, reload persistence, source protection and matching CSV output, and close the session afterward.

## Daily index source checks

`.github/workflows/index-data.yml` checks the configured public sources daily at 23:15 UTC and supports manual dispatch. The workflow uses the repository-scoped GitHub Actions token to commit only `data/indices.json`; it requires no external API secret. Source observation dates and check dates are separate.

`scripts/refresh_indices.py` parses the latest complete FactSet S&P 500 forward-P/E / ten-year-mean paragraph from its official RSS-linked research. MSCI fundamentals come from the exact index's official public factsheet, with strict identity, date, table-header and row-count checks. Legacy factsheet pages discover the current same-host public document URL. One ACWI document supplies the three explicitly identified ACWI/World/EM rows. No authentication, access challenge bypass or paid dataset is used.

Failed sources retain the last verified observation and an explicit error/retained status. Missing means remain null; trailing P/E, CAPE, shorter samples and ETF proxies are never substituted. Public source files are read in memory; only selected observations, hashes and provenance are published. Local review images are ignored under `qa/`.

The browser checks for new snapshots every five visible minutes and on visibility restoration. Source following updates unlocked valuation and yield fields; per-benchmark custom overrides survive refreshes. Growth and horizon remain reader assumptions. When the ten-year mean is missing, exit P/E defaults to current P/E as an explicitly flat-multiple scenario.

Python source-parser tests: `python3 -m unittest discover -s tests -p 'test_*.py'`. Source refresh requires `pypdf==6.14.2`, `Pillow==12.3.0`, curl, Poppler and Tesseract (macOS local QA can use Vision): `python3 scripts/refresh_indices.py`. The optional `--render-qa` renders the actual selected source pages for local visual review. Source images remain ignored and are not website assets.


Additional adapters read J.P. Morgan’s daily Asia guide, Nasdaq’s linked biweekly dashboards, LSEG’s RSS-linked STOXX 600 earnings reports, Raymond James’ monthly index tables, Edelweiss TEMPO’s monthly tables, and independently dated MSCI, Segal, Cumberland, IG and SCBAM research references. Native PDF columns and numerical labels are validated; LSEG’s raster chart uses OCR of its explicitly printed labels plus its ten-year legend, with no estimate from plotted line positions. Source job failures are recorded in `sourceJobs`; per-metric source failures preserve the corresponding value and date. Any unavailable source job makes the scheduled job report failure after publishing the retained snapshot.

Nasdaq and Edelweiss public pages have an optional, anonymous Chromium transport in GitHub Actions when ordinary HTTP fails or returns an empty discovery shell. It uses a fresh context, default browser identity, normal TLS, and no login or challenge handling. CI installs `playwright==1.64.1` and its official Chromium build. The fallback is disabled outside an explicitly enabled GitHub Actions run. Actual hosted tests found Nasdaq network failures and Edelweiss HTTP 403. Those publishers also use the daily **Refresh TickerLantern publisher valuations** Codex heartbeat at 1 p.m. Vancouver time. It opens their ordinary official browser links, reviews the original tables and imports observations with the same parsers. This needs the owner's Mac and Codex to be available. A browser check is accepted for 48 hours; a missed check is visibly retained and makes CI report failure. See `docs/browser-source-runbook.md` and `docs/public-browser-source.md`.

Current P/E, historical mean and dividend yield are updated independently. New monthly fundamentals never erase an independently sourced mean; a fresh P/E never advances an older dividend date. Mean sources and dates are visible in both the selected-index detail and comparison table. Fixed dated research is checked for revisions, while rolling documents and public report listings discover new observations. A dated source whose newer editions omit the mean remains visibly dated; its median or a shorter average is not substituted.
