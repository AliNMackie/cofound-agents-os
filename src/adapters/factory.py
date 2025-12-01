import os
from typing import NamedTuple, Union

from google.oauth2.credentials import Credentials

from src.domain.interfaces import CalendarInterface, MapsInterface
from src.adapters.google_calendar import GoogleCalendarAdapter
from src.adapters.google_maps import GoogleMapsAdapter
from src.adapters.outlook_calendar import OutlookCalendarAdapter
from src.adapters.mocks import MockCalendar, MockMaps


class AdapterBundle(NamedTuple):
    """A bundle of adapters for the agent to use."""
    calendar: CalendarInterface
    maps: MapsInterface


def get_adapter_bundle(
    provider: str, 
    google_creds: Credentials = None, 
    ms_token: dict = None,
    ms_client_id: str = None,
    ms_client_secret: str = None,
    ms_tenant_id: str = None,
) -> AdapterBundle:
    """
    Returns a bundle of adapters based on the specified provider.
    """
    if provider == "google":
        if not google_creds:
            raise ValueError("Google provider requires google_creds.")
        
        maps_api_key = os.environ.get("GOOGLE_MAPS_API_KEY")
        if not maps_api_key:
            raise ValueError("GOOGLE_MAPS_API_KEY environment variable not set.")

        return AdapterBundle(
            calendar=GoogleCalendarAdapter(credentials=google_creds),
            maps=GoogleMapsAdapter(api_key=maps_api_key)
        )
    elif provider == "microsoft":
        if not all([ms_token, ms_client_id, ms_client_secret, ms_tenant_id]):
            raise ValueError("Microsoft provider requires ms_token, ms_client_id, ms_client_secret, and ms_tenant_id.")
            
        return AdapterBundle(
            calendar=OutlookCalendarAdapter(
                tenant_id=ms_tenant_id,
                client_id=ms_client_id,
                client_secret=ms_client_secret,
                user_assertion=ms_token["access_token"]
            ),
            maps=MockMaps()
        )
    elif provider == "mock":
        return AdapterBundle(
            calendar=MockCalendar(),
            maps=MockMaps()
        )
    else:
        raise NotImplementedError(f"Provider '{provider}' is not supported.")
