"""Economic-definition and per-metric provenance contract; public observations only."""
import copy
import json
import sys
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from definition_registry import apply_registry
ROOT=Path(__file__).resolve().parents[1]


class DefinitionRegistryTests(unittest.TestCase):
    def setUp(self):
        self.feed=json.loads((ROOT/'data/indices.json').read_text())
        for row in self.feed['indices']:
            row.pop('metricDefinitions',None);row.pop('historicalCompatibility',None)
        self.rows={r['id']:r for r in self.feed['indices']}

    def enrich(self,previous=None):
        apply_registry(self.feed,previous)
        return self.rows

    def test_complete_catalogue_has_four_metrics_and_each_benchmark_has_a_dividend_anchor(self):
        self.enrich()
        self.assertEqual(len(self.rows),21)
        self.assertEqual(sum(len(r['metricDefinitions']) for r in self.rows.values()),84)
        self.assertEqual(sum(r['metricDefinitions']['dividendYield']['state']=='numeric' for r in self.rows.values()),21)
        observed=self.rows['sp500']['metricDefinitions']['dividendYield']
        self.assertEqual(observed['evidence']['observationDate'],'2026-10-21')
        self.assertIn('first-payment-anchor',observed['permittedUse'])
        self.rows['sp500']['dividendYield']=None
        self.enrich()
        missing=self.rows['sp500']['metricDefinitions']['dividendYield']
        self.assertIsNone(missing['evidence']['observationDate'])
        self.assertIsNone(missing['evidence']['url'])
        self.assertEqual(missing['permittedUse'],[])

    def test_same_document_ntm_pairs_eligible_cross_provider_or_unknown_horizon_blocked(self):
        self.enrich()
        for name in ['sp500','nasdaq100','russell2000','stoxx600','ftse100','hangseng']:
            self.assertTrue(self.rows[name]['historicalCompatibility']['allowExitDefault'],name)
        for name in ['em','tsx','nikkei225','world','australia']:
            self.assertFalse(self.rows[name]['historicalCompatibility']['allowComparison'],name)
            self.assertEqual(self.rows[name]['historicalCompatibility']['outcome'],'qualified')
        self.assertEqual(self.rows['australia']['metricDefinitions']['forwardPE']['economic']['horizon'],'forward-unspecified')

    def test_metric_evidence_retains_independent_dates_and_unknown_windows(self):
        self.enrich();em=self.rows['em']['metricDefinitions']
        self.assertEqual(em['forwardPE']['observationDate'],'2026-10-22')
        self.assertEqual(em['mean10YearForwardPE']['observationDate'],'2025-12-31')
        self.assertEqual(em['dividendYield']['observationDate'],'2026-09-30')
        self.assertEqual(em['dividendYield']['evidence']['publisher'],'MSCI')
        for key in ['windowStart','windowEnd']:
            self.assertIsNone(em['mean10YearForwardPE']['history'][key])
        self.assertEqual(self.rows['nasdaq100']['metricDefinitions']['mean10YearForwardPE']['history']['samplingFrequency'],'daily')
        self.assertEqual(self.rows['sp500']['metricDefinitions']['mean10YearForwardPE']['history']['samplingFrequency'],'not disclosed')

    def test_source_definition_change_blocks_paired_history(self):
        self.rows['sp500']['source']['economicDefinition']={'negativeEarners':'excluded'}
        self.enrich()
        r=self.rows['sp500']
        self.assertEqual(r['metricDefinitions']['forwardPE']['evidenceStatus'],'definition-review-required')
        self.assertFalse(r['historicalCompatibility']['allowComparison'])
        self.rows['sp500']['earningsBasis']='next fiscal year FY1'
        self.enrich()
        self.assertEqual(self.rows['sp500']['metricDefinitions']['forwardPE']['economic']['horizon'],'changed-or-fiscal-basis')

    def test_missing_not_meaningful_and_zero_are_distinct(self):
        self.rows['sp500']['forwardPE']=None
        self.rows['sp500']['metricStates']={'forwardPE':'not-meaningful'}
        self.rows['sp500']['metricRawValues']={'forwardPE':19.0}  # Prior numeric evidence must not survive N/M.
        self.rows['sp500']['sync']['status']='not-meaningful'
        self.rows['sp500']['dividendYield']=0
        self.enrich()
        d=self.rows['sp500']['metricDefinitions']
        self.assertEqual(d['forwardPE']['state'],'not-meaningful')
        self.assertEqual(d['forwardPE']['rawReportedValue'],'N/M')
        self.assertIsNotNone(d['forwardPE']['evidence']['url'])
        self.assertEqual(d['dividendYield']['state'],'numeric')
        self.assertEqual(d['dividendYield']['rawReportedValue'],0)
        self.assertFalse(self.rows['sp500']['historicalCompatibility']['allowExitDefault'])
        self.rows['sp500']['metricRawValues']['forwardPE']='NM'
        self.enrich()
        self.assertEqual(self.rows['sp500']['metricDefinitions']['forwardPE']['rawReportedValue'],'NM')

    def test_check_only_change_does_not_invent_observation_or_accepted_change(self):
        self.enrich();previous=copy.deepcopy(self.feed)
        self.rows['sp500']['source']['checkedAt']='2026-10-23T12:00:00Z'
        self.rows['sp500']['source']['sha256']='a'*64
        self.enrich(previous)
        d=self.rows['sp500']['metricDefinitions']['forwardPE']
        self.assertIsNone(d['evidence']['latestAcceptedChange'])
        self.assertEqual(d['observationDate'],'2026-10-16')
        self.assertIn('publication-date-only',d['dateBasis'])
        self.rows['sp500']['forwardPE']=19.2
        self.enrich(previous)
        self.assertEqual(self.rows['sp500']['metricDefinitions']['forwardPE']['evidence']['latestAcceptedChange'],self.feed['publishedAt'])

    def test_retained_forecast_check_does_not_advance_successful_validation(self):
        r=self.rows['russell2000']['growthForecast'];old_success=r['sync']['lastSuccess'];obs=r['asOf']
        r['sync'].update(status='retained',lastAttempt='2026-10-23T12:00:00Z',error='Source blocked')
        self.enrich();d=self.rows['russell2000']['metricDefinitions']['growthForecast']
        self.assertEqual(d['evidence']['lastSuccess'],old_success)
        self.assertEqual(d['observationDate'],obs)
        self.assertEqual(d['classification'],'estimate-based-published-statistic')
        self.assertEqual(d['periodMapping']['modelUse'],'approximate scenario growth of synthetic anchor; not independently matched rolling-NTM growth')

    def test_unknown_publisher_does_not_inherit_known_adapter_definition(self):
        r=self.rows['nasdaq100'];r['source']['publisher']='Unknown ETF vendor'
        self.enrich();d=r['metricDefinitions']['forwardPE']
        self.assertEqual(d['definitionId'],'unknown:forwardPE')
        self.assertEqual(d['permittedUse'],['display'])
        self.assertFalse(r['historicalCompatibility']['allowComparison'])

    def test_identity_variant_and_precision_do_not_imply_currency_or_tax_returns(self):
        self.enrich();r=self.rows['msci-canada'];d=r['metricDefinitions']['dividendYield']
        self.assertEqual(d['precisionDecimals'],2)
        self.assertEqual(d['evidence']['documentReturnContext'],'CAD net-return chart')
        self.assertIn('gross',d['economic']['taxTreatment'])
        self.assertIn('synthetic',r['benchmarkDefinition']['currency'])
        self.assertFalse(r['benchmarkDefinition']['substitutionsAllowed'])

if __name__=='__main__':unittest.main()
