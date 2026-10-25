#!/usr/bin/env python3
"""Extract one dated CAFC table, preserving source rounding and missing losses."""
import argparse
from decimal import Decimal
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
class Source(HTMLParser):
 def __init__(self):
  super().__init__();self.tables=[];self.table=None;self.row=None;self.cell=None;self.meta={}
 def handle_starttag(self,t,a):
  a=dict(a)
  if t=='meta' and 'name' in a:self.meta[a['name']]=a.get('content','')
  if t=='table':self.table=[]
  if t=='tr':self.row=[]
  if t in ['td','th']:self.cell=[]
 def handle_data(self,d):
  if self.cell is not None:self.cell.append(d)
 def handle_endtag(self,t):
  if t in ['td','th'] and self.cell is not None:
   self.row.append(' '.join(' '.join(self.cell).split()));self.cell=None
  if t=='tr' and self.row is not None:
   if self.table is not None:self.table.append(self.row)
   self.row=None
  if t=='table' and self.table is not None:self.tables.append(self.table);self.table=None

def extract(path):
 raw=path.read_bytes();html=raw.decode();s=Source();s.feed(html)
 assert len(s.tables)==2,'Expected exactly the frequency and dollar-loss tables'
 header=['Fraud type','Reports','Victims','Dollar loss']
 assert all(t[0]==header for t in s.tables)
 assert s.meta['dcterms.issued']=='2026-02-25' and s.meta['dcterms.modified']=='2026-02-25'
 assert re.search(r'over\s+112,000\s+fraud reports',html) and re.search(r'more than\s+\$704\s+million',html)
 expected=['Investments','Spear phishing','Relationship','Job','Fraud investigator','Recovery pitch','Extortion','Service','Merchandise','Prize']
 rows=[]
 for row in s.tables[1][1:]:
  assert len(row)==4,row
  label,reports,victims,loss=row
  match=re.fullmatch(r'\$(\d+(?:\.\d+)?) M',loss);assert match,loss
  r={'label':label,'reports':int(reports.replace(',','')),'victims':int(victims.replace(',','')),'lossCAD':int(Decimal(match[1])*1000000),'publishedLoss':loss}
  assert 0<r['victims']<=r['reports'];rows.append(r)
 assert [r['label'] for r in rows]==expected
 assert all(a['lossCAD']>=b['lossCAD'] for a,b in zip(rows,rows[1:]))
 missing=[]
 for row in s.tables[0][1:]:
  if len(row)==4 and row[3]=='N/A':missing.append({'label':row[0].replace(' *',''),'lossCAD':None})
 assert [r['label'] for r in missing]==['Identity fraud','Personal information','Phishing']
 return {'title':'Top 10 frauds in 2025','url':'https://centreantifraude-antifraudcentre.ca/features-vedette/2026/02/top-fraud-2025-fraudes-plus-courantes-eng.htm','referenceYear':2025,'issued':'2026-02-25','modified':'2026-02-25','retrieved':'2026-10-25','sha256':hashlib.sha256(raw).hexdigest(),'reportedCountLowerBound':112000,'reportedLossLowerBoundCAD':704000000,'rows':rows,'notAvailableLosses':missing}

p=argparse.ArgumentParser();p.add_argument('source',type=Path);p.add_argument('--check',action='store_true');a=p.parse_args()
result=extract(a.source)
output='// Generated from the dated public CAFC HTML. Do not convert N/A to zero.\nexport const fraudSource = '+json.dumps(result,ensure_ascii=False,indent=2)+';\n'
target=Path('src/planning-fraud-data.js')
if a.check:assert target.read_text()==output,'Stored extract differs from the supplied source'
else:target.write_text(output)
print('Verified 10 dollar-loss rows, three N/A loss entries, source rounding, dates and SHA-256.')
