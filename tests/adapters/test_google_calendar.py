import json
import pytest
from unittest.mock import patch, MagicMock
from google.oauth2.credentials import Credentials
from src.adapters.google_calendar import GoogleCalendarAdapter
import httplib2

@pytest.fixture
def mock_credentials():
    """Fixture for mock Google credentials."""
    creds = MagicMock(spec=Credentials)
    creds.token = "mock_token"
    creds.expired = False
    creds.valid = True
    creds.universe_domain = "googleapis.com"
    return creds

@pytest.mark.asyncio
@patch.object(httplib2.Http, 'request')
async def test_get_next_event_success(mock_http_request, mock_credentials):
    """Tests the get_next_event method with a successful API response."""
    # Arrange
    mock_events_result = {
        'items': [{
            'summary': 'Test Event',
            'start': {'dateTime': '2025-01-01T10:00:00Z'},
            'location': 'Test Location'
        }]
    }
    mock_response = httplib2.Response({'status': 200})
    mock_content = json.dumps(mock_events_result).encode('utf-8')
    mock_http_request.return_value = (mock_response, mock_content)
    
    adapter = GoogleCalendarAdapter(credentials=mock_credentials)
    
    # Act
    event = await adapter.get_next_event(user_id="test_user")
    
    # Assert
    assert event is not None
    assert event['title'] == 'Test Event'
    assert event['location'] == 'Test Location'

@pytest.mark.asyncio
@patch.object(httplib2.Http, 'request')
async def test_get_next_event_no_events(mock_http_request, mock_credentials):
    """Tests the get_next_event method when the API returns no events."""
    # Arrange
    mock_events_result = {'items': []}
    mock_response = httplib2.Response({'status': 200})
    mock_content = json.dumps(mock_events_result).encode('utf-8')
    mock_http_request.return_value = (mock_response, mock_content)

    adapter = GoogleCalendarAdapter(credentials=mock_credentials)
    
    # Act
    event = await adapter.get_next_event(user_id="test_user")
    
    # Assert
    assert event is None
