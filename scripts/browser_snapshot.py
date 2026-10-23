"""Validated public observations from the scheduled normal-browser check.

Some publishers reject hosted server traffic. A local Codex heartbeat opens
their public links normally, reviews the original PDF and imports it with the
same numerical parsers. CI may use that independently checked observation for
48 hours. Reading this file never renews its verification timestamp.
"""
import datetime as dt
import json
import re
from pathlib import Path
from public_browser_source import _validate_url

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / 'data/browser-observations.json'
TARGETS = {
    'nasdaq-dashboard': {'nasdaq100', 'russell2000', 'japan'},
    'edelweiss-reference': {'ftse100', 'hangseng'},
}


def validate_entry(adapter, entry, now=None):
    if adapter not in TARGETS or entry.get('adapterId') != adapter:
        raise ValueError('No scheduled-browser adapter for this source')
    now = now or dt.datetime.now(dt.timezone.utc)
    try:
        checked = dt.datetime.fromisoformat(entry['verifiedAt'].replace('Z', '+00:00'))
        if checked.utcoffset() != dt.timedelta(0): raise ValueError('Expected UTC')
    except (KeyError, TypeError, ValueError):
        raise ValueError('Scheduled-browser verification timestamp is invalid') from None
    age = now - checked
    if age < -dt.timedelta(minutes=5) or age > dt.timedelta(hours=48):
        raise ValueError('Scheduled-browser verification is overdue (48-hour limit)')
    evidence = entry.get('source', {})
    _validate_url(evidence.get('url', ''))
    if not re.fullmatch(r'[0-9a-f]{64}', evidence.get('sha256', '')):
        raise ValueError('Scheduled-browser source content hash missing')
    if evidence.get('transport') != 'scheduled-browser' or evidence.get('checkedAt') != entry['verifiedAt']:
        raise ValueError('Scheduled-browser evidence timestamp or transport mismatch')
    if set(entry.get('values', {})) != TARGETS[adapter]:
        raise ValueError('Scheduled-browser benchmark identities do not match')
    expected_host = 'www.nasdaq.com' if adapter == 'nasdaq-dashboard' else 'www.edelweissmf.com'
    from urllib.parse import urlparse
    if urlparse(evidence['url']).hostname != expected_host:
        raise ValueError('Scheduled-browser publisher identity does not match')
    for metrics in entry['values'].values():
        if not all(metrics.get(k) is not None for k in ('forwardPE', 'mean10YearForwardPE', 'asOf', 'meanAsOf', 'meanMethod', 'page')):
            raise ValueError('Scheduled-browser metric provenance is incomplete')
    return entry['values'], evidence, entry['verifiedAt']


def load(adapter, now=None, path=PATH):
    try:
        document = json.loads(path.read_text())
        if document.get('schemaVersion') != 1: raise ValueError('Wrong browser snapshot schema')
        entry = document['sources'][adapter]
    except (OSError, KeyError, json.JSONDecodeError):
        raise ValueError('No verified scheduled-browser observation is available') from None
    return validate_entry(adapter, entry, now)
