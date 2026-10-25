#!/usr/bin/env python3
"""Curate one preliminary period life table, retaining expectation margins."""
import argparse,csv,hashlib,io,json,re,zipfile
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--archive',type=Path,required=True);p.add_argument('--out',type=Path,default=Path('src/planning-life-table-data.js'));a=p.parse_args()
sexes=['Both sexes','Males','Females'];names={'Number of survivors at age x (lx)':'survivors','Life expectancy (in years) at age x (ex)':'expectancy','Margin of error of the life expectancy (m.e.(ex))':'margin'};selected={}
with zipfile.ZipFile(a.archive) as z:
 meta=z.read('13100114_MetaData.csv').decode('utf-8-sig')
 for text in ['2021/2023 and 2022/2024','preliminary','95% confidence interval','100,000 live births','mortality observed over the reference period']:assert text in meta,text
 for r in csv.DictReader(io.TextIOWrapper(z.open('13100114.csv'),encoding='utf-8-sig')):
  if r['GEO']!='Canada' or r['REF_DATE']!='2022/2024' or r['Sex'] not in sexes or r['Element'] not in names:continue
  m=re.fullmatch(r'(\d+) years',r['Age group'])
  if not m:continue
  age=int(m.group(1));measure=names[r['Element']]
  if not (55<=age<=100 and (measure=='survivors' or age<=80)):continue
  assert r['UOM']=='Number' and r['SCALAR_FACTOR']=='units' and r['SYMBOL']=='' and r['TERMINATED']=='' and r['STATUS']=='',r
  assert r['VALUE']!='' and r['DECIMALS']==('0' if measure=='survivors' else '2'),r
  value=float(r['VALUE']);assert value>=0,r
  if measure=='survivors':assert value.is_integer();value=int(value)
  key=(r['Sex'],age,measure);assert key not in selected,key;selected[key]=value
assert len(selected)==294,len(selected)
groups=[]
for sex in sexes:
 survivors=[{'age':age,'value':selected[(sex,age,'survivors')]} for age in range(55,101)]
 expectations=[{'age':age,'years':selected[(sex,age,'expectancy')],'margin95':selected[(sex,age,'margin')]} for age in range(55,81)]
 assert all(0<r['value']<=100000 for r in survivors)
 assert all(b['value']<=a['value'] for a,b in zip(survivors,survivors[1:]))
 assert all(r['years']>r['margin95']>=0 for r in expectations)
 groups.append({'sex':sex,'survivors':survivors,'expectations':expectations})
assert groups[0]['survivors'][10]['value']==88760
assert groups[0]['expectations'][10]=={'age':65,'years':20.85,'margin95':0.02}
data={'publisher':'Statistics Canada','table':'13-10-0114-01','url':'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1310011401','download':'https://www150.statcan.gc.ca/n1/tbl/csv/13100114-eng.zip','released':'2026-01-13','reviewed':'2026-10-25','period':'2022/2024','preliminary':True,'preliminaryBasis':'Metadata note 14 marks the 2022/2024 period preliminary because late death registrations can lead to updates; the selected individual CSV STATUS cells are blank.','archiveSha256':hashlib.sha256(a.archive.read_bytes()).hexdigest(),'scope':'Canada, one three-year period table, source categories Both sexes/Males/Females. Survivors lx: ages 55–100, radix 100,000 at birth. Expected remaining years ex and published 95% margin: ages 55–80. Period mortality held fixed, not a cohort forecast or individual prognosis. No uncertainty for derived lx ratios is supplied.','groups':groups}
a.out.write_text('// Attributed public period-table extract; reproduce from official CSV and metadata.\nexport const lifeTableData = '+json.dumps(data,ensure_ascii=False,indent=2)+';\n');print('Verified 294 observations, dimensions, source precision, blank row flags plus preliminary-period metadata, monotone survivors and exact age-65 checkpoints.')
