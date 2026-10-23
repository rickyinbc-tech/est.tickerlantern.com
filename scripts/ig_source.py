"""Dated editorial prefills from IG's public 2026 Asia outlook.

This checks the original article for revisions. A successful daily fetch does
not turn an old research observation into a current market quote.
"""
import datetime as dt
import hashlib
import html
import re
import unicodedata
from html.parser import HTMLParser

URL = 'https://www.ig.com/sg/news-and-trade-ideas/Asia-stock-market-outlook-for-2026-251209'
PARSER_VERSION = 'ig-asia-outlook-1'


class ArticleParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.skip = 0
        self.heading = None
        self.heading_parts = []
        self.sections = {}
        self.section = None
        self.all_text = []
        self.published = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag in ('script', 'style'):
            self.skip += 1
        if tag == 'meta' and attrs.get('name') == 'published_at':
            self.published = attrs.get('content')
        if tag == 'h2':
            self.heading = tag
            self.heading_parts = []

    def handle_endtag(self, tag):
        if tag in ('script', 'style') and self.skip:
            self.skip -= 1
        if tag == self.heading:
            self.section = ' '.join(self.heading_parts).strip()
            self.sections.setdefault(self.section, [])
            self.heading = None

    def handle_data(self, data):
        if self.skip:
            return
        self.all_text.append(data)
        if self.heading:
            self.heading_parts.append(data)
        elif self.section:
            self.sections[self.section].append(data)


def plain(parts):
    return re.sub(r'\s+', ' ', unicodedata.normalize('NFKC', html.unescape(' '.join(parts)))).strip()


def unique_pair(pattern, section):
    matches = re.findall(pattern, section, re.I)
    if len(matches) != 1:
        raise ValueError('Expected exactly one index-specific forward-P/E and ten-year pair')
    current, mean = map(float, matches[0])
    if not 0 <= current <= 1_000_000 or not 0 <= mean <= 1_000_000:
        raise ValueError('IG valuation outside supported range')
    return current, mean


def parse_ig_asia(body, today=None):
    parser = ArticleParser()
    parser.feed(body.decode('utf-8', 'replace') if isinstance(body, bytes) else body)
    today = today or dt.datetime.now(dt.timezone.utc).date()
    try:
        published = dt.date.fromisoformat(parser.published)
    except (ValueError, TypeError):
        raise ValueError('IG publication date is absent or invalid') from None
    if not dt.date(2020, 1, 1) <= published <= today:
        raise ValueError('IG publication date is outside the accepted range')
    text = plain(parser.all_text)
    dates = set(re.findall(r'The figures stated are as of\s+(\d{1,2}\s+[A-Za-z]+\s+\d{4})\s+unless otherwise stated', text, re.I))
    if len(dates) != 1:
        raise ValueError('Explicit common observation date is absent or ambiguous')
    as_of = dt.datetime.strptime(dates.pop(), '%d %B %Y').date()
    if not dt.date(2020, 1, 1) <= as_of <= published:
        raise ValueError('IG observation date is inconsistent with publication')
    if not {'Hang Seng Index', 'Nikkei 225 Index'}.issubset(parser.sections):
        raise ValueError('Exact Hang Seng and Nikkei 225 sections are absent')
    hsi = plain(parser.sections['Hang Seng Index'])
    nikkei = plain(parser.sections['Nikkei 225 Index'])
    hsi_pair = unique_pair(r'Hang Seng Index[’\']s forward 12.month price.to.earnings\s*\(P/E\)\s*ratio currently stands at\s+(\d+(?:\.\d+)?)x.{0,400}?10.year average forward P/E ratio of\s+(\d+(?:\.\d+)?)x', hsi)
    nikkei_pair = unique_pair(r'forward P/E ratio climbing from.{0,100}?\s+to\s+(\d+(?:\.\d+)?)x.{0,220}?10.year average of\s+(\d+(?:\.\d+)?)x', nikkei)
    if not re.search(r'earnings growth.{0,130}?next 12 months', nikkei, re.I):
        raise ValueError('Nikkei forward-earnings context changed')
    result = {}
    for identifier, pair in [('hangseng', hsi_pair), ('nikkei225', nikkei_pair)]:
        result[identifier] = dict(forwardPE=pair[0], mean10YearForwardPE=pair[1],
                                  asOf=as_of.isoformat(), meanAsOf=as_of.isoformat(),
                                  meanMethod='IG reported 10-year average forward P/E; dated outlook, underlying sampling frequency not specified',
                                  forwardMethod=('IG / LSEG I/B/E/S explicitly reported forward 12-month P/E' if identifier == 'hangseng' else 'IG reported forward P/E in a next-12-month earnings outlook; P/E sentence does not separately specify its horizon'))
    return result, published.isoformat()


def refresh_ig_asia(fetch, today=None):
    body = fetch(URL)
    values, published = parse_ig_asia(body, today)
    source = dict(publisher='IG research', url=URL, discoveryUrl=URL, page=None,
                  publishedAt=published, sha256=hashlib.sha256(body).hexdigest(),
                  parserVersion=PARSER_VERSION,
                  frequency='Dated research outlook; article revisions checked daily')
    return values, source
