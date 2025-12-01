import pytest
from unittest.mock import MagicMock, patch
from google.oauth2.credentials import Credentials

from src.adapters.factory import get_adapter_bundle, AdapterBundle
from src.adapters.google_calendar import GoogleCalendarAdapter
from src.adapters.google_maps import GoogleMapsAdapter
from src.adapters.outlook_calendar import OutlookCalendarAdapter
from src.adapters.mocks import MockCalendar, MockMaps

@patch.dict('os.environ', {'GOOGLE_MAPS_API_KEY': 'AIza_fake_key'})
def test_get_adapter_bundle_google():
    """Tests that the factory returns Google adapters."""
    creds = MagicMock(spec=Credentials)
    bundle = get_adapter_bundle(provider="google", google_creds=creds)
    assert isinstance(bundle, AdapterBundle)
    assert isinstance(bundle.calendar, GoogleCalendarAdapter)
    assert isinstance(bundle.maps, GoogleMapsAdapter)

@patch('src.adapters.outlook_calendar.OnBehalfOfCredential')
def test_get_adapter_bundle_microsoft(mock_obo_credential):
    """Tests that the factory returns the Outlook adapter."""
    bundle = get_adapter_bundle(
        provider="microsoft", 
        ms_token={"access_token": "token"},
        ms_client_id="client_id",
        ms_client_secret="client_secret",
        ms_tenant_id="tenant_id"
    )
    assert isinstance(bundle, AdapterBundle)
    assert isinstance(bundle.calendar, OutlookCalendarAdapter)
    assert isinstance(bundle.maps, MockMaps)

def test_get_adapter_bundle_mock():
    """Tests that the factory returns mock adapters."""
    bundle = get_adapter_bundle(provider="mock")
    assert isinstance(bundle, AdapterBundle)
    assert isinstance(bundle.calendar, MockCalendar)
    assert isinstance(bundle.maps, MockMaps)

def test_get_adapter_bundle_unsupported():
    """Tests that the factory raises an error for unsupported providers."""
    with pytest.raises(NotImplementedError):
        get_adapter_bundle(provider="unsupported")

@patch.dict('os.environ', {}, clear=True)
def test_get_adapter_bundle_google_no_api_key():
    """Tests that the factory raises an error if the API key is missing."""
    creds = MagicMock(spec=Credentials)
    with pytest.raises(ValueError):
        get_adapter_bundle(provider="google", google_creds=creds)

def test_get_adapter_bundle_google_no_credentials():
    """Tests that the factory raises an error if credentials are not provided."""
    with pytest.raises(ValueError):
        get_adapter_bundle(provider="google")

def test_get_adapter_bundle_microsoft_no_credentials():
    """Tests that the factory raises an error if credentials are not provided."""
    with pytest.raises(ValueError):
        get_adapter_bundle(provider="microsoft")
