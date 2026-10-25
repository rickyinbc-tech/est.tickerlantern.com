"""Verify the fixed public donation-claim extract against both original official HTML tables."""
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import subprocess

ROOT=Path(__file__).resolve().parents[1]
DATA=json.loads(subprocess.check_output(['node','--input-type=module','-e',
    "import {charitableDonationsData as d} from './src/planning-charitable-data.js';console.log(JSON.stringify(d))"],cwd=ROOT,text=True))


class Source(HTMLParser):
    def __init__(self):
        super().__init__();self.rows=[];self.row=None;self.cell=None;self.parts=[];self.skip=0

    def handle_starttag(self,tag,attrs):
        if tag in ['script','style']: self.skip+=1
        if tag=='tr': self.row=[]
        if tag in ['td','th'] and self.row is not None: self.cell=[]

    def handle_data(self,data):
        if not self.skip: self.parts.append(data)
        if self.cell is not None: self.cell.append(data)

    def handle_endtag(self,tag):
        if tag in ['script','style']: self.skip-=1
        if tag in ['td','th'] and self.cell is not None:
            self.row.append(' '.join(' '.join(self.cell).split()));self.cell=None
        if tag=='tr' and self.row is not None: self.rows.append(self.row);self.row=None


sources={}
for name,digest in DATA['sourceHashes'].items():
    file=ROOT/'qa'/name
    assert hashlib.sha256(file.read_bytes()).hexdigest()==digest,name
    parser=Source();parser.feed(file.read_text());sources[name]=parser

province=sources['charitable-donors-2023-province.html'].rows
assert province[0]==['','2022 – Donors','2023 – Donors','2022 – Total Donations','2023 – Total Donations','2022 – Median Donation','2023 – Median Donation']
assert province[1]==['','number','number','thousands of dollars','thousands of dollars','dollars','dollars']


def check_row(record,source_row):
    assert record['label']==source_row[0]
    actual=[int(s.replace(',','')) for s in source_row[1:]]
    expected=[record['2022']['claimants'],record['2023']['claimants'],record['2022']['totalThousandsCAD'],record['2023']['totalThousandsCAD'],record['2022']['medianCAD'],record['2023']['medianCAD']]
    assert actual==expected,(record['label'],actual,expected)


records=[DATA['national'],*DATA['jurisdictions']]
assert len(records)==14 and len({r['label'] for r in records})==14
assert len(province[2:])==14
for row,record in zip(province[2:],records): check_row(record,row)
both=[];section=None
for row in sources['charitable-donors-2023-age.html'].rows[2:]:
    if row[0] in ['Male','Female','Both sexes']: section=row[0];continue
    if section=='Both sexes': both.append(row)
assert len(both)==8 and len(DATA['ages'])==7
assert both[0][0]=='All age groups'
check_row({**DATA['national'],'label':'All age groups'},both[0])
for row,record in zip(both[1:],DATA['ages']): check_row(record,row)
text=' '.join(' '.join(sources['charitable-donors-2023-release.html'].parts).split())
for phrase in ['2025-04-01','preliminary version','official tax receipts','spouse','not captured','winter 2026/2027','do not take inflation into account']:
    assert phrase in text,phrase
print('PASS:126 numerical source cells, both-year units,13jurisdictions,7Both-sex age groups,matching national totals,source scope and3original hashes.')
