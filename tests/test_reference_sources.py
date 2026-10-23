import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from reference_sources import parse_msci_deck_text, parse_segal_text

# Compact synthetic fixtures exercise the source's verified label/row contracts.
# Complete third-party reports and extracted source pages are not redistributed.
MSCI = '''Global indexes continue to trade at a premium to longer term averages
based on forward earnings multiples
Price to Forward Earnings for MSCI Indexes as of December 31, 2025
18.96 19.95 22.35 15.66 13.48 15.03
16.50 16.95 19.25 14.26 12.25 14.10
ACWI WORLD USA WORLD ex USA EM (EMERGING MARKETS) EUROPE
Current P/Fwd Ear 10Yr Average P/Fwd Ear'''
SEGAL = '''Quarter In Review: Global Equity Overview
Data range is from 3/31/00 – 12/31/25. P/E ratios are forward 12 months.
18.7 16.0 16.3 14.3 12.4 17.1 12.7 14.3 14.6 10Yr Avg'''
ORDER = 'S&P 500 S&P 400 S&P 600 MSCI EAFE MSCI EM MSCI World MSCI UK MSCI Japan MSCI Canada'


class ReferenceSources(unittest.TestCase):
    def test_msci_exact_labels(self):
        result = parse_msci_deck_text(MSCI)
        self.assertEqual(result['acwi']['mean10YearForwardPE'], 16.5)
        self.assertEqual(result['world']['mean10YearForwardPE'], 16.95)
        self.assertEqual(result['em']['mean10YearForwardPE'], 12.25)
        self.assertEqual(result['europe']['mean10YearForwardPE'], 14.1)
        self.assertEqual(result['europe']['meanAsOf'], '2025-12-31')
        self.assertEqual(result['europe']['page'], 7)
        self.assertNotIn('forwardPE', result['world'])

    def test_msci_rejects_wrong_definition_categories_and_missing_values(self):
        for value in [MSCI.replace('10Yr Average', '20Yr Average'),
                      MSCI.replace('WORLD ex USA', 'EAFE'),
                      MSCI.replace('16.50 ', ''),
                      MSCI.replace('December 31, 2025', 'December 31, 2099')]:
            with self.assertRaises(ValueError):
                parse_msci_deck_text(value)

    def test_msci_roe_cannot_match(self):
        with self.assertRaises(ValueError):
            parse_msci_deck_text(MSCI.replace('Forward Earnings', 'Return on Equity'))

    def test_segal_seed_published_means_are_separate_from_median(self):
        result = parse_segal_text(SEGAL)
        self.assertEqual([result[x]['mean10YearForwardPE'] for x in ['eafe', 'uk', 'japan', 'msci-canada']], [14.3, 12.7, 14.3, 14.6])
        self.assertEqual(result['uk']['meanAsOf'], '2025-12-31')
        self.assertEqual(result['uk']['page'], 3)

    def test_segal_median_and_removed_row_fail(self):
        for value in [SEGAL.replace('10Yr Avg', 'Median'),
                      SEGAL.replace('14.6 ', ''),
                      SEGAL.replace('P/E ratios are forward 12 months.', 'P/E ratios are trailing 12 months.')]:
            with self.assertRaises(ValueError):
                parse_segal_text(value)

    def test_segal_future_layout_requires_ordered_labels(self):
        text = SEGAL.replace('12/31/25', '03/31/26')
        with self.assertRaises(ValueError):
            parse_segal_text(text)
        result = parse_segal_text(text + '\n' + ORDER, page=4)
        self.assertEqual(result['eafe']['meanAsOf'], '2026-03-31')
        self.assertEqual(result['eafe']['page'], 4)
        with self.assertRaises(ValueError):
            parse_segal_text(text + '\n' + ORDER.replace('MSCI UK MSCI Japan', 'MSCI Japan MSCI UK'))

    def test_segal_mean_label_first_is_supported(self):
        text = SEGAL.replace('18.7 16.0 16.3 14.3 12.4 17.1 12.7 14.3 14.6 10Yr Avg', '10Y AVG 18.7 16.0 16.3 14.3 12.4 17.1 12.7 14.3 14.6')
        self.assertEqual(parse_segal_text(text)['msci-canada']['mean10YearForwardPE'], 14.6)


if __name__ == '__main__':
    unittest.main()
