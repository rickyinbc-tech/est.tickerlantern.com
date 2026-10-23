import datetime as dt
import importlib.util
from pathlib import Path
import unittest
from PIL import Image, ImageDraw

spec = importlib.util.spec_from_file_location('lseg_stoxx_source', Path(__file__).resolve().parents[1] / 'scripts/lseg_stoxx_source.py')
source = importlib.util.module_from_spec(spec)
spec.loader.exec_module(source)


class LsegPrintedLabelTests(unittest.TestCase):
    def test_exact_numeric_label(self):
        self.assertEqual(source.parse_printed_number(' 13.9x\n'), 13.9)
        self.assertEqual(source.parse_printed_number('14.2 ×'), 14.2)
        self.assertEqual(source.parse_printed_number('200.1x'),200.1)

    def test_ambiguous_ocr_is_rejected(self):
        for value in ['I3.9x', '13.9', '13.9x 14.2x', 'about 13.9x']:
            with self.subTest(value=value), self.assertRaises(ValueError):
                source.parse_printed_number(value)

    def test_feed_filters_identity_and_uses_published_date(self):
        feed = b'''<rss xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel>
        <item><title>STOXX 600 Earnings Outlook 26Q3</title><pubDate>Thu, 22 Oct 2026 13:10:39 +0000</pubDate><link>https://lipperalpha.refinitiv.com/article/</link><content:encoded><![CDATA[<a href="https://lipperalpha.refinitiv.com/wp-content/uploads/2026/10/TRPR_83201_669.pdf">here</a>]]></content:encoded></item>
        <item><title>S&amp;P 500 Earnings Dashboard</title><pubDate>Thu, 22 Oct 2026 13:10:39 +0000</pubDate></item>
        </channel></rss>'''
        self.assertEqual(source.discover_reports(feed, dt.date(2026, 10, 22))[0][0], '2026-10-22')
        with self.assertRaises(ValueError):
            source.discover_reports(feed, dt.date(2026, 10, 21))

    def test_color_roles_do_not_depend_on_which_valuation_is_higher(self):
        image = Image.new('RGB', (1000, 1400), 'white')
        draw = ImageDraw.Draw(image)
        draw.rectangle((860, 850, 920, 870), fill='blue')
        draw.rectangle((860, 900, 920, 920), fill='black')
        self.assertEqual(set(source.numeric_label_crops(image)), {'blue', 'black'})

    def test_explicit_ten_year_and_twelve_month_legend_required(self):
        source.validate_legend('12 Month Forward P/E - - 10-Year Average')
        for legend in ['12 Month Forward P/E - - 5-Year Average', 'Price/Earnings - - 10-Year Average']:
            with self.subTest(legend=legend), self.assertRaises(ValueError):
                source.validate_legend(legend)

    def test_changed_layout_is_rejected(self):
        with self.assertRaises(ValueError):
            source.numeric_label_crops(Image.new('RGB', (1000, 1400), 'white'))


if __name__ == '__main__':
    unittest.main()
