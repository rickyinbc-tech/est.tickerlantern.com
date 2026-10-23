"""Parse a labelled CSI 300 ten-year forward-P/E reference from SCBAM."""
import datetime as dt
import re
import unicodedata


SCBAM_SEED_URL = 'https://www.scbam.com/medias/module-knowledge/document/290324-SCBAM_Korea_Mar_2024_1.pdf'


def parse_scbam_text(text, page=4):
    """Return only the CSI 300 published 10Y average, with its source date.

    The original chart labels both current values and 10-year averages with
    exact numbers. No marker heights, standard deviations or z-scores are read.
    An unrecognised chart ordering fails, leaving the last valid dated reference.
    """
    text = re.sub(r'\s+', ' ', unicodedata.normalize('NFKC', text)).strip()
    if 'Global Equity Market P/E' not in text or not re.search(r'Forward\s*12m\s*P/E\s*\(x\)', text, re.I):
        raise ValueError('SCBAM global forward-12-month P/E chart not found')
    if not re.search(r'\+/-1\s*SD\s*Current\s*10Y\s*Avg\s*High\s*Low', text):
        raise ValueError('SCBAM chart no longer explicitly labels its ten-year average')
    dates = re.findall(r'Source:\s*Bloomberg as of (\d{1,2})\s+([A-Za-z]{3})\s+(\d{2}|\d{4}),\s*SCBAM Investment Strategy', text)
    if len(dates) != 1:
        raise ValueError('SCBAM expected one dated global valuation chart')
    day, month, year = dates[0]
    as_of = dt.datetime.strptime(f'{day} {month} {year}', '%d %b %y' if len(year) == 2 else '%d %b %Y').date()
    if as_of.year < 2000 or as_of > dt.datetime.now(dt.timezone.utc).date():
        raise ValueError('SCBAM observation date outside supported range')
    order = (r'MSCI\s*ACWI\s+S&P500\s+STOXX\s*600\s+NIKKEI225\s+CSI300\s+'
             r'KOSPI\s+TWSE\s+NIFTY50\s+SET\s+VN Index\s+Current z-score\s+')
    numbers = r'((?:\d+\.\d+\s+){19}\d+\.\d+)'
    matches = re.findall(order + numbers + r'\s+0\.0\s+5\.0\s+10\.0\s+15\.0\s+20\.0\s+25\.0\s+Global Equity Market P/E', text)
    if len(matches) != 1:
        raise ValueError('SCBAM exact numeric labels or category/series order changed')
    values = [float(x) for x in matches[0].split()]
    if not all(1 <= x <= 100 for x in values):
        raise ValueError('SCBAM chart P/E labels outside supported range')
    return {'csi300': dict(
        mean10YearForwardPE=values[14], meanAsOf=as_of.isoformat(),
        meanMethod='SCB Asset Management / Bloomberg reported 10-year average of forward-12-month P/E; historical sampling frequency not specified in the report',
        page=page,
    )}
