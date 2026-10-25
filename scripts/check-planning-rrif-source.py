#!/usr/bin/env python3
"""Validate ordinary RRIF factors against saved public CRA and Justice HTML."""
import hashlib,json,pathlib,subprocess,sys
from html.parser import HTMLParser

class Tables(HTMLParser):
    def __init__(self):
        super().__init__();self.tables=[];self.table=None;self.row=None;self.cell=None
    def handle_starttag(self,tag,attrs):
        if tag=='table':self.table=[]
        if tag=='tr' and self.table is not None:self.row=[]
        if tag in ('td','th') and self.row is not None:self.cell=[]
    def handle_data(self,data):
        if self.cell is not None:self.cell.append(data)
    def handle_endtag(self,tag):
        if tag in ('td','th') and self.cell is not None:
            self.row.append(' '.join(' '.join(self.cell).split()));self.cell=None
        if tag=='tr' and self.row is not None:self.table.append(self.row);self.row=None
        if tag=='table' and self.table is not None:self.tables.append(self.table);self.table=None

assert len(sys.argv)==3,'Usage: python3 scripts/check-planning-rrif-source.py CRA_HTML JUSTICE_HTML'
rules=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {rrifRules as r} from './src/planning-priorities-models.js';console.log(JSON.stringify(r))"],text=True))
reports=[]
for index,filename in enumerate(sys.argv[1:]):
    path=pathlib.Path(filename);raw=path.read_bytes();p=Tables();p.feed(raw.decode('utf-8-sig'))
    candidates=[t for t in p.tables if any(r and r[0]=='71' for r in t)]
    assert candidates,'No RRIF age table found'
    table=candidates[-1]  # Justice: subsection (4), after the legacy table.
    rows=[r for r in table if r and (r[0].isdigit() and 71<=int(r[0])<=94 or r[0]=='95 or older')]
    assert len(rows)==25,(filename,len(rows))
    factors=[float(r[-1]) for r in rows]
    assert factors==rules['factors'],(filename,factors)
    assert [r[0] for r in rows]==[str(a) for a in range(71,95)]+['95 or older']
    if index==1:
        formula=[r[-1] for r in table if r and r[0]=='Under 71'];assert len(formula)==1
        assert formula[0].replace(' ','').replace('–','-').replace('−','-')=='1/(90-Y)',formula
    reports.append({'source_url':rules['url'] if index==0 else rules['regulation'],'retrieved':rules['reviewed'],'sha256':hashlib.sha256(raw).hexdigest(),'factor_column':'All other RRIFs / subsection 7308(4)','ages_71_through_95':factors})
print(json.dumps(reports,indent=2))
