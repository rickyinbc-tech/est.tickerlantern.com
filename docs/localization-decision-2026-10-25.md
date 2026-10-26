# Localization decision: keep public copy English-only

Reviewed 25 October 2026.

## Decision

TickerLantern's public pages remain English-only. Do not merge the machine-translation experiment from
`tickerlantern-search-20261025` or add a language switcher that translates article bodies at runtime.

## What was evaluated

An uncommitted experiment in the `codex/tickerlantern-search-20261025` worktree added:

- a header language control for English, Traditional Chinese and Simplified Chinese;
- a build step that sent visible text to `translate.googleapis.com` and stored large per-language
  dictionaries under `src/locales/` and `dist/locales/`;
- client-side replacement of headings, paragraphs, captions, labels and search-result text.

It was preserved as the stash `Machine-translation locale experiment not shipped: English-only copy doctrine`
on branch `codex/tickerlantern-search-20261025`. The worktree is otherwise clean.

## Reasons not to ship it

- Website copy is required to remain English. A machine-translated second copy is still public website copy.
- The translated pages reuse the English URLs. That risks duplicate or mixed-language pages in search results
  without an editorial review process for every translated sentence.
- The build depends on an unofficial translation endpoint. Its availability, rate limits and output can change
  without notice, so a published site could silently keep stale or missing translations.
- Financial-planning text needs reviewed terminology, source attribution and numerical wording. Automatic
  translation can alter a qualification, a date, a denominator or a warning in ways the English page does
  not show.

## If localization is revisited

Treat it as a separate editorial product, not a build toggle:

1. Define reviewed locales and a named reviewer for each.
2. Translate from a fixed source revision and record that revision beside each translated page.
3. Use locale-specific URLs with canonical and hreflang metadata.
4. Keep charts, source notes and legal or scope statements in a reviewed form.
5. Add a visible correction path and a way to fall back to the English source.

Until then, search, articles and interface copy remain in English.
