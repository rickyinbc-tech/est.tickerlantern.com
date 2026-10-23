import unittest
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from refresh_indices import parse_factset, parse_msci_text, discover_msci_pdf, update_record

# Bounded original-source-derived layout excerpt; performance numbers are only
# structural context for the exact named fundamentals row, not ingested returns.
MSCI = '''Index Factsheet
MSCI ACWI Index (USD)
FUNDAMENTALS (SEP 30, 2026)
ANNUALIZED
1 Mo 3 Mo 1 Yr YTD 3 Yr 5 Yr 10 Yr Since Div Yld (%) P/E P/E Fwd P/BV
MSCI ACWI              -1.08 1.69 17.19 13.37 22.25 12.08 12.92 8.89 1.58 21.35 16.28 3.77
MSCI World             -1.15 1.96 15.68 12.09 21.91 12.39 13.37 9.02 1.52 22.69 17.92 4.10
MSCI Emerging Markets  -0.50 -0.24 29.65 23.73 24.69 9.44 9.53 10.47 2.02 14.90 9.72 2.39
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
        self.assertEqual([r[name]['forwardPE'] for name in ('MSCI ACWI','MSCI World','MSCI Emerging Markets')],[16.28,17.92,9.72])
        self.assertEqual(r['MSCI ACWI']['dividendYield'],1.58)
        self.assertIsNone(r['MSCI ACWI']['mean10YearForwardPE'])
    def test_reordered_header_and_changed_row_count_fail(self):
        for text in [MSCI.replace('P/E Fwd P/BV','P/BV P/E Fwd'),MSCI.replace('2.02 14.90 9.72 2.39','')]:
            with self.assertRaises(ValueError):parse_msci_text(text,'MSCI ACWI')
    def test_wrong_document_fails(self):
        with self.assertRaises(ValueError):parse_msci_text(MSCI,'MSCI Canada')
    def test_ligature_identity_is_normalized(self):
        r=parse_msci_text(MSCI.replace('MSCI ACWI','MSCI AC Asia Paciﬁc ex Japan'),'MSCI AC Asia Pacific ex Japan')
        self.assertEqual(r['MSCI AC Asia Pacific ex Japan']['forwardPE'],16.28)
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


class NamedRows(unittest.TestCase):
    def test_reordered_rows_bind_identity_not_position(self):
        lines=MSCI.splitlines(); rows=[line for line in lines if line.startswith('MSCI ') and not 'Index (USD)' in line]
        changed=MSCI
        for line in rows: changed=changed.replace(line,'')
        changed=changed.replace('INDEX RISK', '\n'.join(reversed(rows))+'\nINDEX RISK')
        parsed=parse_msci_text(changed,'MSCI ACWI')
        self.assertEqual(parsed['MSCI Emerging Markets']['forwardPE'],9.72)
        self.assertEqual(parsed['MSCI ACWI']['forwardPE'],16.28)
    def test_duplicate_or_unbound_rows_fail(self):
        row=next(line for line in MSCI.splitlines() if line.startswith('MSCI World '))
        for text in [MSCI.replace('INDEX RISK',row+'\nINDEX RISK'),MSCI.replace('MSCI World             ','')]:
            with self.assertRaises(ValueError):parse_msci_text(text,'MSCI ACWI')
    def test_published_nm_and_zero_are_not_missing_numeric_zero(self):
        parsed=parse_msci_text(MSCI.replace('1.58 21.35 16.28 3.77','0 21.35 N/M 3.77'),'MSCI ACWI')['MSCI ACWI']
        self.assertIsNone(parsed['forwardPE']);self.assertEqual(parsed['dividendYield'],0)
        self.assertEqual(parsed['metricStates']['forwardPE'],'not-meaningful')

    def test_withdrawal_nm_and_return_to_numeric_preserve_states(self):
        row={'forwardPE':19,'asOf':'2026-09-30'}
        from refresh_indices import update_metrics
        update_metrics(row,{'forwardPE':None,'asOf':'2026-10-16','metricStates':{'forwardPE':'not-meaningful'},'rawForwardPE':'N/M'},{'publisher':'MSCI'},'checked')
        self.assertIsNone(row['forwardPE']);self.assertEqual(row['sync']['status'],'not-meaningful');self.assertEqual(row['metricRawValues']['forwardPE'],'N/M')
        update_metrics(row,{'forwardPE':0,'asOf':'2026-10-20'},{'publisher':'MSCI'},'checked')
        self.assertEqual(row['forwardPE'],0);self.assertEqual(row['metricStates']['forwardPE'],'numeric')
