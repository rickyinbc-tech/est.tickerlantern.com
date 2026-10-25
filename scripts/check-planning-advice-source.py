#!/usr/bin/env python3
"""Check the eight attributed FCAC observations against saved public HTML."""
from html.parser import HTMLParser
from pathlib import Path
import hashlib,json,re,subprocess,sys

class Text(HTMLParser):
    def __init__(self):super().__init__();self.parts=[]
    def handle_data(self,value):self.parts.append(value)

source=Path(sys.argv[1]);raw=source.read_bytes();parser=Text();parser.feed(raw.decode())
text=re.sub(r'\s+',' ',' '.join(parser.parts))
patterns=[
    r'friends or family members\s*\((\d+)%\)',
    r'banks, investment companies or insurance providers\s*\((\d+)%\)',
    r'professional financial advisors or planners\s*\((\d+)%\)',
    r'online sources other than social media\s*\((\d+)%\)',
    r'(\d+)% of respondents cited print media, radio or television',
    r'Nearly 1 out of 10 people\s*\((\d+)%\)\s*said they got financial advice from social media',
    r'Only (\d+)% of those surveyed reported seeking advice from social associations or community organizations',
    r'credit counselling agencies at\s*(\d+)%'
]
root=Path(__file__).resolve().parent.parent
data=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {adviceSource} from './src/planning-advice-cost-data.js';console.log(JSON.stringify(adviceSource));"],cwd=root,text=True))
assert len(data['rows'])==len(patterns)==8
for row,pattern in zip(data['rows'],patterns):
    match=re.search(pattern,text)
    assert match,pattern
    assert abs(float(match.group(1))/100-row['value'])<1e-12,row
assert data['released'] in text,'Publication date missing'
assert 'February and March 2024' in text and 'nearly 8,000' in text,'Survey context missing'
print(json.dumps({'status':'verified','source_url':data['url'],'observations':8,'period':data['period'],'released':data['released'],'sha256':hashlib.sha256(raw).hexdigest()},indent=2))
