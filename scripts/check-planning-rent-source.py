"""Check the selected rent observations against the original public HTML table."""
from html.parser import HTMLParser
from pathlib import Path
import hashlib
import json
import subprocess
import sys


class Rows(HTMLParser):
    def __init__(self):
        super().__init__()
        self.table=False
        self.cell=False
        self.text=''
        self.row=[]
        self.rows=[]

    def handle_starttag(self,tag,attrs):
        if tag=='table': self.table=True
        if self.table and tag=='tr': self.row=[]
        if self.table and tag in ('td','th'): self.cell=True; self.text=''

    def handle_data(self,text):
        if self.cell: self.text+=text

    def handle_endtag(self,tag):
        if self.table and tag in ('td','th'):
            self.row.append(' '.join(self.text.split()))
            self.cell=False
        if self.table and tag=='tr': self.rows.append(self.row)
        if tag=='table': self.table=False


raw=Path(sys.argv[1]).read_bytes()
parser=Rows(); parser.feed(raw.decode('utf-8'))
header=parser.rows[0]
assert header[-2:]==['Asking rent','Paid rent'],header
assert '2026' in raw.decode() and 'second quarter' in raw.decode()
root=Path(__file__).resolve().parents[1]
data=json.loads(subprocess.check_output(['node','--input-type=module','-e',
    "import {rentComparisonSource} from './src/planning-access-rent-data.js';console.log(JSON.stringify(rentComparisonSource));"],cwd=root,text=True))
by_name={r[0]:r for r in parser.rows[1:] if len(r)==3}
assert len(by_name)==len([r for r in parser.rows[1:] if len(r)==3]),'Duplicate geography'
for row in data['rows']:
    observed=by_name[row['label']]
    assert observed[1]!='..' and observed[2]!='..','Suppressed observations cannot become zero'
    assert [float(v.replace(',','')) for v in observed[1:]]==[row['asking'],row['paid']],row['label']
print(json.dumps({'observations':len(data['rows'])*2,'period':data['period'],'source':data['url'],'sha256':hashlib.sha256(raw).hexdigest()}))
