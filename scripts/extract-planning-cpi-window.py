#!/usr/bin/env python3
"""Validate and curate a fixed public CPI snapshot without fetching private data."""
import argparse,hashlib,html,json,re
from pathlib import Path

def clean(value):return ' '.join(html.unescape(re.sub(r'<[^>]+>',' ',value)).split())
def all_items(path):
 rows=[]
 for tr in re.findall(r'<tr\b[^>]*>(.*?)</tr>',path.read_text(),re.S|re.I):
  cells=[clean(x) for x in re.findall(r'<t[dh]\b[^>]*>(.*?)</t[dh]>',tr,re.S|re.I)]
  if cells and cells[0]=='All-items':rows.append(cells)
 assert len(rows)==1,'Expected one unique All-items row'
 return rows[0]
def extract(archive):
 manifest=json.loads((archive/'manifest.json').read_text());sources={Path(x['file']).name:x for x in manifest}
 for name in ['boc-monthly.json','table-nsa.html','table-sa.html','release.html','boc-table.html','faq.html']:
  assert hashlib.sha256((archive/name).read_bytes()).hexdigest()==sources[name]['sha256'],name
 s=json.loads((archive/'boc-monthly.json').read_text());obs=s['observations'];assert len(obs)==13
 refs=['2025-'+str(m).zfill(2)+'-01' for m in range(9,13)]+['2026-'+str(m).zfill(2)+'-01' for m in range(1,10)]
 assert [r['d'] for r in obs]==refs,'Missing, duplicate or out-of-order month'
 names={'nsa':'V41690973','sa':'V41690914','publishedYear':'STATIC_TOTALCPICHANGE'}
 for key in names.values():assert s['seriesDetail'][key]['metadata']['frequency']=='Monthly'
 for key in ['V41690973','V41690914']:assert s['seriesDetail'][key]['metadata']['unit']=='Index (2002=100)'
 assert s['seriesDetail']['STATIC_TOTALCPICHANGE']['metadata']['unit']=='Percent'
 rows=[]
 for source in obs:
  row={'reference':source['d'][:7]}
  for name,key in names.items():
   item=source[key];assert re.fullmatch(r'\d+\.\d',item['v']),item
   flags={k:v for k,v in item.items() if k!='v'};assert all(k=='r' and v==1 for k,v in flags.items()),flags
   row[name]={'value':float(item['v']),'original':item['v'],'flags':flags}
  assert row['nsa']['value']>0 and row['sa']['value']>0
  rows.append(row)
 assert [rows[k]['nsa']['value'] for k in [0,11,12]]==[164.9,169.8,170.0]
 assert [rows[k]['sa']['value'] for k in [0,11,12]]==[165.0,169.4,170.0]
 assert rows[11]['sa']['flags']=={'r':1} and rows[12]['publishedYear']['original']=='3.1'
 nsa=all_items(archive/'table-nsa.html');sa=all_items(archive/'table-sa.html')
 assert nsa==['All-items','164.9','169.8','170.0','0.1','3.1'],nsa
 assert sa==['All-items','168.9','169.4','170.0','0.3','0.4'],sa
 release=clean((archive/'release.html').read_text())
 assert 'The CPI increased 0.1% month over month in September.' in release
 assert 'On a seasonally adjusted monthly basis, the CPI rose 0.4%.' in release
 rate_rows=[{'label':'September 2026 · 12-month NSA','value':float(nsa[-1]),'original':nsa[-1],'window':'2025-09 to 2026-09','adjustment':'Not seasonally adjusted'},
 {'label':'September 2026 · 1-month NSA','value':float(nsa[-2]),'original':nsa[-2],'window':'2026-08 to 2026-09','adjustment':'Not seasonally adjusted'},
 {'label':'September 2026 · 1-month SA','value':float(sa[-1]),'original':sa[-1],'window':'2026-08 to 2026-09','adjustment':'Seasonally adjusted'}]
 used=['boc-monthly.json','table-nsa.html','table-sa.html','release.html','boc-table.html','faq.html']
 return {'publisher':'Statistics Canada; monthly series republished by Bank of Canada','released':'2026-10-19','reviewed':'2026-10-25','retrieved':sources['boc-monthly.json']['retrieved'],'geography':'Canada','aggregate':'All-items','indexUnit':'Index, 2002=100','precision':'Original source indices and published percentage changes retained at one decimal place.','series':names,'scope':'Monthly reference periods September 2025–September 2026. YYYY-MM-01 source dates label monthly periods, not day-one price observations. SA r=1 is a revision flag. Core inflation series are excluded.','sources':[{'url':sources[x]['url'],'sha256':sources[x]['sha256']} for x in used],'rows':rows,'publishedRates':rate_rows}

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--archive',type=Path,required=True);parser.add_argument('--output',type=Path,default=Path('src/planning-cpi-window-data.js'));args=parser.parse_args();data=extract(args.archive)
 args.output.write_text('// Curated public CPI snapshot; reproduce with scripts/extract-planning-cpi-window.py.\nexport const cpiWindowData = '+json.dumps(data,ensure_ascii=False,indent=2)+';\n')
 print('Validated 13 consecutive months × 3 series, original precision/flags and separate NSA/SA headline windows.')
