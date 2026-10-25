#!/usr/bin/env python3
"""Validate two public categorical CSCE AI-work panels and retain their provenance."""
import argparse
from html.parser import HTMLParser
import hashlib
import json
import math
from pathlib import Path
import re
p=argparse.ArgumentParser();p.add_argument('report',type=Path);p.add_argument('hours',type=Path);p.add_argument('uses',type=Path);p.add_argument('--check',action='store_true');a=p.parse_args()
raw=a.report.read_bytes();html=raw.decode();charts=[json.loads(s) for s in re.findall(r'AmCharts\.wpChartData = (\{[^\n]+\});',html)]
class Text(HTMLParser):
 def __init__(self):super().__init__();self.parts=[];self.skip=0
 def handle_starttag(self,t,a):
  if t in ['script','style']:self.skip+=1
 def handle_endtag(self,t):
  if t in ['script','style']:self.skip-=1
 def handle_data(self,s):
  if not self.skip:self.parts.append(s)
parser=Text();parser.feed(html);plain=' '.join(' '.join(parser.parts).split())
assert 'October 19, 2026' in plain and 'August 5 to 27, 2026' in plain and 'August 24 to September 4, 2026' in plain
expected=[('CSCE_2026Q3_C1A',a.hours,'Hours per week',['Active time using AI','Additional time needed to complete tasks without AI']),('CSCE_2026Q3_C1B',a.uses,'Share of respondents',['Improve the quality of my tasks','Take on more tasks','Improve work-life balance','Spend more time learning or training others','Do more innovative or creative work'])]
groups=[]
for group,path,label,categories in expected:
 source=path.read_bytes();data=json.loads(source);chart=[c for c in charts if c.get('group')==group];assert len(chart)==1
 series=group+'_S1';assert set(data['seriesDetail'])=={series};detail=data['seriesDetail'][series]
 assert detail['label']==label and detail['dimension']=={'key':'k','name':'Category'}
 assert [r['k'] for r in data['observations']]==categories,'Missing, duplicated, reordered or unexpected category'
 assert all(set(r)=={'k',series} for r in data['observations'])
 subtitle=data['groupDetail']['metadata']['subtitle'];assert subtitle.strip().replace('  ',' ')
 if group.endswith('C1A'):
  assert 'interpolated median' in subtitle and 'midpoint' in chart[0]['note'] and '7.5' in chart[0]['note']
  assert 'midpoint' in data['groupDetail']['metadata']['notes']
 else:assert 'check all that apply' in subtitle and chart[0]['bottomaxisunit']=='%'
 rows=[]
 for r in data['observations']:
  value=float(r[series]['v']);assert math.isfinite(value) and 0<=value<=(168 if group.endswith('C1A') else 100)
  rows.append({'label':r['k'],'value':value,'publishedText':r[series]['v']})
 groups.append({'id':group,'url':'https://www.bankofcanada.ca/valet/observations/group/'+group+'/json','sha256':hashlib.sha256(source).hexdigest(),'title':data['groupDetail']['label'],'seriesId':series,'sourceUnits':label,'dimension':detail['dimension'],'apiDateFormatHint':detail.get('dateFormat'),'questionAndStatistic':subtitle,'notes':data['groupDetail']['metadata'].get('notes',''),'rows':rows})
result={'reportUrl':'https://www.bankofcanada.ca/2026/10/canadian-survey-of-consumer-expectations-third-quarter-of-2026/','reportSha256':hashlib.sha256(raw).hexdigest(),'releaseDate':'2026-10-19','referenceQuarter':'2026 Q3','onlineCollection':['2026-08-05','2026-08-27'],'followUpInterviews':['2026-08-24','2026-09-04'],'retrieved':'2026-10-25','grain':'Categorical panel rows, not daily observations; k is the Category dimension.','groups':groups}
output='// Generated from the public CSCE 2026 Q3 report and its linked categorical AI-work groups.\nexport const aiTimeSource = '+json.dumps(result,ensure_ascii=False,indent=2)+';\n';target=Path('src/planning-ai-time-data.js')
if a.check:assert target.read_text()==output,'Stored extract differs from public source snapshots'
else:target.write_text(output)
print('Verified two categorical panels, seven complete unique category values, exact units/questions/multiple-response wording, estimation note, release/collection dates and three SHA-256 hashes.')
