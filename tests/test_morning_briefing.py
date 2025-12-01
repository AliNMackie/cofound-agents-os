import unittest
from datetime import datetime, timedelta, timezone
from src.shared.calendar_schema import UnifiedEvent
from src.agents.calendar_manager.logic import detect_conflicts

class TestMorningBriefing(unittest.TestCase):

    def test_conflict_detection(self):
        """
        Tests that the conflict detection logic correctly identifies overlapping events.
        """
        now = datetime.now(timezone.utc)
        events = [
            UnifiedEvent(id="1", subject="Event 1", start_utc=now, end_utc=now + timedelta(hours=1), provider="google"),
            UnifiedEvent(id="2", subject="Event 2", start_utc=now + timedelta(minutes=30), end_utc=now + timedelta(hours=1, minutes=30), provider="google"),
            UnifiedEvent(id="3", subject="Event 3", start_utc=now + timedelta(hours=2), end_utc=now + timedelta(hours=3), provider="google")
        ]
        conflicts = detect_conflicts(events)
        self.assertEqual(len(conflicts), 1)
        self.assertEqual(conflicts[0].event1_id, "1")
        self.assertEqual(conflicts[0].event2_id, "2")

    def test_no_conflict_back_to_back(self):
        """
        Tests that back-to-back events are not considered conflicts.
        """
        now = datetime.now(timezone.utc)
        events = [
            UnifiedEvent(id="1", subject="Event 1", start_utc=now, end_utc=now + timedelta(hours=1), provider="google"),
            UnifiedEvent(id="2", subject="Event 2", start_utc=now + timedelta(hours=1), end_utc=now + timedelta(hours=2), provider="google")
        ]
        conflicts = detect_conflicts(events)
        self.assertEqual(len(conflicts), 0)

    def test_all_day_event_no_conflict(self):
        """
        Tests that all-day events are ignored.
        """
        now = datetime.now(timezone.utc)
        events = [
            UnifiedEvent(id="1", subject="Event 1", start_utc=now, end_utc=now + timedelta(hours=1), provider="google"),
            UnifiedEvent(id="2", subject="All Day Event", start_utc=now, end_utc=now + timedelta(days=1), provider="google", is_all_day=True)
        ]
        conflicts = detect_conflicts(events)
        self.assertEqual(len(conflicts), 0)

    def test_free_status_event_no_conflict(self):
        """
        Tests that events with a status of "Free" are ignored.
        """
        now = datetime.now(timezone.utc)
        events = [
            UnifiedEvent(id="1", subject="Event 1", start_utc=now, end_utc=now + timedelta(hours=1), provider="google"),
            UnifiedEvent(id="2", subject="Free Event", start_utc=now, end_utc=now + timedelta(hours=1), provider="google", status="Free")
        ]
        conflicts = detect_conflicts(events)
        self.assertEqual(len(conflicts), 0)

    def test_long_event_conflict(self):
        """
        Tests that a long event correctly conflicts with multiple shorter events.
        """
        now = datetime.now(timezone.utc)
        events = [
            UnifiedEvent(id="1", subject="Long Event", start_utc=now, end_utc=now + timedelta(hours=3), provider="google"),
            UnifiedEvent(id="2", subject="Short Event 1", start_utc=now + timedelta(hours=1), end_utc=now + timedelta(hours=2), provider="google"),
            UnifiedEvent(id="3", subject="Short Event 2", start_utc=now + timedelta(hours=2, minutes=30), end_utc=now + timedelta(hours=3, minutes=30), provider="google")
        ]
        conflicts = detect_conflicts(events)
        self.assertEqual(len(conflicts), 2)
        # Check that the long event is in conflict with both shorter events
        self.assertEqual(conflicts[0].event1_id, "1")
        self.assertEqual(conflicts[0].event2_id, "2")
        self.assertEqual(conflicts[1].event1_id, "1")
        self.assertEqual(conflicts[1].event2_id, "3")

if __name__ == '__main__':
    unittest.main()
