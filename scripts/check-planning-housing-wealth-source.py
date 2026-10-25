#!/usr/bin/env python3
"""Check the selected public HTML observations against the shipped model rows."""
import argparse
import json
import re
import subprocess
from html.parser import HTMLParser
from pathlib import Path

class Reader(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []
    def handle_data(self, data):
        self.parts.append(data)

parser = argparse.ArgumentParser()
parser.add_argument('source', type=Path, help='Original official Daily HTML download')
args = parser.parse_args()
reader = Reader()
reader.feed(args.source.read_text())
text = re.sub(r'\s+', ' ', ' '.join(reader.parts))
assert 'Survey of Financial Security, 2023' in text
assert '2024-10-29' in text
assert 'Dollar estimates are expressed in 2023 constant dollars' in text
assert 'major income earner was 55 to 64 years of age' in text
assert 'younger families who owned their principal residence increased by $142,800 from 2019 to $457,100 in 2023' in text
assert 'younger families without a principal residence increased by $26,700 from 2019 to $44,000 in 2023' in text
assert 'those who rented and who did not have an employer-sponsored pension plan had a median net worth of $11,900' in text
assert 'did not have an employer-sponsored pension plan had a median net worth of $914,000' in text
assert 'did not own their principal residence, had a median net worth of $359,000' in text
assert 'had a median net worth of $1.4 million in 2023' in text
script = "import {wealthSource} from './src/planning-wealth-flex-models.js'; console.log(JSON.stringify(wealthSource));"
rows = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', script], text=True))
assert [r['value'] for r in rows['younger']] == [457100, 44000]
assert [r['value'] for r in rows['older']] == [1400000, 914000, 359000, 11900]
assert rows['released'] == '2024-10-29' and rows['period'] == '2023'
print('Verified six published medians, group context, constant-dollar units and release date.')
