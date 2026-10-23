# Global Index Valuations & Return Anatomy

An independent TickerLantern research website for **https://est.tickerlantern.com**.

The report explains EPS growth, terminal P/E, dividend cash flows and reinvestment, with a clickable 21-benchmark index desk. Thirteen exact benchmarks currently have sourced forward P/E observations; only the S&P 500 has a verified publisher-reported ten-year forward-P/E mean. Unavailable observations remain null. Growth, horizon and custom inputs are scenario assumptions, not consensus forecasts. The original ChatGPT estimate is not reproduced or validated.

## Run locally

Requires Node.js 20+ and Python 3 for the optional local server. No package installation is needed.

```sh
npm test
npm run build
npm run preview
```

`src/model.js` contains the financial calculations. The build creates the complete static publication in `dist/`. `src/app.js` renders accessible SVG charts, scenario sensitivities, annual data, input validation and CSV export. Reading the article requires no JavaScript; model editing does.

## Publication

Source is maintained in GitHub. Cloudflare Workers serves `dist/` and a narrow read-only `/api/indices` endpoint at the explicit custom domain in `wrangler.jsonc`. The endpoint reads the current public GitHub observation snapshot, cached for up to five minutes, with the bundled snapshot as a labelled fallback. It does not upload neighbouring workspace directories. Authenticate through Wrangler's normal credential store, then run `wrangler deploy`. No credentials belong in this repository.

## Model

Price begins at 100, EPS at `100 / entryPE`. EPS grows annually; P/E moves geometrically from entry to exit. Each year's dividend is the payout ratio times the prior valuation date's EPS anchor, received at year-end. Terminal prices reflect distributions. Investor IRR includes annual dividends plus final sale proceeds; reinvested CAGR purchases additional units at each modeled year-end price. These are different return conventions. The model assumes growth is feasible with the selected payout; it does not enforce that feasibility.

Public references and exact formulas are included in the page. No raw conversation transcript, personal holdings, private archives, authentication material, or private source attachments are included.

## Daily index source checks

`.github/workflows/index-data.yml` checks the configured public sources daily at 23:15 UTC and supports manual dispatch. The workflow uses the repository-scoped GitHub Actions token to commit only `data/indices.json`; it requires no external API secret. Source observation dates and check dates are separate.

`scripts/refresh_indices.py` parses the latest complete FactSet S&P 500 forward-P/E / ten-year-mean paragraph from its official RSS-linked research. MSCI fundamentals come from the exact index's official public factsheet, with strict identity, date, table-header and row-count checks. Legacy factsheet pages discover the current same-host public document URL. One ACWI document supplies the three explicitly identified ACWI/World/EM rows. No authentication, access challenge bypass or paid dataset is used.

Failed sources retain the last verified observation and an explicit error/retained status. Missing means remain null; trailing P/E, CAPE, shorter samples and ETF proxies are never substituted. Public source files are read in memory; only selected observations, hashes and provenance are published. Local review images are ignored under `qa/`.

The browser checks for new snapshots every five visible minutes and on visibility restoration. Source following updates unlocked valuation and yield fields; per-benchmark custom overrides survive refreshes. Growth and horizon remain reader assumptions. When the ten-year mean is missing, exit P/E defaults to current P/E as an explicitly flat-multiple scenario.

Python source-parser tests: `python3 -m unittest discover -s tests -p 'test_*.py'`. Source refresh requires `pypdf==6.14.2` and curl: `python3 scripts/refresh_indices.py`. The optional `--render-qa` uses Poppler to render source page 1 for local visual review.
