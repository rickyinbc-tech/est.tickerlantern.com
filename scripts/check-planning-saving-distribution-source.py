"""Check annual net-saving observations against the original public HTML table."""
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
assert header[-5:]==['2021','2022','2023','2024','2025'],header
root=Path(__file__).resolve().parents[1]
data=json.loads(subprocess.check_output(['node','--input-type=module','-e',
    "import {savingDistributionSource as s} from './src/planning-saving-distribution-data.js';console.log(JSON.stringify(s));"],cwd=root,text=True))
by_name={r[0]:r for r in parser.rows[1:] if len(r)==6}
assert len(by_name)==5
for group in data['groups']:
    observed=by_name[group['label']]
    values=[int(v.replace(' ','').replace(',','').replace('−','-')) for v in observed[1:]]
    assert values==group['values'],(group['label'],values)
assert '2026-04-13' in raw.decode() and '3610058701' in raw.decode()
print(json.dumps({'observations':25,'period':data['period'],'source':data['url'],'sha256':hashlib.sha256(raw).hexdigest()}))
