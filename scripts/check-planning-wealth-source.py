"""Reconcile the small public SFS extract against saved official HTML tables."""
import argparse
import hashlib
import json
from html.parser import HTMLParser
from pathlib import Path
import re
import subprocess


class Tables(HTMLParser):
    def __init__(self):
        super().__init__()
        self.rows, self.row, self.cell = [], None, None

    def handle_starttag(self, tag, attrs):
        if tag == 'tr':
            self.row = []
        if tag in ('td', 'th') and self.row is not None:
            self.cell = []

    def handle_data(self, value):
        if self.cell is not None:
            self.cell.append(value)

    def handle_endtag(self, tag):
        if tag in ('td', 'th') and self.cell is not None:
            self.row.append(' '.join(''.join(self.cell).split()))
            self.cell = None
        if tag == 'tr' and self.row is not None:
            self.rows.append(self.row)
            self.row = None


def read_tables(path):
    raw = path.read_bytes()
    parser = Tables()
    parser.feed(raw.decode('utf-8'))
    return parser.rows, hashlib.sha256(raw).hexdigest()


def amount(value):
    assert re.fullmatch(r'\$?[0-9,]+', value), value
    return int(value.replace('$', '').replace(',', ''))


def main():
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument('table', type=Path, help='Saved official t001a-eng.htm')
    cli.add_argument('infographic', type=Path, help='Saved official 11-627-m2024047-eng.htm')
    args = cli.parse_args()
    root = Path(__file__).resolve().parents[1]
    snapshot = json.loads(subprocess.check_output(
        ['node', '--input-type=module', '-e',
         "import {wealthSource} from './src/planning-wealth-data.js'; console.log(JSON.stringify(wealthSource));"], cwd=root))
    rows, table_hash = read_tables(args.table)
    header = next(row for row in rows if any('2019 - Median net worth' in cell for cell in row))
    assert header[-2:] == ['2019 - Median net worth', '2023 - Median net worth']
    for record in snapshot['ages']:
        label = 'under 35' if record['label'] == 'Under 35' else record['label']
        matches = [row for row in rows if row and row[0] == label]
        assert len(matches) == 1, label
        assert [amount(value) for value in matches[0][-2:]] == [record['before'], record['after']], label
    national = next(row for row in rows if row and row[0] == 'Economic families and persons not in an economic family')
    assert amount(national[-1]) == snapshot['national']
    province_rows, infographic_hash = read_tables(args.infographic)
    for record in snapshot['provinces']:
        matches = [row for row in province_rows if row and row[0] == record['label']]
        assert len(matches) == 1 and len(matches[0]) == 2, record['label']
        assert amount(matches[0][-1]) == record['value'], record['label']
        # Independent public release-table cross-check of the same 2023 median.
        source = next(row for row in rows if row and row[0] == record['label'])
        assert amount(source[-1]) == record['value']
    text = args.table.read_text()
    assert '2023 dollars' in text and '2024-10-29' in text
    assert len(snapshot['ages']) == 5 and len(snapshot['provinces']) == 10
    print(json.dumps({'status': 'verified', 'age_period_cells': 10, 'province_cells': 10,
                      'national_cell': 1, 'table_sha256': table_hash,
                      'infographic_sha256': infographic_hash}, indent=2))


if __name__ == '__main__':
    main()
