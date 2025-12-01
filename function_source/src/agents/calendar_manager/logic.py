from typing import List, Dict, Any
from pydantic import BaseModel
import json
from src.shared.calendar_schema import UnifiedEvent
from src.shared.interfaces import CalendarProvider

class Conflict(BaseModel):
    event1_id: str
    event2_id: str
    event1_subject: str
    event2_subject: str

def detect_conflicts(events: List[UnifiedEvent]) -> List[Conflict]:
    """
    Detects conflicts in a list of events.
    A conflict occurs if two events overlap in time.
    All-day events and events marked as "Free" are ignored.
    """
    conflicts = []
    if len(events) < 2:
        return conflicts

    # Sort events by start time to enable optimization
    sorted_events = sorted(events, key=lambda e: e.start_utc)

    for i in range(len(sorted_events)):
        event1 = sorted_events[i]
        if event1.is_all_day or event1.status == "Free":
            continue

        for j in range(i + 1, len(sorted_events)):
            event2 = sorted_events[j]
            if event2.is_all_day or event2.status == "Free":
                continue

            # Optimization: if the next event starts after the current one ends,
            # no subsequent event can conflict.
            if event2.start_utc >= event1.end_utc:
                break
            
            # If we reach here, the events conflict.
            conflicts.append(Conflict(
                event1_id=event1.id,
                event2_id=event2.id,
                event1_subject=event1.subject,
                event2_subject=event2.subject
            ))
            
    return conflicts

class MorningBriefingAgent:
    """
    An agent that provides a morning briefing of calendar events.
    """

    def __init__(self, calendar_provider: CalendarProvider):
        self.calendar_provider = calendar_provider

    def get_briefing(self, start_date, end_date) -> str:
        """
        Gets the morning briefing.
        """
        events = self.calendar_provider.list_events(start_date, end_date)
        conflicts = detect_conflicts(events)

        # Prepare a JSON summary for the LLM
        summary_data = {
            "events": [event.dict() for event in events],
            "conflicts": [conflict.dict() for conflict in conflicts]
        }
        
        # In a real scenario, this would be sent to Vertex AI
        # For this task, we will simulate the LLM response
        llm_prompt = f"Summarize this schedule. Warn about conflicts: {json.dumps(summary_data['conflicts'])}. Suggest lunch."
        
        # Simulate LLM response
        response = "Your schedule is busy today. You have a conflict between 'Team Sync' and 'Project Update'. Consider grabbing lunch at 12:30 PM."

        return response
