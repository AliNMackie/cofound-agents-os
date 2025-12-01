from abc import ABC, abstractmethod
from datetime import datetime, timedelta
from dataclasses import dataclass
from typing import List, Optional, Any
import requests

# Try to import Google libraries, but don't fail if they are missing
# as the environment might not have them installed yet.
try:
    from googleapiclient.discovery import build
except ImportError:
    build = None

@dataclass
class EventModel:
    summary: str
    start_time: datetime
    end_time: datetime

class CalendarProvider(ABC):
    """Abstract base class for calendar providers."""

    @abstractmethod
    def list_events(self, start_time: datetime, end_time: datetime) -> List[EventModel]:
        """List events within the given time range."""
        pass

    @abstractmethod
    def create_event(self, summary: str, start_time: datetime, duration_minutes: int) -> EventModel:
        """Create a new event."""
        pass

    @abstractmethod
    def check_availability(self, time_slot: datetime) -> bool:
        """Check if the given time slot is available."""
        pass

class GoogleCalendarAdapter(CalendarProvider):
    """Adapter for Google Calendar."""

    def __init__(self, credentials: Any):
        if build is None:
            raise ImportError("google-api-python-client is required for GoogleCalendarAdapter")
        # 'credentials' should be a google.oauth2.credentials.Credentials object
        self.service = build('calendar', 'v3', credentials=credentials)

    def list_events(self, start_time: datetime, end_time: datetime) -> List[EventModel]:
        # Google Calendar API uses RFC3339 format
        events_result = self.service.events().list(
            calendarId='primary',
            timeMin=start_time.isoformat() + 'Z',
            timeMax=end_time.isoformat() + 'Z',
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        
        events = events_result.get('items', [])
        results = []
        
        for event in events:
            summary = event.get('summary', 'No Title')
            start = event.get('start', {}).get('dateTime')
            end = event.get('end', {}).get('dateTime')
            
            # Skip events that are not time-based (e.g. all-day events might have 'date' instead of 'dateTime')
            if start and end:
                # Basic ISO parsing. Google sends Z or offset. Python 3.11+ handles it well.
                # If Z is present, fromisoformat handles it in 3.11+
                try:
                    s_dt = datetime.fromisoformat(start)
                    e_dt = datetime.fromisoformat(end)
                    results.append(EventModel(summary=summary, start_time=s_dt, end_time=e_dt))
                except ValueError:
                    # Fallback or logging could go here
                    pass
                    
        return results

    def create_event(self, summary: str, start_time: datetime, duration_minutes: int) -> EventModel:
        end_time = start_time + timedelta(minutes=duration_minutes)
        event_body = {
            'summary': summary,
            'start': {
                'dateTime': start_time.isoformat(),
                'timeZone': 'UTC', 
            },
            'end': {
                'dateTime': end_time.isoformat(),
                'timeZone': 'UTC',
            },
        }

        event = self.service.events().insert(calendarId='primary', body=event_body).execute()
        
        # Parse response
        s_dt = datetime.fromisoformat(event['start']['dateTime'])
        e_dt = datetime.fromisoformat(event['end']['dateTime'])
        
        return EventModel(
            summary=event.get('summary', summary),
            start_time=s_dt,
            end_time=e_dt
        )

    def check_availability(self, time_slot: datetime) -> bool:
        # Check a small window around the time_slot to see if there are any events
        # This is a naive implementation as instructed by the interface requirements context
        start = time_slot
        end = time_slot + timedelta(minutes=1) 
        events = self.list_events(start, end)
        return len(events) == 0


class OutlookCalendarAdapter(CalendarProvider):
    """Adapter for Microsoft Outlook Calendar."""
    
    BASE_URL = "https://graph.microsoft.com/v1.0/me/calendar/events"

    def __init__(self, bearer_token: str):
        self.headers = {
            "Authorization": f"Bearer {bearer_token}",
            "Content-Type": "application/json"
        }

    def list_events(self, start_time: datetime, end_time: datetime) -> List[EventModel]:
        # Using $filter to get events in range
        # Note: formatting datetimes for MS Graph query
        start_str = start_time.isoformat()
        end_str = end_time.isoformat()
        
        # OData filter syntax for overlap: start < window_end AND end > window_start
        filter_query = f"start/dateTime lt '{end_str}' and end/dateTime gt '{start_str}'"
        
        params = {
            "$filter": filter_query,
            "$select": "subject,start,end"
        }
        
        response = requests.get(self.BASE_URL, headers=self.headers, params=params)
        response.raise_for_status()
        data = response.json()
        
        results = []
        for item in data.get('value', []):
            subject = item.get('subject', 'No Subject')
            start_data = item.get('start', {})
            end_data = item.get('end', {})
            
            s_dt_str = start_data.get('dateTime')
            e_dt_str = end_data.get('dateTime')
            
            if s_dt_str and e_dt_str:
                # MS Graph returns usually 7 digits of microseconds, e.g. 2023-10-27T10:00:00.0000000
                # datetime.fromisoformat might handle it in Python 3.11+, but to be safe we can truncate
                if len(s_dt_str) > 26: 
                    s_dt_str = s_dt_str[:26]
                if len(e_dt_str) > 26:
                    e_dt_str = e_dt_str[:26]
                    
                s_dt = datetime.fromisoformat(s_dt_str)
                e_dt = datetime.fromisoformat(e_dt_str)
                
                results.append(EventModel(summary=subject, start_time=s_dt, end_time=e_dt))
                
        return results

    def create_event(self, summary: str, start_time: datetime, duration_minutes: int) -> EventModel:
        end_time = start_time + timedelta(minutes=duration_minutes)
        payload = {
            "subject": summary,
            "start": {
                "dateTime": start_time.isoformat(),
                "timeZone": "UTC"
            },
            "end": {
                "dateTime": end_time.isoformat(),
                "timeZone": "UTC"
            }
        }
        
        response = requests.post(self.BASE_URL, headers=self.headers, json=payload)
        response.raise_for_status()
        data = response.json()
        
        # Mapping response back to EventModel
        subject = data.get('subject')
        start_str = data.get('start', {}).get('dateTime')
        end_str = data.get('end', {}).get('dateTime')
        
        if len(start_str) > 26: start_str = start_str[:26]
        if len(end_str) > 26: end_str = end_str[:26]
        
        return EventModel(
            summary=subject,
            start_time=datetime.fromisoformat(start_str),
            end_time=datetime.fromisoformat(end_str)
        )

    def check_availability(self, time_slot: datetime) -> bool:
        start = time_slot
        end = time_slot + timedelta(minutes=1)
        events = self.list_events(start, end)
        return len(events) == 0


def get_calendar_service(user_context: dict) -> CalendarProvider:
    """
    Factory function to get the appropriate calendar provider.
    
    Args:
        user_context: Dictionary containing user info and credentials.
                      Expected keys:
                      - 'auth_provider': 'google.com' or 'microsoft.com'
                      - 'credentials': Google OAuth credentials (if google)
                      - 'bearer_token': Microsoft Bearer token (if microsoft)
    """
    auth_provider = user_context.get("auth_provider")
    
    if auth_provider == "google.com":
        credentials = user_context.get("credentials")
        if not credentials:
            raise ValueError("Google credentials missing from user context")
        return GoogleCalendarAdapter(credentials)
        
    elif auth_provider == "microsoft.com":
        token = user_context.get("bearer_token")
        if not token:
            raise ValueError("Microsoft bearer token missing from user context")
        return OutlookCalendarAdapter(token)
        
    else:
        raise ValueError(f"Unknown or unsupported auth_provider: {auth_provider}")
