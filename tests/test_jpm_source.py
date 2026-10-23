import unittest
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from jpm_source import parse_apac, parse_global
from refresh_indices import update_metrics

APAC = '''APAC ex-Japan equities: Returns and valuations by market
market indices within the MSCI AC Asia Pacific ex-Japan index.
Data reflect most recently available as of 22/10/26.
Australia China Hong Kong India Indonesia South Korea Malaysia New Zealand Philippines Singapore Taiwan Thailand APAC ex-Japan
Forward P/E ratio 18.3x 9.7x 13.7x 18.7x 7.7x 3.9x 13.1x 57.2x 9.7x 16.2x 17.2x 16.1x 9.6x
10-year average 16.5x 11.3x 14.6x 21.0x 14.1x 10.1x 14.8x 33.6x 14.5x 13.7x 15.4x 16.4x 13.6x
Trailing P/B ratio 2.7x 1.3x 1.2x 3.1x 1.5x 1.8x 1.5x 2.3x 1.5x 2.1x 5.2x 2.0x 2.2x
10-year average 2.2x 1.5x 1.1x 3.4x 2.4x 1.1x 1.4x 2.8x 1.9x 1.5x 2.5x 1.9x 1.7x
Dividend Yield 3.3% 1.6% 3.7% 1.3% 8.9% 0.9% 4.1% 2.2% 3.2% 3.2% 1.3% 3.3% 1.7%
10-year average 3.9% 1.4% 3.3% 1.2% 3.6% 1.7% 3.6% 2.9% 1.9% 3.9% 3.2% 2.9% 2.3%'''


class JpmAndMergeTests(unittest.TestCase):
    def test_selects_pe_mean_not_pb_mean_or_yield_mean(self):
        rows = parse_apac(APAC, 37)
        self.assertEqual(rows['china']['forwardPE'], 9.7)
        self.assertEqual(rows['china']['mean10YearForwardPE'], 11.3)
        self.assertEqual(rows['asia-ex-japan']['mean10YearForwardPE'], 13.6)
        self.assertEqual(rows['australia']['dividendYield'], 3.3)
        self.assertEqual(rows['india']['page'], 37)

    def test_rejects_reordered_columns_and_missing_cell(self):
        for body in [APAC.replace('Australia China', 'China Australia'), APAC.replace('18.3x 9.7x', '18.3x')]:
            with self.assertRaises(ValueError): parse_apac(body, 37)

    def test_current_refresh_cannot_erase_independent_history_or_redate_yield(self):
        row = {'forwardPE': 15, 'asOf': '2026-09-30', 'mean10YearForwardPE': 14, 'meanAsOf': '2025-12-31', 'meanMethod': '10-year reference', 'meanSource': {'publisher':'Historical'}, 'dividendYield':2, 'yieldAsOf':'2026-09-30'}
        update_metrics(row, {'forwardPE':16, 'asOf':'2026-10-22', 'mean10YearForwardPE':None}, {'publisher':'Current'}, 'checked')
        self.assertEqual(row['mean10YearForwardPE'],14)
        self.assertEqual(row['meanSource']['publisher'],'Historical')
        self.assertEqual(row['yieldAsOf'],'2026-09-30')
        self.assertEqual(row['asOf'],'2026-10-22')

    def test_old_source_updates_only_a_newer_independent_mean(self):
        row = {'forwardPE':16, 'asOf':'2026-10-22', 'mean10YearForwardPE':14, 'meanAsOf':'2025-12-31'}
        update_metrics(row, {'forwardPE':15, 'asOf':'2026-10-13', 'mean10YearForwardPE':14.5, 'meanAsOf':'2026-10-13', 'meanMethod':'10-year daily mean'}, {'publisher':'Historical'}, 'checked')
        self.assertEqual(row['forwardPE'],16)
        self.assertEqual(row['mean10YearForwardPE'],14.5)
        self.assertEqual(row['meanAsOf'],'2026-10-13')

    def test_invalid_mean_cannot_partially_mutate_current(self):
        row = {'forwardPE':15, 'asOf':'2026-09-30'}
        with self.assertRaises(ValueError):
            update_metrics(row, {'forwardPE':16, 'asOf':'2026-10-22', 'mean10YearForwardPE':14}, {}, 'checked')
        self.assertEqual(row['forwardPE'],15)

    def test_invalid_yield_cannot_partially_mutate_current(self):
        row = {'forwardPE':15, 'asOf':'2026-09-30'}
        with self.assertRaises(ValueError):
            update_metrics(row, {'forwardPE':16, 'asOf':'2026-10-22', 'dividendYield':1001}, {}, 'checked')
        self.assertEqual(row['forwardPE'],15)

    def test_equal_date_prefers_explicit_forward_horizon_but_newer_date_wins(self):
        row = {'forwardPE':12.3, 'asOf':'2026-09-30', 'source':{'adapterId':'edelweiss-reference'}}
        update_metrics(row, {'forwardPE':12, 'asOf':'2026-09-30'}, {'adapterId':'raymond-james-tsx'}, 'checked')
        self.assertEqual(row['forwardPE'],12.3)
        update_metrics(row, {'forwardPE':12.1, 'asOf':'2026-10-01'}, {'adapterId':'raymond-james-tsx'}, 'checked')
        self.assertEqual(row['forwardPE'],12.1)


if __name__ == '__main__': unittest.main()
