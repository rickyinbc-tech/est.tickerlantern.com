#!/usr/bin/env python3
"""Import a freshly downloaded PUBLIC publisher PDF after browser review.

Downloads must come through the official report listing in a normal browser.
This command never controls a browser, fetches a URL, or publishes PDF bytes.
"""
import argparse
import datetime as dt
import io
import copy
import json
from pathlib import Path
from pypdf import PdfReader
from browser_snapshot import PATH, ROOT, validate_entry
from refresh_indices import update_metrics
from source_jobs import source, parse_reference, NASDAQ_LIST


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--adapter', required=True, choices=['nasdaq-dashboard', 'edelweiss-reference'])
    parser.add_argument('--pdf', required=True, type=Path)
    parser.add_argument('--url', required=True, help='Exact official download URL actually opened')
    parser.add_argument('--verified-at', required=True, help='UTC time of the actual browser source check, not a file re-read')
    parser.add_argument('--publish-snapshot', action='store_true', help='Also merge validated values into the website JSON')
    args = parser.parse_args()
    body = args.pdf.read_bytes()
    if not body.startswith(b'%PDF') or len(body) > 24_000_000: raise ValueError('Expected a bounded original public PDF')
    if args.adapter == 'nasdaq-dashboard':
        from nasdaq_source import parse_dashboard, PARSER_VERSION
        reader = PdfReader(io.BytesIO(body))
        if not 1 <= len(reader.pages) <= 6: raise ValueError('Unexpected dashboard length')
        values = parse_dashboard('\n'.join(p.extract_text() for p in reader.pages))
        for row in values.values(): row['page'] = 1
        evidence = source('Nasdaq / Bloomberg / FactSet', args.url, body, NASDAQ_LIST)
        evidence['parserVersion'] = PARSER_VERSION
    else:
        from edelweiss_source import parse_edelweiss_text, TEMPO_DETAIL_URL
        values = parse_reference(body, parse_edelweiss_text)
        evidence = source('Edelweiss Mutual Fund / Bloomberg', args.url, body, TEMPO_DETAIL_URL)
    evidence.update(adapterId=args.adapter, checkedAt=args.verified_at, transport='scheduled-browser', frequency='Daily scheduled browser check; requires the owner’s Mac and Codex to be available')
    entry = dict(adapterId=args.adapter, verifiedAt=args.verified_at, source=evidence, values=values)
    validate_entry(args.adapter, entry)
    cache = json.loads(PATH.read_text()) if PATH.exists() else dict(schemaVersion=1, sources={})
    cache['sources'][args.adapter] = entry
    feed_path = ROOT / 'data/indices.json'
    feed = json.loads(feed_path.read_text())
    previous = copy.deepcopy(feed)
    rows = {r['id']: r for r in feed['indices']}
    for id, metrics in values.items(): update_metrics(rows[id], metrics, evidence, args.verified_at)
    # Validate all metrics before either file is written.
    from snapshot import finalize, atomic_write
    if not args.publish_snapshot: atomic_write(PATH, cache)
    if args.publish_snapshot:
        jobs = feed.setdefault('sourceJobs', [])
        old_failed = sum(j['status'] not in ('ok', 'browser-verified') for j in jobs)
        base_failed = max(0, feed.get('refresh', {}).get('failed', 0) - old_failed)
        jobs[:] = [j for j in jobs if j['id'] != args.adapter]
        jobs.append(dict(id=args.adapter, indices=sorted(values), status='browser-verified', checkedAt=args.verified_at, lastBrowserCheck=args.verified_at, error=None))
        feed['publishedAt'] = dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds').replace('+00:00', 'Z')
        feed['browserSourceCheckAt'] = args.verified_at
        feed['refresh']['failed'] = base_failed + sum(j['status'] not in ('ok', 'browser-verified') for j in jobs)
        feed['refresh']['successful'] = sum(r.get('sync', {}).get('status') == 'ok' for r in rows.values())
        feed = finalize(feed, previous, 'browser-verified-publisher-refresh')
        # Both candidates are fully validated before replacing either accepted
        # file. A Git commit publishes the two files as one repository revision.
        atomic_write(PATH, cache)
        atomic_write(feed_path, feed)
    print(json.dumps(dict(adapter=args.adapter, verifiedAt=args.verified_at, values=values), indent=2))


if __name__ == '__main__': main()
