from datetime import datetime
from typing import Optional
from pydantic import BaseModel
import pytz

def normalize_to_utc(dt_input: datetime, source_timezone: Optional[str] = None) -> datetime:
    """
    Normalizes a datetime object to UTC.

    Args:
        dt_input: The datetime object to normalize.
        source_timezone: The timezone to assume for naive datetime objects.

    Returns:
        A datetime object in UTC.
    """
    if dt_input.tzinfo is None:
        if source_timezone is None:
            raise ValueError("Naive datetime provided without a source timezone.")
        tz = pytz.timezone(source_timezone)
        dt_input = tz.localize(dt_input)
    
    return dt_input.astimezone(pytz.utc)

class UnifiedEvent(BaseModel):
    id: str
    subject: str
    start_utc: datetime
    end_utc: datetime
    provider: str
    meeting_link: Optional[str] = None
    is_all_day: bool = False
    status: Optional[str] = None

class TimeSlot(BaseModel):
    start_utc: datetime
    end_utc: datetime
