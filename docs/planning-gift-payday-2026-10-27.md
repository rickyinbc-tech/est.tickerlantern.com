# Fund units given in kind and TFSA January versus payday timing

Two English articles dated 27 October 2026, each with four figures, chart data tables and editable inputs, plus Simplified Chinese editions:

- `donate-fund-units-in-kind-charity-capital-gain-zero-inclusion` (`donateKind`): giving non-registered mutual fund units to a registered charity in kind against selling first and giving cash; CRA donation credit rates by province; give-and-rebuy cost-base reset against keeping old units or selling first; savings heatmap by cost-base share and marginal rate. Distinct from the charitable cash-budget and donor-statistics guides, which it cross-links.
- `tfsa-january-deposit-or-every-payday-contribution-timing` (`tfsaPayday`): separates money already saved (January deposit vs monthly staging, waiting cash inside vs outside the TFSA, half-year return stress grid) from paycheque money (invest each payday vs save for a January deposit). Distinct from the phased-investing, batched-purchases and waiting-for-a-dip guides, which it cross-links.

## Dated sources (reviewed 27 Oct 2026)

- CRA P113 Gifts and Income Tax 2025 (page date 2026-01-20): mutual fund trust units and mutual fund corporation shares may qualify for a zero inclusion rate (T1170); 75% of net income limit; 5-year carryforward.
- CRA Line 34900 How much you can claim (2025 tax year, page date 2026-07-06): federal 14.5% / 29% / 33%; provincial rates (BC 5.06/16.8/20.5, ON 5.05/11.16, AB 60% first $200 then 21%, MB 10.8/17.4, NB 9.4/17.95, NL 8.7/21.8, NT 5.9/14.05, NS 8.79/21, NU 4/11.5, PE 9.5/19, SK 10.5/14.5, YT 6.4/12.8; QC via Revenu Québec). Chart uses 29% + provincial over-$200 rate.
- CRA Calculating and reporting capital gains (page date 2026-02-05): 50% of a capital gain taxable.
- CRA Before you give: confirm qualified donee.
- CRA TFSA limits page (page date 2025-12-01): limits 2009–2026, 2026 = 7,000; no 2027 limit; cumulative 109,000 computed.
- CRA RC4466 (marked cancelled): carryforward, withdrawals added back next year, 1%/month excess tax.
- FINRA Dollar-cost averaging (page date 2026-05-19).
- Bank of Canada Valet V39079, retrieved 27 Oct 2026, 2026-06-01 to 2026-10-23: 2.25% throughout. Response SHA-256 `ba1fa7f6755640476ca17bbd0e4090a2c9f36eded543a2456e32153536d25e4f` (saved under ignored `qa/planning-visual-2026-10-27/src/`).
- canada.ca pages were read with WebFetch; no page bytes saved.

## Calculations (defaults)

Gift: value 20,000, ACB 12,000, credit 45.8%, marginal 40%, 6%, 10 years. Credit 9,160; gain 8,000; tax if sold first 1,600; net cost 10,840 in kind vs 12,440 sold first. Year 10 after-tax: give-and-rebuy 32,653.56; keep old units 31,053.56; sell-give-rebuy 29,788.21. Loss case and zero gain: no difference.

TFSA: 7,000, fund 6%, savings 2%, tax on outside interest 30%, 20 years, monthly-equivalent rates. One year: January 7,420; staged inside 7,289.87; staged outside 7,270.50. Half-year grid: −20%/+20% → staging ahead 937.22; +20%/−20% → January ahead 458.18. Paycheque: year 1 7,225.47 vs 7,052.97; 20 years 265,793.36 vs 259,447.69 (gap 6,345.67) on 140,000 contributed.

All defaults reproduced with 40-digit Python Decimal arithmetic (`qa/planning-visual-2026-10-27/check.py`, ignored) and asserted in `tests/planning-gift-payday.test.mjs`. 600 randomized/edge input runs produced no non-finite chart or metric values.

## Checks

- `npm test`: 1770 tests, 0 failures. `npm run zh:refresh`: 0 missing units. 216 Chinese units written directly (no external translation service), inserted only after numguard agreement and identical-markup checks.
- Built HTML: four figures, four data tables and the inputs on each English and Chinese page; homepage, research index and sitemap entries present.
- Browser QA: starting a local static preview in the in-app browser was declined in this unattended run, so no browser pass of the local build is claimed.
