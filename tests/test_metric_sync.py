"""Source ownership and check-state regressions; all failures are isolated fixtures."""
import copy,json,sys,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'scripts'))
from metric_sync import resolved_sync,metric_source,mark_failure,primary_owns,repair_shared_sync
from refresh_indices import update_metrics
from definition_registry import apply_registry
import refresh_indices

ATTEMPT='2026-10-23T10:00:00Z';RECOVERY='2026-10-23T11:00:00Z'
def feed():return json.loads((ROOT/'data/indices.json').read_text())
def row(id):return copy.deepcopy(next(r for r in feed()['indices'] if r['id']==id))

class MetricSyncTests(unittest.TestCase):
 def test_actual_primary_failure_path_covers_factset_mean_and_msci_yield(self):
  before=feed();world=next(r for r in before['indices'] if r['id']=='world')
  world['yieldSync']={'status':'ok','lastAttempt':'2026-10-23T06:00:00Z','lastSuccess':'2026-10-23T06:00:00Z','error':None}
  with tempfile.TemporaryDirectory() as folder:
   root=Path(folder);(root/'data').mkdir();(root/'data/indices.json').write_text(json.dumps(before));(root/'data/catalog.json').write_text((ROOT/'data/catalog.json').read_text())
   with patch.object(refresh_indices,'ROOT',root),patch.object(refresh_indices,'fetch',side_effect=ValueError('Isolated timeout')),patch.object(refresh_indices.time,'sleep'),patch('source_jobs.refresh_supplemental',return_value=[]),patch('builtins.print'):
    after=refresh_indices.refresh()
  old={r['id']:r for r in before['indices']};new={r['id']:r for r in after['indices']}
  for id,metrics in [('sp500',[('forwardPE','sync'),('mean10YearForwardPE','meanSync')]),('world',[('forwardPE','sync'),('dividendYield','yieldSync')])]:
   for metric,sync in metrics:
    self.assertEqual(new[id][metric],old[id][metric]);self.assertEqual(new[id][sync]['status'],'retained')
    self.assertEqual(new[id][sync]['lastAttempt'],after['sourceCheckAt']);self.assertEqual(new[id][sync]['lastSuccess'],old[id][sync]['lastSuccess'])
   for key in ['asOf','meanAsOf','yieldAsOf','source','meanSource','yieldSource']:
    self.assertEqual(new[id].get(key),old[id].get(key))
  self.assertEqual(new['world']['meanSync'],old['world']['meanSync'])
  self.assertTrue(any(j['id']=='primary:factset' and j['status']=='retained' for j in after['primarySourceJobs']))
 def test_missing_or_older_explicit_sync_inherits_only_same_document(self):
  for id in ['msci-canada','eafe','uk']:
   r=row(id);r.pop('yieldSync',None)
   shared=resolved_sync(r,'dividendYield');self.assertEqual(shared['status'],'retained');self.assertEqual(shared['lastAttempt'],r['sync']['lastAttempt'])
   r['yieldSync']={'status':'ok','lastAttempt':'2026-10-23T06:00:00Z','lastSuccess':'2026-10-23T06:00:00Z'}
   self.assertEqual(resolved_sync(r,'dividendYield')['status'],'retained')
   self.assertEqual(resolved_sync(r,'dividendYield')['lastSuccess'],'2026-10-23T06:00:00Z')
   r['yieldSource']={**r['yieldSource'],'url':'https://www.msci.com/independent-report.pdf'}
   self.assertEqual(resolved_sync(r,'dividendYield')['status'],'ok')
 def test_mixed_source_failure_and_recovery_in_both_directions(self):
  r=row('em');old=copy.deepcopy(r);msci=metric_source(r,'dividendYield');jpm=r['source']
  affected=mark_failure(r,ATTEMPT,'Isolated MSCI failure',lambda s:s.get('url')==msci['url'],['forwardPE','dividendYield'],'primary:msci:acwi')
  self.assertEqual(affected,['dividendYield']);self.assertEqual(r['sync'],old['sync'])
  update_metrics(r,{'forwardPE':r['forwardPE'],'asOf':r['asOf']},jpm,RECOVERY)
  self.assertEqual(resolved_sync(r,'dividendYield')['status'],'retained')
  update_metrics(r,{'dividendYield':r['dividendYield'],'asOf':r['yieldAsOf']},msci,RECOVERY)
  self.assertEqual(resolved_sync(r,'dividendYield')['status'],'ok');self.assertEqual(r['yieldAsOf'],old['yieldAsOf'])
  mark_failure(r,'2026-10-23T12:00:00Z','Isolated JPM failure',lambda s:s.get('url')==jpm['url'],['forwardPE'],'jpm-daily')
  self.assertEqual(resolved_sync(r,'dividendYield')['status'],'ok')
  update_metrics(r,{'dividendYield':r['dividendYield'],'asOf':r['yieldAsOf']},msci,'2026-10-23T13:00:00Z')
  self.assertEqual(resolved_sync(r,'forwardPE')['status'],'retained')
  update_metrics(r,{'forwardPE':r['forwardPE'],'asOf':r['asOf']},jpm,'2026-10-23T13:00:00Z')
  self.assertEqual(resolved_sync(r,'forwardPE')['status'],'ok');self.assertEqual(r['asOf'],old['asOf'])
 def test_partial_success_cannot_clear_another_unvalidated_metric_even_same_document(self):
  r=row('world');mark_failure(r,ATTEMPT,'Fixture',lambda s:s.get('url')==r['source']['url'],owner_id='primary:msci:acwi')
  update_metrics(r,{'forwardPE':r['forwardPE'],'asOf':r['asOf']},r['source'],RECOVERY)
  self.assertEqual(resolved_sync(r,'forwardPE')['status'],'ok');self.assertEqual(resolved_sync(r,'dividendYield')['status'],'retained')
 def test_repair_materializes_only_proven_failure_without_financial_changes(self):
  r=row('eafe');r.pop('yieldSync',None);before=copy.deepcopy(r);changes=repair_shared_sync(r)
  self.assertEqual(changes,['dividendYield']);self.assertEqual(r['yieldSync']['lastAttempt'],before['sync']['lastAttempt'])
  self.assertEqual(r['yieldSync']['lastSuccess'],before['sync']['lastSuccess'])
  r.pop('yieldSync');self.assertEqual(r,before)
 def test_registry_operational_evidence_uses_resolved_status(self):
  f=feed();r=next(r for r in f['indices'] if r['id']=='eafe');r.pop('yieldSync',None)
  apply_registry(f);e=r['metricDefinitions']['dividendYield']['evidence']
  self.assertEqual(e['checkStatus'],'retained');self.assertEqual(e['failureSummary'],r['sync']['error']);self.assertEqual(e['lastSuccess'],r['sync']['lastSuccess'])
 def test_not_meaningful_is_availability_not_failed_check(self):
  r=row('sp500');update_metrics(r,{'forwardPE':None,'asOf':r['asOf'],'metricStates':{'forwardPE':'not-meaningful'},'rawForwardPE':'N/M'},r['source'],RECOVERY)
  self.assertEqual(r['metricStates']['forwardPE'],'not-meaningful');self.assertEqual(r['sync']['status'],'ok');self.assertIsNone(r['forwardPE'])
 def test_legacy_nm_availability_survives_independent_health_normalization(self):
  f=feed();r=next(r for r in f['indices'] if r['id']=='sp500');r['forwardPE']=None;r.pop('metricStates',None);r['metricRawValues']={'forwardPE':'N/M'};r['sync']['status']='not-meaningful'
  apply_registry(f)
  self.assertEqual(r['metricDefinitions']['forwardPE']['state'],'not-meaningful');self.assertEqual(r['metricDefinitions']['forwardPE']['rawReportedValue'],'N/M')
  self.assertEqual(r['metricDefinitions']['forwardPE']['evidence']['checkStatus'],'ok')
  mark_failure(r,ATTEMPT,'Isolated later failure',lambda source:source.get('url')==r['source']['url'],['forwardPE'],'primary:factset')
  apply_registry(f)
  self.assertEqual(r['metricDefinitions']['forwardPE']['state'],'not-meaningful');self.assertEqual(r['sync']['status'],'retained')
