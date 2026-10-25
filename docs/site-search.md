# Site search

`/search?q=mortgage+renewal` searches the publication's articles, individual
planning charts and research tools. The index is rebuilt by the normal
`npm run build` after article rendering and SEO enrichment. Newly published
guides and their actual chart IDs enter automatically. Only the publication's
source modules and `dist/` are read; neighboring private archives are excluded
by construction.

The browser downloads the index only on the search page. Search uses title,
category, description and article text, with curated English / traditional and
simplified Chinese / Cantonese financial-topic synonyms. It also supports
English prefixes and a single-character spelling difference. These are search
rules, not an LLM or unrestricted semantic understanding. Unsupported phrasing
can require a shorter or broader query. No paid API, account or search-history
storage is needed.

Articles, charts and tools have separate filters, and a topic selector narrows
the section. Chart results use real generated SVG previews and link to existing
figure anchors. Evidence labels retain the distinction between official
observations and hypothetical scenarios. The previews describe the published
default example, not a visitor's custom scenario.

Structured-note and GIC landing pages are indexed from the existing public
`studyPages` metadata. Individual note contracts and dynamic screener rows are
not indexed as separate articles or figures. The main Worker inserts the same
search assets into the proxied research site's HTML without changing the
separate notes service. The client keeps the search entry present when that
application renders or replaces its header.

Query, type and topic are shareable URL parameters. Search result pages use
`noindex,follow` and stay out of the sitemap. The input supports IME composition,
live results, retry on index-loading failure, keyboard focus and `/` or
Cmd/Ctrl+K shortcuts. Inputs and results are escaped before rendering.

Verify with `npm run build`, `node --test tests/search.test.mjs`, and `npm test`.
For local Worker preview use Wrangler 4.152.0 or newer with
`wrangler dev --local --host localhost --local-upstream localhost --port 8775`;
the host override prevents production-domain HTTPS redirects during HTTP preview.
