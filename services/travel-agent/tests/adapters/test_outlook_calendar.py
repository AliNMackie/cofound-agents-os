import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from src.adapters.outlook_calendar import OutlookCalendarAdapter

@pytest.mark.asyncio
@patch('src.adapters.outlook_calendar.OnBehalfOfCredential')
async def test_get_next_event_success(mock_obo_credential):
    """Tests the get_next_event method with a successful API response."""
    # Arrange
    adapter = OutlookCalendarAdapter(
        tenant_id="tenant",
        client_id="client",
        client_secret="secret",
        user_assertion="assertion"
    )
    
    mock_response = {
        'value': [{
            'subject': 'Team Sync',
            'start': {'dateTime': '2025-01-01T12:00:00'},
            'location': {'displayName': 'Conference Room 1'}
        }]
    }
    
    with patch.object(adapter.adapter, 'send_async', AsyncMock(return_value=mock_response)) as mock_send_async:
        # Act
        event = await adapter.get_next_event(user_id="test_user")
        
        # Assert
        assert event is not None
        assert event['title'] == 'Team Sync'
        assert event['location'] == 'Conference Room 1'
        mock_send_async.assert_called_once()

@pytest.mark.asyncio
@patch('src.adapters.outlook_calendar.OnBehalfOfCredential')
async def test_get_next_event_no_events(mock_obo_credential):
    """Tests the get_next_event method when the API returns no events."""
    # Arrange
    adapter = OutlookCalendarAdapter(
        tenant_id="tenant",
        client_id="client",
        client_secret="secret",
        user_assertion="assertion"
    )
    
    mock_response = {'value': []}
    
    with patch.object(adapter.adapter, 'send_async', AsyncMock(return_value=mock_response)) as mock_send_async:
        # Act
        event = await adapter.get_next_event(user_id="test_user")
        
        # Assert
        assert event is None
        mock_send_async.assert_called_once()
