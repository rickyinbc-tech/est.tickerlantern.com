"""Verify the small published BCPI extract against a saved original release HTML."""
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import subprocess
import sys

class Text(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts=[]
    def handle_data(self,data):
        self.parts.append(data)

source=Path(sys.argv[1]) if len(sys.argv)>1 else Path('qa/construction-sources/release.html')
parser=Text();parser.feed(source.read_text())
text=re.sub(r'\s+','',' '.join(parser.parts))
data=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {constructionQuoteSource as s} from './src/planning-construction-quote-data.js';console.log(JSON.stringify(s));"],text=True))
assert 'Released:2026-07-24' in text
assert 'Residentialbuildingconstructioncostsincreased0.5%inthesecondquarter' in text
for label,value in [('Québec',2.6),('Montréal',2.5),('Halifax',2.1),('Calgary',-.1),('Vancouver',-.2),('Toronto',-.8)]:
    row=next(r for r in data['rows'] if r['label']==label)
    assert abs(row['value']-value/100)<1e-12
    number=('+' if value>0 else '')+str(value)+'%'
    assert label+'('+number+')' in text,(label,number)
assert len(data['rows'])==7 and data['rows'][0]['value']==.005
print(json.dumps({'verified_observations':7,'released':data['released'],'source_sha256':hashlib.sha256(source.read_bytes()).hexdigest()}))
