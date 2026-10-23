# Optional public publisher transport for scheduled refreshes

Implemented in `scripts/public_browser_source.py`. This is a GitHub Actions
application feature, not a local agent browser controller. It has not been run
with a browser on Ricky's computer. Mock tests verify the transport boundaries;
an actual GitHub Actions run is still needed to confirm publisher delivery.

Ordinary HTTP remains the first transport. The fallback requires both
`PUBLIC_BROWSER_FETCH=1` and `GITHUB_ACTIONS=true`. It only navigates reviewed
Nasdaq research/dashboard paths and Edelweiss TEMPO listing/report paths.
Standard HTTPS resources embedded by those public pages may load normally.
Document navigation redirects outside the reviewed paths are aborted.

The module uses the documented full Chromium headless channel, with its default
identity, TLS and launch arguments. Each fetch creates and destroys a separate
nonpersistent context. There is no account login, stored profile, saved cookie
state, stealth patch, proxy, CAPTCHA interaction or denial retry. HTTP errors,
visible human-verification screens and denied document bodies stop the fetch.
The ordinary source parser still validates index identity, dates and valuation
definitions after transport succeeds. The caller retains its last validated
observation when a transport or parser fails.

`fetch_public(url)` returns PDF bytes or the rendered public HTML, bounded to
24 MiB. Normal attachment downloads use Playwright's temporary download path and
are deleted immediately; context closure also removes temporary files. The
browser starts lazily and `close()` releases it. An exit hook is registered as a
final cleanup. Callers must continue to apply publisher rate limits, including
Nasdaq's 30-second interval between explicit source requests.

For the Ubuntu GitHub Actions job with Python 3.12:

```yaml
- run: python -m pip install playwright==1.64.1
- run: python -m playwright install --with-deps --no-shell chromium
- name: Check public publisher sources
  env:
    PUBLIC_BROWSER_FETCH: '1'
  run: python scripts/refresh_indices.py
```

The package version was checked against the publisher-maintained
[PyPI metadata for Playwright 1.64.1](https://pypi.org/pypi/playwright/1.64.1/json)
on October 22, 2026. It requires Python 3.10 or newer.

Official API references used:

- [Playwright lifecycle](https://playwright.dev/python/docs/api/class-playwright)
- [Nonpersistent browser contexts](https://playwright.dev/python/docs/api/class-browsercontext)
- [Full Chromium headless channel](https://playwright.dev/python/docs/browsers#chromium-new-headless-mode)
- [CI browser and operating system dependency installation](https://playwright.dev/python/docs/ci-intro)
- [Response body bytes](https://playwright.dev/python/docs/api/class-response#response-body)
- [Normal browser downloads and temporary download paths](https://playwright.dev/python/docs/api/class-download#download-path)

The default headless shell has documented PDF-navigation limitations. The full
Chromium channel is selected, and the implementation accepts either a PDF
response body or a normal attachment-download event. No response headers are
rewritten to force a download. If neither documented path delivers PDF bytes,
the refresh fails safely and retains the dated prior observation.
