"""Validate selected public LFS duration observations; preserve units and source grain."""
import argparse
import csv
import hashlib
import io
import json
from pathlib import Path
import zipfile

parser=argparse.ArgumentParser()
parser.add_argument('archive',type=Path)
parser.add_argument('--output',type=Path,default=Path('src/planning-unemployment-duration-data.js'))
args=parser.parse_args()
raw=args.archive.read_bytes()
with zipfile.ZipFile(io.BytesIO(raw)) as archive:
    rows=list(csv.DictReader(io.StringIO(archive.read('14100057.csv').decode('utf-8-sig'))))
    metadata=archive.read('14100057_MetaData.csv').decode('utf-8-sig')
assert max(int(r['REF_DATE']) for r in rows)==2025,'Review the new reference-year coverage.'
assert 'Excluding the territories.' in metadata
assert 'two series are provided for average duration' in metadata
base=[r for r in rows if r['GEO']=='Canada' and r['Gender']=='Total - Gender' and r['Age group']=='15 years and over']


def observation(year,category,unit):
    selected=[r for r in base if r['REF_DATE']==str(year) and r['Duration of unemployment']==category]
    assert len(selected)==1,(year,category,len(selected))
    row=selected[0]
    assert row['UOM']==unit and row['DECIMALS']=='1'
    assert row['SCALAR_FACTOR']==('thousands' if unit=='Persons in thousands' else 'units')
    assert not any(row[k] for k in ['STATUS','SYMBOL','TERMINATED']),row
    value=float(row['VALUE']);assert value>=0
    return {'year':year,'category':category,'value':value,'source':{k:row[k] for k in ['VALUE','UOM','SCALAR_FACTOR','DECIMALS','STATUS','VECTOR','COORDINATE']}}


categories=['1 to 4 weeks','5 to 13 weeks','14 to 25 weeks','26 weeks','27 to 51 weeks','52 weeks','53 weeks or more','Duration unknown']
bins=[observation(2025,category,'Persons in thousands') for category in categories]
total=observation(2025,'Total unemployed, all weeks','Persons in thousands')
long=observation(2025,'27 weeks or more','Persons in thousands')
assert abs(sum(r['value'] for r in bins)-total['value'])<=.1*len(bins),'Non-overlapping duration bins do not reconcile within source rounding.'
assert abs(sum(r['value'] for r in bins[4:7])-long['value'])<=.3
assert total['value']==1538.9 and long['value']==349.3 and bins[-1]['value']==57.2
means=[{'year':year,'uncapped':observation(year,'Average weeks unemployed, no top-code','Weeks'),
        'capped99':observation(year,'Average weeks unemployed, top-code is 99 weeks','Weeks')}
       for year in range(2015,2026)]
assert means[-1]['uncapped']['value']==21.8 and means[-1]['capped99']['value']==19.6
assert all(r['uncapped']['value']>=r['capped99']['value'] for r in means)
data={'publisher':'Statistics Canada','table':'14-10-0057-01','released':'2026-01-09','reviewed':'2026-10-25',
      'latestReferenceYear':2025,'url':'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1410005701',
      'download':'https://www150.statcan.gc.ca/n1/tbl/csv/14100057-eng.zip','downloadSHA256':hashlib.sha256(raw).hexdigest(),
      'population':'Canada excluding territories; 15 years and over; Total - Gender; Labour Force Survey annual estimates.',
      'uncertainty':'This selected source table supplies point estimates and suppression/status information, not observation-specific confidence bounds. No confidence intervals or significance tests are inferred.',
      'bins2025':bins,'total2025':total,'long2025':long,'means':means}
args.output.write_text('export const unemploymentDurationData='+json.dumps(data,indent=2)+';\n')
print('Validated eight disjoint 2025 duration bins, total and long-duration aggregate, and two 2015–2025 mean series.')
