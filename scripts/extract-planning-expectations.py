#!/usr/bin/env python3
"""Create a bounded, date-labelled extract of published CSCE interpolated medians."""
import argparse
import hashlib
from html.parser import HTMLParser
import json
import math
from pathlib import Path
import re

class Text(HTMLParser):
 def __init__(self):super().__init__();self.parts=[];self.skip=0
 def handle_starttag(self,t,a):
  if t in ['script','style']:self.skip+=1
 def handle_endtag(self,t):
  if t in ['script','style']:self.skip-=1
 def handle_data(self,s):
  if not self.skip:self.parts.append(s)

p=argparse.ArgumentParser();p.add_argument('html',type=Path);p.add_argument('json',type=Path);p.add_argument('--check',action='store_true');a=p.parse_args()
htmlBytes=a.html.read_bytes();jsonBytes=a.json.read_bytes();html=htmlBytes.decode();data=json.loads(jsonBytes)
parser=Text();parser.feed(html);plain=' '.join(' '.join(parser.parts).split())
assert 'October 19, 2026' in plain and 'online panel from August 5 to 27, 2026' in plain
assert 'August 24 to September 4, 2026' in plain
charts=[json.loads(x) for x in re.findall(r'AmCharts\.wpChartData = (\{[^\n]+\});',html)]
charts=[c for c in charts if c.get('group')=='CSCE_2026Q3_C1'];assert len(charts)==1
assert charts[0]['leftaxisunit']=='%' and '(Interpolated median)' in charts[0]['subtitle']
assert '(Interpolated median)' in data['groupDetail']['description']
keys={'CES_C1_PERCEPTIONS':'Perceptions about current inflation','CES_C1_SHORT_TERM':'1-year-ahead inflation expectations','CES_C1_MID_TERM':'2-year-ahead inflation expectations','CES_C1_LONG_TERM':'5-year-ahead inflation expectations'}
assert set(data['seriesDetail'])==set(keys)
for key,label in keys.items():
 detail=data['seriesDetail'][key];assert detail['label']==label and detail['dateFormat']=='quarterly' and detail['dimension']['key']=='d'
expected=['2024-10-01','2025-01-01','2025-04-01','2025-07-01','2025-10-01','2026-01-01','2026-04-01','2026-07-01']
assert [r['d'] for r in data['observations']]==expected,'Unexpected grain, missing/duplicate quarter, order or window'
rows=[]
for record in data['observations']:
 assert set(record)=={'d',*keys}
 date=record['d'];year,month,day=map(int,date.split('-'));assert day==1 and month in [1,4,7,10]
 row={'dateKey':date,'quarter':f'{year} Q{(month-1)//3+1}'}
 for key in keys:
  value=float(record[key]['v']);assert math.isfinite(value) and -20<=value<=100
  row[key]=value
 rows.append(row)
result={'reportUrl':'https://www.bankofcanada.ca/2026/10/canadian-survey-of-consumer-expectations-third-quarter-of-2026/','dataUrl':'https://www.bankofcanada.ca/valet/observations/group/CSCE_2026Q3_C1/json?start_date=2024-10-01&end_date=2026-09-30','reportGroup':'CSCE_2026Q3_C1','releaseDate':'2026-10-19','referenceQuarter':'2026 Q3','onlineCollection':['2026-08-05','2026-08-27'],'followUpInterviews':['2026-08-24','2026-09-04'],'retrieved':'2026-10-25','statistic':'Interpolated median','sourceUnits':'Percent, not fractions','dateKeyMeaning':'Quarter-start index key, not an interview or release date','htmlSha256':hashlib.sha256(htmlBytes).hexdigest(),'jsonSha256':hashlib.sha256(jsonBytes).hexdigest(),'series':keys,'rows':rows}
output='// Generated from public Bank of Canada report metadata and its linked Valet group.\nexport const expectationsSource = '+json.dumps(result,ensure_ascii=False,indent=2)+';\n'
target=Path('src/planning-expectations-data.js')
if a.check:assert target.read_text()==output,'Stored extract differs from original source snapshots'
else:target.write_text(output)
print('Verified 8 unique consecutive quarters × 4 series = 32 complete values; question/statistic/unit metadata, release/collection dates and both source hashes.')
