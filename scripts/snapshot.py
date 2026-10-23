"""Validate and atomically publish complete, versioned public snapshots.

snapshotId/version describe financial values and definitions; a successful check
alone advances publishedAt/check metadata without inventing a new observation.
"""
import copy
import datetime as dt
import hashlib
import json
import math
import os
import tempfile
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
METRICS = {'forwardPE': ('asOf', 'source', 'sync'), 'mean10YearForwardPE': ('meanAsOf', 'meanSource', 'meanSync'), 'dividendYield': ('yieldAsOf', 'yieldSource', 'yieldSync'), 'growthForecast': ('asOf', 'source', 'sync')}


def utcnow():
    return dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds').replace('+00:00', 'Z')


def date(value, timestamp=False, now=None):
    if not isinstance(value, str): raise ValueError('Missing source date')
    try:
        parsed = dt.datetime.fromisoformat(value.replace('Z', '+00:00')) if timestamp else dt.date.fromisoformat(value)
    except ValueError: raise ValueError('Invalid calendar date') from None
    today = now or dt.datetime.now(dt.timezone.utc)
    if timestamp:
        if parsed.tzinfo is None or parsed > today + dt.timedelta(minutes=5): raise ValueError('Invalid or future snapshot timestamp')
    elif parsed.isoformat() != value or parsed.year < 2000 or parsed > today.date(): raise ValueError('Invalid or future source observation')
    return value


def source(evidence):
    if not isinstance(evidence, dict) or not isinstance(evidence.get('publisher'), str) or not evidence['publisher'].strip(): raise ValueError('Missing source publisher')
    url = urlparse(evidence.get('url', ''))
    if url.scheme != 'https' or not url.hostname or url.username or url.password: raise ValueError('Missing or invalid HTTPS evidence')
    for key in ('checkedAt', 'lastAttempt', 'lastSuccess'):
        if evidence.get(key): date(evidence[key], True)
    if evidence.get('sha256') and (len(evidence['sha256']) != 64 or any(c not in '0123456789abcdef' for c in evidence['sha256'])): raise ValueError('Malformed evidence hash')


def validate(feed):
    catalog = {row['id']: row['name'] for row in json.loads((ROOT/'data/catalog.json').read_text())}
    if feed.get('schemaVersion') != 1 or not isinstance(feed.get('indices'), list): raise ValueError('Unsupported snapshot schema')
    rows = feed['indices']
    if len(rows) != len(catalog) or {r.get('id') for r in rows} != set(catalog): raise ValueError('Snapshot must contain the exact complete catalogue')
    date(feed.get('publishedAt'), True)
    for row in rows:
        if row.get('name') != catalog[row['id']]: raise ValueError('Benchmark name does not match identity')
        for metric, (date_key, source_key, _) in METRICS.items():
            value = row.get(metric)
            if value is None: continue
            if metric == 'growthForecast':
                date(value.get('asOf')); source(value.get('source'))
                if value.get('forecastType') not in ('house', 'consensus') or value.get('periodBasis') not in ('calendar-year','fiscal-year','publisher-year','forecast-horizon'): raise ValueError('Invalid growth forecast definition')
                years = []
                for p in value.get('estimates', []):
                    if not isinstance(p.get('year'), int) or isinstance(p['year'], bool) or not 2020 <= p['year'] <= 2100 or isinstance(p.get('growth'),bool) or not isinstance(p.get('growth'), (int,float)) or not math.isfinite(p['growth']) or abs(p['growth']) > 1_000_000: raise ValueError('Invalid growth estimate')
                    years.append(p['year'])
                if not years or len(years) > 12 or years != sorted(set(years)): raise ValueError('Invalid growth forecast year identity')
            else:
                if isinstance(value, bool) or not isinstance(value, (int,float)) or not math.isfinite(value) or abs(value) > 1_000_000 or (metric == 'dividendYield' and not 0 <= value <= 1000): raise ValueError('Invalid numeric source observation')
                date(row.get(date_key) or (row.get('asOf') if metric == 'dividendYield' else None))
                source(row.get(source_key) or row.get('source'))
                if metric == 'mean10YearForwardPE' and not row.get('meanMethod'): raise ValueError('Missing historical statistic definition')
    if 'snapshotVersion' in feed and (not isinstance(feed['snapshotVersion'], int) or isinstance(feed['snapshotVersion'], bool) or feed['snapshotVersion'] < 1): raise ValueError('Invalid semantic snapshot version')
    if 'snapshotId' in feed and (not isinstance(feed['snapshotId'], str) or len(feed['snapshotId']) != 64 or any(c not in '0123456789abcdef' for c in feed['snapshotId'])): raise ValueError('Invalid semantic snapshot identifier')
    return feed


def observation(row, metric):
    value = row.get(metric)
    definition = row.get('metricDefinitions', {}).get(metric, {})
    if metric == 'growthForecast' and value is not None:
        economic = {k: value.get(k) for k in ('asOf','periodBasis','forecastType','epsBasis','method','estimates','horizonNote')}
        evidence = value.get('source') or {}
    else:
        date_key, source_key, _ = METRICS[metric]
        economic = {'value': value, 'observationDate': row.get(date_key), 'method': row.get('meanMethod') if metric == 'mean10YearForwardPE' else row.get('forwardMethod') if metric == 'forwardPE' else None}
        evidence = row.get(source_key) or row.get('source') or {}
    return {**economic, 'definitionId': definition.get('definitionId'), 'definitionVersion': definition.get('definitionVersion'), 'state': definition.get('state'), 'economicDefinition': definition.get('economic'), 'permittedUse': definition.get('permittedUse'), 'evidenceStatus': definition.get('evidenceStatus'), 'publisher': evidence.get('publisher'), 'url': evidence.get('url')}


def evidence_revision(row, metric):
    evidence = (row.get(metric) or {}).get('source', {}) if metric == 'growthForecast' else row.get(METRICS[metric][1]) or row.get('source') or {}
    return {key:evidence.get(key) for key in ('publisher','url','sha256','parserVersion','checkedAt','publicationDate','dateBasis')}


def semantic(feed):
    return {'schemaVersion':feed['schemaVersion'], 'registryVersion':feed.get('definitionRegistryVersion'), 'modelConventionVersion':feed.get('modelConventionVersion'), 'indices':[{'id':r['id'], **{metric:observation(r,metric) for metric in METRICS}, 'historicalCompatibility': r.get('historicalCompatibility')} for r in sorted(feed['indices'],key=lambda r:r['id'])]}


def finalize(feed, previous=None, reason='publisher-refresh'):
    previous = previous or {}
    from definition_registry import apply_registry
    feed = apply_registry(feed, previous)
    validate(feed)
    payload = json.dumps(semantic(feed), sort_keys=True, separators=(',',':'), ensure_ascii=False)
    identity = hashlib.sha256(payload.encode()).hexdigest()
    # First migration assigns a version; later check-only publications keep it.
    changed = identity != previous.get('snapshotId')
    feed['snapshotId'] = identity
    feed['snapshotVersion'] = max(1, previous.get('snapshotVersion', 0) + int(changed))
    history = copy.deepcopy(previous.get('changeHistory', []))
    old_rows = {r['id']:r for r in previous.get('indices',[])}
    if changed:
        changes = []
        for row in feed['indices']:
            old = old_rows.get(row['id'], {})
            for metric in METRICS:
                before, after = observation(old, metric), observation(row,metric)
                if before != after:
                    if row.get('metricDefinitions', {}).get(metric, {}).get('evidence') is not None:
                        row['metricDefinitions'][metric]['evidence']['latestAcceptedChange'] = feed['publishedAt']
                    changes.append({'benchmark':row['id'],'metric':metric,'old':before,'new':after, 'evidenceRevision':{'oldSource':evidence_revision(old,metric),'newSource':evidence_revision(row,metric)}, 'reason': 'same-date-correction-or-definition-change' if before.get('observationDate',before.get('asOf')) == after.get('observationDate',after.get('asOf')) else reason})
        history.append({'snapshotId':identity,'snapshotVersion':feed['snapshotVersion'],'acceptedAt':feed['publishedAt'],'reason':reason,'changes':changes})
    feed['changeHistory'] = history[-40:]
    event = os.environ.get('GITHUB_EVENT_NAME','local')
    run_id = os.environ.get('GITHUB_RUN_ID')
    feed['pipelineRun'] = {'event':event,'runId':run_id,'url':f'https://github.com/rickyinbc-tech/est.tickerlantern.com/actions/runs/{run_id}' if run_id else None,'checkedAt':feed['publishedAt']}
    if event == 'schedule': feed['lastScheduledCheckAt'] = feed['publishedAt']
    elif previous.get('lastScheduledCheckAt'): feed['lastScheduledCheckAt'] = previous['lastScheduledCheckAt']
    validate(feed)
    return feed


def atomic_write(path, value):
    path = Path(path)
    payload = json.dumps(value, indent=2, ensure_ascii=False)+'\n'
    descriptor, name = tempfile.mkstemp(prefix='.'+path.name+'-', dir=path.parent)
    try:
        with os.fdopen(descriptor, 'w') as stream:
            stream.write(payload); stream.flush(); os.fsync(stream.fileno())
        os.replace(name, path)
    finally:
        if os.path.exists(name): os.unlink(name)
