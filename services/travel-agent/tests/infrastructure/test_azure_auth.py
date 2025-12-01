import pytest
from unittest.mock import patch, MagicMock
from src.infrastructure import azure_auth

@patch('msal.ConfidentialClientApplication')
def test_initiate_auth(mock_msal_app_constructor):
    """Tests the initiate_auth function."""
    # Arrange
    mock_app = MagicMock()
    mock_msal_app_constructor.return_value = mock_app
    
    auth_flow = {
        "auth_uri": "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?...",
        "state": "state456"
    }
    mock_app.initiate_auth_code_flow.return_value = auth_flow
    
    # Act
    auth_uri, state = azure_auth.initiate_auth(
        "client_id", 
        "https://login.microsoftonline.com/common", 
        "http://localhost/redirect"
    )
    
    # Assert
    assert "authorize" in auth_uri
    assert state == "state456"
    mock_app.initiate_auth_code_flow.assert_called_with(
        scopes=azure_auth.SCOPES,
        redirect_uri="http://localhost/redirect"
    )

@patch('msal.ConfidentialClientApplication')
def test_handle_callback_success(mock_msal_app_constructor):
    """Tests the handle_callback function with a successful token acquisition."""
    # Arrange
    mock_app = MagicMock()
    mock_msal_app_constructor.return_value = mock_app
    
    token_result = {
        "access_token": "ey...",
        "id_token_claims": {"preferred_username": "user@example.com"}
    }
    mock_app.acquire_token_by_auth_code_flow.return_value = token_result
    
    # Act
    result = azure_auth.handle_callback(
        "client_id",
        "client_secret",
        "https://login.microsoftonline.com/common",
        "http://localhost/redirect",
        auth_response={"code": "auth_code"}
    )
    
    # Assert
    assert result is not None
    assert "access_token" in result
    mock_app.acquire_token_by_auth_code_flow.assert_called_once()
