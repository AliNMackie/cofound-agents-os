import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch
from src.main import app
from src.core.auth import get_current_user

client = TestClient(app)

def test_public_routes():
    """Health check and version should be public"""
    response = client.get("/health")
    assert response.status_code == 200
    
    response = client.get("/version")
    assert response.status_code == 200

def test_protected_route_no_token():
    """Protected routes should 403/401 without token"""
    # Try accessing signals without token
    response = client.get("/signals")
    # FastAPI returns 403 Forbidden when using HTTPBearer and no header is present
    assert response.status_code in [401, 403] 

def test_protected_route_with_valid_token(mock_current_user):
    """Should pass with valid token override"""
    # Override the dependency
    app.dependency_overrides[get_current_user] = lambda: mock_current_user
    
    # Mock Firestore for this call to avoid unrelated errors
    with patch("src.api.signals.firestore.Client") as mock_db:
        mock_col = MagicMock()
        mock_db.return_value.collection.return_value = mock_col
        # Mock stream to return empty list
        mock_col.order_by.return_value.limit.return_value.stream.return_value = []
        
        response = client.get("/signals")
        assert response.status_code == 200
    
    # Clean up override
    app.dependency_overrides = {}
