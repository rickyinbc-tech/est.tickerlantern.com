#!/usr/bin/env python3
"""Extract six validated Canada all-items annual CPI observations from StatCan CSV."""
import argparse
import csv
import hashlib
import io
import json
from pathlib import Path
import zipfile

parser=argparse.ArgumentParser()
parser.add_argument('--archive',type=Path,required=True)
parser.add_argument('--output',type=Path,required=True)
args=parser.parse_args()
with zipfile.ZipFile(args.archive) as archive:
    names=[name for name in archive.namelist() if name.endswith('.csv') and 'MetaData' not in name]
    if len(names)!=1:raise ValueError('Expected one main table CSV')
    records=list(csv.DictReader(io.StringIO(archive.read(names[0]).decode('utf-8-sig'))))
years=[str(year) for year in range(2020,2026)]
selected=[r for r in records if r['GEO']=='Canada' and r['Products and product groups']=='All-items' and r['REF_DATE'] in years]
if len(selected)!=6 or sorted(r['REF_DATE'] for r in selected)!=years:raise ValueError('Missing or duplicate year')
rows=[]
for record in sorted(selected,key=lambda r:r['REF_DATE']):
    for key,value in {'UOM':'2002=100','SCALAR_FACTOR':'units','VECTOR':'v41693271','STATUS':'','SYMBOL':'','TERMINATED':'','DECIMALS':'1'}.items():
        if record[key]!=value:raise ValueError(f'Unexpected {key}: {record[key]}')
    value=float(record['VALUE'])
    if not 0<value<1000:raise ValueError('Invalid CPI value')
    rows.append({'year':int(record['REF_DATE']),'index':value})
source={'publisher':'Statistics Canada','table':'18-10-0005-01','url':'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1810000501','download':'https://www150.statcan.gc.ca/n1/en/tbl/csv/18100005-eng.zip','released':'2026-01-19','retrieved':'2026-10-25','geography':'Canada','product':'All-items','frequency':'Annual average, not seasonally adjusted','unit':'2002=100','period':'2020–2025','archiveSha256':hashlib.sha256(args.archive.read_bytes()).hexdigest(),'rows':rows}
args.output.write_text('export const cpiLevelSource = '+json.dumps(source,ensure_ascii=False,indent=2)+';\n')
print(json.dumps({'selected_rows':len(rows),'years':years,'archive_sha256':source['archiveSha256']}))
