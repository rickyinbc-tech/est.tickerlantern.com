"""Bounded parsing for Nasdaq's public Global Markets Dashboard.

This module does no networking. The caller owns approved-host fetching,
rate limits, PDF extraction, provenance hashes and retaining prior observations.
"""
import datetime as dt
import html
import re
import unicodedata
from urllib.parse import urljoin, urlparse


PARSER_VERSION = 'nasdaq-global-dashboard-1'
TARGETS = {
    'nasdaq100': r'Nasdaq\s*[-\u2010-\u2014]?\s*100\s*(?:\u00ae)?',
    'russell2000': r'Russell\s+2000',
    'japan': r'MSCI\s+Japan',
}
NUMBER = r'([+-]?\d[\d,]*(?:\.\d+)?)'
PERCENT = NUMBER + r'\s*%'


def parse_dashboard(text, today=None):
    """Return exact named-index NTM P/E, daily ten-year mean and yield.

    The source also includes thematic FIVE-year means and nearby but different
    benchmarks (EM IMI, ACWI ex-USA, Europe ex-UK). Those are never substituted.
    """
    text = unicodedata.normalize('NFKC', text)
    compact = re.sub(r'\s+', ' ', text)
    if not re.search(r'Nasdaq Global Index(?:es| Investment Insights)', compact):
        raise ValueError('Not a Nasdaq Global Indexes dashboard')
    if not re.search(r'Global (?:Index Snapshot|Markets Dashboard)', compact):
        raise ValueError('Dashboard identity missing')
    if not re.search(r'Averages utilize daily data\s*\(NTM P/E, volatility indexes\)', compact):
        raise ValueError('Daily-average definition missing or changed')
    # The label belongs to the global-equities table, not the thematic 5y table.
    start = compact.find('Global Equities')
    end = compact.find('Thematic Equity', start)
    if start < 0 or end < 0:
        raise ValueError('Global-equities table boundaries changed')
    section = compact[start:end]
    if not re.search(r'Dividend Yield NTM P/E NTM P/E 10yr Avg\.', section):
        raise ValueError('Global-equities NTM / ten-year column order changed')
    dates = set(re.findall(r'Data as of\s+(\d{1,2}/\d{1,2}/\d{4})\.', compact))
    if len(dates) != 1:
        raise ValueError('Missing or conflicting dashboard observation dates')
    observed = dt.datetime.strptime(dates.pop(), '%m/%d/%Y').date()
    if not dt.date(2000, 1, 1) <= observed <= (today or dt.datetime.now(dt.timezone.utc).date()):
        raise ValueError('Dashboard observation date outside the accepted range')
    rows = {}
    # Price, four return percentages, dividend yield, NTM, ten-year mean, premium.
    suffix = r'\s+' + NUMBER + r'\s+' + r'\s+'.join([PERCENT] * 5 + [NUMBER, NUMBER, PERCENT])
    for key, name in TARGETS.items():
        matches = re.findall(r'(?<![\w-])' + name + suffix + r'(?![\d.])', section)
        if len(matches) != 1:
            raise ValueError('Expected exactly one dashboard row for ' + key)
        values = [float(value.replace(',', '')) for value in matches[0]]
        price, *_, dividend, forward, mean, premium = values
        if price <= 0 or not 0 <= dividend <= 15 or not 1 <= forward <= 100 or not 1 <= mean <= 100:
            raise ValueError('Dashboard fundamentals outside accepted bounds')
        # The displayed premium is rounded to one decimal percent.
        if abs((forward / mean - 1) * 100 - premium) > 0.2:
            raise ValueError('Dashboard premium does not reconcile to the P/E columns')
        date = observed.isoformat()
        rows[key] = dict(forwardPE=forward, mean10YearForwardPE=mean,
                         dividendYield=dividend, asOf=date, meanAsOf=date,
                         meanMethod='Nasdaq reported 10-year average of daily next-12-month P/E observations; Bloomberg / FactSet')
    return rows


def dashboard_links(body, base_url='https://www.nasdaq.com/'):
    """Extract only publisher-linked public dashboard documents from HTML."""
    links = set()
    for href in re.findall(r'href\s*=\s*[\"\x27]([^\"\x27]+)', html.unescape(body), re.I):
        url = urljoin(base_url, href)
        parsed = urlparse(url)
        if (parsed.scheme == 'https' and parsed.hostname == 'www.nasdaq.com'
                and parsed.path.startswith('/docs/') and 'global-markets-dashboard' in parsed.path
                and not parsed.query and not parsed.fragment):
            links.add(url)
    return sorted(links)


def biweekly_article_links(body, base_url='https://www.nasdaq.com/'):
    """Extract exact links from official listings or public XML sitemaps."""
    candidates = re.findall(r'(?:href\s*=\s*[\"\x27]|<loc>)([^<\"\x27]+)', html.unescape(body), re.I)
    links = []
    for value in candidates:
        url = urljoin(base_url, value.strip())
        parsed = urlparse(url)
        if (parsed.scheme == 'https' and parsed.hostname == 'www.nasdaq.com'
                and parsed.path.startswith('/articles/') and 'biweekly-investment-insights' in parsed.path
                and not parsed.query and not parsed.fragment):
            if url not in links: links.append(url)
    return links
