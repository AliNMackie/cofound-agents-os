"""
API Keys — Regression Tests (updated for Sprint 9 rewrite)
Tests the new tenant-scoped, SHA-256 hashed API key endpoints.
"""
import sys
import os
import pytest
import datetime
from fastapi import FastAPI
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.api.api_keys import router
from src.core.auth import get_current_user, require_admin, AuthenticatedUser, UserRole


@pytest.fixture
def mock_admin():
    return AuthenticatedUser(
        uid="admin-uid", email="admin@bank.co.uk",
        tenant_id="test-tenant", role=UserRole.ADMIN,
    )


@pytest.fixture
def mock_viewer():
    return AuthenticatedUser(
        uid="viewer-uid", email="viewer@bank.co.uk",
        tenant_id="test-tenant", role=UserRole.VIEWER,
    )


@pytest.fixture
def admin_client(mock_admin):
    app = FastAPI()
    app.include_router(router)
    app.dependency_overrides[get_current_user] = lambda: mock_admin
    app.dependency_overrides[require_admin] = lambda: mock_admin
    return TestClient(app)


@pytest.fixture
def viewer_client(mock_viewer):
    app = FastAPI()
    app.include_router(router)
    app.dependency_overrides[get_current_user] = lambda: mock_viewer
    # Don't override require_admin — let it enforce role check
    return TestClient(app)


def test_list_api_keys(admin_client):
    with patch("src.api.api_keys._get_db") as mock_db_fn:
        mock_db = MagicMock()
        mock_db_fn.return_value = mock_db

        mock_key_doc = MagicMock()
        mock_key_doc.id = "key_123"
        mock_key_doc.to_dict.return_value = {
            "label": "Test Key",
            "prefix": "sk_live_12ab...",
            "scopes": ["read"],
            "created_at": datetime.datetime.now(datetime.timezone.utc),
            "created_by_email": "admin@bank.co.uk",
            "status": "active",
        }
        mock_db.collection.return_value.document.return_value.collection.return_value.stream.return_value = [mock_key_doc]

        response = admin_client.get("/api/v1/keys/")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == "key_123"
        assert data[0]["label"] == "Test Key"


def test_create_api_key(admin_client):
    with patch("src.api.api_keys._get_db") as mock_db_fn:
        mock_db = MagicMock()
        mock_db_fn.return_value = mock_db

        mock_doc_ref = MagicMock()
        mock_doc_ref.id = "new_key_id"
        mock_db.collection.return_value.document.return_value.collection.return_value.document.return_value = mock_doc_ref

        payload = {"label": "New Key", "scopes": ["read", "write"]}
        response = admin_client.post("/api/v1/keys/generate", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "new_key_id"
        assert "sk_live_" in data["key"]
        assert data["warning"]  # One-time display warning
        mock_doc_ref.set.assert_called()


def test_revoke_api_key(admin_client):
    with patch("src.api.api_keys._get_db") as mock_db_fn:
        mock_db = MagicMock()
        mock_db_fn.return_value = mock_db

        mock_doc_ref = MagicMock()
        mock_doc = MagicMock()
        mock_doc.exists = True
        mock_doc_ref.get.return_value = mock_doc
        mock_db.collection.return_value.document.return_value.collection.return_value.document.return_value = mock_doc_ref

        response = admin_client.delete("/api/v1/keys/target_key_id")

        assert response.status_code == 200
        assert response.json()["status"] == "success"
        mock_doc_ref.update.assert_called()  # Soft delete (status=revoked)


def test_revoke_api_key_not_found(admin_client):
    with patch("src.api.api_keys._get_db") as mock_db_fn:
        mock_db = MagicMock()
        mock_db_fn.return_value = mock_db

        mock_doc_ref = MagicMock()
        mock_doc = MagicMock()
        mock_doc.exists = False
        mock_doc_ref.get.return_value = mock_doc
        mock_db.collection.return_value.document.return_value.collection.return_value.document.return_value = mock_doc_ref

        response = admin_client.delete("/api/v1/keys/nonexistent")
        assert response.status_code == 404
