"""Check the frozen public CSV snapshot at its intended coordinate/year grain."""
import collections
import csv
import hashlib
import io
import json
from pathlib import Path
import subprocess
import sys
import zipfile

root=Path(__file__).resolve().parents[1]
source=Path(sys.argv[1]) if len(sys.argv)>1 else root/'qa/adjusted-income-sources/36100587-eng.zip'
data=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {adjustedIncomeSource as s} from './src/planning-adjusted-income-data.js';console.log(JSON.stringify(s));"],cwd=root,text=True))
with zipfile.ZipFile(source) as archive:
    raw=archive.read('36100587.csv')
    metadata=archive.read('36100587_MetaData.csv').decode('utf-8-sig')
assert hashlib.sha256(raw).hexdigest()==data['csvSha256'],'Snapshot changed: review the release vintage before refreshing values.'
assert '"36100587"' in metadata and '"Value per household","","3"' in metadata
rows=list(csv.DictReader(io.StringIO(raw.decode('utf-8-sig'))))
keys=[(r['REF_DATE'],r['COORDINATE']) for r in rows]
assert len(set(keys))==len(keys),'Duplicate full coordinate/year key'
lookup=dict(zip(keys,rows))
measures={'disposable':('1','Household disposable income'),'inKind':('24','Social transfers in kind (STiK)'),'adjusted':('28','Adjusted household disposable income')}
verified=0;aliases=0;residuals=collections.Counter()
for group in data['groups']:
    assert len(group['rows'])==len(data['years'])==5
    for expected in group['rows']:
        observed={}
        for key,(member,label) in measures.items():
            coordinate=f"1.3.{group['coordinateGroup']}.{member}"
            r=lookup[(str(expected['year']),coordinate)]
            assert (r['GEO'],r['Statistics'],r['Characteristics'],r['Income, consumption and savings'])==('Canada','Value per household',group['label'],label)
            assert r['VECTOR']==group['vectors'][key]
            assert r['UOM']=='Dollars' and r['SCALAR_FACTOR']=='units' and r['DECIMALS']=='0'
            assert all(r[k]=='' for k in ['STATUS','SYMBOL','TERMINATED']) and r['VALUE']!=''
            observed[key]=int(r['VALUE']);assert observed[key]==expected[key]
            verified+=1
        alternate=lookup[(str(expected['year']),f"1.3.{group['coordinateGroup']}.29")]
        assert alternate['Income, consumption and savings']=='Social transfers in kind (STiK)' and int(alternate['VALUE'])==observed['inKind']
        aliases+=1
        residual=observed['adjusted']-observed['disposable']-observed['inKind']
        assert residual==expected['roundingResidual'] and abs(residual)<=1
        residuals[residual]+=1
assert verified==75 and aliases==25
receipt={'source_rows':len(rows),'source_columns':len(rows[0]),'full_key_duplicates':0,'selected_observations':verified,'duplicate_label_pairs_with_equal_values':aliases,'missing_or_flagged_selected_values':0,'accounting_residual_counts':dict(residuals),'unit':'Current CAD per household per year','grain':'Year × Canada × Value per household × income quintile × canonical measure member','canonical_measure_members':data['measureMembers'],'csv_sha256':data['csvSha256'],'risk':'Same-named STiK entries occupy separate income and consumption positions. Summing by display label would count the same transfer twice. Select canonical member 24, reconcile member 29, and preserve whole-dollar rounding residuals.','confidence':'High: all selected rows, units, flags, vectors and the alternate STiK entries were checked against the frozen original CSV.'}
out=root/'qa/adjusted-income-source-verification.json';out.parent.mkdir(exist_ok=True);out.write_text(json.dumps(receipt,indent=2))
print(json.dumps(receipt))
