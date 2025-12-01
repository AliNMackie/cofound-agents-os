import unittest
from datetime import datetime
import pytz
from src.shared.calendar_schema import normalize_to_utc

class TestCalendarInfrastructure(unittest.TestCase):

    def test_dst_transition(self):
        """
        Tests that a datetime in "Europe/London" during the DST clock change is correctly converted to UTC.
        """
        # In London, the clocks go forward on the last Sunday of March.
        # In 2023, this was on March 26th.
        # 1:00 AM becomes 2:00 AM.
        local_tz = pytz.timezone("Europe/London")
        # This is a time that exists just before the DST transition
        dt_before_dst = local_tz.localize(datetime(2023, 3, 26, 0, 59, 59))
        utc_before_dst = dt_before_dst.astimezone(pytz.utc)

        # This time is during the DST transition
        dt_during_dst = local_tz.localize(datetime(2023, 3, 26, 2, 0, 0))
        utc_during_dst = dt_during_dst.astimezone(pytz.utc)

        self.assertEqual(normalize_to_utc(dt_before_dst), utc_before_dst)
        self.assertEqual(normalize_to_utc(dt_during_dst), utc_during_dst)
        # The difference should be 1 second in UTC, as the local time jumps over the 1 AM hour
        self.assertAlmostEqual((utc_during_dst - utc_before_dst).total_seconds(), 1)

    def test_naive_datetime(self):
        """
        Tests that a naive datetime is correctly converted to UTC when a source timezone is provided.
        """
        naive_dt = datetime(2023, 11, 26, 10, 0, 0)
        source_timezone = "America/New_York"
        
        local_tz = pytz.timezone(source_timezone)
        expected_utc_dt = local_tz.localize(naive_dt).astimezone(pytz.utc)

        self.assertEqual(normalize_to_utc(naive_dt, source_timezone), expected_utc_dt)

    def test_naive_datetime_without_timezone(self):
        """
        Tests that a ValueError is raised when a naive datetime is provided without a source timezone.
        """
        naive_dt = datetime(2023, 11, 26, 10, 0, 0)
        with self.assertRaises(ValueError):
            normalize_to_utc(naive_dt)

if __name__ == '__main__':
    unittest.main()
