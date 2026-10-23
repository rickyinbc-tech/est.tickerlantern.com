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
import math
import copy
import json
import logging
import os
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
from metric_sync import mark_failure, primary_owns

ROOT = Path(__file__).resolve().parents[1]
RSS = 'https://insight.factset.com/topic/earnings/rss.xml'
PARSER_VERSION = 'index-fundamentals-2'
logging.getLogger('pypdf').setLevel(logging.ERROR)


def plain(text):
    text = re.sub(r'<(?:script|style)\b[^>]*>.*?</(?:script|style)>', ' ', text, flags=re.I | re.S)
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', text))).strip()


HOSTS = {'www.msci.com', 'insight.factset.com', 'am.jpmorgan.com', 'www.nasdaq.com', 'lipperalpha.refinitiv.com', 'cambridgeretirementma.gov', 'www.ig.com', 'www.raymondjames.ca', 'www.manulife.com', 'cumberlandprivate.com', 'www.aranca.com', 'www.krungsri.com', 'www.ajbell.co.uk', 'www.goodridgegroup.ca', 'www.edelweissmf.com', 'www.scbam.com', 'meetings.sypensions.org.uk'}


def fetch(url):
    from public_http import request, checked_url, validate_body
    checked_url(url, HOSTS)
    try:
        return request(url, HOSTS)[0]
    except ValueError:
        if os.environ.get('PUBLIC_BROWSER_FETCH') == '1' and os.environ.get('GITHUB_ACTIONS') == 'true' and urlparse(url).hostname in ('www.nasdaq.com', 'www.edelweissmf.com'):
            from public_browser_source import fetch_public
            return validate_body(fetch_public(url), '', url)
        raise


def valid_date(value, now=None):
    parsed = dt.date.fromisoformat(value)
    if parsed > (now or dt.datetime.now(dt.timezone.utc).date()):
        raise ValueError('Source observation is future-dated')
    if parsed.year < 2000:
        raise ValueError('Unexpected source date')
    return value


def valid_pe(value):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or abs(value) > 1_000_000:
        raise ValueError('Invalid or implausible published P/E; calculator bounds are separate')
    return value


def parse_factset(body, published):
    text = plain(body)
    if 'S&P 500' not in text:
        raise ValueError('Wrong index in FactSet article')
    pairs = re.findall(r'The forward 12.month P/E ratio is\s+(\d+(?:\.\d+)?)(.{0,330}?)10.year average\s*\((\d+(?:\.\d+)?)\)', text, re.I)
    if len(pairs) != 1:
        raise ValueError('Expected exactly one forward-P/E / 10-year-mean paragraph')
    current, _, mean = pairs[0]
    return dict(forwardPE=valid_pe(float(current)), mean10YearForwardPE=valid_pe(float(mean)), asOf=valid_date(published), meanAsOf=valid_date(published), meanMethod='FactSet reported 10-year average; underlying sampling frequency not specified in the article', dateBasis='article-publication-date; metric observation date not separately disclosed', publicationDate=published)


def parse_msci_text(text, expected):
    """Parse layout-preserved rows, never infer identity from numeric row order.

    MSCI's fundamentals share a horizontal row with its named performance
    table. Plain text extraction moves the names away from the fundamentals;
    layout extraction keeps the label and all twelve cells on the same line.
    """
    text = unicodedata.normalize('NFKC', text).replace('\xa0', ' ')
    if not re.search(re.escape(expected) + r'\s+Index\s*\(', re.sub(r'\s+', ' ', text[:1800])):
        raise ValueError('Factsheet identity does not match ' + expected)
    match = re.search(r'FUNDAMENTALS\s*\(([A-Za-z]{3}\s+\d{1,2},\s*\d{4})\)(.*?)INDEX RISK', text, re.S)
    if not match: raise ValueError('Dated fundamentals table not found')
    date = dt.datetime.strptime(match[1], '%b %d, %Y').date().isoformat()
    valid_date(date)
    section = match[2]
    if not re.search(r'Div\s+Yld\s*\(%\)\s+P/E\s+P/E\s+Fwd\s+P/BV', section): raise ValueError('Fundamentals column order changed')
    rows = {}
    for line in section.splitlines():
        match = re.fullmatch(r'\s*(MSCI [A-Za-z0-9 &()/-]+?)\s{2,}(.+?)\s*', line)
        if not match: continue
        name = re.sub(r'\s+', ' ', match[1]).strip()
        cells = match[2].split()
        if len(cells) != 12 or any(not re.fullmatch(r'-?\d+(?:\.\d+)?|N/M|N/A|-', cell) for cell in cells): raise ValueError('Named MSCI row or multi-level table structure changed')
        if name in rows: raise ValueError('Duplicate named MSCI fundamentals row')
        dividend, trailing, forward, book = cells[-4:]
        numeric = lambda cell: None if cell in ('N/M', 'N/A', '-') else float(cell)
        forward_value, dividend_value = numeric(forward), numeric(dividend)
        if forward_value is not None: valid_pe(forward_value)
        if dividend_value is not None and not 0 <= dividend_value <= 1000: raise ValueError('Invalid published dividend yield')
        rows[name] = dict(forwardPE=forward_value, dividendYield=dividend_value, asOf=date, mean10YearForwardPE=None, meanAsOf=None, meanMethod=None, rawForwardPE=forward, rawDividendYield=dividend, metricStates={'forwardPE': 'not-meaningful' if forward == 'N/M' else 'unavailable' if forward_value is None else 'numeric', 'dividendYield': 'unavailable' if dividend_value is None else 'numeric'})
    if len(rows) != 3 or expected not in rows: raise ValueError('Expected three unambiguous named benchmark rows')
    return rows


def parse_msci_pdf(body, expected):
    if not body.startswith(b'%PDF'): raise ValueError('Source returned a challenge or HTML instead of a PDF')
    reader = PdfReader(io.BytesIO(body))
    if not 1 <= len(reader.pages) <= 8: raise ValueError('Unexpected factsheet page count')
    return parse_msci_text(reader.pages[0].extract_text(extraction_mode='layout'), expected)


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
    update_metrics(record, values, source, checked)


def update_metrics(record, values, source, checked):
    """Choose the newest observation independently for price, mean and yield.

    A monthly fundamentals refresh cannot erase an independently sourced mean,
    nor turn the date of an older dividend observation into today's date.
    """
    values = dict(values)
    source = {**source, 'page': values.pop('page', source.get('page'))}
    for key in ('forwardPE', 'mean10YearForwardPE'):
        if values.get(key) is not None: valid_pe(values[key])
    date = valid_date(values['asOf']) if values.get('asOf') else None
    mean_date = valid_date(values['meanAsOf']) if values.get('meanAsOf') else None
    if values.get('forwardPE') is not None and not date: raise ValueError('Missing forward observation date')
    if values.get('mean10YearForwardPE') is not None and (not mean_date or not values.get('meanMethod')): raise ValueError('Missing mean provenance')
    if values.get('dividendYield') is not None and (not date or isinstance(values['dividendYield'], bool) or not isinstance(values['dividendYield'], (int, float)) or not math.isfinite(values['dividendYield']) or not 0 <= values['dividendYield'] <= 1000): raise ValueError('Invalid or undated source dividend yield')
    def accepted(incoming, retained, source_key):
        # On equal dates prefer explicit 12-month-forward primary tables over
        # secondary tables whose forward horizon is less precisely described.
        rank = lambda evidence: 70 if (evidence or {}).get('adapterId') in ('edelweiss-reference', 'nasdaq-dashboard') else 50
        return not retained or incoming > retained or (incoming == retained and rank(source) >= rank(record.get(source_key)))
    accepted_metrics = []
    status = dict(status='ok', lastAttempt=checked, lastSuccess=checked, error=None, metrics=accepted_metrics, ownerId=source.get('checkOwner') or source.get('adapterId'))
    for metric, state in values.get('metricStates', {}).items():
        if state not in ('not-meaningful', 'withdrawn', 'unavailable'): continue
        date_key, source_key, sync_key = ('asOf', 'source', 'sync') if metric == 'forwardPE' else ('yieldAsOf', 'yieldSource', 'yieldSync')
        if date and accepted(date, record.get(date_key), source_key):
            accepted_metrics.append(metric)
            record.update({metric: None, date_key: date, source_key: source, sync_key: status})
            record.setdefault('metricStates', {})[metric] = state
            record.setdefault('metricRawValues', {})[metric] = values.get('rawForwardPE' if metric == 'forwardPE' else 'rawDividendYield')
    if values.get('forwardPE') is not None and accepted(date, record.get('asOf'), 'source'):
        accepted_metrics.append('forwardPE')
        record.setdefault('metricStates', {})['forwardPE'] = 'numeric'
        record.setdefault('metricRawValues', {})['forwardPE'] = values.get('rawForwardPE', values['forwardPE'])
        record.update(forwardPE=values['forwardPE'], asOf=date, source={**source, 'dateBasis': values.get('dateBasis', source.get('dateBasis', 'explicit-observation-date')), 'publicationDate': values.get('publicationDate', source.get('publicationDate'))}, sync=status, earningsBasis=values.get('earningsBasis', 'not disclosed'), forwardMethod=values.get('forwardMethod'))
    if values.get('dividendYield') is not None and accepted(date, record.get('yieldAsOf'), 'yieldSource'):
        accepted_metrics.append('dividendYield')
        record.setdefault('metricStates', {})['dividendYield'] = 'numeric'
        record.setdefault('metricRawValues', {})['dividendYield'] = values.get('rawDividendYield', values['dividendYield'])
        record.update(dividendYield=values['dividendYield'], yieldAsOf=date, yieldSource=source, yieldSync=status)
    if values.get('mean10YearForwardPE') is not None and accepted(mean_date, record.get('meanAsOf'), 'meanSource'):
        accepted_metrics.append('mean10YearForwardPE')
        if not values.get('meanMethod') or not mean_date: raise ValueError('Missing mean provenance')
        record.update(mean10YearForwardPE=values['mean10YearForwardPE'], meanAsOf=mean_date, meanMethod=values['meanMethod'], meanSource=source, meanSync=status)


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
        if row.get('dividendYield') is not None:
            row.setdefault('yieldAsOf', row.get('asOf'))
            row.setdefault('yieldSource', row.get('source'))
        if row.get('mean10YearForwardPE') is not None:
            row.setdefault('meanSource', row.get('source'))
        row.setdefault('sync', dict(status='not-connected', lastAttempt=None, lastSuccess=None, error='No validated public valuation adapter is connected for this exact benchmark.'))
        rows.append(row)
    by_id = {r['id']: r for r in rows}
    checked = dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds').replace('+00:00', 'Z')
    successes, failures, primary_jobs = [], [], []

    def failed(ids, error, owner, metrics):
        message = str(error)[:240] if isinstance(error, ValueError) else 'Source request or parsing unavailable (' + type(error).__name__ + ')'
        for id in ids:
            mark_failure(by_id[id],checked,message,lambda source:primary_owns(source,owner),metrics,owner['id'])
            failures.append(id)
        primary_jobs.append(dict(id=owner['id'],indices=ids,status='retained',checkedAt=checked,error=message))

    factset_owner=dict(id='primary:factset',provider='FactSet',url=(by_id['sp500'].get('source') or {}).get('url'),discoveryUrl=RSS)
    try:
        feed = ET.fromstring(fetch(RSS))
        articles = []
        for item in feed.findall('.//item'):
            title, url = item.findtext('title', ''), item.findtext('link', '')
            if 'S&P 500' in title and urlparse(url).hostname == 'insight.factset.com':
                date = parsedate_to_datetime(item.findtext('pubDate')).date().isoformat()
                articles.append((date, url))
        candidates = [(date, url) for date, url in articles if 'earnings-season' in url]
        if not candidates: raise ValueError('No explicitly identified FactSet earnings-season article discovered')
        date, url = max(candidates)
        body = fetch(url)
        values = parse_factset(body.decode('utf-8', 'replace'), date)
        update_metrics(by_id['sp500'], values, dict(publisher='FactSet',checkOwner=factset_owner['id'], url=url, discoveryUrl=RSS, page=None, checkedAt=checked, sha256=hashlib.sha256(body).hexdigest(), parserVersion=PARSER_VERSION, frequency='Weekly research; checked daily', publicationDate=date, dateBasis=values['dateBasis']), checked)
        successes.append('sp500')
        primary_jobs.append(dict(id=factset_owner['id'],indices=['sp500'],status='ok',checkedAt=checked,error=None))
    except Exception as exc:
        failed(['sp500'], exc,factset_owner,['forwardPE','mean10YearForwardPE'])

    msci_jobs = [('acwi', ['acwi', 'world', 'em'])] + [(r['id'], [r['id']]) for r in rows if r.get('adapter') == 'msci-pdf' and r['id'] not in ['acwi', 'world', 'em']]
    for id, target_ids in msci_jobs:
        row = by_id[id]
        owner=dict(id='primary:msci:'+id,provider='MSCI',url=row.get('pdfUrl'),discoveryUrl=row.get('landingUrl'))
        try:
            time.sleep(.35)
            url = discover_msci_pdf(fetch(row['landingUrl'])) if row.get('landingUrl') else row['pdfUrl']
            owner['url']=url
            body = fetch(url)
            expected = 'MSCI ACWI' if id == 'acwi' else row['name']
            values = parse_msci_pdf(body, expected)
            source = dict(publisher='MSCI',checkOwner=owner['id'], url=url, discoveryUrl=row.get('landingUrl'), page=1, checkedAt=checked, sha256=hashlib.sha256(body).hexdigest(), parserVersion=PARSER_VERSION, frequency='Monthly factsheet; checked daily')
            if render_qa:
                qa = ROOT / 'qa/source-pages'
                qa.mkdir(parents=True, exist_ok=True, mode=0o700)
                subprocess.run(['pdftoppm', '-f', '1', '-singlefile', '-scale-to', '1500', '-jpeg', '-jpegopt', 'quality=70', '-', str(qa / id)], input=body, capture_output=True, check=True)
            candidates = {}
            for target_id in target_ids:
                target_name = by_id[target_id]['name']
                if target_name not in values: raise ValueError('Named MSCI comparison row missing: ' + target_name)
                candidate = copy.deepcopy(by_id[target_id])
                update_metrics(candidate, values[target_name], source, checked)
                candidates[target_id] = candidate
            for target_id, candidate in candidates.items():
                by_id[target_id].update(candidate)
                successes.append(target_id)
            primary_jobs.append(dict(id=owner['id'],indices=target_ids,status='ok',checkedAt=checked,error=None))
        except Exception as exc:
            failed(target_ids, exc,owner,['forwardPE','dividendYield'])

    from source_jobs import refresh_supplemental
    source_jobs = refresh_supplemental(by_id, fetch, update_metrics, checked, render_qa)
    healthy = ('ok', 'browser-verified')
    result = dict(previous)
    result.update(schemaVersion=1, publishedAt=checked, sourceCheckAt=checked, refreshCadence='Daily at 23:15 UTC plus daily scheduled browser source checks', historyPolicy='Published 10-year forward-P/E references retain their own dates, definitions and sources. An older dated reference is not relabelled as a current rolling mean.', refresh=dict(successful=len(set(successes) | {id for job in source_jobs if job['status'] in healthy for id in job['indices']}), failed=len(failures) + sum(j['status'] not in healthy for j in source_jobs), notConnected=sum(r.get('forwardPE') is None for r in rows)), sourceJobs=source_jobs, indices=rows)
    from snapshot import finalize, atomic_write
    result['primarySourceJobs']=primary_jobs
    result = finalize(result, previous, 'valuation-publisher-refresh')
    atomic_write(path, result)
    for job in source_jobs:
        print(f"Source {job['id']}: {job['status']}; {job['error'] or 'validated'}")
    for row in rows:
        print(f"{row['id']}: {row['sync']['status']}; forward={row['forwardPE']}; mean10y={row['mean10YearForwardPE']}; asOf={row['asOf']}")
    print(f'Refresh finished: {result["refresh"]["successful"]} benchmark observations checked; {result["refresh"]["failed"]} source jobs failed/retained; {result["refresh"]["notConnected"]} without connected valuation sources.')
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--render-qa', action='store_true', help='Render original source page 1 into ignored local QA images for review')
    args = parser.parse_args()
    try:
        out = refresh(args.render_qa)
    finally:
        from public_browser_source import close
        close()
    sys.exit(0 if out['refresh']['successful'] and not out['refresh']['failed'] else 1)
