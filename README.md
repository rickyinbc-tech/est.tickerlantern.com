# S&P 500 Return Anatomy

An independent TickerLantern research website for **https://est.tickerlantern.com**.

The report explains EPS growth, terminal P/E, dividend cash flows and reinvestment. All interactive inputs are explicitly illustrative. It does not claim to reproduce the unavailable numerical output of the original ChatGPT estimate, use a live market feed or contain a verified historical P/E dataset.

## Run locally

Requires Node.js 20+ and Python 3 for the optional local server. No package installation is needed.

```sh
npm test
npm run build
npm run preview
```

`src/model.js` contains the financial calculations. The build creates the complete static publication in `dist/`. `src/app.js` renders accessible SVG charts, scenario sensitivities, annual data, input validation and CSV export. Reading the article requires no JavaScript; model editing does.

## Publication

Source is maintained in GitHub. Cloudflare Workers serves only `dist/`, at the explicit custom domain configured in `wrangler.jsonc`. It does not upload neighbouring workspace directories. Authenticate through Wrangler's normal credential store, then run `wrangler deploy`. No credentials belong in this repository.

## Model

Price begins at 100, EPS at `100 / entryPE`. EPS grows annually; P/E moves geometrically from entry to exit. Each year's dividend is the payout ratio times the prior valuation date's EPS anchor, received at year-end. Terminal prices reflect distributions. Investor IRR includes annual dividends plus final sale proceeds; reinvested CAGR purchases additional units at each modeled year-end price. These are different return conventions. The model assumes growth is feasible with the selected payout; it does not enforce that feasibility.

Public references and exact formulas are included in the page. No raw conversation transcript, personal holdings, private archives, authentication material, or private source attachments are included.
