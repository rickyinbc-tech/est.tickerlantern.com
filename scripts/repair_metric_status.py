"""Materialize only failed shared checks already proven in the accepted feed."""
import copy
import json
from pathlib import Path
from metric_sync import repair_shared_sync
from snapshot import finalize,atomic_write,utcnow


def repair(path):
    path=Path(path);previous=json.loads(path.read_text());candidate=copy.deepcopy(previous)
    repaired=[]
    for row in candidate['indices']:
        repaired.extend({'benchmark':row['id'],'metric':key} for key in repair_shared_sync(row))
    candidate['publishedAt']=utcnow()
    candidate['statusMetadataRepair']={'appliedAt':candidate['publishedAt'],'reason':'Resolve existing same-document failed check outcomes; no publisher request','metrics':repaired}
    result=finalize(candidate,previous,'source-status-metadata-repair')
    if (result['snapshotId'],result['snapshotVersion'])!=(previous['snapshotId'],previous['snapshotVersion']):
        raise ValueError('Status repair must not change financial/definition snapshot identity')
    # Preserve the actual publisher run; a metadata repair is not a new check.
    result['pipelineRun']=previous.get('pipelineRun')
    for key in ('sourceCheckAt','growthCheckAt','lastScheduledCheckAt'):
        if result.get(key)!=previous.get(key):raise ValueError('Status repair cannot advance a publisher check')
    atomic_write(path,result)
    return result['statusMetadataRepair']


if __name__=='__main__':
    import argparse
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--snapshot',default=str(Path(__file__).resolve().parents[1]/'data/indices.json'))
    print(json.dumps(repair(parser.parse_args().snapshot),indent=2))
