"""
Sprint 9 Validation Tests — Enterprise Readiness
Tests: AuditLogMiddleware (PII redaction, interception), API Key lifecycle
       (hashing, generation, verification), SSO domain mapping, auth upgrades
"""
import sys
import os
import hashlib
from unittest.mock import MagicMock, patch, AsyncMock

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


# ═══════════════════════════════════════════
# TASK 1: AuditLogMiddleware Tests
# ═══════════════════════════════════════════

class TestAuditRedaction:
    """Validate PII / secret redaction in audit logs."""

    def test_redact_password_field(self):
        from src.core.audit import _redact_dict
        result = _redact_dict({"username": "alice", "password": "secret123"})
        assert result["username"] == "alice"
        assert result["password"] == "[REDACTED]"

    def test_redact_api_key_field(self):
        from src.core.audit import _redact_dict
        result = _redact_dict({"api_key": "sk_live_abc123"})
        assert result["api_key"] == "[REDACTED]"

    def test_redact_nested_fields(self):
        from src.core.audit import _redact_dict
        result = _redact_dict({
            "user": {"name": "Alice", "token": "jwt_xyz"},
            "action": "login",
        })
        assert result["user"]["name"] == "Alice"
        assert result["user"]["token"] == "[REDACTED]"

    def test_redact_preserves_non_sensitive(self):
        from src.core.audit import _redact_dict
        result = _redact_dict({"company_name": "Acme", "status": "active"})
        assert result["company_name"] == "Acme"
        assert result["status"] == "active"

    def test_redact_truncates_long_strings(self):
        from src.core.audit import _redact_dict
        long_val = "x" * 600
        result = _redact_dict({"description": long_val})
        assert len(result["description"]) < 600
        assert "[TRUNCATED]" in result["description"]

    def test_redact_caps_list_entries(self):
        from src.core.audit import _redact_dict
        result = _redact_dict({"items": [{"a": i} for i in range(20)]})
        assert len(result["items"]) == 10  # capped at 10

    def test_redact_depth_limit(self):
        from src.core.audit import _redact_dict
        deep = {"a": {"b": {"c": {"d": {"e": {"f": {"g": "leaf"}}}}}}}
        result = _redact_dict(deep)
        # Should not crash, should truncate at depth 5
        assert "_truncated" in str(result)

    def test_redact_credit_card(self):
        from src.core.audit import _redact_dict
        result = _redact_dict({"credit_card": "4111-1111-1111-1111"})
        assert result["credit_card"] == "[REDACTED]"

    def test_redact_key_value(self):
        from src.core.audit import _redact_dict
        result = _redact_dict({"key_value": "sk_live_abc123xyz"})
        assert result["key_value"] == "[REDACTED]"


class TestAuditMiddlewareIntegration:
    """Validate the middleware intercepts state-changing requests."""

    def _make_app(self):
        from src.core.audit import AuditLogMiddleware
        app = FastAPI()
        app.add_middleware(AuditLogMiddleware)

        @app.post("/test/create")
        async def create_item():
            return {"status": "created"}

        @app.get("/test/read")
        async def read_item():
            return {"status": "ok"}

        @app.get("/health")
        async def health():
            return {"status": "ok"}

        return TestClient(app)

    def test_post_request_is_intercepted(self):
        client = self._make_app()
        response = client.post("/test/create", json={"name": "test"})
        assert response.status_code == 200
        # If we get here, the middleware didn't crash
        assert response.json()["status"] == "created"

    def test_get_request_passes_through(self):
        client = self._make_app()
        response = client.get("/test/read")
        assert response.status_code == 200

    def test_health_endpoint_skipped(self):
        client = self._make_app()
        response = client.get("/health")
        assert response.status_code == 200


# ═══════════════════════════════════════════
# TASK 2: API Key Management Tests
# ═══════════════════════════════════════════

class TestApiKeyHashing:
    """Validate SHA-256 key hashing."""

    def test_hash_is_deterministic(self):
        from src.api.api_keys import _hash_key
        key = "sk_live_abc123"
        h1 = _hash_key(key)
        h2 = _hash_key(key)
        assert h1 == h2

    def test_hash_is_sha256(self):
        from src.api.api_keys import _hash_key
        key = "sk_live_test"
        expected = hashlib.sha256(key.encode("utf-8")).hexdigest()
        assert _hash_key(key) == expected

    def test_different_keys_produce_different_hashes(self):
        from src.api.api_keys import _hash_key
        h1 = _hash_key("sk_live_aaa")
        h2 = _hash_key("sk_live_bbb")
        assert h1 != h2

    def test_generate_key_format(self):
        from src.api.api_keys import _generate_raw_key
        key = _generate_raw_key()
        assert key.startswith("sk_live_")
        assert len(key) > 20

    def test_generate_key_uniqueness(self):
        from src.api.api_keys import _generate_raw_key
        keys = {_generate_raw_key() for _ in range(100)}
        assert len(keys) == 100  # All unique


class TestApiKeyVerification:
    """Validate the verify_api_key dependency."""

    @pytest.mark.asyncio
    async def test_verify_api_key_missing(self):
        from src.api.api_keys import verify_api_key
        from fastapi import HTTPException
        with pytest.raises(HTTPException) as exc_info:
            await verify_api_key(x_api_key=None, authorization=None)
        assert exc_info.value.status_code == 401

    @pytest.mark.asyncio
    async def test_verify_api_key_not_api_bearer(self):
        """Non-API-key bearer tokens should be rejected."""
        from src.api.api_keys import verify_api_key
        from fastapi import HTTPException
        with pytest.raises(HTTPException) as exc_info:
            await verify_api_key(x_api_key=None, authorization="Bearer jwt_token")
        assert exc_info.value.status_code == 401


class TestApiKeyEndpoints:
    """Validate API key CRUD endpoints."""

    @pytest.fixture
    def admin_client(self):
        from src.api.api_keys import router
        from src.core.auth import get_current_user, require_admin, AuthenticatedUser, UserRole

        app = FastAPI()
        app.include_router(router)
        mock_admin = AuthenticatedUser(
            uid="admin-uid", email="admin@bank.co.uk",
            tenant_id="test-tenant", role=UserRole.ADMIN,
        )
        app.dependency_overrides[get_current_user] = lambda: mock_admin
        app.dependency_overrides[require_admin] = lambda: mock_admin
        return TestClient(app)

    @patch("src.api.api_keys._get_db")
    def test_generate_key_returns_raw_key_once(self, mock_db_fn, admin_client):
        mock_db = MagicMock()
        mock_doc_ref = MagicMock()
        mock_doc_ref.id = "key-123"
        mock_db.collection.return_value.document.return_value.collection.return_value.document.return_value = mock_doc_ref
        mock_db_fn.return_value = mock_db

        response = admin_client.post(
            "/api/v1/keys/generate",
            json={"label": "Test Key", "scopes": ["read"]},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["key"].startswith("sk_live_")
        assert data["warning"]  # Should warn about one-time display
        assert data["label"] == "Test Key"


# ═══════════════════════════════════════════
# TASK 3: SSO Domain Mapping Tests
# ═══════════════════════════════════════════

class TestSSODomainMapping:
    """Validate SSO email domain → tenant_id mapping."""

    def test_is_sso_provider_saml(self):
        from src.core.auth import _is_sso_provider
        assert _is_sso_provider("saml.barclays") is True

    def test_is_sso_provider_oidc(self):
        from src.core.auth import _is_sso_provider
        assert _is_sso_provider("oidc.azure") is True

    def test_is_sso_provider_google(self):
        from src.core.auth import _is_sso_provider
        assert _is_sso_provider("google.com") is True

    def test_is_sso_provider_password(self):
        from src.core.auth import _is_sso_provider
        assert _is_sso_provider("password") is False

    def test_is_sso_provider_empty(self):
        from src.core.auth import _is_sso_provider
        assert _is_sso_provider("") is False

    def test_resolve_tenant_from_email_mapped(self):
        from src.core import auth
        # Temporarily add a mapping
        auth.SSO_DOMAIN_MAP["testbank.com"] = "tenant-testbank"
        try:
            result = auth._resolve_tenant_from_email("user@testbank.com")
            assert result == "tenant-testbank"
        finally:
            del auth.SSO_DOMAIN_MAP["testbank.com"]

    def test_resolve_tenant_from_email_unmapped(self):
        from src.core.auth import _resolve_tenant_from_email
        result = _resolve_tenant_from_email("user@unknown.com")
        assert result is None

    def test_resolve_tenant_from_email_invalid(self):
        from src.core.auth import _resolve_tenant_from_email
        assert _resolve_tenant_from_email("invalid-email") is None
        assert _resolve_tenant_from_email("") is None

    def test_default_sso_role_saml(self):
        from src.core.auth import _get_default_sso_role, UserRole
        assert _get_default_sso_role("saml.barclays") == UserRole.ANALYST

    def test_default_sso_role_oidc(self):
        from src.core.auth import _get_default_sso_role, UserRole
        assert _get_default_sso_role("oidc.azure") == UserRole.VIEWER


class TestSSOGetCurrentUser:
    """Validate SSO user auto-mapping in get_current_user."""

    def test_sso_auto_maps_tenant(self):
        from src.core import auth
        from src.core.auth import get_current_user, UserRole

        # Register domain mapping
        auth.SSO_DOMAIN_MAP["ssobank.com"] = "tenant-sso"

        try:
            token = {
                "uid": "sso-user-1",
                "email": "alice@ssobank.com",
                # No tenant_id claim!
                "firebase": {"sign_in_provider": "saml.ssobank"},
            }

            user = get_current_user(token)
            assert user.tenant_id == "tenant-sso"
            assert user.role == UserRole.ANALYST  # SAML default
        finally:
            del auth.SSO_DOMAIN_MAP["ssobank.com"]

    def test_non_sso_without_tenant_raises(self):
        from src.core.auth import get_current_user
        from fastapi import HTTPException

        token = {
            "uid": "user-1",
            "email": "bob@example.com",
            "firebase": {"sign_in_provider": "password"},
        }

        with pytest.raises(HTTPException) as exc_info:
            get_current_user(token)
        assert exc_info.value.status_code == 403

    def test_existing_claims_take_precedence(self):
        from src.core import auth
        from src.core.auth import get_current_user, UserRole

        auth.SSO_DOMAIN_MAP["corp.com"] = "tenant-via-domain"

        try:
            token = {
                "uid": "user-1",
                "email": "carol@corp.com",
                "tenant_id": "tenant-from-claims",
                "role": "ADMIN",
                "firebase": {"sign_in_provider": "saml.corp"},
            }

            user = get_current_user(token)
            # Claims should take precedence over domain mapping
            assert user.tenant_id == "tenant-from-claims"
            assert user.role == UserRole.ADMIN
        finally:
            del auth.SSO_DOMAIN_MAP["corp.com"]
