"""Check the fixed public extract against Statistics Canada's original CSV ZIP."""
import argparse
import csv
import hashlib
import io
import json
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--source', type=Path, default=ROOT / 'qa/retirement-age-14100060-eng.zip')
args = parser.parse_args()
text = (ROOT / 'src/planning-retirement-age-data.js').read_text()
data = json.loads(text.removeprefix('export const retirementAgeData = ').removesuffix(';\n'))
source = args.source.read_bytes()
assert hashlib.sha256(source).hexdigest() == data['sourceSHA256'], 'Source ZIP changed; review it before updating the dated extract.'
with zipfile.ZipFile(io.BytesIO(source)) as archive:
    records = list(csv.DictReader(io.StringIO(archive.read('14100060.csv').decode('utf-8-sig'))))
    metadata = archive.read('14100060_MetaData.csv').decode('utf-8-sig')
years = {str(y) for y in data['years']}
selected = [r for r in records if r['REF_DATE'] in years and r['GEO'] == 'Canada' and r['Gender'] == 'Total - Gender']
assert len(selected) == 40
assert all(r['UOM'] == 'Years' and r['SCALAR_FACTOR'] == 'units' and r['DECIMALS'] == '1' for r in selected)
assert all(r['STATUS'] == '' and r['SYMBOL'] == '' for r in selected), 'Do not silently discard source flags.'
lookup = {(r['REF_DATE'], r['Class of worker'], r['Retirement age']): float(r['VALUE']) for r in selected}
assert len(lookup) == 40, 'Duplicate source dimensions.'
groups = [data['national'], *data['classes']]
assert {g['label'] for g in groups} == {r['Class of worker'] for r in selected}
checked = 0
for group in groups:
    for year in years:
        assert set(group[year]) == {'mean', 'median'}
        for key, source_measure in [('mean', 'Average age'), ('median', 'Median age')]:
            assert group[year][key] == lookup[(year, group['label'], source_measure)]
            checked += 1
assert checked == 40
for phrase in ['2025-11-17', 'estimates of the average retirement age were corrected for all reference periods',
               'Excluding the territories', 'not working', 'within the year prior to being surveyed',
               'LFS started collecting gender of person in 2022', 'Total - Gender']:
    assert phrase in metadata, phrase
assert data['table'] == '14-10-0060-01'
assert data['geography'] == 'Canada, excluding territories'
assert data['genderScope'].startswith('Total - Gender')
print('PASS: 40 official retirement-age cells, dimensions, units, precision, flags, correction/scope metadata and original source SHA-256.')
