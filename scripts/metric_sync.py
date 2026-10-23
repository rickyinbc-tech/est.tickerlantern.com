"""Resolve check outcomes by owned metric/document, independently of availability."""
import copy
import re

METRICS = {'forwardPE':('source','sync','asOf'), 'mean10YearForwardPE':('meanSource','meanSync','meanAsOf'), 'dividendYield':('yieldSource','yieldSync','yieldAsOf')}
FAILURES = ('retained','unavailable')
AVAILABILITY = ('not-meaningful','withdrawn')


def safe_error(value):
    text = re.sub(r'[\x00-\x1f<>]', ' ', str(value or ''))
    text = re.sub(r'(?i)(authorization|cookie|password|token|api[_-]?key)\s*[:=]\s*\S+', r'\1=[redacted]', text)
    return re.sub(r'\s+', ' ', text).strip()[:240] or None


def metric_source(row, key):
    if key == 'growthForecast': return (row.get(key) or {}).get('source') or {}
    source_key, _, _ = METRICS[key]
    if row.get(source_key): return row[source_key]
    if key == 'forwardPE' or row.get(key) is not None or (row.get('metricStates') or {}).get(key) in AVAILABILITY:
        return row.get('source') or {}
    return {}


def same_document(a, b):
    # A publisher name, host, or adapter alone cannot establish shared ownership.
    return bool(a.get('url') and a.get('url') == b.get('url') and not (a.get('adapterId') and b.get('adapterId') and a['adapterId'] != b['adapterId']))


def own_sync(row, key):
    return ((row.get(key) or {}).get('sync') or row.get('growthSync') or {}) if key == 'growthForecast' else row.get(METRICS[key][1]) or {}


def resolved_sync(row, key):
    source = metric_source(row,key)
    own = own_sync(row,key)
    candidates = [(own,source,True)] if own else []
    if key != 'growthForecast':
        for other in METRICS:
            status = own_sync(row,other)
            if other != key and status and same_document(source,metric_source(row,other)) and (status.get('metrics') is None or key in status['metrics']):
                candidates.append((status,metric_source(row,other),False))
    if not candidates:
        return dict(status='unknown',lastAttempt=None,lastSuccess=source.get('checkedAt'),error=None)
    status, evidence, _ = max(candidates,key=lambda item:(item[0].get('lastAttempt') or item[0].get('lastSuccess') or item[1].get('checkedAt') or '', item[0].get('status') in FAILURES, item[2]))
    result = copy.deepcopy(status)
    if result.get('status') in AVAILABILITY: result['status']='ok'
    result.setdefault('lastAttempt',None)
    result['lastSuccess'] = (own.get('lastSuccess') if result.get('status') in FAILURES else None) or result.get('lastSuccess') or evidence.get('checkedAt')
    result['error'] = safe_error(result.get('error'))
    return result


def primary_owns(source, owner):
    if not source.get('url'): return False
    if source.get('checkOwner'): return source['checkOwner'] == owner['id']
    if source.get('adapterId'): return False
    if owner['provider'] == 'FactSet':
        return source.get('publisher') == 'FactSet' and (source['url']==owner.get('url') or bool(owner.get('discoveryUrl') and source.get('discoveryUrl')==owner['discoveryUrl']))
    if source.get('publisher') != 'MSCI': return False
    if owner.get('url') and source['url'] == owner['url']: return True
    if owner.get('discoveryUrl') and source.get('discoveryUrl') == owner['discoveryUrl']: return True
    return False


def mark_failure(row, checked, error, owns, metrics=None, owner_id=None):
    affected = [key for key in (metrics or METRICS) if owns(metric_source(row,key))]
    before = {key:resolved_sync(row,key) for key in affected}
    for key in affected:
        previous = own_sync(row,key)
        accepted = row.get(key) is not None or (row.get('metricStates') or {}).get(key) in AVAILABILITY
        row[METRICS[key][1]] = dict(status='retained' if accepted else 'unavailable',lastAttempt=checked,
            lastSuccess=previous.get('lastSuccess') or before[key].get('lastSuccess'),error=safe_error(error),metrics=affected,ownerId=owner_id)
    return affected


def repair_shared_sync(row):
    """Only materialize existing proven outcomes; no new attempt or success."""
    changes=[]
    resolved={key:resolved_sync(row,key) for key in METRICS}
    for key,status in resolved.items():
        original=own_sync(row,key)
        if status.get('lastAttempt') and status.get('status') in FAILURES and any(original.get(k)!=status.get(k) for k in ('status','lastAttempt','lastSuccess')):
            row[METRICS[key][1]]=status;changes.append(key)
    return changes
