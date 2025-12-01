import asyncio
import datetime
from typing import List, Dict, Any, Optional
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from src.domain.interfaces import CalendarInterface

class GoogleCalendarAdapter(CalendarInterface):
    """Adapter for Google Calendar API."""

    def __init__(self, credentials: Credentials):
        self.service = build('calendar', 'v3', credentials=credentials)

    async def get_next_event(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetches the next upcoming event from the user's primary calendar asynchronously.
        """
        def _get_event():
            try:
                now = datetime.datetime.now(datetime.timezone.utc).isoformat()
                events_result = self.service.events().list(
                    calendarId='primary',
                    timeMin=now,
                    maxResults=1,
                    singleEvents=True,
                    orderBy='startTime'
                ).execute()
                
                events = events_result.get('items', [])
                if not events:
                    return None
                
                event = events[0]
                start_str = event['start'].get('dateTime', event['start'].get('date'))
                return {
                    'title': event.get('summary', 'Untitled Event'),
                    'start_time': start_str,
                    'location': event.get('location', 'No location provided')
                }
            except HttpError as error:
                print(f"An error occurred with Google Calendar API: {error}")
                return None
        
        return await asyncio.to_thread(_get_event)

    async def list_events(self, user_id: str, max_results: int = 10) -> List[Dict[str, Any]]:
        """
        Lists upcoming events from the user's primary calendar asynchronously.
        """
        def _list_events():
            try:
                now = datetime.datetime.now(datetime.timezone.utc).isoformat()
                events_result = self.service.events().list(
                    calendarId='primary',
                    timeMin=now,
                    maxResults=max_results,
                    singleEvents=True,
                    orderBy='startTime'
                ).execute()
                
                events = events_result.get('items', [])
                formatted_events = []
                for event in events:
                    start_str = event['start'].get('dateTime', event['start'].get('date'))
                    formatted_events.append({
                        'title': event.get('summary', 'Untitled Event'),
                        'start_time': start_str,
                        'location': event.get('location', 'No location provided')
                    })
                return formatted_events
            except HttpError as error:
                print(f"An error occurred with Google Calendar API: {error}")
                return []

        return await asyncio.to_thread(_list_events)
