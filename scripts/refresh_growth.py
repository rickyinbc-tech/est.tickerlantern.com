#!/usr/bin/env python3
"""Refresh public annual earnings forecasts independently of valuation feeds."""
import datetime as dt
import hashlib
import html
import json
import re
import subprocess
import time
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import urljoin, urlparse
from email.utils import parsedate_to_datetime
from growth_sources import PARSERS

ROOT = Path(__file__).resolve().parents[1]
VERSION = 'annual-growth-1'
HOSTS = {'insight.factset.com', 'advantage.factset.com', 'www.ubs.com', 'www.firsteagle.com', 'www.nbinvestments.ca', 'www.nbc.ca', 'am.jpmorgan.com', 'www.hartfordfunds.com', 'emea.amova-am.com', 'fsm.global'}


class PublicSources:
    """Anonymous HTTPS reads, publisher robots rules, and per-host pacing."""
    def __init__(self):
        self.policies = {}; self.last = {}; self.cache = {}

    def raw(self, url, post=False):
        from public_http import request
        return request(url, HOSTS, post=post, allow_status=True)

    def policy(self, url):
        host = urlparse(url).hostname
        if host in self.policies: return self.policies[host]
        body, status = self.raw('https://' + host + '/robots.txt')
        if status in (404, 410): rules, delay = [], .4
        elif status == 200:
            rules, delay, agents, directives = [], .4, [], []
            def save():
                nonlocal delay
                if '*' in agents or any('tickerlantern' in a for a in agents):
                    for key, val in directives:
                        if key in ('allow', 'disallow') and val: rules.append((key, val))
                        if key == 'crawl-delay':
                            try: delay = max(delay, float(val))
                            except ValueError: pass
            # Blank lines are legal within a group on several publishers.
            for line in body.decode('utf-8', 'replace').splitlines():
                line = line.split('#', 1)[0].strip()
                if ':' not in line: continue
                key, val = [s.strip() for s in line.split(':', 1)]; key = key.lower()
                if key == 'user-agent':
                    if directives: save(); agents, directives = [], []
                    agents.append(val.lower())
                else: directives.append((key, val))
            save()
        else: raise ValueError('Publisher robots policy unavailable')
        self.policies[host] = rules, delay
        return rules, delay

    def get(self, url, post=False):
        key = (url, post)
        if key in self.cache: return self.cache[key]
        rules, delay = self.policy(url); parsed = urlparse(url)
        target = parsed.path + ('?' + parsed.query if parsed.query else '')
        matches = []
        for kind, pattern in rules:
            end = pattern.endswith('$'); pattern = pattern.rstrip('$')
            if re.match(re.escape(pattern).replace(r'\*', '.*') + ('$' if end else ''), target): matches.append((len(pattern.replace('*', '')), kind == 'allow'))
        if matches and not max(matches)[1]: raise ValueError('Publisher robots excludes this source route')
        time.sleep(max(0, delay - (time.monotonic() - self.last.get(parsed.hostname, 0))))
        body, status = self.raw(url, post); self.last[parsed.hostname] = time.monotonic()
        if status != 200 or not body: raise ValueError('Public source HTTP ' + str(status))
        self.cache[key] = body
        return body


def links(body, base):
    return list(dict.fromkeys(urljoin(base, html.unescape(s)) for s in re.findall(r'(?:href|src)=["\']([^"\']+)', body.decode('utf-8', 'replace'))))


def newest(urls, pattern, key=lambda x: x):
    selected = [u for u in urls if re.search(pattern, u, re.I)]
    if not selected: raise ValueError('Latest publisher document link not found')
    return sorted(selected, key=key, reverse=True)[0]


def discover(job, client):
    adapter, discovery = job['adapter'], job['discoveryUrl']
    if adapter in ('jpm', 'nbf'): return job['url'], None
    if adapter == 'fsm': return job['url'], None
    body = client.get(discovery)
    urls = links(body, discovery)
    if adapter == 'factset':
        feed = ET.fromstring(body)
        items = [(parsedate_to_datetime(i.findtext('pubDate')).date(), i.findtext('link')) for i in feed.findall('.//item') if 'S&P 500' in i.findtext('title', '') and 'earnings-season' in i.findtext('link', '')]
        if not items: raise ValueError('FactSet earnings-season RSS entries missing')
        date, article = max(items)
        article_links = links(client.get(article), article)
        documents = [u for u in article_links if 'EarningsInsight_' in u and '.pdf' in u]
        # FactSet's published file naming convention. The PDF's actual cover
        # date and CY paragraphs are validated before accepting this candidate.
        return (documents[0] if len(documents) == 1 else re.sub(r'EarningsInsight_\d{6}\.pdf', 'EarningsInsight_' + date.strftime('%m%d%y') + '.pdf', job['url'])), date.isoformat()
    if adapter == 'ubs':
        urls = [e.text for e in ET.fromstring(body).iter() if e.tag.endswith('loc') and e.text]
        dated_urls = []
        for u in urls:
            m = re.search(r'/house-view/daily/(20\d{2})/latest-(\d{6}|\d{8})\.html$', u)
            if not m: continue
            try: date = dt.datetime.strptime(m[2], '%d%m%Y' if len(m[2]) == 8 else '%d%m%y').date()
            except ValueError: continue
            if date <= dt.datetime.now(dt.timezone.utc).date(): dated_urls.append((date, u))
        for _, u in sorted(dated_urls, reverse=True)[:30]:
            candidate = client.get(u)
            try: PARSERS['ubs'](candidate)
            except ValueError: continue
            return u, None
        raise ValueError('No recent UBS annual Nasdaq-100 consensus pair')
    if adapter == 'firsteagle':
        article = newest(urls, r'/insights/[^?#]*small-cap-market-overview')
        urls = links(client.get(article), article)
        return newest(urls, r'Small-Cap-Market-Overview.*\.pdf'), None
    if adapter == 'nbi':
        months = {dt.date(2000, i, 1).strftime('%B').lower(): i for i in range(1,13)}
        def key(u):
            m = re.search(r'asset-allocation-strategy-([a-z]+)-(20\d{2})', u)
            return (int(m[2]), months.get(m[1], 0)) if m else (0,0)
        article = newest(urls, r'/article/asset-allocation-strategy-[a-z]+-20\d{2}\.html', key)
        urls = links(client.get(article), article)
        return newest(urls, r'/publication/cio-asset-s?llocation-strategy-20\d{2}-\d{2}\.pdf'), None
    if adapter == 'hartford':
        return newest(urls, r'HF0044_Q[1-4]\d{2}\.pdf', lambda u: re.search(r'Q([1-4])(\d{2})',u)[2] + re.search(r'Q([1-4])(\d{2})',u)[1]), None
    if adapter == 'amova':
        listing = json.loads(body)
        if listing.get('status') != 'ok' or listing.get('hasMore') or not isinstance(listing.get('data'), list): raise ValueError('Amova public listing incomplete')
        articles = [item for item in listing['data'] if re.fullmatch(r'Global Investment Strategy Committee Outlook Q[1-4] 20\d{2}', item.get('DisplayTitle', '').strip())]
        if not articles: raise ValueError('Amova quarterly outlook not found')
        article = max(articles, key=lambda item:item['PublicationDateSortable'])['AbsoluteUrl']
        urls = links(client.get(article), article)
        return newest(urls, r'global-investment-strategy-committee-outlook-q[1-4]-20\d{2}\.pdf'), None
    raise ValueError('Unsupported growth discovery adapter')


def update(row, values, job, url, body, checked):
    date = dt.date.fromisoformat(values['asOf'])
    if date > dt.datetime.now(dt.timezone.utc).date() or date.year < 2020: raise ValueError('Invalid growth observation date')
    old = row.get('growthForecast') or {}
    if old.get('asOf') and values['asOf'] < old['asOf']: raise ValueError('Publisher observation is older than retained growth data')
    source = dict(publisher=job['publisher'], url=url, discoveryUrl=job['discoveryUrl'], page=values['page'], sha256=hashlib.sha256(body).hexdigest(), checkedAt=checked, parserVersion=VERSION, frequency='Dated article revision check daily' if job['adapter']=='fsm' else 'Latest public publication checked daily')
    if job.get('contentUrl'): source.update(contentUrl=job['contentUrl'], contentMethod='POST')
    row['growthForecast'] = {**job['indices'][row['id']], 'asOf': values['asOf'], 'estimates': values['estimates'], 'source': source, 'sync': dict(status='ok', lastAttempt=checked, lastSuccess=checked, error=None)}


def refresh(path=None, jobs=None, client=None):
    path = Path(path or ROOT / 'data/indices.json')
    feed = json.loads(path.read_text()); previous = json.loads(path.read_text()); rows = {r['id']:r for r in feed['indices']}
    jobs = jobs or json.loads((ROOT/'data/growth-sources.json').read_text())['jobs']
    checked = dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds').replace('+00:00','Z')
    client = client or PublicSources(); successes, failures = [], []
    for job in jobs:
        try:
            url, expected_date = discover(job, client)
            body = client.get(job.get('contentUrl', url), post=job['adapter']=='fsm')
            parsed = PARSERS[job['adapter']](body)
            if expected_date and any(v['asOf'] != expected_date for v in parsed.values()): raise ValueError('Discovered publication and PDF dates differ')
            if set(parsed) != set(job['indices']): raise ValueError('Exact growth benchmark coverage changed')
            # Validate the whole job before mutating any index.
            candidates = {}
            for id, values in parsed.items():
                candidate = dict(rows[id]); update(candidate, values, job, url, body, checked); candidates[id] = candidate['growthForecast']
            for id, forecast in candidates.items():
                rows[id]['growthForecast'] = forecast
                rows[id].pop('growthSync', None)
            successes.extend(parsed)
            print(job['adapter'] + ': verified ' + ', '.join(parsed), flush=True)
        except Exception as error:
            message = str(error)[:200] if isinstance(error, ValueError) else type(error).__name__
            for id in job['indices']:
                old = rows[id].get('growthForecast')
                status = dict(status='retained' if old else 'unavailable', lastAttempt=checked, lastSuccess=(old or {}).get('sync',{}).get('lastSuccess'), error=message)
                if old: old['sync'] = status
                rows[id]['growthSync'] = status
            failures.append(dict(adapter=job['adapter'], error=message))
            print(job['adapter'] + ': retained prior data — ' + message, flush=True)
    feed.update(publishedAt=checked, growthCheckAt=checked, growthRefresh=dict(parserVersion=VERSION, checkedAt=checked, successfulIndices=successes, failures=failures))
    from snapshot import finalize, atomic_write
    feed = finalize(feed, previous, 'growth-publisher-refresh')
    atomic_write(path, feed)
    return not failures


if __name__ == '__main__':
    raise SystemExit(0 if refresh() else 1)
