#!/usr/bin/env python3
"""Validate a dated Canada LFS annual snapshot before exporting the eight selected series."""
import argparse
import csv
import datetime
import hashlib
import io
import json
import math
from pathlib import Path
import zipfile

parser=argparse.ArgumentParser()
parser.add_argument('--archive',type=Path,required=True)
parser.add_argument('--output',type=Path,required=True)
parser.add_argument('--retrieved',required=True)
args=parser.parse_args()
datetime.date.fromisoformat(args.retrieved)
count_keys={'Population':'population','Labour force':'labourForce','Employment':'employment','Unemployment':'unemployment','Not in labour force':'notInLabourForce'}
rate_keys={'Unemployment rate':'unemployment','Participation rate':'participation','Employment rate':'employment'}
wanted=set(count_keys)|set(rate_keys)
with zipfile.ZipFile(args.archive) as archive:
    names=[n for n in archive.namelist() if n.endswith('.csv') and 'MetaData' not in n]
    if len(names)!=1:raise ValueError('Expected one main data CSV')
    with archive.open(names[0]) as stream:
        selected=[r for r in csv.DictReader(io.TextIOWrapper(stream,encoding='utf-8-sig')) if r['REF_DATE']=='2025' and r['GEO']=='Canada' and r['Gender']=='Total - Gender' and r['Age group']=='15 years and over' and r['Labour force characteristics'] in wanted]
    metadata=next(n for n in archive.namelist() if 'MetaData' in n)
    notes={r[0].strip():r[1] for r in csv.reader(io.StringIO(archive.read(metadata).decode('utf-8-sig'))) if len(r)>1 and r[0].strip() in {'8','9','10','13'}}
if len(selected)!=8 or {r['Labour force characteristics'] for r in selected}!=wanted:raise ValueError('Missing or duplicate selected series')
counts={};rates={}
for row in selected:
    key=row['Labour force characteristics'];is_count=key in count_keys
    expected={'UOM':'Persons in thousands' if is_count else 'Percent','SCALAR_FACTOR':'units','STATUS':'','SYMBOL':'','TERMINATED':'','DECIMALS':'1'}
    for column,value in expected.items():
        if row[column]!=value:raise ValueError(f'Unexpected {column} for {key}: {row[column]}')
    value=float(row['VALUE'])
    if not math.isfinite(value) or value<0 or (not is_count and value>100):raise ValueError('Invalid selected value')
    if is_count:counts[count_keys[key]]=value
    else:rates[rate_keys[key]]=value
if abs(counts['employment']+counts['unemployment']-counts['labourForce'])>.2:raise ValueError('Labour-force components fail the rounded-count check')
if abs(counts['labourForce']+counts['notInLabourForce']-counts['population'])>.2:raise ValueError('Population components fail the rounded-count check')
for key,numerator,denominator in [('unemployment','unemployment','labourForce'),('participation','labourForce','population'),('employment','employment','population')]:
    if abs(100*counts[numerator]/counts[denominator]-rates[key])>.051:raise ValueError('Published rate disagrees with its denominator beyond rounding')
for key,term in {'8':'percentage of the labour force','9':'population 15 years of age and over','10':'population 15 years of age and over','13':'excluding the territories'}.items():
    if term not in notes.get(key,'').lower():raise ValueError(f'Footnote {key} was not verified')
source={'publisher':'Statistics Canada','table':'14-10-0327-01','url':'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1410032701','download':'https://www150.statcan.gc.ca/n1/en/tbl/csv/14100327-eng.zip','period':'2025 annual estimates','released':'2026-01-09','retrieved':args.retrieved,'geography':'Canada, excluding the territories','ageGroup':'15 years and over','gender':'Total - Gender','countUnit':'Persons in thousands','rateUnit':'Percent','verifiedFootnotes':[8,9,10,13],'archiveSha256':hashlib.sha256(args.archive.read_bytes()).hexdigest(),'counts':counts,'rates':rates}
args.output.write_text('export const labourBudgetSource = '+json.dumps(source,ensure_ascii=False,indent=2)+';\n')
print(json.dumps({'selected_series':8,'count_series':len(counts),'rate_series':len(rates),'archive_sha256':source['archiveSha256']}))
