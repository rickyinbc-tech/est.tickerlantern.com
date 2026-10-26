"""Controlled failures use isolated fixtures, never published financial changes."""
import copy
import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
import public_http
import snapshot
import refresh_indices
from source_jobs import merge_observations

ROOT=Path(__file__).resolve().parents[1]

def current(): return json.loads((ROOT/'data/indices.json').read_text())


class PublicTransport(unittest.TestCase):
    def response(self,status=200,body=b'<html>Public article</html>',mime='text/html',location=None):
        def run(args,**kwargs):
            headers='HTTP/1.1 '+str(status)+'\r\n'
            if location: headers+='Location: '+location+'\r\n'
            Path(args[args.index('--dump-header')+1]).write_text(headers)
            return subprocess.CompletedProcess(args,0,body+b'\n'+str(status).encode()+b'\n'+mime.encode(),b'')
        return run
    def test_redirect_is_validated_before_off_allowlist_request(self):
        with patch.object(public_http.subprocess,'run',side_effect=self.response(302,location='https://unreviewed.example/report.pdf')) as call:
            with self.assertRaisesRegex(ValueError,'Unapproved'): public_http.request('https://publisher.example/report',{'publisher.example'})
            self.assertEqual(call.call_count,1)
    def test_same_publisher_redirect_is_bounded_and_validated(self):
        replies=iter([self.response(302,location='/latest'),self.response()])
        with patch.object(public_http.subprocess,'run',side_effect=lambda args,**kwargs:next(replies)(args,**kwargs)) as call:
            body,status=public_http.request('https://publisher.example/report',{'publisher.example'})
            self.assertEqual(status,200);self.assertIn(b'Public article',body);self.assertEqual(call.call_count,2)
            self.assertEqual(call.call_args.args[0][-1],'https://publisher.example/latest')
    def test_denial_wrong_content_and_truncated_pdf_are_failures(self):
        for body,mime,url in [(b'<html>Verify you are human</html>','text/html','https://publisher.example/report'),(b'%PDF-1.4 truncated','application/pdf','https://publisher.example/report.pdf'),(b'<html>Loading</html>','application/pdf','https://publisher.example/report.pdf'),(b'123','image/png','https://publisher.example/report')]:
            with self.subTest(body=body),self.assertRaises(ValueError): public_http.validate_body(body,mime,url)
    def test_publisher_eof_marker_without_final_byte_needs_a_real_xref(self):
        body=b'%PDF-1.4\n1 0 obj\n<<>>\nendobj\nxref\n0 1\n0000000000 65535 f \ntrailer\n<< /Size 1 >>\nstartxref\n'
        complete=body.replace(b'startxref\n',b'startxref\n%d\n%%%%EO' % body.index(b'xref'))
        self.assertEqual(public_http.validate_body(complete,'application/pdf','https://publisher.example/report.pdf'),complete)
        for broken in [complete[:-1],complete.replace(b'startxref\n%d' % body.index(b'xref'),b'startxref\n9999'),complete.replace(b'startxref\n%d' % body.index(b'xref'),b'startxref\n3')]:
            with self.subTest(broken=broken[-20:]),self.assertRaises(ValueError): public_http.validate_body(broken,'application/pdf','https://publisher.example/report.pdf')
    def test_http_timeout_and_rate_limit_fail_closed(self):
        with patch.object(public_http.subprocess,'run',return_value=subprocess.CompletedProcess([],28,b'',b'timeout')):
            with self.assertRaisesRegex(ValueError,'unavailable'):public_http.request('https://publisher.example/report',{'publisher.example'})
        with patch.object(public_http.subprocess,'run',side_effect=self.response(429)):
            with self.assertRaisesRegex(ValueError,'HTTP 429'):public_http.request('https://publisher.example/report',{'publisher.example'})

    def test_no_source_range_clamping(self):
        for value in [0,200,-4]: self.assertEqual(refresh_indices.valid_pe(value),value)
        for value in [float('nan'),float('inf'),True,1e7]:
            with self.assertRaises(ValueError):refresh_indices.valid_pe(value)


class AtomicSnapshots(unittest.TestCase):
    def test_check_or_irrelevant_source_html_change_is_not_new_financial_observation(self):
        feed=current(); previous=snapshot.finalize(copy.deepcopy(feed),feed)
        checked=copy.deepcopy(previous);checked['publishedAt']=snapshot.utcnow()
        checked['indices'][0]['source']['sha256']='b'*64
        checked['indices'][0]['source']['checkedAt']=snapshot.utcnow()
        after=snapshot.finalize(checked,previous)
        self.assertEqual(after['snapshotId'],previous['snapshotId'])
        self.assertEqual(after['snapshotVersion'],previous['snapshotVersion'])
        self.assertEqual(after['changeHistory'],previous['changeHistory'])
    def test_same_date_correction_keeps_observation_date_and_records_semantic_change(self):
        feed=current(); previous=snapshot.finalize(copy.deepcopy(feed),feed)
        changed=copy.deepcopy(previous);changed['publishedAt']=snapshot.utcnow();changed['indices'][0]['forwardPE']+=.1
        after=snapshot.finalize(changed,previous)
        self.assertEqual(after['snapshotVersion'],previous['snapshotVersion']+1)
        self.assertNotEqual(after['snapshotId'],previous['snapshotId'])
        self.assertEqual(after['indices'][0]['asOf'],previous['indices'][0]['asOf'])
        self.assertEqual(after['changeHistory'][-1]['changes'][0]['reason'],'same-date-correction-or-definition-change')
    def test_invalid_candidate_cannot_replace_accepted_file(self):
        with tempfile.TemporaryDirectory() as folder:
            path=Path(folder)/'indices.json';path.write_text('accepted')
            with patch.object(snapshot.os,'replace',side_effect=OSError('Disk unavailable')):
                with self.assertRaises(OSError):snapshot.atomic_write(path,{'candidate':True})
            self.assertEqual(path.read_text(),'accepted');self.assertEqual(len(list(Path(folder).iterdir())),1)
    def test_related_source_bundle_is_atomic_and_rejects_wrong_identity(self):
        rows={'sp500':{'forwardPE':19,'asOf':'2026-10-16'},'world':{'forwardPE':17,'asOf':'2026-09-30'}};old=copy.deepcopy(rows)
        observations=[({'sp500':{'forwardPE':20,'asOf':'2026-10-20'},'world':{'forwardPE':18,'asOf':'2026-10-20','mean10YearForwardPE':14}}, {'publisher':'Test'})]
        with self.assertRaises(ValueError):merge_observations(rows,list(rows),observations,refresh_indices.update_metrics,snapshot.utcnow(),'test')
        self.assertEqual(rows,old)
        with self.assertRaises(ValueError):merge_observations(rows,list(rows),[({'spy-etf':{}},{})],refresh_indices.update_metrics,snapshot.utcnow(),'test')
    def test_independent_metric_can_update_without_erasing_retained_mean(self):
        row={'forwardPE':19,'asOf':'2026-10-16','mean10YearForwardPE':18,'meanAsOf':'2025-12-31','meanMethod':'10-year mean','meanSource':{'publisher':'History','url':'https://history.example/report'}}
        refresh_indices.update_metrics(row,{'forwardPE':20,'asOf':'2026-10-20'},{'publisher':'Current'},snapshot.utcnow())
        self.assertEqual(row['meanAsOf'],'2025-12-31');self.assertEqual(row['mean10YearForwardPE'],18)
    def test_valuation_refresh_retains_other_pipeline_metadata_when_all_sources_fail(self):
        feed=current()
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);(root/'data').mkdir();(root/'data/indices.json').write_text(json.dumps(feed));(root/'data/catalog.json').write_text((ROOT/'data/catalog.json').read_text())
            with patch.object(refresh_indices,'ROOT',root),patch.object(refresh_indices,'fetch',side_effect=ValueError('Timeout')),patch.object(refresh_indices.time,'sleep'),patch('source_jobs.refresh_supplemental',return_value=[]),patch('builtins.print'):
                after=refresh_indices.refresh()
        self.assertEqual(after.get('growthRefresh'),feed.get('growthRefresh'))
        self.assertEqual(after.get('growthCheckAt'),feed.get('growthCheckAt'))
        for before,after_row in zip(feed['indices'],after['indices']):self.assertEqual(after_row['growthForecast'],before['growthForecast'])
    def test_only_actual_schedule_event_records_scheduled_check(self):
        feed=current()
        with patch.dict(os.environ,{'GITHUB_EVENT_NAME':'workflow_dispatch','GITHUB_RUN_ID':'123'}): manual=snapshot.finalize(copy.deepcopy(feed),feed)
        self.assertEqual(manual.get('lastScheduledCheckAt'),feed.get('lastScheduledCheckAt'))
        with patch.dict(os.environ,{'GITHUB_EVENT_NAME':'schedule','GITHUB_RUN_ID':'124'}): scheduled=snapshot.finalize(copy.deepcopy(feed),feed)
        self.assertEqual(scheduled['lastScheduledCheckAt'],scheduled['publishedAt']);self.assertEqual(scheduled['pipelineRun']['event'],'schedule')
