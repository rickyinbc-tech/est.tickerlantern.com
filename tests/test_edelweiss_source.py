import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from edelweiss_source import discover_tempo_links, parse_edelweiss_text, TEMPO_SEED_URL, TEMPO_DATED_FALLBACK_URL

# A compact source-contract fixture; complete third-party reports are not stored.
TEMPO = '''Global equity markets at a glance
Source: IIFL Securities, Bloomberg estimates. Data as of 28th November, 2025.
Countries Exchange Name Index Level
Valuation (12-month forward) Absolute Performance (%)
P/E P/E P/B P/B ROE 10yr Avg 10yr Avg 1 Month 3 Months 6 Months 1 Year
(x) (x) (x) (x) (%) Developed Market
UK FTSE 100 9,711 13.1 12.8 2.1 1.7 16.1 0.1% 5.4% 11.3% 17.3%
Germany DAX 23,757
Hong Kong Hang Seng 25,859 11.3 10.4 1.2 1.1 11.0 -1.8% 3.4% 11.2% 33.5%
Emerging Market India Sensex 85,707'''
OCTOBER = '''Global equity markets at a glance
Source: Bloomberg. Data as of 30th Sep 2026.
Countries Exchange Name Index Level Valuation (12-month forward)
P/E (x) P/E (x) P/B (x) P/B (x) ROE (%)
1 Month 3 Months 6 Months 1 Year 10yr Avg 10yr Avg
Developed Market
UK FTSE 100 10,606 12.3 12.6 2.1 1.8 16.0 -2.0% 1.0% 4.7% 13.4%
Germany DAX 25,199
Hong Kong Hang Seng 24,613 10.3 10.4 1.1 1.1 11.0 -3.8% 7.6% -0.6% -8.3%
Emerging Market India Sensex 72,480'''


class EdelweissSource(unittest.TestCase):
    def test_exact_index_current_and_mean(self):
        result = parse_edelweiss_text(TEMPO, page=3)
        self.assertEqual(list(result), ['ftse100', 'hangseng'])
        value = result['ftse100']
        self.assertEqual((value['forwardPE'], value['mean10YearForwardPE']), (13.1, 12.8))
        self.assertEqual((value['asOf'], value['meanAsOf'], value['page']), ('2025-11-28', '2025-11-28', 3))

    def test_october_bloomberg_table_units_and_abbreviated_month(self):
        result = parse_edelweiss_text(OCTOBER)
        value = result['ftse100']
        self.assertEqual((value['forwardPE'], value['mean10YearForwardPE']), (12.3, 12.6))
        self.assertEqual((value['meanAsOf'], value['page']), ('2026-09-30', 4))
        hsi = result['hangseng']
        self.assertEqual((hsi['forwardPE'], hsi['mean10YearForwardPE'], hsi['meanAsOf']), (10.3, 10.4, '2026-09-30'))

    def test_hang_seng_wrong_identity_and_missing_mean_fail(self):
        for change in [OCTOBER.replace('Hang Seng 24,613', 'Hang Seng China Enterprises 24,613'),
                       OCTOBER.replace('Hang Seng 24,613', 'Hang Seng Tech 24,613'),
                       OCTOBER.replace('10.3 10.4 1.1', '10.3 1.1'),
                       OCTOBER.replace('Emerging Market India Sensex', 'Emerging Market China CSI300')]:
            with self.subTest(change=change), self.assertRaises(ValueError):
                parse_edelweiss_text(change)

    def test_wrong_metric_missing_cells_wrong_index_and_future_date_fail(self):
        for change in [TEMPO.replace('12-month forward', 'trailing 12 months'),
                       TEMPO.replace('10yr Avg', '5yr Avg'),
                       TEMPO.replace('P/E P/E P/B P/B', 'P/B P/B P/E P/E'),
                       TEMPO.replace('FTSE 100', 'FTSE All-Share'),
                       TEMPO.replace(' 12.8 ', ' '),
                       TEMPO.replace('November, 2025', 'November, 2099')]:
            with self.subTest(change=change), self.assertRaises(ValueError):
                parse_edelweiss_text(change)

    def test_duplicate_table_or_changed_source_fails(self):
        for change in [TEMPO + TEMPO, TEMPO.replace('IIFL Securities', 'Unknown')]:
            with self.assertRaises(ValueError):
                parse_edelweiss_text(change)

    def test_discovery_uses_only_published_official_pdf_anchors(self):
        july = '/Files/Insigths/viewpoint/Edelweiss_Mutual_Fund_-_TEMPO_-_July_09072025_063616_PM.pdf'
        html = f'''<a href="{july}">July</a><a href="{TEMPO_SEED_URL}">December</a>
        <a href="https://example.com/Files/Insigths/viewpoint/TEMPO.pdf">Mirror</a>
        <a href="https://www.edelweissmf.com.evil.test/Files/Insigths/viewpoint/TEMPO.pdf">Spoof</a>
        <a href="https://user:pass@www.edelweissmf.com/Files/Insigths/viewpoint/TEMPO.pdf">Credentials</a>
        <a href="/Files/Insigths/viewpoint/Other.pdf">Other</a>
        <a href="/Files/Insigths/viewpoint/TEMPO.pdf?key=secret">Query</a>'''
        self.assertEqual(discover_tempo_links(html), [TEMPO_SEED_URL, 'https://www.edelweissmf.com' + july])
        self.assertEqual(discover_tempo_links('<p>Dynamic listing has no anchors.</p>'), [])

    def test_new_and_legacy_official_path_spellings_are_supported(self):
        html = f'<a href="{TEMPO_DATED_FALLBACK_URL}">Old</a><a href="{TEMPO_SEED_URL}">Latest</a>'
        self.assertEqual(discover_tempo_links(html), [TEMPO_SEED_URL, TEMPO_DATED_FALLBACK_URL])


if __name__ == '__main__':
    unittest.main()
