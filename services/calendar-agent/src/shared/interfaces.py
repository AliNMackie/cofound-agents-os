from abc import ABC, abstractmethod
from typing import List
from src.shared.calendar_schema import UnifiedEvent, TimeSlot
from datetime import datetime

class CalendarProvider(ABC):
    """
    Abstract base class for a calendar provider.
    """

    @abstractmethod
    def list_events(self, start_date: datetime, end_date: datetime) -> List[UnifiedEvent]:
        """
        Lists all events in a given time range.
        """
        pass

    @abstractmethod
    def create_event(self, event: UnifiedEvent) -> UnifiedEvent:
        """
        Creates a new event.
        """
        pass

    @abstractmethod
    def get_free_busy(self, start_date: datetime, end_date: datetime) -> List[TimeSlot]:
        """
        Gets the free/busy information for a given time range.
        """
        pass
