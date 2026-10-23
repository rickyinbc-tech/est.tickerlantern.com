"""Optional anonymous publisher navigation for the GitHub Actions data job.

This is application transport code, never an agent's local browser controller.
The caller first tries its ordinary HTTP transport, applies publisher rate limits,
and enables this fallback explicitly. Only the two reviewed public publishers and
their research paths may be navigated. Standard page subresources may load over
HTTPS; no credentials, stored profiles, stealth settings, proxies, or challenge
handling are used. Every fetch has a new nonpersistent context, destroyed before
returning. The browser process is lazy and shared only until ``close()``.

Documented APIs: https://playwright.dev/python/docs/api/class-playwright
https://playwright.dev/python/docs/api/class-browsercontext
https://playwright.dev/python/docs/api/class-response#response-body
https://playwright.dev/python/docs/api/class-download#download-path
https://playwright.dev/python/docs/browsers#chromium-new-headless-mode
"""
import atexit
import os
from pathlib import Path
import re
from html.parser import HTMLParser
from urllib.parse import unquote, urlsplit


MAX_BYTES = 24 * 1024 * 1024
NAVIGATION_TIMEOUT_MS = 30_000
CONTENT_TIMEOUT_MS = 12_000
_session = None


def _validate_url(url):
    """Constrain top-level fetches and all document redirects to public research."""
    try:
        parsed = urlsplit(url)
        path = unquote(parsed.path)
        if (parsed.scheme != 'https' or parsed.username is not None
                or parsed.password is not None or parsed.port not in (None, 443)
                or parsed.query or parsed.fragment or '\\' in path
                or any(part in ('.', '..') for part in path.split('/'))
                or any(ord(char) < 32 for char in url)):
            raise ValueError('Unsupported public research URL')
    except (TypeError, ValueError) as exc:
        raise ValueError('Unsupported public research URL') from exc
    if parsed.hostname == 'www.nasdaq.com':
        allowed = (
            path.rstrip('/') == '/products/global-indexes/research-insights'
            or re.fullmatch(r'/articles/(?:global-indexes/)?biweekly-investment-insights/[A-Za-z0-9_-]+/?', path)
            or re.fullmatch(r'/docs/(?:global-indexes/)?global-markets-dashboard[A-Za-z0-9_.-]*', path)
        )
    elif parsed.hostname == 'www.edelweissmf.com':
        allowed = (
            path.rstrip('/') in ('/investor-insights/fund-market', '/investor-insights/fund-market/tempo')
            or (re.fullmatch(r'/files/(?:insights|insigths)/viewpoint/[^/]+\.pdf', path, re.I)
                and 'tempo' in path.lower())
        )
    else:
        allowed = False
    if not allowed:
        raise ValueError('URL is outside reviewed public publisher research paths')
    return parsed.hostname


class _VisibleText(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.hidden = 0
        self.parts = []

    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style', 'noscript'):
            self.hidden += 1

    def handle_endtag(self, tag):
        if tag in ('script', 'style', 'noscript'):
            self.hidden = max(0, self.hidden - 1)

    def handle_data(self, text):
        if not self.hidden:
            self.parts.append(text)


def _reject_denied(html):
    # Only visible page text: an ordinary footer's captcha-library source is not
    # evidence of a gate. We never click, solve, dismiss, or wait through a gate.
    parser = _VisibleText()
    parser.feed(html)
    visible = re.sub(r'\s+', ' ', ' '.join(parser.parts)).lower()
    markers = (
        'access denied', 'request blocked', 'verify you are human',
        'verify that you are human', 'checking your browser',
        'performing security verification', 'complete the captcha',
        'enable javascript and cookies to continue', 'attention required! | cloudflare',
    )
    title = re.search(r'<title\b[^>]*>(.*?)</title>', html, re.I | re.S)
    if any(marker in visible for marker in markers) or (title and re.search(r'just a moment|access denied|captcha', title[1], re.I)):
        raise ValueError('Publisher returned a denial or human-verification page; browser fallback stopped')


def _bounded(body):
    if not body or len(body) > MAX_BYTES:
        raise ValueError('Public research response is empty or exceeds the size limit')
    return body


def _check_response(response):
    _validate_url(response.url)
    if not 200 <= response.status < 300:
        raise ValueError(f'Publisher returned HTTP {response.status}; browser fallback stopped')
    try:
        length = int(response.headers.get('content-length', '0'))
    except ValueError:
        raise ValueError('Publisher returned an invalid response length') from None
    if length < 0 or length > MAX_BYTES:
        raise ValueError('Public research response exceeds the size limit')


def _pdf_bytes(body):
    body = _bounded(body)
    if not body.startswith(b'%PDF'):
        # Never return an HTML challenge disguised as a .pdf resource.
        _reject_denied(body[:1_000_000].decode('utf-8', 'replace'))
        raise ValueError('Publisher did not return a PDF document')
    return body


class _Session:
    def __init__(self):
        # A missing optional dependency must not affect ordinary HTTP sources.
        from playwright.sync_api import sync_playwright, Error, TimeoutError
        self.error = Error
        self.timeout = TimeoutError
        self.playwright = sync_playwright().start()
        try:
            # The documented full Chromium headless channel, with default UA,
            # TLS, browser arguments and automation identification unchanged.
            self.browser = self.playwright.chromium.launch(headless=True, channel='chromium')
        except Exception:
            self.playwright.stop()
            raise

    def close(self):
        try:
            self.browser.close()
        finally:
            self.playwright.stop()

    def fetch(self, url):
        host = _validate_url(url)
        context = self.browser.new_context(accept_downloads=True, service_workers='block')
        try:
            page = context.new_page()
            downloads, responses, blocked = [], [], []

            def route_request(route):
                request = route.request
                if request.is_navigation_request() and request.frame == page.main_frame:
                    try:
                        _validate_url(request.url)
                    except ValueError:
                        blocked.append(True)
                        route.abort()
                        return
                elif urlsplit(request.url).scheme not in ('https', 'data', 'blob'):
                    route.abort()
                    return
                route.continue_()

            def record_response(response):
                request = response.request
                if request.is_navigation_request() and request.frame == page.main_frame:
                    responses.append(response)

            def record_download(download):
                # Playwright caches wrappers as attributes of callbacks. A
                # built-in bound method such as list.append cannot hold them.
                downloads.append(download)

            context.route('**/*', route_request)
            page.on('download', record_download)
            page.on('response', record_response)
            navigation_error = None
            try:
                page.goto(url, wait_until='domcontentloaded', timeout=NAVIGATION_TIMEOUT_MS)
            except self.error as exc:
                # Chromium represents a normal attachment download as an aborted
                # document navigation. Accept it only with an actual PDF below.
                navigation_error = exc
            if blocked:
                raise ValueError('Publisher navigation left reviewed public research paths')
            for response in responses:
                if response.status >= 400:
                    _check_response(response)

            if downloads:
                if len(downloads) != 1:
                    raise ValueError('Unexpected multiple publisher downloads')
                download = downloads[0]
                _validate_url(download.url)
                try:
                    if download.failure():
                        raise ValueError('Publisher PDF download failed')
                    path = Path(download.path())
                    if path.stat().st_size > MAX_BYTES:
                        raise ValueError('Public research download exceeds the size limit')
                    return _pdf_bytes(path.read_bytes())
                finally:
                    download.delete()

            if not responses:
                raise ValueError('Publisher navigation produced no public document response')
            response = responses[-1]
            _check_response(response)
            content_type = response.headers.get('content-type', '').lower()
            if 'application/pdf' in content_type or urlsplit(url).path.lower().endswith('.pdf') or '/docs/' in urlsplit(url).path:
                try:
                    return _pdf_bytes(response.body())
                except self.error:
                    raise ValueError('Publisher PDF response body was unavailable') from None
            if navigation_error is not None:
                raise ValueError('Publisher HTML navigation did not complete') from None
            _validate_url(page.url)
            html = page.content()
            _reject_denied(html)
            selector = ('a[href*="biweekly-investment-insights"], a[href*="global-markets-dashboard"]'
                        if host == 'www.nasdaq.com'
                        else 'a[href*="TEMPO"], a[href*="tempo"]')
            try:
                page.locator(selector).first.wait_for(state='attached', timeout=CONTENT_TIMEOUT_MS)
            except self.timeout:
                # An otherwise public page may contain no relevant new links.
                # The discovery/parser layer decides whether to retain its seed.
                pass
            _validate_url(page.url)
            html = page.content()
            _reject_denied(html)
            return _bounded(html.encode('utf-8'))
        finally:
            # Also removes the temporary download files and in-memory cookies.
            context.close()


def fetch_public(url):
    """Return public PDF bytes/rendered HTML only in an explicitly enabled CI job.

    The ordinary HTTP fetch must be attempted by the caller first. This function
    never retries a denial/challenge or changes identity after one is returned.
    """
    global _session
    _validate_url(url)
    if os.environ.get('PUBLIC_BROWSER_FETCH') != '1' or os.environ.get('GITHUB_ACTIONS') != 'true':
        raise ValueError('Public browser fallback is restricted to the enabled GitHub Actions job')
    if _session is None:
        _session = _Session()
    return _session.fetch(url)


def close():
    """Release the optional browser; safe when it was never started or is closed."""
    global _session
    session, _session = _session, None
    if session is not None:
        session.close()


atexit.register(close)
