"""Verify SFS debt estimates and published confidence bounds from the original CSV ZIP."""
from pathlib import Path
import csv,io,zipfile,subprocess,json,hashlib,sys
def main():
 path=Path(sys.argv[1]);data=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {debt2023} from './src/planning-debt-denominators-data.js';console.log(JSON.stringify(debt2023))"],text=True))
 wanted={obs['VECTOR']:(entry,kind,obs) for entry in data['rows'] for kind in ['holding','median'] for obs in entry[kind]['observations']};assert len(wanted)==30
 found={}
 with zipfile.ZipFile(path) as z:
  meta=z.read('11100016_MetaData.csv').decode('utf-8-sig');assert 'values not equal to $0' in meta and '95% confidence interval' in meta
  with z.open('11100016.csv') as raw:
   for row in csv.DictReader(io.TextIOWrapper(raw,encoding='utf-8-sig')):
    if row['REF_DATE']=='2023' and row['VECTOR'] in wanted:
     assert row['VECTOR'] not in found;found[row['VECTOR']]=row
 assert found.keys()==wanted.keys(),'Missing selected original observations'
 for vector,(entry,kind,obs) in wanted.items():
  row=found[vector]
  for key,value in obs.items():assert row[key]==value,(vector,key,row[key],value)
  assert row['GEO']=='Canada' and row['Age group']=='All ages' and row['Economic family type']=='Economic families and persons not in an economic family'
  assert row['Assets and debts']==entry['sourceLabel']
  assert row['Statistics']==('Percentage holding asset or debt' if kind=='holding' else 'Median value for those holding asset or debt')
  key={'Estimate':'value','Lower bound of a 95% confidence interval':'lower','Upper bound of a 95% confidence interval':'upper'}[row['Confidence intervals']]
  assert entry[kind][key]==float(row['VALUE'])/(100 if kind=='holding' else 1)
 print(json.dumps({'source':data['url'],'period':data['period'],'reviewed':data['reviewed'],'verifiedEstimateAndBoundCells':len(found),'sourceSha256':hashlib.sha256(path.read_bytes()).hexdigest()},indent=2))
if __name__=='__main__':main()
