import pytest
from unittest.mock import patch, MagicMock
from src.infrastructure import oauth

@patch('google_auth_oauthlib.flow.Flow.from_client_secrets_file')
def test_initiate_auth(mock_flow_from_secrets):
    """Tests the initiate_auth function."""
    # Arrange
    mock_flow = MagicMock()
    mock_flow.authorization_url.return_value = ("https://example.com/auth", "state123")
    mock_flow_from_secrets.return_value = mock_flow
    
    # Act
    auth_url, state = oauth.initiate_auth("secrets.json", "https://localhost/callback")
    
    # Assert
    assert auth_url == "https://example.com/auth"
    assert state == "state123"
    mock_flow_from_secrets.assert_called_with(
        "secrets.json",
        scopes=oauth.SCOPES,
        redirect_uri="https://localhost/callback"
    )
    mock_flow.authorization_url.assert_called_with(
        access_type='offline',
        prompt='consent'
    )

@patch('google_auth_oauthlib.flow.Flow.from_client_secrets_file')
def test_handle_callback(mock_flow_from_secrets):
    """Tests the handle_callback function."""
    # Arrange
    mock_flow = MagicMock()
    mock_creds = MagicMock()
    mock_flow.credentials = mock_creds
    mock_flow_from_secrets.return_value = mock_flow
    
    # Act
    credentials = oauth.handle_callback(
        "secrets.json",
        "https://localhost/callback",
        "state123",
        "code123"
    )
    
    # Assert
    assert credentials == mock_creds
    mock_flow_from_secrets.assert_called_with(
        "secrets.json",
        scopes=oauth.SCOPES,
        state="state123",
        redirect_uri="https://localhost/callback"
    )
    mock_flow.fetch_token.assert_called_with(code="code123")
