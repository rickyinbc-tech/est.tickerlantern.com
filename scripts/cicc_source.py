"""Parse CICC's dated CSI 300 ten-year forward-P/E mean from a public repost.

CICC's own report is distributed to clients; this public repost quotes its
valuation paragraph verbatim with the Wind observation date. Only the
past-ten-year historical mean is read. The paired current multiple, P/B,
equity risk premium and Hong Kong figures are not imported.
"""
import datetime as dt
import re
from dividend_sources import visible

CICC_URL = 'https://www.sohu.com/a/1092734089_120109837'


def parse_cicc_text(body, today=None):
    raw = body.decode('utf-8', 'replace') if isinstance(body, bytes) else body
    published = re.findall(r'"datePublished":\s*"(\d{4})-(\d{2})-(\d{2})T', raw)
    if len(set(published)) != 1:
        raise ValueError('Expected one repost publication date')
    published = dt.date(*map(int, published[0]))
    text = visible(raw)
    if '中金公司发布研报' not in text:
        raise ValueError('Repost does not attribute the CICC research report')
    # NFKC folds the original full-width punctuation to ASCII.
    pattern = (r'根据Wind数据, ?截至(\d{1,2})月(\d{1,2})日, ?1\) ?A股市场方面, ?沪深300指数前向市盈率(\d+(?:\.\d+)?)x, ?'
               r'前向市净率\d+(?:\.\d+)?x, ?低于过去十年的历史均值\((\d+(?:\.\d+)?)x和\d+(?:\.\d+)?x\)')
    found = re.findall(pattern, text)
    if len(found) != 1:
        raise ValueError('Expected one dated CSI 300 forward-P/E and past-ten-year mean paragraph')
    month, day, _current, mean = found[0]
    year = published.year if (int(month), int(day)) <= (published.month, published.day) else published.year - 1
    as_of = dt.date(year, int(month), int(day))
    if as_of > published or as_of > (today or dt.datetime.now(dt.timezone.utc).date()) or (published - as_of).days > 31:
        raise ValueError('CICC observation date is inconsistent with the repost date')
    mean = float(mean)
    if not 0 < mean <= 1_000:
        raise ValueError('CICC historical mean outside supported range')
    return {'csi300': dict(
        mean10YearForwardPE=mean, meanAsOf=as_of.isoformat(),
        meanMethod='CICC / Wind reported past-ten-year historical mean of CSI 300 forward P/E; forward-earnings horizon and sampling frequency not specified in the cited paragraph',
    )}, published.isoformat()
