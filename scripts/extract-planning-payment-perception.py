#!/usr/bin/env python3
"""Validate a bounded extract of public CSCE perceived-payment-risk observations."""
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

p=argparse.ArgumentParser();p.add_argument('survey',type=Path);p.add_argument('data',type=Path);p.add_argument('report',type=Path);p.add_argument('--check',action='store_true');a=p.parse_args()
html=a.survey.read_bytes();raw=a.data.read_bytes();report=a.report.read_bytes();data=json.loads(raw)
charts=[json.loads(x) for x in re.findall(r'AmCharts\.wpChartData = (\{[^\n]+\});',html.decode())]
chart=[c for c in charts if c.get('group')=='CES_C14_DEMOGRAPHICS'];assert len(chart)==1
assert chart[0]['charttitle']=='Chart 7: Probability of missing debt payment' and chart[0]['leftaxisunit']=='%'
assert 'next 3 months' in chart[0]['subtitle'] and 'minimum required payments' in chart[0]['subtitle']
key='CES_C14_MISS_DEBT';detail=data['seriesDetail'][key]
assert detail['label']=='Probability of missing a debt payment' and detail['dateFormat']=='quarterly' and detail['dimension']['key']=='d'
assert data['groupDetail']['label']=='Probability of missing debt payment'
parser=Text();parser.feed(report.decode());plain=' '.join(' '.join(parser.parts).split())
assert 'October 19, 2026' in plain and 'online panel from August 5 to 27, 2026' in plain and 'August 24 to September 4, 2026' in plain
dates=['2025-07-01','2025-10-01','2026-01-01','2026-04-01','2026-07-01']
assert [r['d'] for r in data['observations']]==dates,'Missing, duplicated or unexpected quarterly grain'
rows=[]
for r in data['observations']:
 v=float(r[key]['v']);assert math.isfinite(v) and 0<=v<=100
 year,month,day=map(int,r['d'].split('-'));assert day==1 and month in [1,4,7,10]
 rows.append({'dateKey':r['d'],'quarter':f'{year} Q{(month-1)//3+1}','value':v})
result={'surveyUrl':'https://www.bankofcanada.ca/publications/canadian-survey-of-consumer-expectations/canadian-survey-of-consumer-expectations-survey-data/','dataUrl':'https://www.bankofcanada.ca/valet/observations/group/CES_C14_DEMOGRAPHICS/json?start_date=2025-07-01&end_date=2026-09-30','reportUrl':'https://www.bankofcanada.ca/2026/10/canadian-survey-of-consumer-expectations-third-quarter-of-2026/','methodologyUrl':'https://www.bankofcanada.ca/wp-content/uploads/2025/07/sdp2025-11.pdf#page=20','methodologyLocation':'Table A-1, printed page 17; PDF page 20, visually inspected 25 October 2026','methodologyPdfSha256':'c11f0954cf9a0aaf58ea0c973b207555a116fd56049550751fdedb64a9178054','statistic':'Interpolated median of respondents’ self-assessed probabilities; raw probability, without the inversion used in the composite index','series':key,'questionHorizon':'Next three months','sourceUnits':'Percent, not fractions','referenceQuarter':'2026 Q3','releaseDate':'2026-10-19','onlineCollection':['2026-08-05','2026-08-27'],'followUpInterviews':['2026-08-24','2026-09-04'],'retrieved':'2026-10-25','dateKeyMeaning':'Quarter-start index key, not interview or publication date','surveyHtmlSha256':hashlib.sha256(html).hexdigest(),'dataJsonSha256':hashlib.sha256(raw).hexdigest(),'reportHtmlSha256':hashlib.sha256(report).hexdigest(),'rows':rows}
output='// Bounded extract of public Bank of Canada CSCE observations; no respondent records.\nexport const paymentPerceptionSource = '+json.dumps(result,ensure_ascii=False,indent=2)+';\n'
target=Path('src/planning-payment-perception-data.js')
if a.check:assert target.read_text()==output,'Stored extract differs from source snapshots'
else:target.write_text(output)
print('Verified five unique consecutive quarter keys, overall-series label and percent units, complete finite values, collection/release dates and source hashes.')
