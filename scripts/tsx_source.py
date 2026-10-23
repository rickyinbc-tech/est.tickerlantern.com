"""Exact S&P/TSX Composite valuation parsing from public publisher reports.

Current NTM P/E and the ten-year NTM mean have independent publishers and dates.
This module deliberately never accepts the Raymond James historical median, or
Cumberland's individual calendar-year P/E estimates, as a ten-year mean/current NTM.
The caller owns source fetching, hashes, provenance, and retention policy.
"""
import datetime as dt
import html
import json
import re
import unicodedata
from urllib.parse import urljoin, urlparse


PARSER_VERSION = 'tsx-public-reports-1'


def compact(text):
    return re.sub(r'\s+', ' ', unicodedata.normalize('NFKC', text)).strip()


def validate_date(value, today=None):
    date = dt.date.fromisoformat(value)
    if not dt.date(2000, 1, 1) <= date <= (today or dt.datetime.now(dt.timezone.utc).date()):
        raise ValueError('Valuation observation date outside accepted range')
    return value


def validate_pe(value):
    if not 1 <= value <= 100:
        raise ValueError('Valuation outside accepted P/E bounds')
    return value


def parse_raymond_james(pages, today=None):
    """Read only the exact Composite row of the sector-valuation table.

    ``pages`` is a list of native PDF page text in physical-page order. The
    returned ``sourcePage`` is one-based and belongs to this observation only.
    """
    candidates = []
    for page_number, raw in enumerate(pages, 1):
        text = compact(raw)
        title = re.search(r'Table\s+\d+\s*[-\u2013\u2014]\s*S&P/TSX Composite Sector Performance and Valuations', text)
        if not title:
            continue
        # Exclude nearby charts and the later global-equity table.
        table = text[title.start():]
        end = re.search(r'Source:\s*FactSet,\s*Raymond James Ltd\.?;\s*Data as of\s+([A-Za-z]+\s+\d{1,2},\s*\d{4})\.', table)
        if not end:
            raise ValueError('Dated Raymond James / FactSet table source missing')
        table = table[:end.end()]
        if not re.search(r'Current P/E NTM\s+Historical P/E NTM', table):
            raise ValueError('Current NTM / historical column order changed')
        number = r'([+-]?\d+(?:\.\d+)?)'
        percentage = r'[+-]?\d+(?:\.\d+)?\s*%'
        pattern = (r'S&P/TSX Composite\s+[-\u2013\u2014]{1,2}\s+'
                   + r'\s+'.join([percentage] * 3)
                   + r'\s+' + number + r'\s+' + number + r'(?![\d.])')
        rows = re.findall(pattern, table)
        if len(rows) != 1:
            raise ValueError('Expected one exact Composite valuation row')
        current, historical = map(float, rows[0])
        validate_pe(historical)  # Alignment sanity check only; never published as 10y.
        observed = dt.datetime.strptime(end[1], '%B %d, %Y').date().isoformat()
        candidates.append(dict(forwardPE=validate_pe(current), asOf=validate_date(observed, today),
                               sourcePage=page_number,
                               forwardMethod='Raymond James / FactSet reported current next-twelve-month P/E; exact S&P/TSX Composite index'))
    if len(candidates) != 1:
        raise ValueError('Expected exactly one Composite sector-valuation table')
    return candidates[0]


def parse_cumberland(pages, today=None):
    """Read the TSX ten-year BF12 mean, never a calendar-year estimate.

    Accepts the documented June-2025 two-benchmark table layout. A changed table
    is rejected for review instead of being inferred from prose or charts.
    """
    candidates = []
    for page_number, raw in enumerate(pages, 1):
        text = compact(raw)
        if not ('S&P500 and TSX Earnings and Valuation' in text and 'S&P/TSX' in text):
            continue
        method = re.search(r'10.year average uses forward P/E\s*\(blended forward 12 months\)', text, re.I)
        if not method:
            raise ValueError('Cumberland ten-year BF12 definition missing')
        source = re.search(r'Source:\s*Bloomberg\s*&\s*CPWM,\s*(\d{2}/\d{2}/\d{4})\.', text)
        if not source:
            raise ValueError('Dated Cumberland / Bloomberg table source missing')
        rows = re.findall(r'10.year Average\s+(\d+(?:\.\d+)?)x\s+(\d+(?:\.\d+)?)x', text, re.I)
        if len(rows) != 1 or not re.search(r'YEAR EPS % change P/E EPS % change P/E', text):
            raise ValueError('Cumberland two-benchmark mean row/column order changed')
        sp500, tsx = map(float, rows[0])
        validate_pe(sp500)
        observed = dt.datetime.strptime(source[1], '%m/%d/%Y').date().isoformat()
        candidates.append(dict(mean10YearForwardPE=validate_pe(tsx), meanAsOf=validate_date(observed, today),
                               sourcePage=page_number,
                               meanMethod='Cumberland / Bloomberg reported ten-year average of blended-forward-12-month P/E; sampling frequency not specified'))
    if len(candidates) != 1:
        raise ValueError('Expected exactly one Cumberland TSX ten-year BF12 mean table')
    return candidates[0]


def parse_global_indices(pages, today=None):
    """Read exact unstarred index NTM valuations from the global table.

    The report explicitly identifies starred aggregate rows as iShares ETF
    proxies. Only the four exact, unstarred named-index rows below are accepted.
    The table's historical column is a 2000-present median, not a ten-year mean.
    """
    targets = {
        'nikkei225': r'Nikkei\s+225\s*\(Japan\)',
        'ftse100': r'FTSE\s+100\s*\(U\.K\.\)',
        'hangseng': r'Hang\s+Seng\s*\(Hong Kong\)',
        'csi300': r'CSI\s+300\s*\(China\)',
    }
    candidates = []
    for page_number, raw in enumerate(pages, 1):
        text = compact(raw)
        title = re.search(r'Table\s+\d+\s*[-\u2013\u2014]\s*Global Equities Performance', text)
        if not title:
            continue
        table = text[title.start():]
        source = re.search(r'Source:\s*FactSet,\s*Raymond James Ltd\.?;\s*Total returns,\s*data as of\s+([A-Za-z]+\s+\d{1,2},\s*\d{4})\.', table)
        if not source:
            raise ValueError('Dated global-equity FactSet / Raymond James source missing')
        footer = table[source.start():source.start() + 700]
        if not ('Historical P/E Median:' in footer and 'iShares ETFs' in footer and 'proxies' in footer):
            raise ValueError('Global-equity historical/proxy definition changed')
        table = table[:source.end()]
        if not re.search(r'Current PE NTM Historical PE Median Premium\s*\(RED\)\s*/\s*Discount\s*\(GREEN\)', table):
            raise ValueError('Global-equity current/historical column order changed')
        if 'Selected Developed Markets' not in table or 'Selected Emerging Markets' not in table:
            raise ValueError('Global-equity market sections changed')
        observed = dt.datetime.strptime(source[1], '%B %d, %Y').date().isoformat()
        validate_date(observed, today)
        number = r'([+-]?\d+(?:\.\d+)?)'
        suffix = r'\s+' + r'\s+'.join([number] * 12) + r'(?![\d.])'
        rows = {}
        for key, name in targets.items():
            matches = re.findall(name + suffix, table)
            if len(matches) != 1:
                raise ValueError('Expected exactly one unstarred global row for ' + key)
            values = list(map(float, matches[0]))
            current, historical, premium = values[-3:]
            validate_pe(historical)  # Alignment sanity check; never used as 10y.
            if abs((current - historical) - premium) > 0.21:
                raise ValueError('Global-equity current/historical premium does not reconcile')
            rows[key] = dict(forwardPE=validate_pe(current), asOf=observed, sourcePage=page_number,
                             forwardMethod='Raymond James / FactSet reported current next-twelve-month P/E; exact unstarred index row')
        candidates.append(rows)
    if len(candidates) != 1:
        raise ValueError('Expected exactly one global-equity valuation table')
    return candidates[0]


def raymond_james_links(body, base_url='https://www.goodridgegroup.ca/'):
    """Extract same-host publisher-linked monthly report PDFs from article HTML."""
    links = set()
    for value in re.findall(r'href\s*=\s*[\"\x27]([^\"\x27]+)', html.unescape(body), re.I):
        url = urljoin(base_url, value)
        parsed = urlparse(url)
        path = parsed.path.lower()
        if (parsed.scheme == 'https' and parsed.hostname == 'www.goodridgegroup.ca'
                and path.startswith('/-/media/rj/dotcom-canada/files/commentary-and-insights/insights-and-strategies/')
                and path.endswith('.pdf') and not parsed.query and not parsed.fragment):
            links.add(url)
    return sorted(links)


def raymond_james_article_links(body, base_url='https://www.goodridgegroup.ca/'):
    """Extract monthly article links from public listings or XML sitemaps."""
    links = set()
    for value in re.findall(r'(?:href\s*=\s*[\"\x27]|<loc>)([^<\"\x27]+)', html.unescape(body), re.I):
        url = urljoin(base_url, value.strip())
        parsed = urlparse(url)
        if (parsed.scheme == 'https' and parsed.hostname == 'www.goodridgegroup.ca'
                and re.fullmatch(r'/knowledge-centre/\d{4}/\d{2}/\d{2}/insights-and-strategies/?', parsed.path)
                and not parsed.query and not parsed.fragment):
            links.add(url)
    return sorted(links, reverse=True)


def cumberland_report_links(posts):
    """Extract publisher-linked North American reports from public WP posts JSON."""
    if isinstance(posts, str):
        posts = json.loads(posts)
    if not isinstance(posts, list) or len(posts) > 100:
        raise ValueError('Unexpected Cumberland public-post listing')
    links = set()
    for post in posts:
        content = post.get('content', {}).get('rendered', '')
        for url in re.findall(r'href\s*=\s*[\"\x27]([^\"\x27]+)', html.unescape(content), re.I):
            parsed = urlparse(url)
            if (parsed.scheme == 'https' and parsed.hostname == 'cumberlandprivate.com'
                    and parsed.path.startswith('/wp-content/uploads/') and parsed.path.lower().endswith('.pdf')
                    and 'north-american' in parsed.path.lower() and not parsed.query and not parsed.fragment):
                links.add(url)
    return sorted(links, reverse=True)
