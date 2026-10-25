"""Verify selected published CMHC table cells against an original saved HTML file."""
from pathlib import Path
from html.parser import HTMLParser
import subprocess,json,hashlib,sys
class Rows(HTMLParser):
 def __init__(self):super().__init__();self.rows=[];self.row=None;self.cell=None
 def handle_starttag(self,tag,attrs):
  if tag=='tr':self.row=[]
  if tag in ('td','th') and self.row is not None:self.cell=[]
 def handle_data(self,data):
  if self.cell is not None:self.cell.append(data)
 def handle_endtag(self,tag):
  if tag in ('td','th') and self.cell is not None:
   self.row.append(' '.join(''.join(self.cell).split()));self.cell=None
  if tag=='tr' and self.row is not None:self.rows.append(self.row);self.row=None
def main():
 path=Path(sys.argv[1]);raw=path.read_bytes();parser=Rows();parser.feed(raw.decode('utf-8'))
 data=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {premiumSchedule} from './src/planning-premium-financing-data.js';console.log(JSON.stringify(premiumSchedule))"],text=True))
 assert ['Loan-to-Value','Premium on Total Loan','Premium on Increase to Loan Amount for Portability'] in parser.rows,'Expected CMHC column headers not found'
 for row in data['rows']:
  matches=[r for r in parser.rows if r and r[0]==row['label']];assert len(matches)==1,(row,matches)
  assert matches[0][1]==f"{row['value']*100:.2f}%",(row,matches)
 print(json.dumps({'source':data['url'],'reviewed':data['reviewed'],'sourceSha256':hashlib.sha256(raw).hexdigest(),'verifiedRows':data['rows']},indent=2))
if __name__=='__main__':main()
