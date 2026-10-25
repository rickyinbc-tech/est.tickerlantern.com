"""Check original public HTML snapshots against the bundled spending and utility facts."""
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import subprocess

ROOT=Path(__file__).resolve().parents[1]
DATA=json.loads(subprocess.check_output(['node','--input-type=module','-e',
    "import {spendingQuintileData as spending,utilityPaymentSource as utility} from './src/planning-spending-utility-data.js';console.log(JSON.stringify({spending,utility}))"],cwd=ROOT,text=True))


class Source(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts=[]
        self.paragraphs=[]
        self.current=None

    def handle_starttag(self,tag,attrs):
        if tag=='p': self.current=[]

    def handle_data(self,data):
        self.parts.append(data)
        if self.current is not None: self.current.append(data)

    def handle_endtag(self,tag):
        if tag=='p' and self.current is not None:
            self.paragraphs.append(' '.join(' '.join(self.current).split()))
            self.current=None


parsed={}
for key,filename in [('spending','shs-2023-release.html'),('utility','utility-payment-source.html')]:
    p=ROOT/'qa'/filename
    assert hashlib.sha256(p.read_bytes()).hexdigest()==DATA[key]['sourceSha256'],filename
    parser=Source();parser.feed(p.read_text());parsed[key]=parser
text=' '.join(' '.join(parsed['spending'].parts).split())
shares=text.split('Households at different income levels',1)[1].split('In contrast, households',1)[0]
values=list(map(float,re.findall(r'(\d+\.\d+)%',shares)))
assert values==[34.8,17.9,32.2,14.6],values
transport=text.split('In contrast, households in the highest income quintile',1)[1].split('Infographic 1',1)[0]
transport_values=list(map(float,re.findall(r'(\d+\.\d+)%',transport)))
assert transport_values[0]==15.9 and transport_values[3]==13.3,transport_values
assert [(r['lowest'],r['highest']) for r in DATA['spending']['shares']]==[(values[0],values[2]),(values[1],values[3]),(transport_values[3],transport_values[0])]
levels=next(p for p in parsed['spending'].paragraphs if '$123,447' in p and '$40,080' in p)
assert [r['value'] for r in DATA['spending']['annualConsumption']]==[40080,123447]
assert 'highest income quintile' in levels and 'bottom quintile' in levels
text=' '.join(' '.join(parsed['spending'].parts).split())
for phrase in ['2025-05-21','Canada-level estimates include the provinces only.','current dollars (not adjusted for inflation)','Average spending includes sales taxes.']:
    assert phrase in text,phrase
utility=' '.join(' '.join(parsed['utility'].parts).split())
for phrase in ['previous 12 months','every four months','In month 12','last 11 months','credit for the difference',"billed for the difference",'Electric Tariff shall prevail']:
    assert phrase in utility,phrase
print('PASS: six quintile shares, two annual means, release scope/units, utility review/settlement context and both original-source hashes.')
