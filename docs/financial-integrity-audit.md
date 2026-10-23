# Financial-integrity implementation audit — 23 October 2026

**Verdict: suitable for educational annual scenarios, with source and period qualifications.** This is not an underwritten expected-return forecast or a basis for portfolio action. Source observations and model assumptions are separate.

## Baseline and scope

The fresh baseline was main `6760c0f9c80494395b6b048ea52056dd6a25938a`, deployed Worker `89473eb7-b2fb-4b22-be58-259523013b92`. At 08:11 UTC the live schema-1 GitHub transport held 21 forward P/Es, 21 reported ten-year means, 14 yields and 21 yearly-growth paths. Russell 2000 growth retained its July 9 estimate. It had no semantic snapshot identifier. The reproducible capture is [baseline metadata](financial-integrity-baseline.json).

The preceding expansion added JPM, Nasdaq, LSEG, Raymond James, Edelweiss, independently dated MSCI/Segal/Cumberland/IG/SCBAM references, and nine annual-growth adapters. This audit preserves those additions, their dates, per-index scenarios and protected yearly edits.

## Implemented decisions

| Requirement | Result | Evidence / qualification |
|---|---|---|
| Every benchmark/metric and default assumption | Completed; economic definitions qualified where undisclosed | [84 metric records and source/assumption table](source-assumption-audit.md), [registry](../data/source-definitions.json), [22 model assumptions](model-conventions.md). Exact identity, source precision, per-metric evidence/date basis, publication/check dates, definitions, permitted use and unknowns are explicit. |
| Historical comparisons and exit defaults | Completed | Six internally paired, explicitly matching forward-12-month series qualify. Fifteen references remain visible with blocked direct comparisons/defaults. A compatible mean is an illustrative mean-reversion assumption. Without one, an unlocked exit follows the active entry, including a custom entry. |
| Earnings/dividend timeline and arithmetic | Completed for the documented annual illustration; source-to-NTM mapping qualified | `100/P/E` is synthetic. Exactly n growth factors follow n elapsed holding years; a conditional NTM terminal anchor covers the next earnings period. CY/FY/house figures remain labelled proxies, not precise NTM transitions. No unsupported repeated future growth, payout inference or double-counted buyback/dividend is introduced. |
| IRR and output consistency | Completed | Financial formulas were independently confirmed. Generic IRR invalid-flow/fixed-bracket defects were repaired using log-gross solving and residual diagnostics. One accepted scenario drives charts, tables and narrative. CSV preserves full precision, model/snapshot versions, all assumptions and source/custom classifications. |
| Conservative adapters and retention | Completed controls; live source access qualified | Named MSCI row binding, newest-candidate failures, explicit publication-date-only FactSet basis, bounded MIME/signature/truncation checks and off-allowlist redirects. Atomic bundles permit independent valid metrics to publish; failures retain their own last success and original evidence. N/M, withdrawal, zero and missing stay distinct. |
| Versioned snapshots, fallback and concurrent edits | Completed | Financial/definition-only semantic IDs and monotonic versions; checks do not invent observations. Remote and bundled feeds use the same complete-21 contract. Invalid/older payloads cannot discard an accepted newer client. Workflow rebases without force-push; conflicts fail visibly. |
| Reader protection and live refresh | Completed preview checks; live publication recorded below | Protected entry/exit, payout/yield/mode, growth and horizons survive. A temporarily blank edited year survives an in-flight revision while an untouched focused year updates visibly. Switching indices during refresh applies only the current benchmark and restores each saved path. |
| Existing scheduling and automation | Qualified | Existing daily 23:15 UTC workflow is active; the existing 13:00 Vancouver publisher heartbeat remains active and unchanged. The baseline history contained manual dispatches only. Actual scheduled execution remains not yet evidenced; no waiting or fabricated schedule proof. |
| Static HTML, print and visuals | Completed focused checks | Static source numbers and coverage derive from the accepted build snapshot. Original precision and publication-date limitations are visible. A4 print was rendered and its complete assumptions page inspected; the model heading and form stay together. Mobile/desktop checks and current captures are recorded below. |
| Original-source evidence | Qualified | [Manifest](source-evidence-manifest.json): 30 original saved-page image inspections plus seven fresh primary text reads, distinctly labelled. Additional current MSCI PDFs were fetched and parsed by the pipeline audit. This is not a claim of fresh visual certification of every publisher document. |

## Acceptance evidence

`npm test`: **86/86**; `python3 -m unittest discover -s tests -p 'test_*.py'`: **114/114**. Build, JavaScript syntax and whitespace checks passed. Source-shaped synthetic fixtures are identified in tests and never published as production observations.

Independent math includes one-year 20×/6%/30% payout = **7.50%**, five-year 25×→20×/6%/30% = **1.3733649777% price CAGR** and **2.6865056300% IRR**, payout/yield equivalence, and a declining-price case with cash wealth **35**, reinvested wealth **33**, IRR **−42.6707195%** and reinvested CAGR **−42.5543735%**. A 1,536-scenario supported-domain grid independently checks NPV residuals. No supported-domain financial formula defect was found.

Browser failure injection at an isolated localhost preview verified changed forecasts, blank and custom edit retention, untouched focused fields, index switches in flight, invalid remote plus invalid fallback, HTTP failures and older-snapshot rejection. These are simulated change-detection tests; they are not evidence that a publisher changed a number during this audit.

## Publication and live verification

Pending final publication checks. This section is completed with actual implementation commit, deployment, workflow and live snapshot evidence after publication.

## Remaining qualifications

- Many publishers do not disclose complete earnings aggregation, negative-earner coverage, currency construction, historical sampling or methodology version. These are explicit unknowns, not inferred equivalence. Historical reference dates are not invented window endpoints.
- Russell 2000 growth retains verified July 9 First Eagle/LSEG evidence because anonymous automation is blocked. CSI 300 is a dated May house model with revision checks, not automatic replacement discovery.
- The hardened fetch identified a current EAFE PDF ending `%%EO` rather than a complete PDF terminator. It is rejected as truncated; prior validated observations remain available. Hosted outcomes are recorded after the actual run, not assumed from local access.
- CY/FY and Amova forecast-date EPS scenarios cannot establish a precisely date-matched rolling-NTM forecast. Amova's prior invented “Year to” labels were corrected to printed forecast-date scenarios; numeric values and original dates were preserved.
- Source observation age, successful-check age, failures, definition review and delivery fallback are distinct. A fresh check does not make a dated observation current. Missing yields and unpublished growth years remain missing.
- Existing tabs require one reload to acquire changed application code; subsequent data refreshes use the existing snapshot path. Browser-local scenarios do not synchronize across devices.
- GitHub raw delivery, five-minute Worker fetch caching, five-minute API edge caching and five-minute visible polling are separate delays. Publication/check cadence and these caches can compound; no instantaneous synchronization or hard maximum is promised.

Operational references: [GitHub schedules](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule), [bot-token trigger behavior](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow), [Cloudflare fetch caching](https://developers.cloudflare.com/workers/examples/cache-using-fetch/). Bot data commits do not need a deployment trigger: the Worker reads the committed snapshot. Application changes are separately deployed.
