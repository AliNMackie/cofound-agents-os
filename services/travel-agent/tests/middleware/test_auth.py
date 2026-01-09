import pytest
from unittest.mock import patch, MagicMock
from fastapi import FastAPI, Depends, Request
from fastapi.testclient import TestClient
from src.middleware.auth import get_current_user, security
from firebase_admin import auth

@pytest.fixture
def app():
    """Create a FastAPI app for testing."""
    app = FastAPI()

    @app.get("/test")
    def test_route(user_id: str = Depends(get_current_user)):
        return {"user_id": user_id}

    return app

@pytest.fixture
def client(app):
    return TestClient(app)

@patch('src.middleware.auth.auth.verify_id_token')
def test_require_auth_success(mock_verify_token, client):
    """Tests that the dependency grants access with a valid token."""
    mock_verify_token.return_value = {'uid': 'test_user'}
    
    response = client.get('/test', headers={'Authorization': 'Bearer valid_token'})
    
    assert response.status_code == 200
    assert response.json() == {'user_id': 'test_user'}

def test_require_auth_no_header(client):
    """Tests that the dependency denies access without an Authorization header."""
    response = client.get('/test')
    assert response.status_code == 403 # HTTPBearer returns 403 if missing scheme, or 401 if missing

@patch('src.middleware.auth.auth.verify_id_token')
def test_require_auth_invalid_token(mock_verify_token, client):
    """Tests that the dependency denies access with an invalid token."""
    mock_verify_token.side_effect = auth.InvalidIdTokenError('Invalid token')
    
    response = client.get('/test', headers={'Authorization': 'Bearer invalid_token'})
    
    assert response.status_code == 401

