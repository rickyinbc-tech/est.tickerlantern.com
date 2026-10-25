"""Extract a small attributed public snapshot; raw files remain under ignored qa/."""
import argparse
import csv
import hashlib
import html.parser
import json
import pathlib
import re

parser=argparse.ArgumentParser()
parser.add_argument('--release',required=True,type=pathlib.Path)
parser.add_argument('--chart',required=True,type=pathlib.Path)
args=parser.parse_args()

class Text(html.parser.HTMLParser):
    def __init__(self):
        super().__init__();self.parts=[]
    def handle_data(self,data):
        self.parts.append(data)

p=Text();p.feed(args.release.read_text())
text=re.sub(r'\s+',' ',' '.join(p.parts))
match=re.search(r'average of \$(\d[\d,]*)\s+per month in\s+2022\s*,\s*to \$(\d[\d,]*)\s+in\s+2023\s+and to \$(\d[\d,]*)\s+in\s+2025',text)
assert match,'National observation sentence changed or is missing'
national=[{'year':year,'value':int(value.replace(',',''))} for year,value in zip([2022,2023,2025],match.groups())]
assert 'Released: 2025-10-21' in text
assert '30 hours or more per week' in text
assert 'Comparisons to 2022 exclude the territories' in text
raw=list(csv.reader(args.chart.read_text(encoding='utf-8-sig').splitlines()))
assert len(raw[0])==1 and 'Monthly mean expenses' in raw[0][0] and 'children aged 0 to 5' in raw[0][0]
assert raw[0][0].endswith(', $'),'Dollar unit is missing or changed'
assert raw[1]==['','2022','2023','2025']
observations=[r for r in raw[2:] if len(r)==4]
expected=['Newfoundland and Labrador','Prince Edward Island','Nova Scotia','New Brunswick','Quebec','Ontario','Manitoba','Saskatchewan','Alberta','British Columbia','Yukon','Northwest Territories','Nunavut']
regions=[]
for row in observations:
    label=re.sub(r'[¹²,]','',row[0])
    assert row[3].isdigit(),row
    value=int(row[3]);assert value>0,row
    regions.append({'label':label,'value':value})
assert [r['label'] for r in regions]==expected,'Region coverage, order or duplicates changed'
assert len({r['label'] for r in regions})==13
assert any('42-10-0053-01' in r[0] for r in raw if r),'Source table identity changed'
assert any('Data were not collected in the three territories in 2022.' in r[0] for r in raw if r)
for row in observations[-3:]:
    assert row[1]=='2','2022 territory cells are footnote markers, never dollar observations'
snapshot={
    'released':'2025-10-21','retrieved':'2026-10-25',
    'url':'https://www150.statcan.gc.ca/n1/daily-quotidien/251021/dq251021c-eng.htm',
    'chartUrl':'https://www150.statcan.gc.ca/n1/daily-quotidien/251021/cg-c001-eng.htm',
    'csvUrl':'https://www150.statcan.gc.ca/n1/daily-quotidien/251021/cg251021c001-eng.csv',
    'table':'42-10-0053-01','unit':'Current CAD per month; parent-reported mean expense',
    'population':'Children aged 0–5 attending full-time centre-based care, 30+ hours per week',
    'comparisonNote':'2022 national comparison excludes territories; 2023 and 2025 include them. Survey sources differ across periods. Regional observations here use 2025 only.',
    'releaseSHA256':hashlib.sha256(args.release.read_bytes()).hexdigest(),
    'chartSHA256':hashlib.sha256(args.chart.read_bytes()).hexdigest(),
    'national':national,'regions':regions
}
output=pathlib.Path('src/planning-childcare-data.js')
output.write_text('// Generated from a dated public Statistics Canada release and its chart CSV.\nexport const childcareSource = '+json.dumps(snapshot,ensure_ascii=False,indent=2)+';\n')
print('Validated 3 national and 13 regional observations; 2022 territory footnotes excluded.')
