"""Read explicitly labelled FTSE 100 and Hang Seng observations from TEMPO.

Discovery accepts links actually published on the official insight page. It does
not guess time-stamped filenames or use an unlabelled chart's coordinates.
"""
import datetime as dt
from html.parser import HTMLParser
import re
import unicodedata
from urllib.parse import unquote, urljoin, urlparse


TEMPO_LISTING_URL = 'https://www.edelweissmf.com/investor-insights/fund-market'
TEMPO_DETAIL_URL = 'https://www.edelweissmf.com/investor-insights/fund-market/tempo'
TEMPO_SEED_URL = ('https://www.edelweissmf.com/Files/Insights/viewpoint/'
                  '9th%20Oct%20Edelweiss%20Mutual%20Fund%20-%20TEMPO_09102026_101803_AM.pdf')
TEMPO_DATED_FALLBACK_URL = ('https://www.edelweissmf.com/Files/Insigths/viewpoint/'
                            'December_Edelweiss_Mutual_Fund_-_TEMPO_%28003%29_12122025_124700_PM.pdf')


class _Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []

    def handle_starttag(self, tag, attrs):
        if tag.lower() == 'a':
            for key, value in attrs:
                if key.lower() == 'href' and value:
                    self.links.append(value)


def discover_tempo_links(html, base_url=TEMPO_DETAIL_URL):
    """Return official TEMPO PDF anchors, newest filename date first.

    The live listing may require JavaScript. An empty result is an explicit
    discovery gap; the caller can retry its last verified report and retain its
    observation date. Neither this function nor the parser bypasses a 403 gate.
    """
    parser = _Links()
    parser.feed(html)
    links = set()
    for href in parser.links:
        url = urljoin(base_url, href)
        parsed = urlparse(url)
        path = unquote(parsed.path)
        if (parsed.scheme == 'https' and parsed.hostname == 'www.edelweissmf.com'
                and parsed.username is None and parsed.password is None
                and parsed.port in (None, 443)
                and not parsed.query and not parsed.fragment
                and re.match(r'^/files/(?:insights|insigths)/viewpoint/', path, re.I)
                and path.lower().endswith('.pdf') and 'tempo' in path.lower()):
            links.add(url)

    def key(url):
        match = re.search(r'_(\d{2})(\d{2})(20\d{2})_\d{6}_(?:AM|PM)\.pdf$',
                          unquote(urlparse(url).path), re.I)
        try:
            return dt.date(int(match[3]), int(match[2]), int(match[1])) if match else dt.date.min
        except ValueError:
            return dt.date.min

    return sorted(links, key=lambda url: (key(url), url), reverse=True)


def parse_edelweiss_text(text, page=4):
    """Parse dated FTSE 100 / Hang Seng rows with explicit valuation labels.

    The report's China row is Shanghai Composite and
    older Japan rows have a conflicting index label/level; neither is an accepted
    substitute for a different catalog index.
    """
    text = re.sub(r'\s+', ' ', unicodedata.normalize('NFKC', text)).strip()
    if 'Global equity markets at a glance' not in text:
        raise ValueError('TEMPO global-equity valuation table not found')
    if not re.search(r'Valuation\s*\(12[–—-]month forward\)', text, re.I):
        raise ValueError('TEMPO explicit 12-month-forward definition missing')
    header = text.split('Developed Market', 1)[0]
    metric_header = re.sub(r'\((?:x|%)\)', '', header)
    if not re.search(r'P/E\s*P/E\s*P/B\s*P/B\s*ROE', metric_header):
        raise ValueError('TEMPO valuation header order changed')
    if len(re.findall(r'10\s*yr\s+Avg\b', header, re.I)) != 2:
        raise ValueError('TEMPO explicit ten-year P/E and P/B mean labels missing')
    dates = re.findall(r'Source:\s*(?:IIFL\s+Securities,\s*Bloomberg\s+estimates|Bloomberg)\.\s*'
                       r'Data as of (\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+),?\s+(20\d{2})\.', text, re.I)
    if len(dates) != 1:
        raise ValueError('TEMPO expected one dated global valuation table')
    day, month, year = dates[0]
    try:
        as_of = dt.datetime.strptime(f'{day} {month} {year}', '%d %B %Y').date()
    except ValueError:
        as_of = dt.datetime.strptime(f'{day} {month} {year}', '%d %b %Y').date()
    if as_of > dt.datetime.now(dt.timezone.utc).date():
        raise ValueError('TEMPO observation date is in the future')
    patterns = {
        'ftse100': r'\bUK\s*FTSE\s*100\s+(.*?)\s+Germany\s*DAX\b',
        'hangseng': (r'\bHong\s*Kong\s+Hang\s*Seng\s+(.*?)\s+'
                     r'Emerging\s+Market\s+India\s+Sensex\b'),
    }
    result = {}
    for id, pattern in patterns.items():
        rows = re.findall(pattern, text)
        if len(rows) != 1:
            raise ValueError(f'TEMPO exact {id} row or surrounding index labels changed')
        tokens = rows[0].split()
        if len(tokens) != 10 or not all(re.fullmatch(r'\(?-?\d[\d,]*(?:\.\d+)?%?\)?', x) for x in tokens):
            raise ValueError(f'TEMPO {id} row is missing a cell or its column layout changed')
        index, pe, mean, pb, mean_pb, roe = [float(x.replace(',', '').strip('()%')) for x in tokens[:6]]
        if not (1000 <= index <= 100000 and 0 <= pe <= 1_000_000 and 0 <= mean <= 1_000_000
                and 0.1 <= pb <= 30 and 0.1 <= mean_pb <= 30 and 0 <= roe <= 100):
            raise ValueError(f'TEMPO {id} valuation values outside supported ranges')
        result[id] = dict(
            forwardPE=pe, asOf=as_of.isoformat(),
            mean10YearForwardPE=mean, meanAsOf=as_of.isoformat(),
            meanMethod='Edelweiss Mutual Fund TEMPO / Bloomberg reported 10-year average of 12-month-forward P/E; historical sampling frequency not specified in the report',
            page=page,
        )
    return result
