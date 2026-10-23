"""Parse explicitly published historical forward-P/E means from public research.

These are publisher-reported reference observations, not a reconstructed history.
Callers keep their dates and provenance separate from current fundamentals.
"""
import datetime as dt
import re
import unicodedata


def _plain(text):
    return re.sub(r'\s+', ' ', unicodedata.normalize('NFKC', text)).strip()


def _date(value):
    date = dt.date.fromisoformat(value)
    if date.year < 2000 or date > dt.datetime.now(dt.timezone.utc).date():
        raise ValueError('Historical reference has an invalid observation date')
    return date.isoformat()


def _pe(value):
    value = float(value)
    if not 0 <= value <= 1_000_000:
        raise ValueError('Historical forward-P/E reference outside supported range')
    return value


def parse_msci_deck_text(text, page=7):
    """Parse the six explicitly labelled bars on the MSCI diversification slide.

    The PDF native text contains exact numerical labels. No chart coordinates,
    colour heights or values from the nearby ROE slide are used.
    """
    text = _plain(text)
    if 'Global indexes continue to trade at a premium to longer term averages based on forward earnings multiples' not in text:
        raise ValueError('MSCI historical forward-valuation slide not found')
    dates = re.findall(r'Price to Forward Earnings for MSCI Indexes as of ([A-Za-z]+ \d{1,2}, \d{4})', text)
    if len(dates) != 1:
        raise ValueError('Expected one dated MSCI forward-valuation chart')
    as_of = _date(dt.datetime.strptime(dates[0], '%B %d, %Y').date().isoformat())
    order = r'ACWI WORLD USA WORLD ex USA EM \(EMERGING MARKETS\) EUROPE'
    # This reviewed slide prints every numeric bar label to two decimals.
    # Enforce that source precision so a missing bar cannot consume a year or
    # page number elsewhere in the native text stream.
    pattern = r'(?<![\d.])((?:\d+\.\d{2}\s+){12})' + order + r'\s+Current P/Fwd Ear 10Yr Average P/Fwd Ear'
    matches = re.findall(pattern, text)
    if len(matches) != 1:
        raise ValueError('MSCI chart values, category order or 10-year mean label changed')
    values = [_pe(x) for x in matches[0].split()]
    ids = ['acwi', 'world', 'msci-usa', 'world-ex-usa', 'em', 'europe']
    return {
        id: dict(mean10YearForwardPE=values[6+i], meanAsOf=as_of,
                 meanMethod='MSCI reported 10-year average of forward P/E; historical sampling frequency not specified in the presentation',
                 page=page)
        for i, id in enumerate(ids)
    }


def parse_segal_text(text, page=3):
    """Read Segal Marco's explicit 10Yr Avg row, never its Median row.

    The verified 2025-Q4 PDF has raster chart headers and a separate native-text
    mean row. Its exact nine-column layout was inspected in the original page.
    A different observation date must contain all nine ordered category labels
    in the supplied text (native extraction or separately verified OCR). This
    prevents a future raster-only table layout from silently shifting columns.
    """
    text = _plain(text)
    if not re.search(r'Quarter(?:ly| In) Review:\s*Global Equity(?: Overview)?', text, re.I):
        raise ValueError('Segal global-equity valuation review not found')
    if not re.search(r'P/E(?: ratios| forward 12 months ratio data range).*?forward 12 months|P/E forward 12 months ratio data range', text, re.I):
        raise ValueError('Segal forward-12-month valuation definition not found')
    dates = re.findall(r'(?:Data range is from|ratio data range is from)\s*\d{1,2}/\d{1,2}/\d{2,4}\s*[–—-]\s*(\d{1,2}/\d{1,2}/\d{2,4})', text, re.I)
    if len(dates) != 1:
        raise ValueError('Expected one dated Segal forward-P/E chart')
    date_format = '%m/%d/%Y' if len(dates[0].split('/')[-1]) == 4 else '%m/%d/%y'
    as_of = _date(dt.datetime.strptime(dates[0], date_format).date().isoformat())
    labels = r'S&P 500\s+S&P 400\s+S&P 600\s+MSCI EAFE\s+MSCI EM\s+MSCI World\s+MSCI UK\s+MSCI Japan\s+MSCI Canada'
    if as_of != '2025-12-31' and not re.search(labels, text):
        raise ValueError('New Segal chart date requires verified ordered category labels')
    number_row = r'(\d+(?:\.\d+)?(?:\s+\d+(?:\.\d+)?){8})'
    # PDF extraction can place the row label before or after its numeric cells.
    rows = re.findall(number_row + r'\s*10\s*(?:Yr|Y|Year)\s*Avg\b', text, re.I)
    rows += re.findall(r'10\s*(?:Yr|Y|Year)\s*Avg\s*' + number_row + r'(?![\d.])', text, re.I)
    if len(rows) != 1:
        raise ValueError('Expected one explicit nine-column 10-year average row; median is not accepted')
    values = [_pe(x) for x in rows[0].split()]
    ids = ['sp500', 'sp400', 'sp600', 'eafe', 'em', 'world', 'uk', 'japan', 'msci-canada']
    return {
        id: dict(mean10YearForwardPE=values[i], meanAsOf=as_of,
                 meanMethod='Segal Marco Advisors / FactSet reported 10-year average of forward-12-month P/E; historical sampling frequency not specified in the report',
                 page=page)
        for i, id in enumerate(ids)
    }
