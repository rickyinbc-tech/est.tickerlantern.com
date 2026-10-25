#!/usr/bin/env python3
"""Validate the small public Chart 1 extract against a saved official HTML page."""
import hashlib,json,pathlib,subprocess,sys
from html.parser import HTMLParser

class Rows(HTMLParser):
    def __init__(self):
        super().__init__();self.rows=[];self.row=None;self.cell=None
    def handle_starttag(self,tag,attrs):
        if tag=='tr':self.row=[]
        if tag in ('td','th') and self.row is not None:self.cell=[]
    def handle_data(self,data):
        if self.cell is not None:self.cell.append(data)
    def handle_endtag(self,tag):
        if tag in ('td','th') and self.cell is not None:
            self.row.append(' '.join(' '.join(self.cell).split()));self.cell=None
        if tag=='tr' and self.row is not None:self.rows.append(self.row);self.row=None

source=pathlib.Path(sys.argv[1]);raw=source.read_bytes();parser=Rows();parser.feed(raw.decode('utf-8-sig'))
data=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {caregivingSource as s} from './src/planning-care-data.js';console.log(JSON.stringify(s))"],text=True))
labels={'No unpaid care':'No unpaid care','Adult care only':'Adult care','Child care only':'Child care','Both adult and child care':'Sandwich care'}
found=[]
for row in data['rows']:
    candidates=[r for r in parser.rows if len(r)==4 and r[0]==labels[row['label']]]
    assert len(candidates)==1,(row['label'],candidates)
    values=list(map(float,candidates[0][1:]));assert values==[row['percent'],row['lower'],row['upper']],values
    assert 0<=row['lower']<=row['percent']<=row['upper']<=100
    found.append({'source_label':candidates[0][0],'percent':values[0],'ci95':values[1:]})
assert abs(sum(r['percent'] for r in data['rows'])-100)<1e-9
report={'source_url':data['url'],'source_period':data['period'],'released':data['released'],'retrieved':data['reviewed'],'sha256':hashlib.sha256(raw).hexdigest(),'rows':found,'scope':data['scope']}
print(json.dumps(report,indent=2))
