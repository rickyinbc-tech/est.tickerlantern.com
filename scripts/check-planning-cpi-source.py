"""Verify the published extract against the saved original accessible HTML table."""
import hashlib
import json
from pathlib import Path
import subprocess
import sys
from html.parser import HTMLParser


class TableReader(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_table = False
        self.in_cell = False
        self.rows = []
        self.row = []
        self.cell = ''

    def handle_starttag(self, tag, attrs):
        if tag == 'table':
            self.in_table = True
        if self.in_table and tag == 'tr':
            self.row = []
        if self.in_table and tag in ('th', 'td'):
            self.in_cell = True
            self.cell = ''

    def handle_data(self, data):
        if self.in_cell:
            self.cell += data

    def handle_endtag(self, tag):
        if self.in_table and tag in ('th', 'td'):
            self.row.append(' '.join(self.cell.split()))
            self.in_cell = False
        if self.in_table and tag == 'tr':
            self.rows.append(self.row)
        if tag == 'table':
            self.in_table = False


source = Path(sys.argv[1])
raw = source.read_bytes()
reader = TableReader()
reader.feed(raw.decode('utf-8'))
assert reader.rows[0] == ['', '2024', '2025'], 'Wrong period columns'
assert len(reader.rows) == 10, 'Missing or duplicated categories'
actual = {r[0]: float(r[2]) for r in reader.rows[1:]}
assert len(actual) == 9, 'Duplicate source categories'
root = Path(__file__).resolve().parents[1]
snapshot = json.loads(subprocess.check_output(
    ['node', '--input-type=module', '-e',
     "import {cpi2025} from './src/planning-budget-exposure-data.js'; console.log(JSON.stringify(cpi2025));"],
    cwd=root, text=True))
expected = {'All-items Consumer Price Index': snapshot['headline'],
            **{r['label']: r['rate'] for r in snapshot['rows']}}
assert actual == expected, f'Source mismatch: {actual!r}'
assert snapshot['geography'] == 'Canada' and snapshot['released'] == '2026-01-19'
print(json.dumps({'verified_observations': len(actual), 'period': snapshot['period'],
                  'source_url': snapshot['url'], 'sha256': hashlib.sha256(raw).hexdigest()}))
