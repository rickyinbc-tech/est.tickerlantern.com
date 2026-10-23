# Notes domain consolidation — 23 October 2026

The user's requested consolidation is live at https://tickerlantern.com.
The index workbench remains the homepage, with links to structured-note research
at `/notes/research` and equity-linked GIC research at `/gics`. The note screener,
individual notes, indices, probabilities, scenarios, methodology, sources and
downloads retain their original paths on the apex domain.

The index Worker calls `tickerlantern-notes` through `NOTES_RESEARCH`. Its own
`/api/indices` endpoint and all index assets/data remain unchanged. Study bundles
use `/notes-app/assets/`. The former notes hostname returns HTTP 301 redirects,
preserving paths and queries; its root maps to `/notes/research` and its health
endpoint to `/api/notes/health`. Its DNS entry remains for these redirects.

Deployed application source: index `f8616ac`, study `27854c7`. Cloudflare versions:

- `tickerlantern-est`: `13da9a8b-c10e-472b-adf7-c7934b9d2170`.
- `tickerlantern-notes`: `e2ca4cde-759f-47be-b0cc-4cf61dd2a776`.

The study was first staged with legacy redirects disabled. Apex routing was
published and checked before redirects were enabled. The previous index version
`b657b0c5-d07b-4b1d-ab2d-a802dd0d379a` remains in Cloudflare's history.

Verification: 123 index tests and 49 study tests passed. Production builds and
Wrangler dry runs passed. The combined live smoke test passed 20 page/download
routes, initial bundle loading, three blocked source paths, read-only health
methods and 22 old-domain redirects. All ten live study assets/downloads match
the reviewed build; all five downloads retain their pre-migration hashes.
The 22 existing index asset/data files remain byte-identical, and the existing
API validates all 21 benchmarks. Desktop and 390px mobile navigation, the GIC
page, a note detail page, the research chart and browser redirects were checked.
No financial input or model was refreshed during this migration.

Local Worker QA used a compatibility-date override of 2026-10-19 because the
installed emulator supports that date; production retains 2026-10-22. The final
Cloudflare deployment and public HTTP/browser checks verify the production
runtime. QA captures and operational logs remain private and ignored.
