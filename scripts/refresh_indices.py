#!/usr/bin/env python3
"""Refresh a small editorial selection of public index fundamentals.

No credentials, paid datasets, constituent data or complete source documents are
published. A missing metric remains null; source dates never become fetch dates.
"""
import argparse
import datetime as dt
import hashlib
import html
import io
import json
import logging
import re
import subprocess
import sys
import time
import unicodedata
import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime
from pathlib import Path
from urllib.parse import urlparse
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
RSS = 'https://insight.factset.com/topic/earnings/rss.xml'
PARSER_VERSION = 'index-fundamentals-1'
logging.getLogger('pypdf').setLevel(logging.ERROR)


def plain(text):
    text = re.sub(r'<(?:script|style)\b[^>]*>.*?</(?:script|style)>', ' ', text, flags=re.I | re.S)
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', text))).strip()


def fetch(url):
    if urlparse(url).hostname not in ('www.msci.com', 'insight.factset.com'):
        raise ValueError('Unapproved source host')
    result = subprocess.run(['curl', '--proto', '=https', '--proto-redir', '=https', '-fsSL', '--max-time', '25', '--retry', '1', '--max-filesize', '3000000', url], capture_output=True)
    if result.returncode:
        raise ValueError('Public source request failed: ' + result.stderr.decode('utf-8', 'replace')[:160])
    if not result.stdout or len(result.stdout) > 3000000:
        raise ValueError('Empty or oversized source')
    return result.stdout


def valid_date(value, now=None):
    parsed = dt.date.fromisoformat(value)
    if parsed > (now or dt.datetime.now(dt.timezone.utc).date()):
        raise ValueError('Source observation is future-dated')
    if parsed.year < 2000:
        raise ValueError('Unexpected source date')
    return value


def valid_pe(value):
    if not isinstance(value, (int, float)) or not 1 <= value <= 100:
        raise ValueError('Forward P/E outside the supported source range')
    return value


def parse_factset(body, published):
    text = plain(body)
    if 'S&P 500' not in text:
        raise ValueError('Wrong index in FactSet article')
    pairs = re.findall(r'The forward 12.month P/E ratio is\s+(\d+(?:\.\d+)?)(.{0,330}?)10.year average\s*\((\d+(?:\.\d+)?)\)', text, re.I)
    if len(pairs) != 1:
        raise ValueError('Expected exactly one forward-P/E / 10-year-mean paragraph')
    current, _, mean = pairs[0]
    return dict(forwardPE=valid_pe(float(current)), mean10YearForwardPE=valid_pe(float(mean)), asOf=valid_date(published), meanAsOf=valid_date(published), meanMethod='FactSet reported 10-year average; underlying sampling frequency not specified in the article')


def parse_msci_text(text, expected):
    text = unicodedata.normalize('NFKC', text).replace('\xa0', ' ')
    if not re.search(re.escape(expected) + r'\s+Index\s*\(', re.sub(r'\s+', ' ', text[:1500])):
        raise ValueError('Factsheet identity does not match ' + expected)
    match = re.search(r'FUNDAMENTALS\s*\(([A-Za-z]{3}\s+\d{1,2},\s*\d{4})\)(.*?)INDEX RISK', text, re.S)
    if not match:
        raise ValueError('Dated fundamentals table not found')
    date = dt.datetime.strptime(match[1], '%b %d, %Y').date().isoformat()
    valid_date(date)
    section = match[2]
    if not re.search(r'Div\s+Yld\s*\(%\)\s+P/E\s+P/E\s+Fwd\s+P/BV', section):
        raise ValueError('Fundamentals column order changed')
    rows = []
    for line in section.splitlines():
        values = re.fullmatch(r'\s*(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s*', line)
        if values:
            dividend, trailing, forward, book = map(float, values.groups())
            if not 0 <= dividend <= 15 or not 0 < trailing <= 300 or not 0 < book <= 50:
                raise ValueError('Invalid fundamentals row')
            rows.append(dict(forwardPE=valid_pe(forward), dividendYield=dividend, asOf=date, mean10YearForwardPE=None, meanAsOf=None, meanMethod=None))
    if len(rows) != 3:
        raise ValueError('Expected three benchmark rows; review the table before refreshing')
    return rows


def parse_msci_pdf(body, expected):
    if not body.startswith(b'%PDF'):
        raise ValueError('Source returned a challenge or HTML instead of a PDF')
    reader = PdfReader(io.BytesIO(body))
    if not 1 <= len(reader.pages) <= 8:
        raise ValueError('Unexpected factsheet page count')
    return parse_msci_text(reader.pages[0].extract_text(), expected)


def discover_msci_pdf(body):
    # Legacy official factsheet pages advertise their own document in canonical
    # metadata (occasionally with a duplicated host prefix). Match only the
    # actual absolute, same-host public document, not images or arbitrary links.
    links = set(re.findall(r'https://www\.msci\.com/documents/10199/[a-zA-Z0-9-]{36}(?![a-zA-Z0-9-])', html.unescape(body.decode('utf-8', 'replace'))))
    if len(links) != 1:
        raise ValueError('No unique official factsheet document link')
    return links.pop()


def update_record(record, values, source, checked):
    if record.get('asOf') and values['asOf'] < record['asOf']:
        raise ValueError('Source is older than the retained observation')
    record.update(values)
    record['source'] = source
    record['sync'] = dict(status='ok', lastAttempt=checked, lastSuccess=checked, error=None)


def refresh(render_qa=False):
    catalog = json.loads((ROOT / 'data/catalog.json').read_text())
    path = ROOT / 'data/indices.json'
    previous = json.loads(path.read_text()) if path.exists() else {}
    retained = {r['id']: r for r in previous.get('indices', [])}
    rows = []
    for item in catalog:
        row = {**item, **retained.get(item['id'], {})}
        row.update(item)
        for key in ['forwardPE', 'mean10YearForwardPE', 'dividendYield', 'asOf', 'meanAsOf', 'meanMethod']:
            row.setdefault(key, None)
        row.setdefault('source', None)
        row.setdefault('sync', dict(status='not-connected', lastAttempt=None, lastSuccess=None, error='No validated public valuation adapter is connected for this exact benchmark.'))
        rows.append(row)
    by_id = {r['id']: r for r in rows}
    checked = dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds').replace('+00:00', 'Z')
    successes, failures = [], []

    def failed(ids, error):
        for id in ids:
            old = by_id[id].get('sync') or {}
            message = str(error)[:240] if isinstance(error, ValueError) else 'Source request or parsing unavailable (' + type(error).__name__ + ')'
            by_id[id]['sync'] = dict(status='retained' if by_id[id].get('forwardPE') is not None else 'unavailable', lastAttempt=checked, lastSuccess=old.get('lastSuccess'), error=message)
            failures.append(id)

    try:
        feed = ET.fromstring(fetch(RSS))
        articles = []
        for item in feed.findall('.//item'):
            title, url = item.findtext('title', ''), item.findtext('link', '')
            if 'S&P 500' in title and urlparse(url).hostname == 'insight.factset.com':
                date = parsedate_to_datetime(item.findtext('pubDate')).date().isoformat()
                articles.append((date, url))
        last_error = None
        for date, url in sorted(articles, reverse=True)[:8]:
            try:
                body = fetch(url)
                values = parse_factset(body.decode('utf-8', 'replace'), date)
                update_record(by_id['sp500'], values, dict(publisher='FactSet', url=url, discoveryUrl=RSS, page=None, checkedAt=checked, sha256=hashlib.sha256(body).hexdigest(), parserVersion=PARSER_VERSION, frequency='Weekly research; checked daily'), checked)
                successes.append('sp500')
                break
            except (ValueError, TypeError) as exc:
                last_error = exc
        else:
            raise ValueError('No recent complete valuation paragraph: ' + str(last_error))
    except Exception as exc:
        failed(['sp500'], exc)

    msci_jobs = [('acwi', ['acwi', 'world', 'em'])] + [(r['id'], [r['id']]) for r in rows if r.get('adapter') == 'msci-pdf' and r['id'] not in ['acwi', 'world', 'em']]
    for id, target_ids in msci_jobs:
        row = by_id[id]
        try:
            time.sleep(.35)
            url = discover_msci_pdf(fetch(row['landingUrl'])) if row.get('landingUrl') else row['pdfUrl']
            body = fetch(url)
            expected = 'MSCI ACWI' if id == 'acwi' else row['name']
            values = parse_msci_pdf(body, expected)
            source = dict(publisher='MSCI', url=url, discoveryUrl=row.get('landingUrl'), page=1, checkedAt=checked, sha256=hashlib.sha256(body).hexdigest(), parserVersion=PARSER_VERSION, frequency='Monthly factsheet; checked daily')
            if render_qa:
                qa = ROOT / 'qa/source-pages'
                qa.mkdir(parents=True, exist_ok=True, mode=0o700)
                subprocess.run(['pdftoppm', '-f', '1', '-singlefile', '-scale-to', '1500', '-jpeg', '-jpegopt', 'quality=70', '-', str(qa / id)], input=body, capture_output=True, check=True)
            for i, target_id in enumerate(target_ids):
                if id == 'acwi' and not all(label in PdfReader(io.BytesIO(body)).pages[0].extract_text() for label in ['MSCI ACWI', 'MSCI World', 'MSCI Emerging Markets']):
                    raise ValueError('ACWI comparison row identities changed')
                update_record(by_id[target_id], values[i], source, checked)
                successes.append(target_id)
        except Exception as exc:
            failed(target_ids, exc)

    result = dict(schemaVersion=1, publishedAt=checked, sourceCheckAt=checked, refreshCadence='Daily at 23:15 UTC, plus manual publisher runs', historyPolicy='Only an explicit publisher-reported 10-year forward-P/E mean is accepted. Missing means stay null.', refresh=dict(successful=len(successes), failed=len(failures), notConnected=sum(r.get('adapter') is None for r in rows)), indices=rows)
    path.write_text(json.dumps(result, indent=2, ensure_ascii=False) + '\n')
    for row in rows:
        print(f"{row['id']}: {row['sync']['status']}; forward={row['forwardPE']}; mean10y={row['mean10YearForwardPE']}; asOf={row['asOf']}")
    print(f'Refresh finished: {len(successes)} index observations checked; {len(failures)} failed/retained; {result["refresh"]["notConnected"]} without connected valuation sources.')
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--render-qa', action='store_true', help='Render original source page 1 into ignored local QA images for review')
    args = parser.parse_args()
    out = refresh(args.render_qa)
    sys.exit(0 if out['refresh']['successful'] else 1)
