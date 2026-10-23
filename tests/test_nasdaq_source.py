import datetime as dt
import unittest
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from nasdaq_source import parse_dashboard, dashboard_links, biweekly_article_links

FIXTURE = '''Nasdaq Global Indexes Investment Insights Global Index Snapshot
Global Equities Last MTD % Change QTD % Change YTD % Change LTM % Change
Dividend Yield NTM P/E NTM P/E 10yr Avg. Last vs. 10yr Avg.
Nasdaq-100® 30,569 0.5% 0.5% 21.1% 23.5% 0.5% 21.36 23.09 -7.5%
Russell 2000 2,783 -0.5% -0.5% 12.1% 13.1% 1.5% 23.87 23.34 +2.3%
MSCI Japan 5,735 -1.0% -1.0% 19.5% 23.6% 1.8% 15.90 15.15 +5.0%
Thematic Equity NTM P/E NTM P/E 5yr Avg.
All figures are shown in spot price terms in USD, unless otherwise noted.
Averages utilize daily data (NTM P/E, volatility indexes).
Source: Nasdaq Global Indexes, Bloomberg, FactSet. Data as of 10/13/2026.'''


class NasdaqSourceTests(unittest.TestCase):
    def test_exact_daily_means_and_observation_date(self):
        rows = parse_dashboard(FIXTURE, dt.date(2026, 10, 22))
        self.assertEqual(rows['nasdaq100']['forwardPE'], 21.36)
        self.assertEqual(rows['nasdaq100']['mean10YearForwardPE'], 23.09)
        self.assertEqual(rows['russell2000']['forwardPE'], 23.87)
        self.assertEqual(rows['russell2000']['mean10YearForwardPE'], 23.34)
        self.assertEqual(rows['japan']['dividendYield'], 1.8)
        self.assertEqual(rows['japan']['asOf'], '2026-10-13')

    def test_rejects_five_year_replacement(self):
        with self.assertRaises(ValueError):
            parse_dashboard(FIXTURE.replace('10yr Avg.', '5yr Avg.'))

    def test_rejects_wrong_index_and_duplicate_row(self):
        for text in [FIXTURE.replace('MSCI Japan', 'Nikkei 225'), FIXTURE.replace('Thematic Equity', 'Russell 2000 2,783 -0.5% -0.5% 12.1% 13.1% 1.5% 23.87 23.34 +2.3% Thematic Equity')]:
            with self.assertRaises(ValueError):
                parse_dashboard(text)

    def test_rejects_conflicting_or_future_date(self):
        with self.assertRaises(ValueError):
            parse_dashboard(FIXTURE + ' Data as of 10/14/2026.')
        with self.assertRaises(ValueError):
            parse_dashboard(FIXTURE, dt.date(2026, 10, 12))

    def test_rejects_shifted_columns(self):
        with self.assertRaises(ValueError):
            parse_dashboard(FIXTURE.replace('21.36 23.09', '23.09 21.36'))

    def test_only_official_linked_dashboard_documents(self):
        body = '<a href="/docs/global-indexes/global-markets-dashboard-oct-16-2026">PDF</a><a href="https://evil.example/docs/global-markets-dashboard.pdf">x</a>'
        self.assertEqual(dashboard_links(body), ['https://www.nasdaq.com/docs/global-indexes/global-markets-dashboard-oct-16-2026'])
        xml = '<url><loc>https://www.nasdaq.com/articles/global-indexes/biweekly-investment-insights/example</loc></url>'
        self.assertEqual(biweekly_article_links(xml), ['https://www.nasdaq.com/articles/global-indexes/biweekly-investment-insights/example'])


if __name__ == '__main__':
    unittest.main()
