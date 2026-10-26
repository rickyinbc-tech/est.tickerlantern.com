"""Exact-benchmark cash-dividend anchors from publisher pages and factsheets.

Each parser binds one named benchmark, one labelled yield and its own dated
observation. Fund distribution yields, SEC yields, ETF proxies and payout
ratios are never read. A changed layout fails and leaves the last validated
observation retained with its original date.
"""
import datetime as dt
import html
import io
import math
import re
import unicodedata
from pypdf import PdfReader

PARSER_VERSION = 'index-dividend-anchors-1'
SSGA_URL = 'https://www.ssga.com/us/en/individual/etfs/state-street-spdr-sp-500-etf-trust-spy'
TSX_FEED = 'https://carolannsteinhoff.com/feed/'
FTSE_URL = 'https://research.ftserussell.com/Analytics/FactSheets/Home/DownloadSingleIssue?issueName=UKX&IsManual=false'
HSI_URL = 'https://www.hsi.com.hk/api/wsit-hsi-ddoc-ea-public-website-proxy/v1/content/gcs/download?resource=%2Fpublic-website%2Fwebapp%2Ffactsheets%2Fen-hk%2Fhsi.pdf'
CSI_URL = 'https://oss-ch.csindex.com.cn/static/html/csindex/public/uploads/indices/detail/files/en/000300factsheeten.pdf'


def visible(body):
    text = body.decode('utf-8', 'replace') if isinstance(body, bytes) else body
    text = re.sub(r'<(?:script|style)\b[^>]*>.*?</(?:script|style)>', ' ', text, flags=re.I | re.S)
    text = html.unescape(re.sub(r'<[^>]+>', ' ', text))
    return re.sub(r'\s+', ' ', unicodedata.normalize('NFKC', text)).strip()


def observed(value, today=None):
    if value.year < 2000 or value > (today or dt.datetime.now(dt.timezone.utc).date()):
        raise ValueError('Dividend observation date outside supported range')
    return value.isoformat()


def yield_value(text):
    value = float(text)
    if not math.isfinite(value) or not 0 <= value <= 25:
        raise ValueError('Published dividend yield outside supported range')
    return value


def unique(pattern, text, message, flags=0):
    found = re.findall(pattern, text, flags)
    if len(found) != 1:
        raise ValueError(message)
    return found[0]


def pdf_text(body, page, layout=False):
    if not body.startswith(b'%PDF'):
        raise ValueError('Factsheet returned HTML or a challenge instead of PDF')
    reader = PdfReader(io.BytesIO(body))
    if not 1 <= len(reader.pages) <= 6 or page > len(reader.pages):
        raise ValueError('Unexpected factsheet length')
    text = reader.pages[page - 1].extract_text(extraction_mode='layout') if layout else reader.pages[page - 1].extract_text()
    return unicodedata.normalize('NFKC', text)


def parse_ssga(body, today=None):
    """State Street's S&P 500 Index Dividend Yield, not SPY's fund yields."""
    text = visible(body)
    unique(r'Benchmark (S&P 500 Index) Inception Date', text, 'SPY page no longer names the S&P 500 Index benchmark')
    date, section = unique(r'Yields as of ([A-Z][a-z]{2} \d{1,2} \d{4})(.*?)Fund Market Price as of', text, 'Expected one dated SPY yields section')
    value = unique(r'Index Dividend Yield Index Dividend Yield The weighted average of the underlyings\' indicated annual dividend divided by price, expressed as a percentage\. (\d+(?:\.\d+)?)%', section, 'Index Dividend Yield definition or value changed')
    as_of = observed(dt.datetime.strptime(date, '%b %d %Y').date(), today)
    return {'sp500': dict(dividendYield=yield_value(value), asOf=as_of)}


def tsx_newsletter_link(body):
    """Newest daily newsletter from the publisher's own RSS feed."""
    text = body.decode('utf-8', 'replace') if isinstance(body, bytes) else body
    items = re.findall(r'<item>.*?<title>(.*?)</title>.*?<link>(https://carolannsteinhoff\.com/[a-z0-9-]+/)</link>', text, re.S)
    links = [link for title, link in items if re.search(r'newsletter', html.unescape(title), re.I)]
    if not links:
        raise ValueError('No dated newsletter in the publisher feed')
    return links[0]


def parse_tsx_newsletter(body, today=None):
    """Bloomberg Automation S&P/TSX Composite trailing-12-month yield at that close."""
    text = visible(body)
    month, day, year = unique(r'Closes for ([A-Z][a-z]+) ?(\d{1,2})(?:st|nd|rd|th)?, ?(\d{4})', text, 'Expected one dated market-close table')
    as_of = observed(dt.datetime.strptime(f'{month} {day} {year}', '%B %d %Y').date(), today)
    section = unique(r'(S&P/TSX Composite is trading at a price-to-earnings ratio .{0,260}?The index.s dividend yield is \d+(?:\.\d+)?% on a trailing 12-month basis)', text, 'Expected one S&P/TSX Composite yield paragraph')
    value = unique(r'dividend yield is (\d+(?:\.\d+)?)% on a trailing 12-month basis', section, 'S&P/TSX Composite yield basis changed')
    return {'tsx': dict(dividendYield=yield_value(value), asOf=as_of)}


def parse_ftse_factsheet(body, today=None):
    """FTSE Russell's month-end FTSE 100 Index Characteristics dividend yield."""
    first = pdf_text(body, 1)
    if not re.search(r'FTSE\s+Russell\s+Factsheet\s+FTSE 100 Index\s', first):
        raise ValueError('Factsheet identity does not match FTSE 100')
    text = pdf_text(body, 3)
    date = unique(r'FTSE 100 Index\s+Data as at: (\d{1,2} [A-Z][a-z]+ \d{4})', text, 'Expected one dated FTSE 100 characteristics page')
    table = unique(r'Index Characteristics\s+(.*?)Constituent Sizes', text, 'Index Characteristics table not found', re.S)
    if not re.search(r'Attributes\s+FTSE 100\s', table):
        raise ValueError('Index Characteristics column is not FTSE 100')
    value = unique(r'Dividend Yield %\s+(\d+(?:\.\d+)?)\s', table, 'FTSE 100 dividend yield row changed')
    as_of = observed(dt.datetime.strptime(date, '%d %B %Y').date(), today)
    return {'ftse100': dict(dividendYield=yield_value(value), asOf=as_of, page=3)}


def parse_hsi_factsheet(body, today=None):
    """Hang Seng Indexes' month-end HSI Index Fundamentals dividend yield."""
    text = pdf_text(body, 1)
    if not text.lstrip().startswith('Hang Seng Index'):
        raise ValueError('Factsheet identity does not match Hang Seng Index')
    date = unique(r'All data as at (\d{1,2} [A-Z][a-z]{2} \d{4})', text, 'Expected one dated HSI factsheet')
    header = r'INDEX FUNDAMENTALS\s*Annual Volatility\*\(%\)Index Dividend Yield \(%\) PE Ratio \(Times\) 1 - Yr 3 - Yr 5 - Yr\s*'
    value = unique(header + r'HSI (\d+(?:\.\d+)?) \d+(?:\.\d+)? \d+(?:\.\d+)? \d+(?:\.\d+)? \d+(?:\.\d+)?\s', text, 'HSI fundamentals header or row changed')
    as_of = observed(dt.datetime.strptime(date, '%d %b %Y').date(), today)
    return {'hangseng': dict(dividendYield=yield_value(value), asOf=as_of, page=1)}


def parse_csi_factsheet(body, today=None):
    """China Securities Index's month-end CSI 300 Fundamental table yield."""
    text = pdf_text(body, 1, layout=True)
    if not re.search(r'000300\s*CSI 300 Index', pdf_text(body, 1)):
        raise ValueError('Factsheet identity does not match CSI 300 / 000300')
    day, month, year = unique(r'(\d{1,2})-([A-Z][a-z]+)-\s*\n\s*(\d{4})\s*\n', text, 'Expected one dated CSI factsheet header')
    if not re.search(r'Volatility\s+Fundamental\s*\n', text):
        raise ValueError('CSI Fundamental table not found')
    value = unique(r'^\s*5Y Annualized\s+-?\d+(?:\.\d+)?%\s+Yield\s+(\d+(?:\.\d+)?)%\s*$', text, 'CSI 300 Yield row changed', re.M)
    as_of = observed(dt.datetime.strptime(f'{day} {month} {year}', '%d %B %Y').date(), today)
    return {'csi300': dict(dividendYield=yield_value(value), asOf=as_of, page=1)}
