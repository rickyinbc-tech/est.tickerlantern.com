#!/usr/bin/env python3
"""Extract a small attributed CPP snapshot from retained official public bytes."""
import argparse,csv,hashlib,io,json,re
from decimal import Decimal
from html import unescape
from pathlib import Path

def extract(archive):
 csv_bytes=(archive/'monthly-maximum.csv').read_bytes()
 rows=list(csv.DictReader(io.StringIO(csv_bytes.decode('cp1252'))))
 selected=[r for r in rows if r['Year']=='2026']
 assert len(selected)==12,'Expected exactly twelve 2026 monthly rows'
 months=['Jan. / jan.','Feb. / fév.','Mar. / mar.','Apr. / avr.','May / mai','June / juin','Jul. / juil.','Aug. / août','Sept. / sept.','Oct. / oct.','Nov. / nov.','Dec. / déc.']
 assert [r['Month'] for r in selected]==months,'Changed or duplicated source months'
 values=[Decimal(r['Retirement Pension'].replace(',','')) for r in selected]
 assert all(x>0 for x in values) and all(a<b for a,b in zip(values,values[1:]))
 assert [values[i] for i in [0,6,9]]==[Decimal('1507.65'),Decimal('1516.99'),Decimal('1521.67')]
 html_bytes=(archive/'amounts.html').read_bytes();html=html_bytes.decode()
 table_rows=re.findall(r'<tr\b[^>]*>(.*?)</tr>',html,re.S|re.I)
 clean=lambda t:unescape(re.sub(r'<[^>]+>',' ',t)).replace('\xa0',' ')
 matching=[clean(r) for r in table_rows if 'Retirement pension' in clean(r) and 'age 65' in clean(r)]
 assert len(matching)==1,'Expected unique age-65 retirement row'
 amounts=re.findall(r'\$\s*([\d,]+\.\d{2})',matching[0])
 assert amounts==['858.34','1,507.65'],amounts
 plain=clean(html);assert 'new beneficiaries (July 2026)' in plain
 assert 'beginning in January 2026' in plain
 rate=(archive/'rate-card.html').read_text();assert 'month of January 2026' in clean(rate) and '$1,507.65' in rate
 source_manifest=json.loads((archive/'manifest.json').read_text())
 by_file={Path(x['file']).name:x for x in source_manifest if 'file' in x}
 for name in ['monthly-maximum.csv','amounts.html','rate-card.html']:
  assert hashlib.sha256((archive/name).read_bytes()).hexdigest()==by_file[name]['sha256']
 return {'publisher':'Employment and Social Development Canada / Service Canada','reviewed':'2026-10-25','unit':'Nominal CAD per month','age':65,
  'scope':'Retirement pension at age 65 only; average for new beneficiaries in July 2026; maximum for a new pension starting in each labelled month. Not all existing recipients and not a personal entitlement.',
  'average':{'reference':'2026-07','population':'New beneficiaries; retirement pension at age 65','value':float(Decimal(amounts[0])),'url':by_file['amounts.html']['url'],'sha256':by_file['amounts.html']['sha256']},
  'maximumSource':{'url':by_file['monthly-maximum.csv']['url'],'dataset':'https://open.canada.ca/data/en/dataset/e547539b-7fc6-4879-be54-3d1f80ac9e9e','sha256':by_file['monthly-maximum.csv']['sha256'],'encoding':'Windows-1252','column':'Retirement Pension','selection':'2026 January–October. November–December published rows are deliberately omitted from this as-of-October display.'},
  'maximumRows':[{'month':i+1,'reference':f'2026-{i+1:02d}','sourceMonth':months[i],'value':float(values[i])} for i in range(10)]}

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--archive',type=Path,required=True);parser.add_argument('--output',type=Path,default=Path('src/planning-cpp-amounts-data.js'));args=parser.parse_args()
 data=extract(args.archive);args.output.write_text('// Curated public-source figures; reproduce with scripts/extract-planning-cpp-amounts.py.\nexport const cppAmounts = '+json.dumps(data,indent=2,ensure_ascii=False)+';\n')
 print('Validated one age-65 new-beneficiary average and ten monthly new-pension maxima; future months excluded.')
