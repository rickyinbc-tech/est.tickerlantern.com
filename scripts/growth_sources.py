"""Fail-closed adapters for selected public annual index earnings forecasts.

Only printed growth observations are extracted. No GDP, price targets, quarterly
earnings growth, constituent-average growth, or proxy indices are substituted.
"""
import datetime as dt
import io
import math
import json
import re
from html import unescape
from pypdf import PdfReader
from jpm_source import observation_date

NUMBER = r'-?\d+(?:\.\d+)?'


def plain(value):
    value = re.sub(r'<(script|style)\b[^>]*>.*?</\1>', ' ', value, flags=re.S | re.I)
    return re.sub(r'\s+', ' ', unescape(re.sub('<[^>]+>', ' ', value))).strip()


def dated(value, fmt):
    return dt.datetime.strptime(value.strip(), fmt).date().isoformat()


def result(date, years, values, page=None, labels=None):
    if len(years) != len(values) or len(set(years)) != len(years) or any(isinstance(value,bool) for value in values):
        raise ValueError('Ambiguous annual forecast columns')
    estimates = [dict(year=int(y), growth=float(g), periodLabel=labels[i] if labels else f'{y} annual earnings estimate') for i, (y, g) in enumerate(zip(years, values))]
    if not estimates or any(not isinstance(p['growth'], (int,float)) or isinstance(p['growth'], bool) or not math.isfinite(p['growth']) or abs(p['growth']) > 1_000_000 for p in estimates):
        raise ValueError('Annual earnings growth outside supported range')
    return dict(asOf=date, estimates=estimates, page=page)


def pdf(body):
    if not body.startswith(b'%PDF'): raise ValueError('Publisher returned non-PDF content')
    reader = PdfReader(io.BytesIO(body))
    if not 1 <= len(reader.pages) <= 150: raise ValueError('Unexpected source length')
    return reader


def parse_factset(body):
    pages = [p.extract_text() for p in pdf(body).pages]
    dates = re.findall(r'\b([A-Z][a-z]+ \d{1,2}, 20\d{2})\b', plain(pages[0]))
    if not dates or 'EARNINGS INSIGHT' not in pages[0].upper(): raise ValueError('FactSet report identity/date missing')
    date = dated(dates[0], '%B %d, %Y')
    matches = []
    for i, text in enumerate(pages):
        pairs = re.findall(r'For CY (20\d{2}), analysts are projecting earnings growth of (' + NUMBER + r')%', plain(text))
        if len(pairs) >= 2 and 'S&P 500' in text: matches.append((i + 1, pairs))
    if len(matches) != 1: raise ValueError('No unique multi-year FactSet CY forecast paragraph')
    page, pairs = matches[0]
    return {'sp500': result(date, [int(y) for y, _ in pairs], [float(g) for _, g in pairs], page)}


def parse_ubs(body):
    text = plain(body.decode())
    pairs = re.findall(r'Consensus estimates project the Nasdaq[ -]100 to grow earnings by (' + NUMBER + r')% this year and (' + NUMBER + r')% next year', text, re.I)
    created = re.findall(r'"dateCreated"\s*:\s*"(20\d{2}-\d{2}-\d{2})', body.decode())
    if len(pairs) != 1 or len(set(created)) != 1: raise ValueError('No unique dated annual Nasdaq-100 consensus pair')
    date = created[0]; year = int(date[:4])
    return {'nasdaq100': result(date, [year, year + 1], pairs[0])}


def parse_firsteagle(body):
    found = []
    for i, page in enumerate(pdf(body).pages):
        text = plain(page.extract_text())
        pair = re.findall(r'forecasts reflect (' + NUMBER + r')% earnings growth for the Russell 2000 in (20\d{2}) and (' + NUMBER + r')% in (20\d{2})', text)
        dates = re.findall(r'LSEG I/B/E/S; data as of ([A-Z][a-z]+ \d{1,2}, 20\d{2})', text)
        if len(pair) == 1 and len(dates) == 1:
            a, y, b, z = pair[0]
            found.append(result(dated(dates[0], '%B %d, %Y'), [int(y), int(z)], [a, b], i + 1))
    if len(found) != 1: raise ValueError('Russell annual forecasts or underlying LSEG date missing')
    return {'russell2000': found[0]}


def parse_nbf(body):
    found = []
    for i, page in enumerate(pdf(body).pages):
        text = page.extract_text()
        if 'MSCI composite index: EPS Performance' not in text: continue
        header = re.search(r'(20\d{2})\s+(20\d{2})\s+(20\d{2})\s+(20\d{2})\s+12 months\s+forward', text)
        dates = re.findall(r'(?m)^\s*(\d{1,2}/\d{1,2}/\d{2})\s*$', text)
        if not header or len(set(dates)) != 1 or 'data via Refinitiv' not in text: raise ValueError('NBF forecast header/date changed')
        years = list(map(int, header.groups()))
        rows = {}
        for id, name in [('acwi', 'MSCI ACWI'), ('world', 'MSCI World'), ('msci-canada', 'MSCI Canada'), ('europe', 'MSCI Europe')]:
            match = re.findall(r'(?m)^\s*' + re.escape(name) + r'\s+(' + NUMBER + r')\s+(' + NUMBER + r')\s+(' + NUMBER + r')\s+(' + NUMBER + r')\s+(' + NUMBER + r')\s*$', text)
            if len(match) != 1: raise ValueError('NBF exact index row missing: ' + name)
            # First column is historical; last is NTM, not an annual year.
            rows[id] = result(dated(dates[0], '%m/%d/%y'), years[1:], match[0][1:4], i + 1)
        found.append(rows)
    if len(found) != 1: raise ValueError('No unique NBF annual EPS table')
    return found[0]


def parse_jpm(body):
    pages = [p.extract_text() for p in pdf(body).pages]
    out = {}; seen = set()
    for i, text in enumerate(pages):
        flat = plain(text)
        if 'APAC ex-Japan equities: Returns and valuations by market' in text:
            if 'apac' in seen: raise ValueError('Duplicate JPM earnings table')
            seen.add('apac')
            order = 'Australia China Hong Kong India Indonesia South Korea Malaysia New Zealand Philippines Singapore Taiwan Thailand APAC ex-Japan'
            if order not in flat or 'market indices within the MSCI AC' not in flat: raise ValueError('JPM benchmark columns changed')
            rows = re.findall(r'(20\d{2}) earnings\s+growth\s+((?:' + NUMBER + r'%\s*){13})(?=20\d{2} earnings|Forward P/E)', text)
            if len(rows) != 2: raise ValueError('JPM annual growth rows missing')
            years = [int(y) for y, _ in rows]
            values = [[float(n) for n in re.findall('(' + NUMBER + ')%', row)] for _, row in rows]
            # Cross-check exact values against the separately labelled CY chart.
            charts = [p for p in pages if 'Earnings expectations by market and' in p and 'Consensus estimates used are calendar year estimates from FactSet' in plain(p)]
            if len(charts) != 1 or observation_date(charts[0]) != observation_date(text): raise ValueError('JPM calendar-year method/date missing')
            for id, col in [('australia', 0), ('china', 1), ('india', 3), ('asia-ex-japan', 12)]:
                out[id] = result(observation_date(text), years, [r[col] for r in values], i + 1, [f'Calendar year {y}' for y in years])
        if 'Global equities: Earnings expectations' in text:
            if 'japan' in seen: raise ValueError('Duplicate JPM Japan chart')
            seen.add('japan')
            if 'MSCI EMU, MSCI Japan, MSCI AC Asia Pacific ex-Japan and MSCI China, respectively' not in flat or 'Consensus estimates used are calendar year estimates from FactSet' not in flat: raise ValueError('JPM Japan identity/method missing')
            labels = re.search(r'U\.S\. Eurozone Japan Asia Pacific ex-Japan China\s+((?:' + NUMBER + r'%\s*){10})0%', text)
            years = re.findall(r'\b(20\d{2}) (20\d{2})\b', text)
            if not labels or len(set(years)) != 1: raise ValueError('JPM Japan chart labels/year order changed')
            v = list(map(float, re.findall('(' + NUMBER + ')%', labels[1])))
            ys = list(map(int, years[0]))
            out['japan'] = result(observation_date(text), ys, [v[2], v[7]], i + 1, [f'Calendar year {y} (rounded)' for y in ys])
    if seen != {'apac', 'japan'}: raise ValueError('JPM annual earnings tables missing')
    return out


def parse_hartford(body):
    found = []
    for i, page in enumerate(pdf(body).pages):
        text = page.extract_text(); flat = plain(text)
        if 'Earnings-Per-Share Growth Rate Forecasts (%)' not in text: continue
        if 'UK (MSCI United Kingdom Index)' not in flat or 'EM (MSCI Emerging Markets Index)' not in flat or 'Source: LSEG and Schroders' not in flat: raise ValueError('Hartford benchmark identities changed')
        date = re.search(r'As of (\d{1,2}/\d{1,2}/\d{2})\.', text)
        values = re.search(r'Source: LSEG and Schroders, \d{1,2}/\d{2}\.\s+((?:' + NUMBER + r'\s+){15})0\s+10\s+20', text)
        years = re.findall(r'\b(20\d{2})e\s+(20\d{2})e\s+(20\d{2})e\b', text)
        if not date or not values or len(years) != 1 or 'US UK Europe (ex UK) Japan EM' not in flat: raise ValueError('Hartford series/year layout changed')
        v = list(map(float, values[1].split())); ys = list(map(int, years[0])); date = dated(date[1], '%m/%d/%y')
        found.append({id: result(date, ys, v[start:start+3], i + 1) for id, start in [('uk', 3), ('em', 12)]})
    if len(found) != 1: raise ValueError('No unique Hartford annual forecast chart')
    return found[0]


def parse_amova(body):
    reader = pdf(body); out = {}
    full = ' '.join(p.extract_text() for p in reader.pages)
    meetings = re.findall(r'GISC\) convened on (\d{1,2}\s+[A-Z][a-z]+)\.', plain(full))
    years = set(re.findall(r'Global Investment Strategy Committee Outlook Q[1-4] (20\d{2})', full))
    if len(meetings) != 1 or len(years) != 1: raise ValueError('Amova committee observation date missing')
    date = dated(meetings[0] + ' ' + years.pop(), '%d %B %Y')
    for i, page in enumerate(reader.pages):
        text = page.extract_text()
        # In this publisher's native object order each exact index title follows
        # its table. Require five dated rows and the three growth quantiles, plus
        # all six PE/price columns. Never select PE or the 25th/75th percentile.
        for id, name in [('nikkei225', 'Nikkei 225'), ('stoxx600', 'STOXX Europe 600'), ('ftse100', 'FTSE 100'), ('hangseng', 'Hang Seng Index')]:
            if not re.search(r'(?m)^' + re.escape(name) + r'\s*$', text): continue
            prior = text[:re.search(r'(?m)^' + re.escape(name) + r'\s*$', text).start()]
            rows = re.findall(r'(?m)^([A-Z][a-z]{2})-(20\d{2})\s+(' + NUMBER + r')%\s+(' + NUMBER + r')%\s+(' + NUMBER + r')%\s+((?:[\d,.]+\s+){5}[\d,.]+)\s*$', prior)
            if len(rows) < 5 or 'EPS Growth Scenarios' not in prior[-160:]: raise ValueError('Amova EPS median table structure changed')
            block = rows[-5:]
            periods = [dt.datetime.strptime(m + '-' + y, '%b-%Y') for m, y, *_ in block]
            if periods != sorted(periods) or len(set(periods)) != 5: raise ValueError('Amova horizon order changed')
            selected = {}
            for row in block:
                m, y, low, median, high, _ = row
                if not float(low) <= float(median) <= float(high): raise ValueError('Amova quantile columns changed')
                selected[int(y)] = (float(median), f'{m}-{y} EPS growth scenario')
            ys = sorted(selected)
            out[id] = result(date, ys, [selected[y][0] for y in ys], i + 1, [selected[y][1] for y in ys])
    if set(out) != {'nikkei225', 'stoxx600', 'ftse100', 'hangseng'}: raise ValueError('Amova exact benchmark tables missing')
    return out


def parse_fsm(body):
    data = json.loads(body); content = data.get('content', '')
    if 'CSI300' not in data.get('title', '').replace(' ', ''): raise ValueError('FSM article identity changed')
    tables = [t for t in re.findall(r'<table\b.*?</table>', content, re.S | re.I) if '000300.SH' in plain(t) and 'EPS Growth' in plain(t)]
    if len(tables) != 1: raise ValueError('FSM exact CSI 300 annual table missing')
    rows = [[plain(c) for c in re.findall(r'<t[dh]\b[^>]*>(.*?)</t[dh]>', r, re.S | re.I)] for r in re.findall(r'<tr\b[^>]*>(.*?)</tr>', tables[0], re.S | re.I)]
    headers = [r for r in rows if r and '000300.SH' in r[0]]
    eps = [r for r in rows if r and r[0] == 'EPS Growth']
    # Other tables have other observation dates. Bind to this table's own note.
    after = content[content.index(tables[0]) + len(tables[0]):]
    dates = re.findall(r'Data as of (\d{1,2} [A-Z][a-z]+ 20\d{2})', plain(after)[:600])[:1]
    if len(headers) != 1 or len(eps) != 1 or len(set(dates)) != 1: raise ValueError('FSM annual row or observation date ambiguous')
    h, e = headers[0], eps[0]
    if len(h) != len(e) or any(not re.fullmatch(r'20\d{2}[AE]', y) for y in h[1:]) or any(not re.fullmatch(NUMBER + '%', x) for x in e[1:]): raise ValueError('FSM year/growth column layout changed')
    pairs = [(int(y[:4]), float(g[:-1])) for y, g in zip(h[1:], e[1:]) if y.endswith('E')]
    return {'csi300': result(dated(dates[0], '%d %B %Y'), [y for y, _ in pairs], [g for _, g in pairs])}


def parse_nbi(body):
    found = []
    colors = [(0.745, 0.667, 0.569), (0.659, 0.757, 0.722), (0.871, 0.086, 0.114), (0.082, 0.145, 0.196)]
    for i, page in enumerate(pdf(body).pages):
        text = page.extract_text(); flat = plain(text)
        years = re.search(r'Expected annual earnings growth\s+\(full line = (20\d{2}), dashed line = (20\d{2})\)', text)
        if not years: continue
        if any(s not in flat for s in ['Canada (S&P/TSX)', 'EAFE (MSCI)', 'Emerging markets (MSCI)', 'United States (S&P 500)', 'data via Refinitiv']): raise ValueError('NBI series identities changed')
        dates = re.findall(r'Asset Allocation Strategy\s*\|\s*([A-Z][a-z]+ \d{1,2}, 20\d{2})', flat)
        if len(dates) != 1: raise ValueError('NBI report date missing')
        color = [None]; stack = []; labels = []
        def operand(op, args, cm, tm):
            if op == b'q': stack.append(color[0])
            elif op == b'Q': color[0] = stack.pop() if stack else None
            elif op in (b'rg', b'scn', b'sc') and len(args) == 3: color[0] = tuple(float(x) for x in args)
            elif op == b'g': color[0] = (float(args[0]),) * 3
        def visit(value, cm, tm, font, size):
            for token in value.split():
                if re.fullmatch(NUMBER + '%', token) and color[0] is not None:
                    matches = [j for j, c in enumerate(colors) if max(abs(a-b) for a,b in zip(c, color[0])) < .006]
                    if matches: labels.append((matches[0], float(token[:-1])))
        page.extract_text(visitor_operand_before=operand, visitor_text=visit)
        # Strictly guarded publisher painting order: all solid labels, then all
        # dashed labels, same four series colors. Fail on template/color changes.
        if [s for s, _ in labels] != [0,1,2,3,0,1,2,3]: raise ValueError('NBI line/color label order changed; visual review required')
        ys = list(map(int, years.groups())); date = dated(dates[0], '%B %d, %Y')
        found.append({id: result(date, ys, [labels[col][1], labels[col+4][1]], i+1) for id, col in [('tsx', 2), ('eafe', 1)]})
    if len(found) != 1: raise ValueError('No unique NBI annual earnings chart')
    return found[0]


PARSERS = dict(factset=parse_factset, ubs=parse_ubs, firsteagle=parse_firsteagle, nbf=parse_nbf, jpm=parse_jpm, hartford=parse_hartford, amova=parse_amova, fsm=parse_fsm, nbi=parse_nbi)
