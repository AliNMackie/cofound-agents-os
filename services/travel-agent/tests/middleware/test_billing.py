import pytest
from unittest.mock import patch, MagicMock
from fastapi import FastAPI, Depends, HTTPException
from fastapi.testclient import TestClient
from src.middleware.billing import require_subscription

# Mock auth dependency
def mock_get_current_user():
    return 'test_user'

@pytest.fixture
def app():
    """Create a FastAPI app for testing."""
    app = FastAPI()

    @app.get("/test")
    def test_route(user_id: str = Depends(require_subscription)):
        return {"status": "ok"}

    return app

@pytest.fixture
def client(app):
    app.dependency_overrides = {} # User ID normally comes from request, but require_subscription calls get_current_user. 
    # We need to mock the user_id passing into require_subscription which calls get_current_user
    # Actually require_subscription depends on get_current_user. We should override get_current_user.
    from src.middleware.auth import get_current_user
    app.dependency_overrides[get_current_user] = mock_get_current_user
    return TestClient(app)

@patch('google.cloud.firestore.Client')
def test_require_subscription_active(mock_firestore_client, client):
    """Tests that the dependency grants access with an active subscription."""
    mock_db = MagicMock()
    mock_doc = MagicMock()
    mock_doc.exists = True
    mock_doc.to_dict.return_value = {'subscription_status': 'active'}
    mock_db.collection.return_value.document.return_value.get.return_value = mock_doc
    mock_firestore_client.return_value = mock_db
    
    response = client.get('/test')
    
    assert response.status_code == 200

@patch('google.cloud.firestore.Client')
def test_require_subscription_inactive(mock_firestore_client, client):
    """Tests that the dependency denies access with an inactive subscription."""
    mock_db = MagicMock()
    mock_doc = MagicMock()
    mock_doc.exists = True
    mock_doc.to_dict.return_value = {'subscription_status': 'inactive'}
    mock_db.collection.return_value.document.return_value.get.return_value = mock_doc
    mock_firestore_client.return_value = mock_db
    
    response = client.get('/test')
    
    assert response.status_code == 402
