"""Transport boundary tests; these tests never install or launch a browser."""
import os
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import Mock, patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
import public_browser_source as source


NASDAQ = 'https://www.nasdaq.com/docs/global-indexes/global-markets-dashboard-oct-16-2026'
LISTING = 'https://www.edelweissmf.com/investor-insights/fund-market/tempo'
TEMPO = 'https://www.edelweissmf.com/Files/Insigths/viewpoint/Edelweiss_Mutual_Fund-TEMPO_10022026_031024_PM.pdf'


class BrowserSourceTests(unittest.TestCase):
    def tearDown(self):
        source.close()

    def test_strict_navigation_boundaries(self):
        for good in (NASDAQ, LISTING, TEMPO, 'https://www.nasdaq.com/products/global-indexes/research-insights',
                     'https://www.nasdaq.com/articles/global-indexes/biweekly-investment-insights/earnings-show-me-moment'):
            source._validate_url(good)
        for bad in ('http://www.nasdaq.com/docs/global-markets-dashboard.pdf',
                    'https://www.nasdaq.com.evil.example/docs/global-markets-dashboard.pdf',
                    'https://user:password@www.nasdaq.com/docs/global-markets-dashboard.pdf',
                    NASDAQ + '?token=secret', NASDAQ + '#fragment',
                    'https://www.nasdaq.com/api/v1/foo',
                    'https://www.nasdaq.com/docs/../private/global-markets-dashboard.pdf',
                    'https://www.nasdaq.com/docs/%2e%2e/private/global-markets-dashboard.pdf',
                    'https://www.edelweissmf.com/Files/Insights/viewpoint/private.pdf'):
            with self.subTest(url=bad), self.assertRaises(ValueError):
                source._validate_url(bad)

    def test_ci_opt_in_is_required_before_lazy_launch(self):
        with patch.dict(os.environ, {}, clear=True), patch.object(source, '_Session') as launcher:
            with self.assertRaises(ValueError):
                source.fetch_public(NASDAQ)
            launcher.assert_not_called()
        with patch.dict(os.environ, {'PUBLIC_BROWSER_FETCH': '1'}, clear=True), patch.object(source, '_Session') as launcher:
            with self.assertRaises(ValueError):
                source.fetch_public(NASDAQ)
            launcher.assert_not_called()

    def test_lazy_lifetime_and_explicit_cleanup(self):
        session = Mock()
        session.fetch.return_value = b'%PDF-public'
        with patch.dict(os.environ, {'PUBLIC_BROWSER_FETCH': '1', 'GITHUB_ACTIONS': 'true'}, clear=True), patch.object(source, '_Session', return_value=session) as launcher:
            self.assertEqual(source.fetch_public(NASDAQ), b'%PDF-public')
            source.fetch_public(TEMPO)
            launcher.assert_called_once_with()
            source.close()
            source.close()
            session.close.assert_called_once_with()

    def test_denied_documents_are_not_returned_as_data(self):
        for html in ('<title>Access Denied</title>', '<body>Verify you are human</body>',
                     '<title>Just a moment...</title>', '<body>Request blocked</body>'):
            with self.subTest(html=html), self.assertRaises(ValueError):
                source._reject_denied(html)
        source._reject_denied('<html><script src="recaptcha.js">access denied</script><a href="tempo.pdf">TEMPO</a></html>')
        with self.assertRaises(ValueError):
            source._pdf_bytes(b'<html>Access denied</html>')
        with self.assertRaises(ValueError):
            source._bounded(b'x' * (source.MAX_BYTES + 1))

    def make_session(self, response, html='<html><a href="tempo.pdf">TEMPO</a></html>'):
        # Bypass __init__ so no Playwright dependency or browser is used.
        session = object.__new__(source._Session)
        session.error = RuntimeError
        session.timeout = TimeoutError
        session.browser = Mock()
        context = session.browser.new_context.return_value
        page = context.new_page.return_value
        page.main_frame = object()
        page.url = response.url
        page.content.return_value = html
        callbacks = {}

        def on(event, callback):
            # Real Playwright's ImplToApiMapping.wrap_handler caches a wrapper
            # with setattr. Built-in list.append fails this actual API contract.
            setattr(callback, '_pw_impl_instance_', callback)
            callbacks[event] = callback
        page.on.side_effect = on
        response.request.is_navigation_request.return_value = True
        response.request.frame = page.main_frame

        def goto(*args, **kwargs):
            callbacks['response'](response)
            return response
        page.goto.side_effect = goto
        return session, context, page, callbacks

    def test_download_callback_supports_real_playwright_wrapper_cache(self):
        response = Mock(url=NASDAQ, status=200, headers={'content-type': 'application/pdf'})
        response.body.return_value = b'%PDF-public'
        session, _, _, callbacks = self.make_session(response)
        session.fetch(NASDAQ)
        self.assertTrue(hasattr(callbacks['download'], '_pw_impl_instance_'))
        self.assertTrue(hasattr(callbacks['response'], '_pw_impl_instance_'))

    def test_pdf_response_and_context_cleanup(self):
        response = Mock(url=NASDAQ, status=200, headers={'content-type': 'application/pdf'})
        response.body.return_value = b'%PDF-real-data'
        session, context, _, _ = self.make_session(response)
        self.assertEqual(session.fetch(NASDAQ), b'%PDF-real-data')
        context.close.assert_called_once_with()
        session.browser.new_context.assert_called_once_with(accept_downloads=True, service_workers='block')

    def test_rendered_html_and_denial_cleanup(self):
        response = Mock(url=LISTING, status=200, headers={'content-type': 'text/html'})
        session, context, page, _ = self.make_session(response)
        self.assertIn(b'TEMPO', session.fetch(LISTING))
        page.locator.return_value.first.wait_for.assert_called_once()
        context.close.assert_called_once_with()
        session, context, _, _ = self.make_session(response, '<body>Verify that you are human</body>')
        with self.assertRaises(ValueError):
            session.fetch(LISTING)
        context.close.assert_called_once_with()

    def test_http_denial_is_terminal_before_body_or_link_wait(self):
        response = Mock(url=LISTING, status=403, headers={'content-type': 'text/html'})
        session, context, page, _ = self.make_session(response)
        with self.assertRaisesRegex(ValueError, 'HTTP 403'):
            session.fetch(LISTING)
        response.body.assert_not_called()
        page.locator.assert_not_called()
        context.close.assert_called_once_with()

    def test_pdf_download_is_read_and_deleted_after_navigation_abort(self):
        response = Mock(url=TEMPO, status=200, headers={'content-type': 'application/pdf'})
        session, context, page, callbacks = self.make_session(response)
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'public-download'
            path.write_bytes(b'%PDF-downloaded')
            download = Mock(url=TEMPO)
            download.path.return_value = path
            download.failure.return_value = None

            def goto(*args, **kwargs):
                callbacks['response'](response)
                callbacks['download'](download)
                raise RuntimeError('net::ERR_ABORTED')
            page.goto.side_effect = goto
            self.assertEqual(session.fetch(TEMPO), b'%PDF-downloaded')
            download.delete.assert_called_once_with()
            context.close.assert_called_once_with()

    def test_unreviewed_redirect_is_aborted(self):
        response = Mock(url=LISTING, status=200, headers={'content-type': 'text/html'})
        session, context, page, _ = self.make_session(response)
        route = Mock()
        route.request.url = 'https://www.edelweissmf.com/login'
        route.request.is_navigation_request.return_value = True
        route.request.frame = page.main_frame
        context.route.side_effect = lambda glob, callback: callback(route)
        with self.assertRaisesRegex(ValueError, 'left reviewed'):
            session.fetch(LISTING)
        route.abort.assert_called_once_with()
        route.continue_.assert_not_called()
        context.close.assert_called_once_with()

    def test_ordinary_https_iframe_is_not_a_top_level_redirect(self):
        response = Mock(url=LISTING, status=200, headers={'content-type': 'text/html'})
        session, context, _, _ = self.make_session(response)
        route = Mock()
        route.request.url = 'https://public-cdn.example/embedded-frame'
        route.request.is_navigation_request.return_value = True
        route.request.frame = object()
        context.route.side_effect = lambda glob, callback: callback(route)
        self.assertIn(b'TEMPO', session.fetch(LISTING))
        route.continue_.assert_called_once_with()
        route.abort.assert_not_called()


if __name__ == '__main__':
    unittest.main()
