> Historical implementation record. Current definitions, coverage and acceptance results are documented in [the financial-integrity audit](financial-integrity-audit.md). Counts below describe their original release.

# Publication checks — 22 October 2026

## Financial model

Eleven Node tests pass. They independently check the one-year 7.5% example; terminal EPS × P/E; the exact annualized valuation relationship; cumulative dividends; zero NPV at computed IRR; single-counted terminal proceeds; zero dividends; constant-P/E return; reinvested units; declining-earnings/rich-to-cheap valuation limits; invalid and fractional inputs; sensitivity monotonicity; and CSV reconciliation.

The five-year illustration assumes 6% annual EPS growth, 25× entry P/E, 20× exit P/E and a 30% dividend payout of the prior EPS anchor. Results are price CAGR 1.3733649777%, investor cash-flow IRR 2.6865056300%, and reinvested CAGR 2.6879806629%. Displayed results are rounded to two decimal percentage points. The independently defined one-year discussion example returns 7.5%.

## Browser and static checks

Chrome rendered the article, both SVG charts, the annual table and the sensitivity matrix. The constant-P/E preset produced 6% price CAGR and 7.2% cash-flow/reinvested return. Zero dividends made all three 6% in that scenario. A blank growth input showed its error, hid results, and disabled export. Reset restored the baseline. Selecting the 10%-growth / 25× cell produced 11.2% cash-flow IRR.

Responsive checks covered 320px, 390px, 768px and 1440px. A mobile overflow traced to hidden heading line breaks joining adjacent words was corrected by preserving whitespace. Sensitivity and annual-data tables retain local horizontal scrolling. Temporary viewport overrides were reset. Print emulation confirmed white page/hero backgrounds and a hidden print button. Console warning/error checks returned no entries at the tested checkpoint. This is not a full screen-reader, physical-device or print-pagination certification.

Static checks verify unique IDs, valid internal anchors, existing local assets, substituted build placeholders and exclusion of private archive paths, message identifiers, email and authentication material from the publication. JavaScript syntax checks pass. No framework, remote font, chart library, analytics or runtime data feed is required.

## Evidence boundary

The original ChatGPT calculation replies appeared blank in the connected reader and browser. Its audit attachment did not download. No verified historical forward-P/E series was obtained. The report therefore publishes an educational explanation and a new labelled illustration, rather than implying reproduction or validation of that original estimate. The page retains this limitation in its appendix and next to the historical-P/E discussion.

Public SEC, Vanguard, S&P Dow Jones Indices and NYU Stern sources were checked for the accounting and valuation mechanics. Those citations do not source or validate the scenario assumptions. The original conversation, private attachments, account records and local research archives are not repository or deployment assets.
