"""Selected, explicitly labelled valuation observations from JPM's public guide."""
import datetime as dt
import io
import re
from pypdf import PdfReader

URL = 'https://am.jpmorgan.com/content/dam/jpm-am-aem/asiapacific/regional/en/insights/market-insights/daily-guide-updated.pdf'


def number_row(text, label, end, count, suffix='x'):
    sections = re.findall(re.escape(label) + r'\s+(.*?)' + re.escape(end), text, re.S)
    if len(sections) != 1:
        raise ValueError('JPM valuation row missing or ambiguous: ' + label)
    values = re.findall(r'(\d+(?:\.\d+)?)' + re.escape(suffix), sections[0])
    if len(values) != count or re.sub(r'\d+(?:\.\d+)?' + re.escape(suffix) + r'|\s', '', sections[0]):
        raise ValueError('JPM valuation column count or format changed')
    return list(map(float, values))


def observation_date(text):
    dates = set(re.findall(r'Data reflect most recently available as of (\d{2}/\d{2}/\d{2})', text))
    if len(dates) != 1:
        raise ValueError('JPM observation date missing or ambiguous')
    return dt.datetime.strptime(dates.pop(), '%d/%m/%y').date().isoformat()


def parse_apac(text, page):
    if 'APAC ex-Japan equities: Returns and valuations by market' not in text:
        raise ValueError('Wrong JPM table')
    flat = re.sub(r'\s+', ' ', text)
    ordered = 'Australia China Hong Kong India Indonesia South Korea Malaysia New Zealand Philippines Singapore Taiwan Thailand APAC ex-Japan'
    if ordered not in flat or 'market indices within the MSCI AC' not in flat:
        raise ValueError('JPM MSCI benchmark identities or column order changed')
    current = number_row(text, 'Forward P/E ratio', '10-year average', 13)
    means = number_row(text, '10-year average', 'Trailing P/B ratio', 13)
    yields = number_row(text, 'Dividend Yield', '10-year average', 13, '%')
    date = observation_date(text)
    return {id: dict(forwardPE=current[i], mean10YearForwardPE=means[i], dividendYield=yields[i], asOf=date, meanAsOf=date,
                     meanMethod='J.P. Morgan reported 10-year average of forward P/E; FactSet/MSCI. Sampling frequency not specified in the table.', page=page)
            for id, i in [('australia', 0), ('china', 1), ('india', 3), ('asia-ex-japan', 12)]}


def parse_global(text, page):
    flat = re.sub(r'\s+', ' ', text)
    if 'Global equities: Valuations' not in text or 'Forward P/E ratios' not in text:
        raise ValueError('Wrong JPM global table')
    if 'All valuation measures are based on respective MSCI data' not in flat or 'China A, which is represented by the CSI 300 index' not in flat:
        raise ValueError('JPM benchmark definitions changed')
    labels = 'AC World S&P 500 Europe Asia Pac ex-Japan Emerging markets ASEAN China A China Hong Kong India Indonesia Japan Korea Malaysia Philippines Singapore Taiwan Thailand'
    if labels not in flat:
        raise ValueError('JPM global chart column order changed')
    # Explicit printed bar labels are text objects, not values inferred from pixels.
    blocks = re.findall(r'GTM\s+([\d.\s]+)0x', text)
    if len(blocks) != 1:
        raise ValueError('JPM global valuation labels missing or ambiguous')
    values = [float(x) for x in blocks[0].split()]
    if len(values) != 18:
        raise ValueError('JPM global valuation label count changed')
    date = observation_date(text)
    return {id: dict(forwardPE=values[i], asOf=date, page=page)
            for id, i in [('acwi', 0), ('europe', 2), ('em', 4), ('csi300', 6), ('japan', 11)]}


def parse_pdf(body):
    if not body.startswith(b'%PDF'):
        raise ValueError('JPM returned non-PDF content')
    reader = PdfReader(io.BytesIO(body))
    if not 30 <= len(reader.pages) <= 120:
        raise ValueError('Unexpected JPM guide length')
    result, targets = {}, set()
    for i, page in enumerate(reader.pages):
        text = page.extract_text()
        if 'APAC ex-Japan equities: Returns and valuations by market' in text:
            if 'apac' in targets: raise ValueError('Duplicate JPM APAC table')
            result.update(parse_apac(text, i + 1)); targets.add('apac')
        if 'Global equities: Valuations' in text and 'Forward P/E ratios' in text:
            if 'global' in targets: raise ValueError('Duplicate JPM global table')
            result.update(parse_global(text, i + 1)); targets.add('global')
    if targets != {'apac', 'global'}:
        raise ValueError('JPM required valuation tables not found')
    if len({row['asOf'] for row in result.values()}) != 1:
        raise ValueError('JPM table observation dates differ')
    return result
