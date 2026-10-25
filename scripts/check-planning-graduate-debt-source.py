"""Compare the article's National Graduates Survey slice with its original public CSV."""
import csv
import hashlib
import io
import json
from pathlib import Path
import subprocess
import sys
import zipfile
from collections import Counter

root=Path(__file__).resolve().parents[1]
data=json.loads(subprocess.check_output(['node','--input-type=module','-e',
    "import {graduateDebtSource as source,graduateDebtMeasures as measures,graduateDebtLevels as levels} from './src/planning-graduate-debt-data.js';console.log(JSON.stringify({source,measures,levels}));"],cwd=root,text=True))
expected={(str(data['source']['classYear']),level[key]['coordinate']):(level,key,level[key]) for level in data['levels'] for key in data['measures']}
observed={}
with zipfile.ZipFile(sys.argv[1]) as z:
    raw=z.read('37100255.csv')
    assert hashlib.sha256(raw).hexdigest()==data['source']['csvSha256'],'CSV vintage changed; review before replacing article data.'
    for r in csv.DictReader(io.StringIO(raw.decode('utf-8-sig'))):
        grain=(r['REF_DATE'],r['COORDINATE'])
        if grain not in expected:continue
        assert grain not in observed,('Duplicate selected row',grain)
        level,key,value=expected[grain]
        assert r['GEO']=='Canada' and r['Level of study']==level['label'] and r['Field of study']=='All fields of study'
        assert r['Gender']=='Total - Gender' and r['Type of debt source']==data['source']['debtSource']
        assert r['Statistics']==data['measures'][key] and r['VECTOR']==value['vector']
        assert int(r['VALUE'])==value['value'] and r['STATUS']==value['quality'] and r['UOM']==value['unit'] and r['DECIMALS']==value['decimals']
        assert r['STATUS'] in data['source']['qualityCodes'] and not r['SYMBOL'] and not r['TERMINATED'] and r['SCALAR_FACTOR']=='units'
        observed[grain]=r['STATUS']
assert set(observed)==set(expected) and len(observed)==36
print(json.dumps({'observations':36,'class_year':2020,'interview_year':2023,'duplicate_selected_keys':0,'missing_selected_values':0,'quality_codes_preserved':dict(Counter(observed.values())),'statistics':'Six measures across five disjoint level categories plus the overlapping all-level aggregate. Large-debt percentages are outside this slice.','csv_sha256':data['source']['csvSha256']}))
