import datetime as dt
import sys
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from tsx_source import parse_raymond_james, parse_cumberland, parse_global_indices, raymond_james_links, raymond_james_article_links, cumberland_report_links

RJ = '''Investment Strategy (Canada)
Table 2 - S&P/TSX Composite Sector Performance and Valuations (Ranked by 3Q26 Total Return)
Sector Name Sector Weight YTD Total Return 3Q26 Total Return 1M Total Return Current P/E NTM Historical P/E NTM
Information Technology 8.8% -2.8% 17.9% 3.5% 29.1 23.8
S&P/TSX Composite -- 13.0% 1.6% -2.6% 15.6 14.6
Financials 34.2% 19.5% -3.0% -1.1% 14.0 11.5
Source: FactSet, Raymond James Ltd.; Data as of September 30, 2026.
Chart 31 - S&P/TSX Composite Sector Current vs. Historical P/E NTM
Historical P/E: 1/1/2000 – 9/30/2026. Excluding outliers.'''
CP = '''Cumberland Private Wealth
Exhibit 10: S&P500 and TSX Earnings and Valuation
S&P500 S&P/TSX
YEAR EPS % change P/E EPS % change P/E
2025 264.38 - 23.5x 1,582.29 - 17.0x
2026 296.85 12.3% 20.9x 1,763.39 11.5% 15.2x
2027 327.89 10.5% 18.9x 1,861.95 5.6% 14.4x
10-year Average 18.6x 15.1x
Source: Bloomberg & CPWM, 06/30/2025. 10-year average uses forward P/E (blended forward 12 months). EPS estimates shown are on a calendar year basis.'''
GLOBAL = '''Investment Strategy (Canada)
Table 3 - Global Equities Performance
Select Global Equity Indices Sep (in LCL) Sep (in USD) Sep (in CAD) 3Q26 (in LCL) 3Q26 (in USD) 3Q26 (in CAD) YTD (in LCL) YTD (in USD) YTD (in CAD) Current PE NTM Historical PE Median Premium (RED) / Discount (GREEN)
Major Aggregates
World (Global)* -1.2 -1.2 1.1 1.7 1.7 1.7 11.7 11.7 15.7 17.8 16.2 1.6
Selected Developed Markets
Nikkei 225 (Japan) 1.3 2.9 5.4 -4.1 -0.8 -0.7 34.6 33.9 38.9 19.7 17.4 2.3
FTSE 100 (U.K.) -2.0 -4.1 -1.9 1.8 1.1 1.2 9.6 5.5 9.2 12.0 12.3 -0.4
Hang Seng (Hong Kong) -3.3 -3.4 -1.0 8.6 8.6 8.7 -1.4 -2.2 1.3 10.2 11.6 -1.4
Selected Emerging Markets
CSI 300 (China) -5.6 -5.4 -3.0 -11.7 -10.6 -10.6 -4.1 0.0 3.6 14.1 14.0 0.1
Source: FactSet, Raymond James Ltd.; Total returns, data as of September 30, 2026. LCL: listed in local currency. Historical P/E Median: 1/1/2000 – 09/30/2026. *Indices are represented by their corresponding iShares ETFs, serving as proxies.'''


class TsxSourceTests(unittest.TestCase):
    def test_current_ntm_with_exact_independent_date_and_page(self):
        row = parse_raymond_james(['cover', RJ], dt.date(2026, 10, 22))
        self.assertEqual(row['forwardPE'], 15.6)
        self.assertEqual(row['asOf'], '2026-09-30')
        self.assertEqual(row['sourcePage'], 2)
        self.assertNotIn('mean10YearForwardPE', row)

    def test_mean_bf12_not_calendar_year_with_date_and_page(self):
        row = parse_cumberland(['cover', CP], dt.date(2026, 10, 22))
        self.assertEqual(row['mean10YearForwardPE'], 15.1)
        self.assertEqual(row['meanAsOf'], '2025-06-30')
        self.assertEqual(row['sourcePage'], 2)
        self.assertNotIn('forwardPE', row)

    def test_current_rejects_wrong_identity_duplicate_or_shifted_columns(self):
        for pages in [[RJ.replace('S&P/TSX Composite --', 'MSCI Canada --')], [RJ, RJ], [RJ.replace('Current P/E NTM Historical P/E NTM', 'Historical P/E NTM Current P/E NTM')]]:
            with self.assertRaises(ValueError):
                parse_raymond_james(pages)

    def test_mean_rejects_wrong_definition_missing_table_and_bad_date(self):
        for text in [CP.replace('blended forward 12 months', 'calendar year'), CP.replace('10-year Average', '20-year Average'), CP.replace('06/30/2025', '06/30/2099')]:
            with self.assertRaises(ValueError):
                parse_cumberland([text])

    def test_future_current_date_rejected(self):
        with self.assertRaises(ValueError):
            parse_raymond_james([RJ], dt.date(2026, 9, 29))

    def test_only_publisher_linked_sources(self):
        article = 'https://www.goodridgegroup.ca/knowledge-centre/2026/10/08/insights-and-strategies'
        path = '/-/media/RJ/DotCom-Canada/Files/Commentary-and-Insights/Insights-and-strategies/Insights--Strategies-October-2026.pdf'
        self.assertEqual(raymond_james_article_links('<url><loc>' + article + '</loc></url>'), [article])
        self.assertEqual(raymond_james_links('<a href="' + path + '">PDF</a>'), ['https://www.goodridgegroup.ca' + path])
        self.assertEqual(raymond_james_links('<a href="https://evil.example' + path + '">PDF</a>'), [])
        pdf = 'https://cumberlandprivate.com/wp-content/uploads/2025/07/North-American-Strategy-Review-June-2025.pdf'
        self.assertEqual(cumberland_report_links([{'content': {'rendered': '<a href="' + pdf + '">PDF</a>'}}]), [pdf])

    def test_exact_global_indices_are_not_the_starred_etf_rows(self):
        rows = parse_global_indices(['cover', GLOBAL], dt.date(2026, 10, 22))
        self.assertEqual(set(rows), {'nikkei225', 'ftse100', 'hangseng', 'csi300'})
        self.assertEqual([rows[k]['forwardPE'] for k in ['nikkei225', 'ftse100', 'hangseng', 'csi300']], [19.7, 12.0, 10.2, 14.1])
        self.assertTrue(all(r['asOf'] == '2026-09-30' and r['sourcePage'] == 2 for r in rows.values()))
        self.assertTrue(all('mean10YearForwardPE' not in r for r in rows.values()))

    def test_global_wrong_identity_starred_row_order_and_date_rejected(self):
        for text in [GLOBAL.replace('CSI 300 (China)', 'Shanghai Composite (China)'),
                     GLOBAL.replace('FTSE 100 (U.K.)', 'FTSE 100 (U.K.)*'),
                     GLOBAL.replace('Current PE NTM Historical PE Median', 'Historical PE Median Current PE NTM'),
                     GLOBAL.replace('September 30, 2026', 'September 30, 2099')]:
            with self.assertRaises(ValueError):
                parse_global_indices([text])

    def test_global_shifted_numeric_columns_fail_reconciliation(self):
        with self.assertRaises(ValueError):
            parse_global_indices([GLOBAL.replace('19.7 17.4 2.3', '17.4 19.7 2.3')])


if __name__ == '__main__':
    unittest.main()
