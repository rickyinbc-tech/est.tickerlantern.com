"""Extract the public national observations used by the asset-resilience guide."""
import argparse
import csv
import hashlib
import io
import json
from pathlib import Path
import zipfile

parser = argparse.ArgumentParser()
parser.add_argument('archive', type=Path)
parser.add_argument('--output', type=Path, default=Path('src/planning-asset-resilience-data.js'))
args = parser.parse_args()
raw = args.archive.read_bytes()
with zipfile.ZipFile(io.BytesIO(raw)) as archive:
    rows = list(csv.DictReader(io.StringIO(archive.read('11100082.csv').decode('utf-8-sig'))))
    metadata = archive.read('11100082_MetaData.csv').decode('utf-8-sig')
assert 'Includes the ten provinces and excludes the three territories.' in metadata
assert max(int(r['REF_DATE']) for r in rows) == 2023, 'Review the newly available reference period.'
base = [r for r in rows if r['GEO'] == 'Canada' and r['Age group'] == 'Persons all ages'
        and r['Family type'] == 'Persons in all family types']
measures = {'lim': 'National after-tax low income measure (LIM-AT)',
            'income': 'After-tax household income measure'}
durations = {1: 'one', 3: 'three', 6: 'six'}
intervals = [('value', 'Estimate'), ('lower', 'Lower bound of a 95% confidence interval'),
             ('upper', 'Upper bound of a 95% confidence interval')]


def observation(year, measure, months):
    result = {'year': year, 'measure': measure, 'months': months, 'observations': []}
    for key, interval in intervals:
        selected = [r for r in base if int(r['REF_DATE']) == year and r['Income measure'] == measures[measure]
                    and r['Statistics'] == f'Persons who are asset resilient for at least {durations[months]} month' + ('s' if months > 1 else '')
                    and r['Confidence intervals'] == interval]
        assert len(selected) == 1, (year, measure, months, interval, len(selected))
        row = selected[0]
        assert row['UOM'] == 'Percent' and row['SCALAR_FACTOR'] == 'units' and row['DECIMALS'] == '1'
        assert not any(row[k] for k in ['STATUS', 'SYMBOL', 'TERMINATED']), row
        result[key] = float(row['VALUE']) / 100
        result['observations'].append({k: row[k] for k in ['Confidence intervals', 'VALUE', 'VECTOR', 'COORDINATE', 'STATUS', 'UOM', 'SCALAR_FACTOR', 'DECIMALS']})
    assert 0 <= result['lower'] <= result['value'] <= result['upper'] <= 1
    return result


trend = [observation(y, 'lim', 3) for y in [1999, 2005, 2012, 2016, 2019, 2023]]
assert [round(r['value'] * 100, 1) for r in trend] == [63.6, 65.1, 65.3, 66.6, 67.1, 71.4]
duration = [observation(2023, m, n) for n in [1, 3, 6] for m in measures]
data = {'publisher': 'Statistics Canada', 'table': '11-10-0082-01', 'released': '2024-10-29',
        'reviewed': '2026-10-25', 'latestReferenceYear': 2023,
        'url': 'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1110008201',
        'download': 'https://www150.statcan.gc.ca/n1/tbl/csv/11100082-eng.zip',
        'downloadSHA256': hashlib.sha256(raw).hexdigest(),
        'scope': 'Persons all ages, persons in all family types, ten Canadian provinces; excludes the three territories. Percentages of persons, not households. Published 95% confidence bounds retained.',
        'trend': trend, 'duration': duration}
args.output.write_text('export const assetResilienceData=' + json.dumps(data, indent=2) + ';\n')
print(f'Validated {len(trend)} trend points and {len(duration)} duration/measure points with supplied confidence bounds.')
