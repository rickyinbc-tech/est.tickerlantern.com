import datetime as dt
from pathlib import Path
import sys
import unittest
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from browser_snapshot import validate_entry

NOW = dt.datetime(2026, 10, 23, 12, tzinfo=dt.timezone.utc)


def entry():
    return dict(adapterId='edelweiss-reference', verifiedAt='2026-10-23T05:00:00Z',
                source=dict(url='https://www.edelweissmf.com/Files/Insights/viewpoint/TEMPO_09102026_101803_AM.pdf', sha256='a'*64, transport='scheduled-browser', checkedAt='2026-10-23T05:00:00Z'),
                values={id: dict(forwardPE=12, mean10YearForwardPE=13, asOf='2026-09-30', meanAsOf='2026-09-30', meanMethod='Explicit published ten-year forward mean', page=4) for id in ('ftse100', 'hangseng')})


class BrowserSnapshotTests(unittest.TestCase):
    def test_valid_cached_check_keeps_original_verification_time(self):
        original = entry()
        values, source, checked = validate_entry('edelweiss-reference', original, NOW)
        self.assertEqual(checked, '2026-10-23T05:00:00Z')
        self.assertEqual(source['checkedAt'], checked)
        self.assertEqual(values['ftse100']['meanAsOf'], '2026-09-30')
        self.assertEqual(original, entry())

    def test_stale_future_and_undated_checks_are_rejected(self):
        for stamp in ('2026-10-21T11:59:00Z', '2026-10-23T12:06:00Z', 'not a date', '2026-10-23'):
            with self.subTest(stamp=stamp), self.assertRaises(ValueError):
                candidate = entry(); candidate['verifiedAt'] = stamp
                validate_entry('edelweiss-reference', candidate, NOW)

    def test_wrong_publisher_incomplete_identity_and_forged_time_are_rejected(self):
        mutations = [
            lambda x: x['source'].update(url='https://www.nasdaq.com/docs/global-indexes/global-markets-dashboard-oct-16-2026'),
            lambda x: x['values'].pop('hangseng'),
            lambda x: x['values']['ftse100'].pop('meanAsOf'),
            lambda x: x['source'].update(checkedAt='2026-10-23T11:00:00Z'),
            lambda x: x['source'].update(sha256='missing'),
        ]
        for mutate in mutations:
            candidate = entry(); mutate(candidate)
            with self.assertRaises(ValueError): validate_entry('edelweiss-reference', candidate, NOW)


if __name__ == '__main__': unittest.main()
