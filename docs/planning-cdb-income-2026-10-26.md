# Canada Disability Benefit, July 2026–June 2027

One English article dated 26 October 2026 with five editable figures and chart data tables:

- `canada-disability-benefit-2026-27-income-test-working-income-exemption` (`cdbIncomeTest`): the federal CDB allocation for the July 2026–June 2027 payment period, based on 2025 adjusted family net income. Distinct from the long-term-disability offset, disability waiting-period/cap, disability-prevalence, CWB and CGEB guides.

Official anchors (reviewed 26 October 2026): Canada Disability Benefit Regulations SOR/2025-35 (current to 30 September 2026) and amending SOR/2026-123 (Canada Gazette II, 1 July 2026, in force 1 September 2026); ESDC amount, eligibility and payments pages (15 September 2026); Government of Canada benefits calendar (7 August 2026); ESDC release of 10 September 2026 (335,650 people paid CAD 813,074,098 to date, cumulative); Statistics Canada CPI annual reviews (2025 average 164.2, +2.1%; 2024 average 160.9). Shell downloads from canada.ca failed in this run, so source notes in the ignored `qa/cdb-next/sources/` are fetched-text summaries, not byte captures with hashes.

Published 2026–27 amounts: CAD 204.20 a month, exemptions CAD 10,210 / 14,294. Derived (not yet published by ESDC): thresholds CAD 23,483 / 33,182.50 with factor 1.021. The published figures are exactly 1.021 × the 2024 amounts, i.e. the rounded 2.1% CPI change; unrounded index levels (164.2 ÷ 160.9 = 1.02051) would give CAD 204.10 and CAD 10,205. The model's factor is editable and the article states this discrepancy.

Checks: the formula reproduces ESDC's four 2025–26 examples (200.00, 166.67, 200.00, 137.50) with factor 1; 2026–27 versions 204.20, 182.42, 204.20, 147.39. Default (single, AFNI 36,000, working 8,000, +3,000 working): CAD 128.92 a month, 1,547.04 a year; tested 1,389.00 (−158.04, 5.3 cents per dollar); as other income 947.04 (−600, 20 cents); zero at 43,735. Lump-sum boundary CAD 20.00 at AFNI 34,535. All cross-checked with Python Decimal.

Also fixed in this batch: metric boxes in the CGEB and CPP pension-sharing models (pushed, not yet live) and the CWB model (live since an earlier deploy, so the live page currently shows the bug) showed their explanatory note in place of the amount; the renderer now takes an optional fifth `detail` element shown under the value, and those notes moved there unchanged. The CPP-sharing share metric passed 72.92 to a fraction-based percent formatter (shown as 7292.00%); it now passes 0.7292. A regression test covers all four models.

## Release status

Pushed to `main` at 67c5827. Pending deploy: `wrangler deploy` was blocked again by the unattended run's permission policy (Production Deploy), and the preview-server start for a browser check was declined. Live checks on 26 October 2026: this guide, CGEB, CPP pension sharing, TFSA asset location, missed best/worst months, fund income type and crash-warning guides all 404; the CWB guide is 200 with the pre-fix metric boxes.
