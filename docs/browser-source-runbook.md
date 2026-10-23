# Scheduled publisher browser checks

The active Codex heartbeat **Refresh TickerLantern publisher valuations** runs
daily at 1 p.m. America/Vancouver in the existing chat. It needs the owner's Mac
powered on, Codex running, the browser connection available, and saved GitHub
access. GitHub Actions checks the other public sources at 23:15 UTC.

Hosted Nasdaq requests failed without a main-document response; Edelweiss
returned HTTP 403. Both original public reports were accessible through their
ordinary official browser links and visually reviewed. A denial is not
permission to bypass an access control.

## Each daily run

1. Check Git status and pull `origin/main` with `--ff-only` when safe. Preserve
   unrelated work and never publish neighbouring workspace files.
2. Use the supported browser tools, not a local headless controller. Open
   [Nasdaq's research hub](https://www.nasdaq.com/products/global-indexes/research-insights).
   Follow its latest dated Biweekly Investment Insights article, then its
   **Global Markets Dashboard** attachment. Respect the 30-second interval
   between explicit Nasdaq requests. Download the actual linked original
   through the browser. Review page 1: exact Nasdaq-100, Russell 2000 and MSCI
   Japan rows, NTM P/E, **10yr Avg**, the daily-average definition, and observation
   date. An article's publication date is not the table's observation date.
3. Open [Edelweiss's stable TEMPO detail page](https://www.edelweissmf.com/investor-insights/fund-market/tempo).
   Follow **Click here to download**. Review the original global-equities table
   (currently PDF page 4), its **12-month forward** definition, **P/E 10yr Avg**
   column and source date. Use only exact FTSE 100 and Hang Seng rows. TOPIX is
   not Nikkei 225; Shanghai Composite is not CSI 300.
4. Stop on a denied page, CAPTCHA, sign-in requirement or browser warning.
   Do not change identity, use proxies, guess filenames or call blocked APIs.
   Retain existing observations and report the concrete failed check.
5. Import each successfully reviewed original with the exact observed URL and
   actual UTC browser source-check time:

   ```sh
   python3 scripts/import_browser_pdf.py --adapter nasdaq-dashboard --pdf /absolute/path/to/download.pdf --url 'ACTUAL-PUBLISHED-NASDAQ-URL' --verified-at ACTUAL-UTC-CHECK-TIME --publish-snapshot
   python3 scripts/import_browser_pdf.py --adapter edelweiss-reference --pdf /absolute/path/to/download.pdf --url 'ACTUAL-PUBLISHED-TEMPO-URL' --verified-at ACTUAL-UTC-CHECK-TIME --publish-snapshot
   ```

   Replace placeholders with the actual browser evidence. The importer uses
   the same bounded native PDF parsers, hashes the original bytes and publishes
   selected numeric facts only. Never renew a timestamp by rereading an old
   local PDF. Repair a changed layout and its regression test before publishing.
6. Run Python parser tests and `npm test`. Review the diff. Commit and push only
   `data/browser-observations.json` and `data/indices.json` for routine updates.
   Parser repairs may include their focused source/test files after verification.
   Never commit PDFs, screenshots, credentials or private files.
7. Verify the live `/api/indices` feed and selected cards. Allow the cache
   interval. JSON updates require no site redeployment. Stay quiet when numeric
   values are unchanged; a failed/overdue check or meaningful numeric change is
   actionable.

## CI and freshness

`data/browser-observations.json` holds independent verification times, original
hashes, URLs, definitions and selected metrics. It contains no session state or
complete publisher document. After a hosted fetch fails, CI may accept an
independent browser verification for **48 hours**. It checks publisher identity,
exact benchmark set, required provenance, hash and UTC time. Reading this file
never renews the verification timestamp.

The job records `status: browser-verified`, `lastBrowserCheck` and the hosted
failure reason, distinct from a successful hosted request. An overdue check
makes CI fail after retaining the figures and marks affected metrics retained.
Current P/E, historical mean and dividend yield keep independent dates. Newer
observations win; equal dates prefer explicit primary 12-month-forward tables.

The original PDF import is exercised already. Continued operation depends on
the local scheduled task. Fully server-independent delivery for blocked
publishers would require a permitted endpoint or licensed dataset; a green
hosted job does not imply that dependency has disappeared.
