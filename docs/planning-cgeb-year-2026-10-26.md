# Canada Groceries and Essentials Benefit, July 2026–June 2027

One English article dated 26 October 2026 with five editable figures and chart data tables, plus a Simplified Chinese edition:

- `canada-groceries-essentials-benefit-2026-27-phase-out-quarterly-payments` (`cgebBenefitYear`): the federal CGEB (formerly the GST/HST credit) for the July 2026–June 2027 payment period, based on 2025 adjusted family net income. Distinct from the child-benefit calendar, CWB and pay-rise phase-out guides, and from the business `gst-hst-collected-bank-cash-tax-reserve` guide.

Official anchors (reviewed 26 October 2026): CRA payments chart for July 2026–June 2027 (8 June 2026); CRA How much you can get (15 July 2026); RC4210 (2 July 2026); CGEB payment dates (8 June 2026); one-time top-up page (8 July 2026); CRA GST/HST credit statistics July 2025–June 2026 (19 October 2026, CAD 9,846,224,000 in 54,827,530 payments); Finance backgrounder (26 January 2026) and legislation release (12 February 2026). Captures and SHA-256 hashes are in the ignored `qa/cgeb-next/sources/`.

Derived parameters (not quoted from a CRA formula): CAD 445 adult, CAD 445 spouse or eligible-dependant (first child of a single parent), CAD 234 per other child, single supplement 2% above CAD 11,564 up to CAD 234 (full for single parents), reduction 5% above CAD 46,432; annual under CAD 200 paid in July. They reproduce all 135 cells of the CRA chart (tested). Model stops at four children because the chart's last column is "4 children or more".

Defaults (single, no children, AFNI CAD 52,000, tested change −3,000): CAD 400.60 a year, CAD 100.15 a quarter; with the change CAD 550.60 (+150.00, 5 cents per dollar); zero at CAD 60,012. Other worked cases: AFNI 15,000 → 513.72; couple + 2 children at 40,000 → 1,358 (339.50 a quarter); AFNI 57,000 → 150.60 lump sum in July.

Chinese: 227 new units written directly (no external translation service); numeric guard 0 rejections; `zh:refresh` 0 missing. `npm test` 1,710 passed; Python unittest 135 passed. Browser QA unavailable: the preview server start was declined in the unattended run; checks used built HTML (5 figures, 8 tables, hub/home/sitemap entries) and 360px SVG rendering in Node.

## Release status

Pushed to `main`; `wrangler deploy` was blocked by the unattended run's permission policy (Production Deploy), so this URL and the earlier pushed-not-live guides (CPP pension sharing, TFSA asset location, missed best/worst months) stay 404 until the next authorized deploy from current `main`.
