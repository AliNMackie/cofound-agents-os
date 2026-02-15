import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch
from src.main import app
from src.core.auth import get_current_user
import datetime

client = TestClient(app)

@pytest.fixture
def mock_user_auth(mock_current_user):
    app.dependency_overrides[get_current_user] = lambda: mock_current_user
    yield
    app.dependency_overrides = {}

def test_list_api_keys(mock_user_auth):
    with patch("src.api.api_keys.firestore.Client") as mock_db:
        mock_col = MagicMock()
        mock_db.return_value.collection.return_value = mock_col
        
        # Mock stream result
        mock_key_doc = MagicMock()
        mock_key_doc.id = "key_123"
        mock_key_doc.to_dict.return_value = {
            "label": "Test Key",
            "created_at": datetime.datetime.now(datetime.timezone.utc),
            "status": "active",
            "prefix": "sk_live_12..."
        }
        mock_col.where.return_value.stream.return_value = [mock_key_doc]
        
        response = client.get("/api-keys")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == "key_123"
        assert data[0]["label"] == "Test Key"

def test_create_api_key(mock_user_auth):
    with patch("src.api.api_keys.firestore.Client") as mock_db:
        mock_col = MagicMock()
        mock_db.return_value.collection.return_value = mock_col
        mock_doc_ref = MagicMock()
        mock_doc_ref.id = "new_key_id"
        mock_col.document.return_value = mock_doc_ref
        
        payload = {"label": "New Key", "scopes": ["read", "write"]}
        response = client.post("/api-keys", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "new_key_id"
        assert "sk_live_" in data["key"]
        
        # Verify DB calls
        mock_col.document.assert_called()
        mock_doc_ref.set.assert_called()

def test_revoke_api_key(mock_user_auth, mock_current_user):
    with patch("src.api.api_keys.firestore.Client") as mock_db:
        mock_col = MagicMock()
        mock_db.return_value.collection.return_value = mock_col
        mock_doc_ref = MagicMock()
        mock_col.document.return_value = mock_doc_ref
        
        # Mock existing key belonging to user
        mock_doc = MagicMock()
        mock_doc.exists = True
        mock_doc.to_dict.return_value = {"user_id": mock_current_user["uid"]}
        mock_doc_ref.get.return_value = mock_doc
        
        response = client.delete("/api-keys/target_key_id")
        
        assert response.status_code == 200
        assert response.json()["status"] == "success"
        mock_doc_ref.delete.assert_called()

def test_revoke_api_key_unauthorized(mock_user_auth):
    with patch("src.api.api_keys.firestore.Client") as mock_db:
        mock_col = MagicMock()
        mock_db.return_value.collection.return_value = mock_col
        mock_doc_ref = MagicMock()
        mock_col.document.return_value = mock_doc_ref
        
        # Mock key belonging to SOMEONE ELSE
        mock_doc = MagicMock()
        mock_doc.exists = True
        mock_doc.to_dict.return_value = {"user_id": "other_user"}
        mock_doc_ref.get.return_value = mock_doc
        
        response = client.delete("/api-keys/target_key_id")
        
        assert response.status_code == 403
