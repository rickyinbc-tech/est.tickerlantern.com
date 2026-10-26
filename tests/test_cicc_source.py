import datetime as dt
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from cicc_source import parse_cicc_text

# Compact source-contract fixture; the original page is not stored.
PAGE = '''<html><head><script type="application/ld+json">{"datePublished": "2026-10-26T09:58:04+0800"}</script></head><body>
<p>10月26日，中金公司发布研报称，今年下半年中国资本市场回调幅度较大。</p>
<p>根据Wind数据，截至10月23日，1）A股市场方面，沪深300指数前向市盈率11.9x，前向市净率1.1x，低于过去十年的历史均值（12.1x和1.2x），相比年内高点（14.7x和1.3x）回落19.0%、15.5%。</p>
<p>当前沪深300前向市盈率约11.9x，港股恒生指数估值为10.5x。</p></body></html>'''
TODAY = dt.date(2026, 10, 26)


class CiccSourceTests(unittest.TestCase):
    def test_exact_mean_and_wind_date(self):
        values, published = parse_cicc_text(PAGE, TODAY)
        self.assertEqual(published, '2026-10-26')
        self.assertEqual(list(values), ['csi300'])
        row = values['csi300']
        self.assertEqual(row['mean10YearForwardPE'], 12.1)
        self.assertEqual(row['meanAsOf'], '2026-10-23')
        self.assertNotIn('forwardPE', row)

    def test_pb_mean_and_year_high_are_not_read(self):
        values, _ = parse_cicc_text(PAGE.replace('（12.1x和1.2x）', '（12.4x和1.2x）'), TODAY)
        self.assertEqual(values['csi300']['mean10YearForwardPE'], 12.4)

    def test_changed_window_benchmark_attribution_or_date_fails(self):
        for change in [PAGE.replace('过去十年', '过去五年'),
                       PAGE.replace('沪深300指数前向市盈率', '中证500指数前向市盈率'),
                       PAGE.replace('中金公司发布研报', '某机构发布研报'),
                       PAGE.replace('截至10月23日', '截至12月23日'),
                       PAGE.replace('"datePublished": "2026-10-26T09:58:04+0800"', ''),
                       PAGE + PAGE.split('<body>')[1]]:
            with self.subTest(change=change[-60:]), self.assertRaises(ValueError):
                parse_cicc_text(change, TODAY)

    def test_year_end_observation_uses_prior_year(self):
        page = PAGE.replace('2026-10-26T', '2027-01-04T').replace('截至10月23日', '截至12月31日')
        values, _ = parse_cicc_text(page, dt.date(2027, 1, 5))
        self.assertEqual(values['csi300']['meanAsOf'], '2026-12-31')


if __name__ == '__main__':
    unittest.main()
