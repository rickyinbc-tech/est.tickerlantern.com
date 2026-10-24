# Shared forecast/projection policy for all 21 indices

The shared five-year policy now applies to every index. Published growth supplies only its named year; missing years use a sourced long-term nominal EPS projection for the target's market or region. This replaces the older S&P/Japan timing bridges and 18 editorial normalized paths, while retaining Nasdaq's already-corrected forecast/projection pattern.

The workbench, initial static comparison, interactive table and both cash-flow exports use the same path. Source cards name the applicable Invesco market/region, vintage and calculation. Consensus and house forecasts retain their identity and source period labels. Published rates are not capped, faded or carried into uncovered years.

The [policy and all 21 mappings](five-year-forecast-policy.md) document each market/region proxy and the additive earnings/inflation/buyback derivation. Source forecasts, valuations and dividend observations are unchanged. All 21 growth schedules are available; STOXX 600's cash-return output retains its existing requirement for an eligible cash-dividend assumption.

Explicit yearly overrides, custom constant/annual modes and benchmark-specific saved settings remain protected. Legacy source-mode defaults migrate to forecast-long-term-v5, including paused defaults. Future source refreshes preserve the new named-year application metadata.

Validation before publication:

- 122 JavaScript tests passed, covering independently specified paths for all 21 indices, source tie-outs, gaps, uncapped forecasts, invalid inputs, CSV provenance and migration from all prior policies.
- Nine source-definition tests passed.
- Production build, Wrangler dry run and whitespace checks passed.
- Local browser checks passed all 21 indices at 1440px and 390px, including exact inputs, source formulas, house/consensus labels and no horizontal overflow.
- The downloaded all-index CSV retained 126 valuation-date records and 105 matching growth inputs with the correct source per year.
- Per-index edit isolation, source restoration and no browser errors were verified. Desktop/mobile screenshots were visually inspected.

No private PDFs, archives or downloaded source bytes are included in publication.

Published as Worker version `d83d4184-7f7d-4a7c-8f0a-8ce3fbe57ec2`. Live checks passed all 21 indices at desktop and mobile widths, all-index CSV reconciliation, source/projection attribution and saved-edit protection. The five changed live asset hashes matched the local build. Stock analysis, structured notes and GIC routes returned HTTP 200. Final live desktop/mobile screenshots were visually inspected.
