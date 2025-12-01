from datetime import datetime, timedelta
from src.domain.interfaces import CalendarInterface, MapsInterface

class MockCalendar(CalendarInterface):
    """Mock Calendar adapter for testing."""
    async def get_next_event(self, user_id: str):
        return {
            "title": "Team Meeting",
            "start_time": (datetime.now() + timedelta(hours=1)).isoformat(),
            "location": "123 Main St, Anytown, USA"
        }

    async def list_events(self, user_id: str):
        return [await self.get_next_event(user_id)]

class MockMaps(MapsInterface):
    """Mock Maps adapter for testing."""
    async def calculate_route(self, origin: str, destination: str):
        return {
            "distance": 15.5,
            "duration": 1800,  # 30 minutes in seconds
            "traffic_condition": "moderate"
        }

class MockCalendarNoEvent(CalendarInterface):
    """Mock Calendar adapter that returns no events."""
    async def get_next_event(self, user_id: str):
        return None

    async def list_events(self, user_id: str):
        return []
