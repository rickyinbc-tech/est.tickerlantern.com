#!/usr/bin/env python3
"""Reproduce a narrow public employment-income snapshot with quality flags."""
import argparse,csv,hashlib,io,json,zipfile
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--archive',type=Path,required=True);p.add_argument('--out',type=Path,default=Path('src/planning-age-income-data.js'));a=p.parse_args()
ages=['15 to 24 years','25 to 34 years','35 to 44 years','45 to 54 years','55 to 64 years','65 years and over']
measures={'Number of persons':'persons','Number with income':'recipients','Average income (excluding zeros)':'mean','Median income (excluding zeros)':'median'}
selected={}
with zipfile.ZipFile(a.archive) as z:
 meta=z.read('11100239_MetaData.csv').decode('utf-8-sig')
 for phrase in ['2024-01-01','2021 Census','excluding zeros','A - Excellent','B - Very good','15 years and over']:
  assert phrase in meta,phrase
 for r in csv.DictReader(io.TextIOWrapper(z.open('11100239.csv'),encoding='utf-8-sig')):
  if r['REF_DATE'] not in ['2022','2023','2024'] or r['GEO']!='Canada' or r['Gender']!='Total - Gender' or r['Income source']!='Employment income' or r['Age group'] not in ages or r['Statistics'] not in measures:continue
  measure=measures[r['Statistics']];expected='Number' if measure in ['persons','recipients'] else '2024 constant dollars'
  assert r['UOM']==expected and r['SCALAR_FACTOR']=='units' and r['DECIMALS']=='0',r
  assert r['STATUS'] in ['A','B','C','D'] and r['SYMBOL']=='' and r['TERMINATED']=='' and r['VALUE']!='',r
  value=float(r['VALUE']);assert value>=0 and value.is_integer(),r
  key=(int(r['REF_DATE']),r['Age group'],measure);assert key not in selected,key
  selected[key]={'value':int(value),'quality':r['STATUS']}
assert len(selected)==72,len(selected)
years=[]
for year in [2022,2023,2024]:
 rows=[]
 for age,label in zip(ages,['15–24','25–34','35–44','45–54','55–64','65+']):
  row={'age':age,'label':label}
  for measure in measures.values():row[measure]=selected[(year,age,measure)]['value'];row[measure+'Quality']=selected[(year,age,measure)]['quality']
  assert 0<row['recipients']<=row['persons'];rows.append(row)
 years.append({'year':year,'rows':rows})
assert [r['median'] for r in years[-1]['rows']]==[13400,49400,62800,67500,52700,13200]
assert [r['mean'] for r in years[-1]['rows']]==[19400,56900,76200,84700,68300,34000]
assert sum(r['persons'] for r in years[-1]['rows'])==34439100
data={'publisher':'Statistics Canada','table':'11-10-0239-01','url':'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1110023901','download':'https://www150.statcan.gc.ca/n1/tbl/csv/11100239-eng.zip','released':'2026-04-29','reviewed':'2026-10-25','archiveSha256':hashlib.sha256(a.archive.read_bytes()).hexdigest(),'scope':'Canada; Total - Gender; Employment income; six disjoint age bands; 2022–2024 reference years. Income means and medians exclude zeros and are in 2024 constant CAD, units. Persons and persons with income are estimated counts, units. This is not after-tax income or a full-time-worker series.','qualityCodes':{'A':'Excellent','B':'Very good','C':'Good','D':'Acceptable'},'years':years}
a.out.write_text('// Public statistical extract; reproduce from the attributed CSV and metadata.\nexport const ageIncomeData = '+json.dumps(data,ensure_ascii=False,indent=2)+';\n')
print('Verified 72 observations: dimensions, units, no duplicates/missingness, retained quality flags, disjoint ages and 2024 source checkpoints.')
