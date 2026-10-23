# Unified TickerLantern theme — 23 October 2026

The index workbench, stock analysis, structured-note research and equity-linked
GIC research now share a light navy/teal theme. The menu label is **Stock analysis**.
The shared header uses the same logo, typography, four primary links, active-page
indication, native mobile menu and print action. Structured-note subpages retain
their separate local navigation; both GIC languages keep their language controls.

`src/site-theme.css` has an identical copy in the notes application. It defines
the common palette, typefaces and header. Stock-analysis and notes tables, forms,
charts and supporting surfaces now use these colours and the same heading and
body typefaces. The existing index homepage hero retains its navy treatment.
The not-found page uses the same header and tokens.

All financial inputs, forecasts, numerical model modules and download contents
are retained. Stock chart JavaScript changes are colours and print bindings only.
The original stock research dates and source links remain. The notes deployment
gate includes the new shared header and stylesheet in its reviewed source hashes;
the owner-only publication record cites the current presentation instruction.
No source archives, private evidence or original PDF bytes are added to the site.

Local verification passed: 123 index tests, 59 notes/GIC tests, both production
builds, both Wrangler dry runs and the notes publication gate. A connected local
Worker preview passed 28 desktop/mobile route checks across fourteen pages,
including English and Traditional Chinese GIC views. All menus use the same
four labels and light palette. Screener filtering, note selection, probability
tabs, GIC selection, CSV download, both language controls and mobile print actions
were exercised. The retained stock browser suites passed 16 article, 20 senior
analysis and 21 historical-return checks, including calculations and real downloads.
Screenshots of the homepage, stock article, notes overview/detail and both GIC
languages were visually inspected. Tables and charts were checked after responsive
layout settled. No browser errors were reported.

Published source: index/stock `2797081`, notes/GIC `b5e5d09`. Cloudflare versions:
`d55be543-fc7b-4581-ae97-3ff75f3082fd` for `tickerlantern-est` and
`ef8f4204-637b-4fc5-a69d-9a00b84a6782` for `tickerlantern-notes`.

The production domain passed all 28 desktop/mobile route checks and the interaction
checks, including mobile menus, stock calculator navigation and print actions.
All 27 checked live application/theme/research/download files match the reviewed
build hashes. The existing www, est and notes host redirects remain correct, and
the themed not-found page retains HTTP 404. Live desktop and phone screenshots
were inspected. No browser errors were reported. These documentation updates do
not require another deployment.
