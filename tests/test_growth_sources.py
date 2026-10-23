"""Synthetic publisher-shaped fixtures: dates, identities and forecast grain."""
import copy
import json
import sys
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
import growth_sources as g
import refresh_growth as refresh


def document(*pages):
    return SimpleNamespace(pages=[SimpleNamespace(extract_text=lambda text=t, **kw: text) for t in pages])


class GrowthSources(unittest.TestCase):
    def test_factset_selects_annual_earnings_not_quarters_or_revenue(self):
        pages = document('EARNINGS INSIGHT October 16, 2026', 'S&P 500\nFor Q4 2026, analysts are projecting earnings growth of 99%.\nFor CY 2026, analysts are projecting earnings growth of 31% and revenue growth of 12%.\nFor CY 2027, analysts are projecting earnings growth of 14% and revenue growth of 9%.')
        with patch.object(g, 'pdf', return_value=pages):
            result = g.parse_factset(b'fixture')['sp500']
        self.assertEqual([(x['year'], x['growth']) for x in result['estimates']], [(2026,31),(2027,14)])
        self.assertEqual(result['asOf'], '2026-10-16')

    def test_nbf_excludes_history_and_ntm_and_rejects_wrong_benchmark(self):
        text = '2025 2026 2027 2028\n12 months\nforward\nMSCI ACWI 1 2 3 4 99\nMSCI World 5 6 7 8 98\nMSCI Canada 9 10 11 12 97\nMSCI Europe -1 -2 -3 -4 96\n8/28/26\nMSCI composite index: EPS Performance\nNBF data via Refinitiv'
        with patch.object(g, 'pdf', return_value=document(text)):
            rows = g.parse_nbf(b'fixture')
        self.assertEqual([p['growth'] for p in rows['europe']['estimates']], [-2,-3,-4])
        self.assertEqual([p['year'] for p in rows['acwi']['estimates']], [2026,2027,2028])
        with patch.object(g, 'pdf', return_value=document(text.replace('MSCI Canada','S&P/TSX'))):
            with self.assertRaises(ValueError): g.parse_nbf(b'fixture')

    def test_ubs_resolves_relative_years_and_requires_full_annual_pair(self):
        body = b'"dateCreated":"2026-10-07T10:00:00" Consensus estimates project the Nasdaq 100 to grow earnings by 43% this year and 28% next year.'
        self.assertEqual(g.parse_ubs(body)['nasdaq100']['estimates'][1]['year'], 2027)
        for bad in [body.replace(b'Nasdaq 100',b'S&P 500'),body.replace(b'this year',b'this quarter'),body.replace(b'dateCreated',b'unknownDate')]:
            with self.assertRaises(ValueError): g.parse_ubs(bad)

    def test_russell_keeps_underlying_data_date(self):
        text = 'published forecasts reflect 85% earnings growth for the Russell 2000 in 2026 and 44% in 2027 compared to 27% and 18% for another index. Source: LSEG I/B/E/S; data as of July 9, 2026.'
        with patch.object(g, 'pdf', return_value=document(text)):
            row = g.parse_firsteagle(b'fixture')['russell2000']
        self.assertEqual(row['asOf'],'2026-07-09')
        self.assertEqual([p['growth'] for p in row['estimates']],[85,44])

    def test_amova_median_and_endpoint_labels_remain_house_horizons(self):
        header = 'Global Investment Strategy Committee Outlook Q4 2026\nGISC) convened on 30 September.\n'
        block = '\n'.join(f'{m}-{y} 1% {v}% 90% 10 11 12 100 110 120' for m,y,v in [('Sep',2026,2),('Dec',2026,3),('Mar',2027,4),('Jun',2027,5),('Sep',2027,6)])
        text = header + '\n'.join(block + '\nEPS Growth Scenarios PE Ratio Index Price\n' + name for name in ['Nikkei 225','STOXX Europe 600','FTSE 100','Hang Seng Index'])
        with patch.object(g, 'pdf', return_value=document(text)):
            rows = g.parse_amova(b'fixture')
        self.assertEqual(rows['ftse100']['estimates'], [dict(year=2026,growth=3.0,periodLabel='Dec-2026 EPS growth scenario'),dict(year=2027,growth=6.0,periodLabel='Sep-2027 EPS growth scenario')])
        with patch.object(g, 'pdf', return_value=document(text.replace('FTSE 100','MSCI UK'))):
            with self.assertRaises(ValueError): g.parse_amova(b'fixture')

    def test_fsm_binds_observation_to_eps_table_not_other_tables(self):
        content = 'Data as of 31 December 2025<table><tr><td>CSI 300 (000300.SH)</td><td>2025A</td><td>2026E</td><td>2027E</td><td>2028E</td></tr><tr><td>EPS Growth</td><td>6%</td><td>9%</td><td>12%</td><td>6%</td></tr></table>Source iFAST. Data as of 14 May 2026'
        body = json.dumps(dict(title='China CSI300',content=content)).encode()
        row = g.parse_fsm(body)['csi300']
        self.assertEqual(row['asOf'],'2026-05-14')
        self.assertEqual([p['growth'] for p in row['estimates']],[9,12,6])
        with self.assertRaises(ValueError): g.parse_fsm(body.replace(b'EPS Growth',b'GDP Growth'))

    def test_source_update_cannot_regress_or_relabel_observation_date(self):
        old = dict(id='test',forwardPE=21,growthForecast=dict(asOf='2026-10-16'))
        job = dict(publisher='Example',discoveryUrl='https://example.com',adapter='factset',indices={'test':dict(forecastType='consensus',periodBasis='calendar-year',method='Example')})
        with self.assertRaises(ValueError): refresh.update(old, g.result('2026-10-15',[2027],[16]),job,'https://example.com',b'x','2026-10-23T00:00:00Z')
        refresh.update(old, g.result('2026-10-16',[2027],[16]),job,'https://example.com',b'x','2026-10-23T00:00:00Z')
        self.assertEqual(old['growthForecast']['asOf'],'2026-10-16')
        self.assertEqual(old['growthForecast']['source']['checkedAt'],'2026-10-23T00:00:00Z')
        self.assertEqual(old['forwardPE'],21)

    def test_failed_growth_job_retains_original_rates_dates_and_valuation(self):
        feed = json.loads((Path(__file__).resolve().parents[1]/'data/indices.json').read_text())
        row = feed['indices'][0]
        original = copy.deepcopy(row)
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder)/'indices.json'; path.write_text(json.dumps(feed))
            with patch.object(refresh,'discover',side_effect=ValueError('Changed source layout')):
                self.assertFalse(refresh.refresh(path,jobs=[dict(adapter='nbf',indices={'sp500':{}})],client=object()))
            row = json.loads(path.read_text())['indices'][0]
        for key in ['asOf','estimates','source']: self.assertEqual(row['growthForecast'][key], original['growthForecast'][key])
        self.assertEqual(row['growthForecast']['sync']['status'],'retained')
        self.assertEqual(row['forwardPE'],original['forwardPE'])


if __name__ == '__main__': unittest.main()
