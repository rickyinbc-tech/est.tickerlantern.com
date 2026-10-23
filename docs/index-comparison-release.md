> Historical implementation record. Current definitions, coverage and acceptance results are documented in [the financial-integrity audit](financial-integrity-audit.md). Counts below describe their original release.

# Global index comparison update — 22 October 2026

## Result and coverage

The research site now offers a searchable, region-filtered 21-benchmark selector, a full comparison table, a selected-index valuation chart, source links and source-following scenario inputs. Exact benchmark identities remain separate. MSCI Canada does not populate the S&P/TSX Composite; MSCI Japan does not populate the Nikkei 225.

The first live publisher refresh verified 13 current forward-P/E observations: S&P 500, MSCI Canada, ACWI, World, EAFE, Emerging Markets, Europe, United Kingdom, Japan, China, India, AC Asia Pacific ex Japan, and Australia. FactSet's S&P 500 observation is dated 16 October 2026. All 12 MSCI observations are dated 30 September 2026. The corresponding dividend yields are source observations, not forecasts.

Only the S&P 500 has a verified publisher-reported ten-year average forward P/E in this release. Other means remain null. There is no reconstruction from CAPE, trailing P/E, annual returns, short histories or ETF proxies. Eight other named benchmarks have no connected forward valuation source and are explicitly labelled; their editable model defaults remain an illustration rather than an index forecast. Complete historical coverage needs further validated sources or suitable licensed data.

## Automatic updates

GitHub Actions checks the public FactSet RSS-linked research and the exact official MSCI factsheets daily at 23:15 UTC. The updater validates identity, source date, metric definition, table column order and expected row count, and publishes selected metrics, provenance and source hashes to `data/indices.json`. It does not publish source PDFs, raw research pages, private accounts or authentication material.

The read-only Worker endpoint `/api/indices` reads that public GitHub snapshot, with at most five minutes of upstream caching and the deployed verified snapshot as a labelled fallback. Data changes therefore do not require an application redeploy. Browser checks occur every five visible minutes and on visibility restoration; the update button checks for a new published snapshot. Fetch/check timestamps do not replace observation dates. Failed or old sources preserve the last verified observations and mark their status.

Source following updates unlocked entry P/E, available ten-year exit reference and historical dividend-yield inputs. Edited values are protected per benchmark. Growth and horizon remain reader assumptions. Where the ten-year mean is unavailable, the default exit equals the current multiple as an explicitly flat-multiple scenario. Initial dividend yield is a separate model convention; it is not presented as a reported payout ratio or a future dividend forecast.

## Verification

Twenty-three Node tests and nine Python tests pass. They cover dividend and IRR arithmetic, yield mode, source overrides, unavailable/invalid metrics, staleness, API fallback and write rejection, FactSet paragraph parsing, MSCI column/identity/date/row validation, ligature normalization, same-date revisions and older-source rejection. Static IDs, links, assets and build placeholders were checked. Worker dry-run succeeds.

Original MSCI source page 1 was rendered and visually inspected for each of the ten factsheets supplying the twelve MSCI rows. Local source review images remain ignored under `qa/source-pages/`; source documents are not repository assets. The ACWI source supplies the ACWI/World/Emerging Markets rows in their verified order.

Chrome checks confirmed S&P 500 source loading, MSCI World entry/flat-exit 17.92x and 1.52% initial yield, custom exit protection through an update check, source restoration, unavailable Nasdaq-100 labelling, empty search, and four Global choices under the region filter. Width checks at 320, 390, 768 and 1440 pixels found no document overflow. These are browser emulation and focused workflow checks, not physical-device or full accessibility certification.

The local Workers binary supports a compatibility date only through 19 October; local preview used that command-line override. The existing production compatibility date of 22 October is retained. No runtime feature introduced here depends on the three-day difference.

The general private PDF index refresh was attempted as required but stopped at its disk-space threshold, preserving the prior index. No financial figure in this release relies on that retained index: the published observations were fetched anew from their current public original sources.
