import datetime as dt
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
import dividend_sources as d

# Compact source-contract fixtures; original pages and PDFs are not stored.
SSGA = '''<html><body><p>Fund Information as of Oct 26 2026</p><table><tr><th>Benchmark</th><td>S&amp;P 500 Index</td></tr>
<tr><th>Inception Date</th><td>Jan 22 1993</td></tr></table>
<h3>Yields as of Oct 22 2026</h3><table>
<tr><th>Fund Distribution Yield <span>Fund Distribution Yield The sum of the distributions within the past 365 days divided by Net Asset Value per share, expressed as a percentage.</span></th><td>0.99%</td></tr>
<tr><th>Index Dividend Yield <span>Index Dividend Yield The weighted average of the underlyings&#39; indicated annual dividend divided by price, expressed as a percentage.</span></th><td>1.10%</td></tr>
</table><h3>Fund Market Price as of Oct 23 2026</h3></body></html>'''

TSX = '''<html><body><h2>Market Closes for October 23rd,2026</h2><p>TSX 35788.18 -185.27</p>
<p>* S&amp;P/TSX Composite is trading at a price-to-earnings ratio of 20.9 on a trailing basis and 17.3 times estimated earnings of its members for the coming year * The index&#8217;s dividend yield is 2.1% on a trailing 12-month basis * S&amp;P/TSX Composite&#8217;s members have a total market capitalization of C$5.65t</p></body></html>'''

FEED = '''<rss><channel><item><title>October 23rd, 2026, The Newsletter</title><link>https://carolannsteinhoff.com/october-23rd-2026-the-newsletter/</link></item>
<item><title>October 22nd, 2026, Newsletter</title><link>https://carolannsteinhoff.com/october-22nd-2026-newsletter/</link></item></channel></rss>'''

FTSE = {
    (1, False): 'FTSE  Russell  Factsheet  \nFTSE 100 Index  \n bmkTitle1  \nThe FTSE 100 is a market - capitalisation weighted index',
    (3, False): 'FTSE 100 Index  Data as at: 30 September 2026  \nSource: FTSE Russell as at 30 September 2026 .  \n'
                'Index Characteristics  \n \n  \nAttributes   FTSE 100  \nNumber of constituents   100  \nNet MCap (GBPm)   2,516,976  \n'
                'Dividend Yield %   3.11  \nConstituent Sizes (Net MCap GBPm)    \nAverage   25,170  \n',
}

HSI = {(1, False): 'Hang Seng Index | September 2026\nHSI TRI 90,311.28 -3.28 +8.64\n*Annualised  \nINDEX FUNDAMENTALS\n'
                   'Annual Volatility*(%)Index Dividend Yield (%) PE Ratio (Times) 1 - Yr 3 - Yr 5 - Yr\nHSI 2.97 13.79 18.36 23.09 24.80\n'
                   '*Annual Volatility was calculated based on daily return\nAll data as at 30 Sep 2026  \n'}

CSI = {
    (1, False): 'to reflect the overall performance of China A-share market.\n000300CSI 300 Index\nConstituents\n',
    (1, True): '''                                                       30-September-
                                                              2026
Volatility                                                        Fundamental
     1Y Annualized                        17.61%                          P/E TTM                            13.15
     3Y Annualized                        17.84%                             P/B                              1.36
     5Y Annualized                        17.47%                            Yield                            2.49%
Market Cap (CNY Bn)
''',
}
TODAY = dt.date(2026, 10, 26)


def pages(fixture):
    return patch.object(d, 'pdf_text', side_effect=lambda body, page, layout=False: fixture[(page, layout)])


class DividendSourceTests(unittest.TestCase):
    def test_ssga_reads_index_yield_not_fund_yields(self):
        self.assertEqual(d.parse_ssga(SSGA, TODAY), {'sp500': {'dividendYield': 1.1, 'asOf': '2026-10-22'}})

    def test_ssga_wrong_benchmark_or_missing_definition_fails(self):
        for change in [SSGA.replace('S&amp;P 500 Index', 'S&amp;P 500 Value Index'),
                       SSGA.replace('Index Dividend Yield <span>Index Dividend Yield', 'Dividend Yield <span>Dividend Yield'),
                       SSGA.replace('Oct 22 2026', 'Oct 22 2027')]:
            with self.subTest(change=change[:40]), self.assertRaises(ValueError):
                d.parse_ssga(change, TODAY)

    def test_tsx_uses_market_close_date_and_trailing_yield(self):
        self.assertEqual(d.parse_tsx_newsletter(TSX, TODAY), {'tsx': {'dividendYield': 2.1, 'asOf': '2026-10-23'}})
        self.assertEqual(d.tsx_newsletter_link(FEED), 'https://carolannsteinhoff.com/october-23rd-2026-the-newsletter/')

    def test_tsx_changed_basis_or_duplicate_close_fails(self):
        for change in [TSX.replace('on a trailing 12-month basis', 'on an indicated basis'),
                       TSX.replace('</h2>', '</h2><h2>Market Closes for October 22nd,2026</h2>'),
                       TSX.replace('S&amp;P/TSX Composite is trading', 'S&amp;P/TSX 60 is trading')]:
            with self.subTest(change=change[-80:]), self.assertRaises(ValueError):
                d.parse_tsx_newsletter(change, TODAY)
        with self.assertRaises(ValueError):
            d.tsx_newsletter_link('<rss></rss>')

    def test_ftse_month_end_characteristics_yield(self):
        with pages(FTSE):
            self.assertEqual(d.parse_ftse_factsheet(b'%PDF', TODAY), {'ftse100': {'dividendYield': 3.11, 'asOf': '2026-09-30', 'page': 3}})
        for key, old, new in [((3, False), 'Attributes   FTSE 100', 'Attributes   FTSE 250'), ((1, False), 'FTSE 100 Index', 'FTSE 250 Index'), ((3, False), 'Dividend Yield %', 'Dividend Yield (net) %')]:
            changed = {**FTSE, key: FTSE[key].replace(old, new)}
            with self.subTest(new=new), pages(changed), self.assertRaises(ValueError):
                d.parse_ftse_factsheet(b'%PDF', TODAY)

    def test_hsi_binds_yield_column_by_header(self):
        with pages(HSI):
            self.assertEqual(d.parse_hsi_factsheet(b'%PDF', TODAY), {'hangseng': {'dividendYield': 2.97, 'asOf': '2026-09-30', 'page': 1}})
        changed = {(1, False): HSI[(1, False)].replace('Index Dividend Yield (%) PE Ratio (Times)', 'PE Ratio (Times) Index Dividend Yield (%)')}
        with pages(changed), self.assertRaises(ValueError):
            d.parse_hsi_factsheet(b'%PDF', TODAY)

    def test_csi_layout_row_and_split_date(self):
        with pages(CSI):
            self.assertEqual(d.parse_csi_factsheet(b'%PDF', TODAY), {'csi300': {'dividendYield': 2.49, 'asOf': '2026-09-30', 'page': 1}})
        for key, old, new in [((1, True), 'Yield', 'Div Yld'), ((1, False), '000300CSI 300 Index', '000905CSI 500 Index'), ((1, True), '30-September-', '30-September-\n 2026\n 31-October-')]:
            changed = {**CSI, key: CSI[key].replace(old, new)}
            with self.subTest(new=new), pages(changed), self.assertRaises(ValueError):
                d.parse_csi_factsheet(b'%PDF', TODAY)

    def test_non_pdf_and_implausible_yields_fail(self):
        with self.assertRaises(ValueError):
            d.pdf_text(b'<html>blocked</html>', 1)
        with self.assertRaises(ValueError):
            d.parse_tsx_newsletter(TSX.replace('2.1%', '42.1%'), TODAY)


if __name__ == '__main__':
    unittest.main()
