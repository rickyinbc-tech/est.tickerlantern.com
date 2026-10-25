"""Check the published four-cycle extract against the original Statistics Canada CSV."""
import csv
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
csv_path = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'qa/housing-2024-table.csv'
release_path = Path(sys.argv[2]) if len(sys.argv) > 2 else ROOT / 'qa/housing-2024-release.html'
data = json.loads((ROOT / 'src/planning-banking-housing-data.js').read_text().split(' = ', 1)[1].removesuffix(';\n'))
assert hashlib.sha256(csv_path.read_bytes()).hexdigest() == data['csvSha256']
assert hashlib.sha256(release_path.read_bytes()).hexdigest() == data['releaseSha256']
rows = list(csv.reader(csv_path.read_text(encoding='utf-8-sig').splitlines()))
assert [int(x.strip()) for x in rows[1][1:]] == data['periods']
assert all(x == '% of households' for x in rows[2][1:])
for record in data['rows']:
    found = [r for r in rows if r and r[0] == record['label']]
    assert len(found) == 1 and len(found[0]) == 5
    assert list(map(float, found[0][1:])) == record['values']
    assert all(0 <= n <= 100 for n in record['values'])
assert len(data['rows']) == 7


class Text(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []

    def handle_data(self, value):
        self.parts.append(value)


parser = Text()
parser.feed(release_path.read_text())
text = ' '.join(' '.join(parser.parts).split())
for phrase in ['total before-tax income', 'October 28, 2024', 'March 31, 2025', '10 provinces', 'provinces only']:
    assert phrase in text, phrase
print('PASS: 28 values, seven unique rows, four periods, percentage units, source hashes and published population/denominator notes.')
