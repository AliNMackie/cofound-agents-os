import pytest
from unittest.mock import MagicMock, patch
from src.infrastructure.oauth import initiate_auth, handle_callback

@pytest.fixture
def mock_flow():
    with patch('src.infrastructure.oauth.Flow') as mock:
        yield mock

def test_initiate_auth(mock_flow):
    # Setup
    mock_instance = mock_flow.from_client_secrets_file.return_value
    mock_instance.authorization_url.return_value = ('https://auth.url', 'state_token')
    
    # Execute
    url, state = initiate_auth('secrets.json', 'http://callback')
    
    # Verify
    assert url == 'https://auth.url'
    assert state == 'state_token'
    mock_flow.from_client_secrets_file.assert_called_once()
    mock_instance.authorization_url.assert_called_once()

def test_handle_callback(mock_flow):
    # Setup
    mock_instance = mock_flow.from_client_secrets_file.return_value
    expected_credentials = MagicMock()
    mock_instance.credentials = expected_credentials
    
    # Execute
    creds = handle_callback('secrets.json', 'http://callback', 'state', 'code')
    
    # Verify
    assert creds == expected_credentials
    mock_flow.from_client_secrets_file.assert_called_once()
    mock_instance.fetch_token.assert_called_with(code='code')
