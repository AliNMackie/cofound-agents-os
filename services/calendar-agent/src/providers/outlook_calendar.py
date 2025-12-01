import logging
import time
from datetime import datetime
from typing import List, Dict, Any

import requests
from requests import HTTPError

from src.shared.calendar_schema import UnifiedEvent, TimeSlot
from src.shared.exceptions import TokenExpired, QuotaExceeded
from src.shared.interfaces import CalendarProvider
from .decorators import handle_provider_errors, provider_retry


class OutlookCalendarProvider(CalendarProvider):
    """
    Outlook Calendar provider implementation using Microsoft Graph API.
    """
    BASE_URL = "https://graph.microsoft.com/v1.0/me"

    def __init__(self, api_credentials: Any):
        self.api_credentials = api_credentials
        # In a real scenario, this would initialize the Microsoft Graph API client
        pass

    @provider_retry
    def _make_request(self, method: str, endpoint: str, params: Dict = None, data: Dict = None) -> Any:
        """
        Makes a request to the Microsoft Graph API with error handling and retries.
        """
        # This is a mock implementation.
        url = f"{self.BASE_URL}/{endpoint}"
        headers = {
            "Authorization": f"Bearer {self.api_credentials.get('token')}",
            "Content-Type": "application/json",
            "Prefer": 'outlook.timezone="UTC"'
        }

        try:
            response = requests.request(method, url, headers=headers, params=params, json=data)
            response.raise_for_status()
            return response.json()
        except HTTPError as e:
            if e.response.status_code == 401:
                raise TokenExpired("Microsoft Graph API token expired.")
            elif e.response.status_code == 429: # Throttling/quota
                logging.warning("Microsoft Graph API quota exceeded.")
                raise QuotaExceeded("Microsoft Graph API quota exceeded.")
            else:
                raise e

    @handle_provider_errors
    def list_events(self, start_date: datetime, end_date: datetime) -> List[UnifiedEvent]:
        params = {
            "startDateTime": start_date.isoformat(),
            "endDateTime": end_date.isoformat(),
            "$select": "id,subject,start,end,webLink"
        }
        # This is a mock endpoint
        response_data = self._make_request("GET", "calendarview", params=params)
        if not response_data or "value" not in response_data:
            return []
        
        events = []
        for item in response_data["value"]:
            events.append(UnifiedEvent(
                id=item["id"],
                subject=item["subject"],
                start_utc=datetime.fromisoformat(item["start"]["dateTime"]),
                end_utc=datetime.fromisoformat(item["end"]["dateTime"]),
                provider="outlook",
                meeting_link=item.get("webLink")
            ))
        return events

    @handle_provider_errors
    def get_free_busy(self, start_date: datetime, end_date: datetime) -> List[TimeSlot]:
        data = {
            "schedules": ["me"],
            "startTime": {
                "dateTime": start_date.isoformat(),
                "timeZone": "UTC"
            },
            "endTime": {
                "dateTime": end_date.isoformat(),
                "timeZone": "UTC"
            }
        }
        # This is a mock endpoint
        response_data = self._make_request("POST", "calendar/getSchedule", data=data)
        if not response_data or "value" not in response_data or not response_data["value"]:
            return []
        
        busy_slots = response_data["value"][0]["scheduleItems"]
        return [
            TimeSlot(
                start_utc=datetime.fromisoformat(slot["start"]["dateTime"]),
                end_utc=datetime.fromisoformat(slot["end"]["dateTime"])
            ) for slot in busy_slots
        ]

    def create_event(self, event: UnifiedEvent) -> UnifiedEvent:
        raise NotImplementedError("create_event is not implemented for the Outlook Calendar provider.")
