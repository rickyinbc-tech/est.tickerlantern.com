import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from scbam_source import parse_scbam_text

# Compact source-contract fixture; original PDF and source pages are not stored.
CHART = '''Source: Bloomberg as of 15 Mar 24, SCBAM Investment Strategy
MSCI ACWI S&P500 STOXX 600 NIKKEI225 CSI300 KOSPI TWSE NIFTY50 SET VN Index
Current z-score
17.6 20.5 13.9 22.0 11.0 10.7 17.6 20.6 14.3 10.9
16.0 17.9 14.5 18.0 12.2 10.5 14.1 17.8 15.4 12.8
0.0 5.0 10.0 15.0 20.0 25.0 Global Equity Market P/E
+/-1 SD Current 10Y Avg High Low Forward 12m P/E (x)'''


class ScbamSource(unittest.TestCase):
    def test_exact_csi_mean_and_source_date(self):
        result = parse_scbam_text(CHART)
        self.assertEqual(list(result), ['csi300'])
        value = result['csi300']
        self.assertEqual(value['mean10YearForwardPE'], 12.2)
        self.assertEqual(value['meanAsOf'], '2024-03-15')
        self.assertEqual(value['page'], 4)
        self.assertNotIn('forwardPE', value)

    def test_wrong_basis_wrong_window_missing_value_and_reordered_categories_fail(self):
        for change in [CHART.replace('Forward 12m', 'Trailing 12m'),
                       CHART.replace('10Y Avg', '5Y Avg'),
                       CHART.replace('12.2 ', ''),
                       CHART.replace('CSI300 KOSPI', 'KOSPI CSI300'),
                       CHART.replace('15 Mar 24', '15 Mar 99')]:
            with self.subTest(change=change), self.assertRaises(ValueError):
                parse_scbam_text(change)

    def test_z_score_is_not_used_and_changed_published_mean_is_read(self):
        result = parse_scbam_text('-0.65\n' + CHART.replace('12.2 ', '12.3 '))
        self.assertEqual(result['csi300']['mean10YearForwardPE'], 12.3)

    def test_pypdf_compact_native_text_headers(self):
        # pypdf 6.14.2 joins adjacent PDF text runs in the chart's axis/legend.
        compact = (CHART.replace('MSCI ACWI', 'MSCIACWI').replace('STOXX 600', 'STOXX600')
                   .replace('+/-1 SD Current 10Y Avg High Low', '+/-1 SDCurrent10Y AvgHighLow')
                   .replace('Forward 12m', 'Forward12m'))
        self.assertEqual(parse_scbam_text(compact)['csi300']['mean10YearForwardPE'], 12.2)

    def test_duplicate_charts_are_rejected(self):
        with self.assertRaises(ValueError):
            parse_scbam_text(CHART + CHART)


if __name__ == '__main__':
    unittest.main()
