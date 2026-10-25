"""Check the exact 44-value rent-quartile slice against CMHC's public HTML table."""
from html.parser import HTMLParser
from pathlib import Path
import hashlib
import json
import subprocess
import sys

class Tables(HTMLParser):
    def __init__(self):
        super().__init__();self.tables=[];self.rows=None;self.row=None;self.cell=None
    def handle_starttag(self,tag,attrs):
        if tag=='table':self.rows=[]
        if self.rows is not None and tag=='tr':self.row=[]
        if self.rows is not None and tag in ('th','td'):self.cell=''
    def handle_data(self,s):
        if self.cell is not None:self.cell+=s
    def handle_endtag(self,tag):
        if tag in ('th','td') and self.cell is not None:self.row.append(' '.join(self.cell.split()));self.cell=None
        if tag=='tr' and self.row is not None:self.rows.append(self.row);self.row=None
        if tag=='table' and self.rows is not None:self.tables.append(self.rows);self.rows=None

root=Path(__file__).resolve().parents[1]
source=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {vacancyBandSource} from './src/planning-vacancy-band-data.js';console.log(JSON.stringify(vacancyBandSource));"],cwd=root,text=True))
raw=Path(sys.argv[1]).read_bytes();assert hashlib.sha256(raw).hexdigest()==source['htmlSha256'],'HTML snapshot changed: review its source table before updating.'
parser=Tables();parser.feed(raw.decode('utf-8'))
matches=[t for t in parser.tables if t and t[0]==['Year','Q1','Q2','Q3','Q4']]
assert len(matches)==1,'Rent-quartile table is missing or ambiguous.'
rows=matches[0][1:];assert [int(r[0]) for r in rows]==list(range(2015,2026))==source['years']
assert len({r[0] for r in rows})==11
for i,band in enumerate(source['bands']):
    assert band['sourceLabel']=='Q'+str(i+1)
    assert [float(r[i+1]) for r in rows]==band['values']
    assert all(0<=v<=100 for v in band['values'])
assert len(rows)*4==source['observations']==44
print(json.dumps({'observations':44,'years':source['years'],'grain':'Year × rent quartile in CMHC Figure 2; Q1–Q4 are rent ranks, not quarters','missing_or_duplicate_selected_cells':0,'uncertainty':'HTML figure supplies rounded estimates without standard errors, quality codes or rent cutoffs; none invented.','html_sha256':source['htmlSha256']}))
