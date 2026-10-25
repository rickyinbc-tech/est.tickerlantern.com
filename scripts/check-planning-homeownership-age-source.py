"""Verify the retained twelve public chart cells against the original CSV bytes."""
from pathlib import Path
import csv,hashlib,io,json,subprocess,sys
if len(sys.argv)!=2:raise SystemExit('Usage: python3 scripts/check-planning-homeownership-age-source.py <original-chart.csv>')
source=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {homeownershipAgeSource} from './src/planning-homeownership-age-data.js';console.log(JSON.stringify(homeownershipAgeSource))"],text=True))
path=Path(sys.argv[1]);raw=path.read_bytes()
assert hashlib.sha256(raw).hexdigest()==source['csvSHA256'],'Original source bytes changed; inspect before updating the extract.'
rows=list(csv.reader(io.StringIO(raw.decode('utf-8-sig'))))
assert rows[1]==['']+list(map(str,source['years'])),rows[1]
lookup={row[0]:row[1:] for row in rows if len(row)==4 and row[0]}
for row in source['rows']:
 assert list(map(float,lookup[row['originalLabel']]))==row['values'],row
assert source['sourcePrograms'] in raw.decode('utf-8-sig')
print(json.dumps({'verifiedCells':len(source['rows'])*len(source['years']),'sourceSHA256':source['csvSHA256'],'releaseDate':source['releaseDate'],'referenceYears':source['years'],'checkedFile':str(path)},indent=2))
