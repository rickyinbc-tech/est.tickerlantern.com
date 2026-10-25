"""Verify six retained public figures against the reviewed original HTML bytes."""
from pathlib import Path
from html.parser import HTMLParser
import hashlib,json,re,subprocess,sys
if len(sys.argv)!=2:raise SystemExit('Usage: python3 scripts/check-planning-commute-cash-source.py <original-release.html>')
source=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {commuteSnapshot} from './src/planning-commute-cash-data.js';console.log(JSON.stringify(commuteSnapshot))"],text=True))
raw=Path(sys.argv[1]).read_bytes()
assert hashlib.sha256(raw).hexdigest()==source['sourceSha256'],'Source bytes changed; review the original before updating the extract.'
class Paragraphs(HTMLParser):
 def __init__(self):super().__init__();self.paragraphs=[];self.active=False;self.parts=[]
 def handle_starttag(self,tag,attrs):
  if tag=='p':self.active=True;self.parts=[]
 def handle_data(self,data):
  if self.active:self.parts.append(data)
 def handle_endtag(self,tag):
  if tag=='p' and self.active:self.paragraphs.append(' '.join(''.join(self.parts).split()));self.active=False
parser=Paragraphs();parser.feed(raw.decode('utf-8'))
def paragraph(phrase):
 matches=[p for p in parser.paragraphs if phrase in p];assert len(matches)==1,(phrase,len(matches));return matches[0]
car=paragraph('four in five commuters')
public=paragraph('11.9% of commuters primarily took public transit')
active=paragraph('Active transit was the main mode of commuting')
duration=paragraph('Average commute times varied notably depending on the commuting method')
shares=[float(re.search(r'(\d+(?:\.\d+)?)%',p)[1]) for p in [car,public]]
shares.append(float(re.search(r'Active transit was the main mode of commuting for\s*(\d+(?:\.\d+)?)%',active)[1]))
minutes=list(map(float,re.findall(r'(\d+\.\d+)\s*minutes',duration)))
assert len(minutes)==3,minutes
assert shares==[r['share'] for r in source['rows']],shares
assert [minutes[1],minutes[0],minutes[2]]==[r['minutes'] for r in source['rows']],minutes
assert source['reference']=='May 2025' and source['released']=='2025-08-26'
print(json.dumps({'verifiedCells':6,'reference':source['reference'],'released':source['released'],'sha256':source['sourceSha256'],'shares':shares,'meanMinutes':[minutes[1],minutes[0],minutes[2]]},indent=2))
