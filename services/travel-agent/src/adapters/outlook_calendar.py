from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from azure.identity.aio import OnBehalfOfCredential
from msgraph_core.authentication import AzureIdentityAuthenticationProvider
from msgraph_core import BaseGraphRequestAdapter
from kiota_abstractions.request_information import RequestInformation

from src.domain.interfaces import CalendarInterface

class OutlookCalendarAdapter(CalendarInterface):
    """Adapter for the Microsoft Graph API to access Outlook Calendar."""

    def __init__(self, tenant_id: str, client_id: str, client_secret: str, user_assertion: str):
        credential = OnBehalfOfCredential(
            tenant_id=tenant_id,
            client_id=client_id,
            client_secret=client_secret,
            user_assertion=user_assertion
        )
        auth_provider = AzureIdentityAuthenticationProvider(
            credential, 
            allowed_hosts=["graph.microsoft.com"]
        )
        self.adapter = BaseGraphRequestAdapter(auth_provider)

    async def get_next_event(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetches the next upcoming event from the user's primary calendar asynchronously.
        """
        request_info = self._build_events_request_info(top=1)
        response = await self.adapter.send_async(request_info, None)
        
        events = response.get("value", [])
        
        if not events:
            return None
            
        return self._map_event_to_domain(events[0])

    async def list_events(self, user_id: str, max_results: int = 10) -> List[Dict[str, Any]]:
        """
        Lists upcoming events from the user's primary calendar asynchronously.
        """
        request_info = self._build_events_request_info(top=max_results)
        response = await self.adapter.send_async(request_info, None)
        
        events = response.get("value", [])
        
        return [self._map_event_to_domain(event) for event in events]

    def _build_events_request_info(self, top: int) -> RequestInformation:
        """Helper to build the request information for fetching events."""
        request_info = RequestInformation()
        request_info.http_method = "GET"
        request_info.url_template = "{+baseurl}/me/events{?%24top,%24skip,%24search,%24filter,%24count,%24orderby,%24select,%24expand}"
        request_info.query_parameters = {
            "top": top,
            "filter": f"start/dateTime ge '{datetime.now(timezone.utc).isoformat()}'",
            "orderby": "start/dateTime",
        }
        return request_info

    def _map_event_to_domain(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """Maps a single Graph API event to the domain's Event model dictionary."""
        return {
            "title": event.get("subject", "Untitled Event"),
            "start_time": event.get("start", {}).get("dateTime"),
            "location": event.get("location", {}).get("displayName", "No location provided"),
        }
