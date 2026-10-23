import datetime as dt
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('ig_source', Path(__file__).resolve().parents[1] / 'scripts/ig_source.py')
source = importlib.util.module_from_spec(spec)
spec.loader.exec_module(source)

FIXTURE = '''<html><meta name="published_at" content="2025-12-22"><body>
<h2>Hang Seng Index</h2><p>The Hang Seng Index’s forward 12-month price-to-earnings (P/E) ratio currently stands at 11.8x according to LSEG IBES, almost one standard deviation above the index’s 10-year average forward P/E ratio of 10.7x.</p>
<h2>Nikkei 225 Index</h2><p>Earnings growth is expected to accelerate, projecting 9% growth over the next 12 months.</p><p>The forward P/E ratio climbing from April’s low of around 13x to 22x, reflecting investor optimism. While this appears elevated relative to the 10-year average of 18x, historical comparisons need context.</p>
<p>The figures stated are as of 2 December 2025 unless otherwise stated.</p></body></html>'''


class IgSourceTests(unittest.TestCase):
    def test_exact_sections_and_observation_date(self):
        rows, published = source.parse_ig_asia(FIXTURE, dt.date(2026, 10, 22))
        self.assertEqual(published, '2025-12-22')
        self.assertEqual(rows['hangseng']['forwardPE'], 11.8)
        self.assertEqual(rows['hangseng']['mean10YearForwardPE'], 10.7)
        self.assertEqual(rows['nikkei225']['forwardPE'], 22)
        self.assertEqual(rows['nikkei225']['mean10YearForwardPE'], 18)
        self.assertEqual(rows['nikkei225']['asOf'], '2025-12-02')

    def test_historical_low_is_not_current_nikkei(self):
        rows, _ = source.parse_ig_asia(FIXTURE)
        self.assertNotEqual(rows['nikkei225']['forwardPE'], 13)

    def test_five_year_mean_is_rejected(self):
        with self.assertRaises(ValueError):
            source.parse_ig_asia(FIXTURE.replace('10-year average', '5-year average'))

    def test_missing_or_future_dates_are_rejected(self):
        for fixture in [FIXTURE.replace('published_at', 'other_meta'), FIXTURE.replace('2 December 2025', '2 December 2026'), FIXTURE.replace('2 December 2025', 'not specified')]:
            with self.subTest(fixture=fixture), self.assertRaises(ValueError):
                source.parse_ig_asia(fixture, dt.date(2026, 10, 22))

    def test_wrong_benchmark_is_rejected(self):
        with self.assertRaises(ValueError):
            source.parse_ig_asia(FIXTURE.replace('<h2>Nikkei 225 Index</h2>', '<h2>MSCI Japan Index</h2>'))

    def test_duplicate_valuation_is_rejected(self):
        fixture = FIXTURE.replace('</body>', FIXTURE.split('<h2>Nikkei 225 Index</h2>')[1].split('<p>The figures')[0] + '</body>')
        with self.assertRaises(ValueError):
            source.parse_ig_asia(fixture)


if __name__ == '__main__':
    unittest.main()
