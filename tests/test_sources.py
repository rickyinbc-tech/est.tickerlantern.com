import unittest
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from refresh_indices import parse_factset, parse_msci_text, discover_msci_pdf, update_record

MSCI = '''Index Factsheet
MSCI ACWI Index (USD)
FUNDAMENTALS (SEP 30, 2026)
Div Yld (%) P/E P/E Fwd P/BV
1.58 21.35 16.28 3.77
1.52 22.69 17.92 4.10
2.02 14.90 9.72 2.39
INDEX RISK AND RETURN CHARACTERISTICS'''
FACTSET = '<h1>S&amp;P 500 Earnings Update</h1><p>The forward 12-month P/E ratio is 19.0, which is below the 5-year average (19.8) and below the 10-year average (19.1).</p>'

class Sources(unittest.TestCase):
    def test_factset_pair(self):
        r=parse_factset(FACTSET,'2026-10-16')
        self.assertEqual(r['forwardPE'],19.0)
        self.assertEqual(r['mean10YearForwardPE'],19.1)
        self.assertEqual(r['asOf'],'2026-10-16')
    def test_partial_wrong_and_future_rejected(self):
        for body,date in [(FACTSET.replace('10-year','20-year'),'2026-10-16'),(FACTSET.replace('forward 12-month','trailing 12-month'),'2026-10-16'),(FACTSET,'2099-01-01')]:
            with self.assertRaises(ValueError): parse_factset(body,date)
    def test_msci_exact_column(self):
        r=parse_msci_text(MSCI,'MSCI ACWI')
        self.assertEqual([x['forwardPE'] for x in r],[16.28,17.92,9.72])
        self.assertEqual(r[0]['dividendYield'],1.58)
        self.assertIsNone(r[0]['mean10YearForwardPE'])
    def test_reordered_header_and_changed_row_count_fail(self):
        for text in [MSCI.replace('P/E Fwd P/BV','P/BV P/E Fwd'),MSCI.replace('2.02 14.90 9.72 2.39','')]:
            with self.assertRaises(ValueError):parse_msci_text(text,'MSCI ACWI')
    def test_wrong_document_fails(self):
        with self.assertRaises(ValueError):parse_msci_text(MSCI,'MSCI Canada')
    def test_ligature_identity_is_normalized(self):
        r=parse_msci_text(MSCI.replace('MSCI ACWI','MSCI AC Asia Paciﬁc ex Japan'),'MSCI AC Asia Pacific ex Japan')
        self.assertEqual(r[0]['forwardPE'],16.28)
    def test_old_source_cannot_overwrite_new(self):
        old={'forwardPE':19.0,'asOf':'2026-10-16'}
        with self.assertRaises(ValueError):update_record(old,{'forwardPE':18,'asOf':'2026-09-30'},{},'2026-10-22T00:00:00Z')
        self.assertEqual(old['forwardPE'],19.0)
        self.assertEqual(old['asOf'],'2026-10-16')
    def test_same_date_source_revision_updates_metric(self):
        r={'forwardPE':19.0,'asOf':'2026-10-16'}
        update_record(r,{'forwardPE':19.1,'asOf':'2026-10-16'},{'publisher':'FactSet'},'2026-10-22T00:00:00Z')
        self.assertEqual(r['forwardPE'],19.1)
        self.assertEqual(r['asOf'],'2026-10-16')
    def test_only_unique_same_host_document_discovered(self):
        url='https://www.msci.com/documents/10199/a8a34a67-5439-44f1-909a-ba982cb8ca52'
        self.assertEqual(discover_msci_pdf(('<link href="https://www.msci.com'+url+'">').encode()),url)
        with self.assertRaises(ValueError):discover_msci_pdf(b'<p>Challenge Validation</p>')

if __name__=='__main__':unittest.main()
