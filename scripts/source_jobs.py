"""Public-source adapters supplementing monthly index-provider fundamentals."""
import hashlib
import html
import io
import os
import re
import subprocess
import logging
import time
from pathlib import Path
from pypdf import PdfReader
import jpm_source
from reference_sources import parse_msci_deck_text, parse_segal_text
from nasdaq_source import parse_dashboard, dashboard_links, biweekly_article_links
from tsx_source import parse_raymond_james, parse_cumberland, parse_global_indices, raymond_james_links, raymond_james_article_links, cumberland_report_links

MSCI_DECK = 'https://www.msci.com/downloads/web/msci-com/discover-msci/events/event-assets/2026/january/are-you-as-diversified-as-you-intend-in-2026-/Are%20you%20as%20diversified%20as%20you%20intend%20in%202026%20-%20Master%20deck.pdf'
SEGAL_PORTAL = 'https://cambridgeretirementma.gov/retirement-system/financial-reports/'
SEGAL_SEED = 'https://cambridgeretirementma.gov/wp-content/uploads/2025-4Q-Segal.pdf'
NASDAQ_LIST = 'https://www.nasdaq.com/products/global-indexes/research-insights'
NASDAQ_ARTICLE = 'https://www.nasdaq.com/articles/global-indexes/biweekly-investment-insights/earnings-show-me-moment'
NASDAQ_SEED = 'https://www.nasdaq.com/docs/global-indexes/global-markets-dashboard-oct-16-2026'
RJ_LIST = 'https://www.goodridgegroup.ca/knowledge-centre'
RJ_SEED = 'https://www.goodridgegroup.ca/-/media/RJ/DotCom-Canada/Files/Commentary-and-Insights/Insights-and-strategies/Insights--Strategies-October-2026.pdf'
CP_LIST = 'https://cumberlandprivate.com/wp-json/wp/v2/posts?search=north%20american&per_page=6'
CP_SEED = 'https://cumberlandprivate.com/wp-content/uploads/2025/07/North-American-Strategy-Review-June-2025.pdf'


def pdf_pages(body, maximum=250):
    if not body.startswith(b'%PDF'): raise ValueError('Public report returned HTML or a challenge instead of PDF')
    reader = PdfReader(io.BytesIO(body))
    if not 1 <= len(reader.pages) <= maximum: raise ValueError('Unexpected report length')
    return reader.pages


def source(publisher, url, body, discovery, mode='rolling-report'):
    return dict(publisher=publisher, url=url, discoveryUrl=discovery, sha256=hashlib.sha256(body).hexdigest(), parserVersion='supplemental-sources-1', frequency='Publisher research; checked daily', syncMode=mode)


def render(body, pages, name):
    folder = Path(__file__).resolve().parents[1] / 'qa/source-pages'
    folder.mkdir(exist_ok=True, parents=True, mode=0o700)
    for page in sorted(set(pages)):
        subprocess.run(['pdftoppm', '-f', str(page), '-singlefile', '-scale-to', '1600', '-jpeg', '-', str(folder / f'{name}-{page}')], input=body, capture_output=True, check=True, timeout=40)


def parse_reference(body, parser):
    matches = []
    for i, page in enumerate(pdf_pages(body)):
        try: matches.append(parser(page.extract_text(), i + 1))
        except ValueError: continue
    if len(matches) != 1: raise ValueError('No unique explicitly labelled historical-mean table')
    return matches[0]


def segal_reports(body):
    text = html.unescape(body.decode('utf-8', 'replace'))
    # Public attachment pages expose their year and quarter in the linked slug.
    reports = set(re.findall(r'(?:https://cambridgeretirementma\.gov)?(?:/retirement-system/financial-reports/|/wp-content/uploads/)(20\d{2})[-/](\d)[qQ]-[sS]egal(?:\.pdf|/)', text))
    return sorted(reports, reverse=True)[:2]


def refresh_supplemental(by_id, fetch, update, checked, render_qa=False):
    jobs = []

    def discovery(url, parser, get=None):
        body = (get or fetch)(url).decode('utf-8', 'replace')
        links = parser(body)
        if not links and os.environ.get('PUBLIC_BROWSER_FETCH') == '1' and os.environ.get('GITHUB_ACTIONS') == 'true':
            from public_browser_source import fetch_public
            links = parser(fetch_public(url).decode('utf-8', 'replace'))
        return links

    def run(id, ids, action):
        try:
            observations = action()
            accepted = []
            for values, evidence in observations:
                evidence.update(checkedAt=checked, adapterId=id)
                for index, metrics in values.items():
                    if index not in by_id or index not in ids: continue
                    update(by_id[index], metrics, evidence, checked)
                    accepted.append(index)
            if not accepted: raise ValueError('No validated metrics for the selected benchmarks')
            jobs.append(dict(id=id, indices=sorted(set(accepted)), status='ok', checkedAt=checked, error=None))
        except Exception as exc:
            if not isinstance(exc, ValueError): logging.exception('Unexpected publisher adapter failure: %s', id)
            message = str(exc)[:200] if isinstance(exc, ValueError) else 'Source unavailable (' + type(exc).__name__ + ')'
            for index in ids:
                row = by_id[index]
                for source_key, sync_key in [('source', 'sync'), ('meanSource', 'meanSync')]:
                    if row.get(source_key, {}) and row[source_key].get('adapterId') == id:
                        old = row.get(sync_key) or {}
                        row[sync_key] = dict(status='retained', lastAttempt=checked, lastSuccess=old.get('lastSuccess'), error=message)
            jobs.append(dict(id=id, indices=ids, status='retained', checkedAt=checked, error=message))

    def jpm():
        body = fetch(jpm_source.URL)
        values = jpm_source.parse_pdf(body)
        if render_qa: render(body, [row['page'] for row in values.values()], 'jpm')
        return [(values, source('J.P. Morgan / FactSet / MSCI', jpm_source.URL, body, jpm_source.URL, 'rolling-document'))]
    run('jpm-daily', ['acwi', 'europe', 'em', 'csi300', 'japan', 'australia', 'china', 'india', 'asia-ex-japan'], jpm)

    def msci():
        body = fetch(MSCI_DECK)
        values = parse_reference(body, parse_msci_deck_text)
        if render_qa: render(body, [row['page'] for row in values.values()], 'msci-reference')
        return [(values, source('MSCI', MSCI_DECK, body, MSCI_DECK, 'dated-reference'))]
    run('msci-reference', ['acwi', 'world', 'em', 'europe'], msci)

    def segal():
        # Keep the verified seed; newer reports sometimes omit historical means.
        urls = [SEGAL_SEED]
        try:
            for year, quarter in segal_reports(fetch(SEGAL_PORTAL)):
                url = f'https://cambridgeretirementma.gov/wp-content/uploads/{year}-{quarter}Q-Segal.pdf'
                if url not in urls: urls.append(url)
        except ValueError: pass
        observations = []
        for url in urls:
            try:
                body = fetch(url)
                values = parse_reference(body, parse_segal_text)
                if render_qa: render(body, [row['page'] for row in values.values()], 'segal-reference')
                observations.append((values, source('Segal Marco Advisors / FactSet', url, body, SEGAL_PORTAL, 'dated-reference')))
            except ValueError: continue
        return observations
    run('segal-reference', ['eafe', 'uk', 'msci-canada', 'japan'], segal)

    def nasdaq():
        # Respect the publisher's 30-second crawl delay for every Nasdaq request.
        last_fetch = [0.0]
        def get(url):
            delay = 30 - (time.monotonic() - last_fetch[0])
            if delay > 0: time.sleep(delay)
            last_fetch[0] = time.monotonic()
            return fetch(url)
        urls = []
        try:
            listing = get(NASDAQ_LIST).decode('utf-8', 'replace')
            urls.extend(dashboard_links(listing))
            articles = biweekly_article_links(listing)
            if not urls and not articles:
                articles = discovery(NASDAQ_LIST, biweekly_article_links, get)
            # The latest article is exposed in the publisher listing when SSR
            # is available. Seed is a verified dated fallback, not a guessed URL.
            for article in (articles[:2] + ([NASDAQ_ARTICLE] if NASDAQ_ARTICLE not in articles[:2] else [])):
                for url in discovery(article, dashboard_links, get):
                    if url not in urls: urls.append(url)
        except ValueError: pass
        if NASDAQ_SEED not in urls: urls.append(NASDAQ_SEED)
        observations = []
        for url in urls[:3]:
            try:
                body = get(url)
                pages = pdf_pages(body, 6)
                values = parse_dashboard('\n'.join(page.extract_text() for page in pages))
                for row in values.values(): row['page'] = 1
                if render_qa: render(body, [1], 'nasdaq-dashboard')
                observations.append((values, source('Nasdaq / Bloomberg / FactSet', url, body, NASDAQ_LIST)))
            except ValueError: continue
        return observations
    run('nasdaq-dashboard', ['nasdaq100', 'russell2000', 'japan'], nasdaq)

    def stoxx():
        from lseg_stoxx_source import refresh_lseg_stoxx
        values, evidence = refresh_lseg_stoxx(fetch)
        return [({'stoxx600': values}, evidence)]
    run('lseg-stoxx', ['stoxx600'], stoxx)

    def tsx_current():
        urls = []
        try:
            for article in raymond_james_article_links(fetch(RJ_LIST).decode('utf-8', 'replace'))[:2]:
                urls.extend(raymond_james_links(fetch(article).decode('utf-8', 'replace')))
        except ValueError: pass
        if RJ_SEED not in urls: urls.append(RJ_SEED)
        result = []
        for url in urls[:3]:
            try:
                body = fetch(url)
                pages = [page.extract_text() for page in pdf_pages(body)]
                values = {'tsx': parse_raymond_james(pages), **parse_global_indices(pages)}
                for row in values.values(): row['page'] = row.pop('sourcePage')
                if render_qa: render(body, [row['page'] for row in values.values()], 'raymond-james-current')
                result.append((values, source('Raymond James / FactSet', url, body, RJ_LIST)))
            except ValueError: continue
        return result
    run('raymond-james-tsx', ['tsx', 'ftse100', 'hangseng', 'nikkei225', 'csi300'], tsx_current)

    def tsx_mean():
        urls = [CP_SEED]
        try:
            urls.extend(url for url in cumberland_report_links(fetch(CP_LIST).decode('utf-8', 'replace'))[:2] if url != CP_SEED)
        except ValueError: pass
        result = []
        for url in urls:
            try:
                body = fetch(url)
                values = parse_cumberland([page.extract_text() for page in pdf_pages(body)])
                values['page'] = values.pop('sourcePage')
                if render_qa: render(body, [values['page']], 'tsx-reference')
                result.append(({'tsx': values}, source('Cumberland / Bloomberg', url, body, CP_LIST, 'dated-reference')))
            except ValueError: continue
        return result
    run('cumberland-tsx', ['tsx'], tsx_mean)

    def ig():
        from ig_source import refresh_ig_asia
        values, evidence = refresh_ig_asia(fetch)
        evidence['syncMode'] = 'dated-reference'
        # This is a dated outlook, rather than a live daily quote.
        for row in values.values(): row['earningsBasis'] = row['forwardMethod']
        return [(values, evidence)]
    run('ig-asia-reference', ['hangseng', 'nikkei225'], ig)

    def scbam():
        from scbam_source import SCBAM_SEED_URL, parse_scbam_text
        body = fetch(SCBAM_SEED_URL)
        values = parse_reference(body, parse_scbam_text)
        if render_qa: render(body, [row['page'] for row in values.values()], 'scbam-reference')
        return [(values, source('SCB Asset Management / Bloomberg', SCBAM_SEED_URL, body, SCBAM_SEED_URL, 'dated-reference'))]
    run('scbam-reference', ['csi300'], scbam)

    def edelweiss():
        from edelweiss_source import TEMPO_DETAIL_URL, TEMPO_SEED_URL, discover_tempo_links, parse_edelweiss_text
        urls = []
        try: urls.extend(discovery(TEMPO_DETAIL_URL, discover_tempo_links)[:2])
        except ValueError: pass
        if TEMPO_SEED_URL not in urls: urls.append(TEMPO_SEED_URL)
        observations = []
        for url in urls[:4]:
            try:
                body = fetch(url)
                values = parse_reference(body, parse_edelweiss_text)
                if render_qa: render(body, [row['page'] for row in values.values()], 'edelweiss-reference')
                observations.append((values, source('Edelweiss Mutual Fund / Bloomberg', url, body, TEMPO_DETAIL_URL)))
            except ValueError: continue
        return observations
    run('edelweiss-reference', ['ftse100', 'hangseng'], edelweiss)
    return jobs
