# RBC stock analysis restoration — 23 October 2026

The index homepage had replaced the terminal and the original RBC article returned
HTTP 404. Restore `/research/royal-bank-valuation` within the existing index
Worker, and link it from the desktop and mobile homepage navigation. Structured
notes and equity-linked GICs retain their service routing.

The thirteen-file allowlist in `data/rbc-research-restoration.json` records the
original and restored SHA-256 hashes and the exact private terminal source commit.
Only the original public research outputs are included. Eleven files are byte
identical. The HTML navigation now points to the consolidated site, unused legacy
consent/analytics imports are removed, and the six original chart widths move
into the stylesheet to comply with the existing content policy. All visible
financial numbers, source URLs, model modules and download bytes are unchanged.
The original 17/18 October research and 16 October price dates remain explicit;
restoration does not refresh the stock analysis.

The build validates every allowlisted file hash and adds the canonical article
to the sitemap. Research assets use `Cache-Control: no-cache`. The existing index
build also includes already-published source-check metadata from its tracked
source snapshot; all index numerical inputs match the prior bundle. No domain,
Worker service binding, data schedule or audience changes are required.

Local verification: 123 index tests, 15 original RBC calculation/source tests,
and the adapted original browser suites passed (16 article, 20 senior-analysis,
21 return-study checks). Browser coverage includes edits, invalid inputs, reset,
print handling, real JSON/CSV downloads, all 46 regression observations and
1440/768/390/320px containment. Desktop and phone openings, phone navigation and
1024px homepage layout were inspected. All thirteen original source hashes were
verified against the recorded source commit; the financial text was compared
numerically with the original. Build, Wrangler dry run and `git diff --check`
passed. Local Worker QA uses `--host localhost` and compatibility date 2026-10-19;
production retains its configured date.

Application commit `f3d3906` was deployed to the existing `tickerlantern-est`
Worker, version `de2919e0-7ae5-4723-9575-792970e04285`. All thirteen live
research asset hashes match the reviewed build. The homepage, article, structured
notes, GIC calculator and sitemap return HTTP 200. The homepage navigation and
sitemap contain the restored canonical link.

All three adapted browser suites also passed against the production domain:
16 article, 20 senior-analysis and 21 return-study checks. The mobile homepage
menu was used to open the live article, its calculator rendered successfully,
and the 390px live opening was visually inspected. No browser errors were
reported. Documentation and QA capture updates do not require another deploy.
