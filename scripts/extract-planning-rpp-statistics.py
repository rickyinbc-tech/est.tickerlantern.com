#!/usr/bin/env python3
"""Curate 40 count observations and verify top-level funding categories."""
import argparse,csv,hashlib,io,json,zipfile
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--archive',type=Path,required=True);p.add_argument('--out',type=Path,default=Path('src/planning-rpp-statistics-data.js'));a=p.parse_args()
with zipfile.ZipFile(a.archive) as z:
 rows=list(csv.DictReader(io.TextIOWrapper(z.open('11100099.csv'),encoding='utf-8-sig')))
 metadata=list(csv.reader(io.StringIO(z.read('11100099_MetaData.csv').decode('utf-8-sig'))))
assert any('2025-01-01' in row and '11100099' in row for row in metadata)
header=next(n for n,row in enumerate(metadata) if row[:2]==['Dimension ID','Member Name'])
funding=[]
for row in metadata[header+1:]:
 if not row:break
 if row[0]=='3' and row[4]=='1':funding.append(row[1])
assert len(funding)==6 and len(set(funding))==6
assert 'Insurance company contract fully guaranteed' not in funding
all_notes=' '.join(' '.join(r) for r in metadata)
assert "Membership and assets data are as of the plan's year-end in the previous calendar year." in all_notes
assert 'reference date for number of registered pension plans' in all_notes
selected={}
for r in rows:
 if r['GEO']!='Canada' or r['Registered pension plans']!='Total of registered pension plans' or r['Statistics']!='Number':continue
 if r['REF_DATE'] not in {str(y) for y in range(2021,2026)}:continue
 instrument=r['Funding instrument'];measure=r['Plans, active members and asset value']
 if not (instrument=='Total of funding instrument' and measure in ['Plans','Active members, both sexes'] or instrument in funding and measure=='Active members, both sexes'):continue
 assert r['UOM']=='Number' and r['SCALAR_FACTOR']=='units' and r['DECIMALS']=='0'
 assert r['STATUS']=='' and r['SYMBOL']=='' and r['VALUE']!='',r
 value=float(r['VALUE']);assert value>=0 and value.is_integer()
 key=(int(r['REF_DATE']),instrument,measure);assert key not in selected,key
 selected[key]=int(value)
assert len(selected)==40
curated=[]
for year in range(2021,2026):
 groups=[{'label':name,'members':selected[(year,name,'Active members, both sexes')]} for name in funding]
 total=selected[(year,'Total of funding instrument','Active members, both sexes')]
 assert sum(g['members'] for g in groups)==total
 curated.append({'referenceYear':year,'plans':selected[(year,'Total of funding instrument','Plans')],'members':total,'funding':groups})
assert [r['plans'] for r in curated]==[16359,16164,16168,16259,15762]
assert [r['members'] for r in curated]==[6593256,6711260,6927094,7220609,7352686]
data={'publisher':'Statistics Canada','table':'11-10-0099-01','url':'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1110009901','download':'https://www150.statcan.gc.ca/n1/tbl/csv/11100099-eng.zip','released':'2026-07-28','reviewed':'2026-10-25','archiveSha256':hashlib.sha256(a.archive.read_bytes()).hexdigest(),'scope':'Canada; total registered pension plans; count statistics in units. Plans use the 1 January reference date. Membership relates to each plan’s year-end in the preceding calendar year, normally 31 December. Funding categories are the six direct children of the total in the publisher metadata.','rows':curated}
a.out.write_text('// Attributed public counts; extracted and validated from the official CSV and metadata.\nexport const rppStatistics = '+json.dumps(data,ensure_ascii=False,indent=2)+';\n')
print('Verified 40 observations, units, five reference years, metadata hierarchy and membership reconciliation.')
