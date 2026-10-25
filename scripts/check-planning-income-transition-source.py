"""Reconcile the published article slice to the original public Statistics Canada CSV."""
import csv
import hashlib
import io
import json
from pathlib import Path
import subprocess
import sys
import zipfile

root=Path(__file__).resolve().parents[1]
archive=Path(sys.argv[1])
data=json.loads(subprocess.check_output(['node','--input-type=module','-e',
    "import {incomeTransitionSource as source,incomeTransitionMeasures as measures,incomeTransitionPeriods as periods} from './src/planning-income-transition-data.js';console.log(JSON.stringify({source,measures,periods}));"],cwd=root,text=True))
expected={(r['period'],m['coordinate']):(key,r[key],m) for r in data['periods'] for key,m in data['measures'].items()}
observed={}
with zipfile.ZipFile(archive) as z:
    raw=z.read('11100024.csv')
    assert hashlib.sha256(raw).hexdigest()==data['source']['csvSha256'],'Source CSV vintage changed; review before replacing evidence.'
    for r in csv.DictReader(io.StringIO(raw.decode('utf-8-sig'))):
        key=(r['REF_DATE'],r['COORDINATE'])
        if key not in expected:continue
        assert key not in observed,('Duplicate selected observation',key)
        field,value,measure=expected[key]
        assert r['GEO']=='Canada' and r['Selected characteristics']=='Both sexes' and r['Low income threshold']=='Variable low income measure'
        assert r['VECTOR']==measure['vector'] and r['Statistics']==measure['statistic'] and r['UOM']==measure['unit']
        assert r['SCALAR_FACTOR']=='units' and not any(r[k] for k in ['STATUS','SYMBOL','TERMINATED'])
        assert float(r['VALUE'])==value,(key,field,r['VALUE'],value)
        assert r['DECIMALS']==('1' if measure['unit']=='Percent' else '0')
        observed[key]=value
assert set(observed)==set(expected) and len(observed)==55
for r in data['periods']:
    assert r['firstLow']+r['entrants']-r['exits']==r['secondLow']
    assert r['stayedLow']+r['exits']==r['firstLow']
    assert r['stayedLow']+r['entrants']==r['secondLow']
    assert r['stayedLow']+r['stayedNotLow']+r['entrants']+r['exits']==r['total']
    assert abs(r['entryRate']+r['resistanceRate']-100)<1e-9
    assert abs(r['exitRate']+r['immobilityRate']-100)<1e-9
    assert abs(r['entrants']/(r['total']-r['firstLow'])*100-r['entryRate'])<=.05000001
    assert abs(r['exits']/r['firstLow']*100-r['exitRate'])<=.05000001
print(json.dumps({'observations':len(observed),'periods':[r['period'] for r in data['periods']],'grain':'REF_DATE + COORDINATE, scoped to Canada / Both sexes / Variable LIM','missing_or_flagged':0,'duplicate_selected_keys':0,'count_reconciliation':'exact in all five pairs','rate_reconciliation':'matches published one-decimal precision','csv_sha256':data['source']['csvSha256']}))
