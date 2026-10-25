"""Verify the fixed public 2026 CCB schedule and base-year mapping against its original page."""
import datetime
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import subprocess

ROOT=Path(__file__).resolve().parents[1]
DATA=json.loads(subprocess.check_output(['node','--input-type=module','-e',
    "import {ccbCalendarSource as d} from './src/planning-loan-family-data.js';console.log(JSON.stringify(d))"],cwd=ROOT,text=True))
source=ROOT/'qa/ccb-2026-payment-source.html'
assert hashlib.sha256(source.read_bytes()).hexdigest()==DATA['sourceSha256']


class Page(HTMLParser):
    def __init__(self):
        super().__init__();self.parts=[];self.rows=[];self.row=None;self.cell=None

    def handle_starttag(self,tag,attrs):
        if tag=='tr': self.row=[]
        if tag in ['td','th'] and self.row is not None: self.cell=[]

    def handle_data(self,data):
        self.parts.append(data)
        if self.cell is not None: self.cell.append(data)

    def handle_endtag(self,tag):
        if tag in ['td','th'] and self.cell is not None:
            self.row.append(' '.join(' '.join(self.cell).split()));self.cell=None
        if tag=='tr' and self.row is not None: self.rows.append(self.row);self.row=None


page=Page();page.feed(source.read_text());text=' '.join(' '.join(page.parts).split())
pattern=r'\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+2026\b'
def dates(text):
    return [datetime.datetime.strptime(s,'%B %d, %Y').date().isoformat() for s in re.findall(pattern,text)]

all_dates=dates(text)
assert all_dates[:12]==DATA['dates'] and set(all_dates)==set(DATA['dates'])
for year,expected in [(2024,DATA['dates'][:6]),(2025,DATA['dates'][6:])]:
    rows=[r for r in page.rows if len(r)==2 and r[0]==str(year)]
    assert len(rows)==1 and dates(rows[0][1])==expected,(year,rows)
assert DATA['baseTaxYears']==[2024]*6+[2025]*6
for phrase in ['recalculated every July','begins in July and ends in June','less than $240','one lump sum payment','2026-10-22']:
    assert phrase in text,phrase
print('PASS: all twelve 2026 scheduled dates, both six-date base-year mappings, July period context, lump-sum exception and original source hash.')
