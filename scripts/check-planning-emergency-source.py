"""Verify the bundled public SHED extract against locally downloaded original pages."""
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads(subprocess.check_output(['node', '--input-type=module', '-e',
    "import {emergencySurveyData as d} from './src/planning-emergency-recovery-data.js';console.log(JSON.stringify(d))"], cwd=ROOT, text=True))


class Source(HTMLParser):
    def __init__(self):
        super().__init__()
        self.text = []
        self.rows = []
        self.row = None
        self.cell = None

    def handle_starttag(self, tag, attrs):
        if tag == 'tr':
            self.row = []
        if tag in ['td', 'th'] and self.row is not None:
            self.cell = []

    def handle_data(self, data):
        self.text.append(data)
        if self.cell is not None:
            self.cell.append(data)

    def handle_endtag(self, tag):
        if tag in ['td', 'th'] and self.cell is not None:
            self.row.append(' '.join(' '.join(self.cell).split()))
            self.cell = None
        if tag == 'tr' and self.row is not None:
            self.rows.append(self.row)
            self.row = None


paths = [Path(x) for x in sys.argv[1:]] or [ROOT / 'qa/shed-2025-savings-source.html', ROOT / 'qa/shed-2025-method-source.html']
assert len(paths) == 2
parsed = []
for file, key in zip(paths, ['savingsSourceSha256', 'methodSourceSha256']):
    assert hashlib.sha256(file.read_bytes()).hexdigest() == DATA[key], file
    parser = Source()
    parser.feed(file.read_text())
    parsed.append(parser)
for record in DATA['savingsOnly']:
    matching = [r for r in parsed[0].rows if len(r) == 2 and r[0] == record['sourceLabel']]
    assert len(matching) == 1 and float(matching[0][1]) == record['percent'], record
savings = ' '.join(' '.join(parsed[0].text).split())
method = ' '.join(' '.join(parsed[1].text).split())
assert '63 percent of all adults' in savings and DATA['wouldPay400CashEquivalent'] == 63
assert 'Seventy percent of adults' in savings and DATA['couldPay500Savings'] == 70
assert 'Note: Among all adults.' in savings
for phrase in ['October 17 through October 28, 2025', '12,934 respondents', 'civilian population age 18 and older', 'post-stratification weights', 'June 10, 2026']:
    assert phrase in method, phrase
print('PASS: six original savings bands, two question-specific indicators, population/field dates, final sample, weighting and both source hashes.')
