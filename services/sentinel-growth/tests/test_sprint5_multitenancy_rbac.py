"""
Sprint 5 Validation Tests — Multi-Tenancy & RBAC
Tests: tenant isolation, role-based access control, cross-tenant denial
"""
import sys
import os
import asyncio
import datetime
from unittest.mock import MagicMock, patch, AsyncMock

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


# ═══════════════════════════════════════════
# TASK 1: AuthenticatedUser & Role Hierarchy
# ═══════════════════════════════════════════

class TestAuthenticatedUser:
    """Validate the AuthenticatedUser model and role hierarchy."""

    def _make_user(self, role="ADMIN", tenant_id="tenant-A"):
        from src.core.auth import AuthenticatedUser, UserRole
        return AuthenticatedUser(
            uid="uid-001",
            email="test@bank.co.uk",
            tenant_id=tenant_id,
            role=UserRole(role),
        )

    def test_admin_is_admin(self):
        user = self._make_user("ADMIN")
        assert user.is_admin is True
        assert user.is_analyst_or_above is True

    def test_analyst_is_not_admin(self):
        user = self._make_user("ANALYST")
        assert user.is_admin is False
        assert user.is_analyst_or_above is True

    def test_viewer_is_neither_admin_nor_analyst(self):
        user = self._make_user("VIEWER")
        assert user.is_admin is False
        assert user.is_analyst_or_above is False

    def test_can_access_own_tenant(self):
        user = self._make_user(tenant_id="tenant-A")
        assert user.can_access_tenant("tenant-A") is True

    def test_cannot_access_other_tenant(self):
        user = self._make_user(tenant_id="tenant-A")
        assert user.can_access_tenant("tenant-B") is False


# ═══════════════════════════════════════════
# TASK 2: Role-Based Dependencies
# ═══════════════════════════════════════════

class TestRBACDependencies:
    """Validate FastAPI RBAC dependency functions."""

    def test_get_current_user_extracts_claims(self):
        from src.core.auth import get_current_user
        token = {
            "uid": "uid-002",
            "email": "analyst@fund.com",
            "tenant_id": "tenant-B",
            "role": "ANALYST",
        }
        user = get_current_user(token)
        assert user.uid == "uid-002"
        assert user.email == "analyst@fund.com"
        assert user.tenant_id == "tenant-B"
        assert user.role.value == "ANALYST"

    def test_get_current_user_defaults_to_viewer(self):
        from src.core.auth import get_current_user
        token = {"uid": "uid-003", "email": "v@x.com", "tenant_id": "t1"}
        user = get_current_user(token)
        assert user.role.value == "VIEWER"

    def test_get_current_user_rejects_missing_tenant(self):
        from src.core.auth import get_current_user
        from fastapi import HTTPException
        token = {"uid": "uid-004", "email": "bad@x.com"}
        with pytest.raises(HTTPException) as exc_info:
            get_current_user(token)
        assert exc_info.value.status_code == 403

    def test_require_admin_rejects_analyst(self):
        from src.core.auth import require_admin, AuthenticatedUser, UserRole
        from fastapi import HTTPException
        analyst = AuthenticatedUser("uid", "e@x.com", "t1", UserRole.ANALYST)
        with pytest.raises(HTTPException) as exc_info:
            require_admin(analyst)
        assert exc_info.value.status_code == 403

    def test_require_admin_accepts_admin(self):
        from src.core.auth import require_admin, AuthenticatedUser, UserRole
        admin = AuthenticatedUser("uid", "e@x.com", "t1", UserRole.ADMIN)
        result = require_admin(admin)
        assert result.is_admin is True

    def test_require_analyst_rejects_viewer(self):
        from src.core.auth import require_analyst, AuthenticatedUser, UserRole
        from fastapi import HTTPException
        viewer = AuthenticatedUser("uid", "e@x.com", "t1", UserRole.VIEWER)
        with pytest.raises(HTTPException) as exc_info:
            require_analyst(viewer)
        assert exc_info.value.status_code == 403

    def test_require_analyst_accepts_analyst(self):
        from src.core.auth import require_analyst, AuthenticatedUser, UserRole
        analyst = AuthenticatedUser("uid", "e@x.com", "t1", UserRole.ANALYST)
        result = require_analyst(analyst)
        assert result.role == UserRole.ANALYST

    def test_require_tenant_access_denies_cross_tenant(self):
        from src.core.auth import require_tenant_access, AuthenticatedUser, UserRole
        from fastapi import HTTPException
        user = AuthenticatedUser("uid", "e@x.com", "tenant-A", UserRole.ADMIN)
        with pytest.raises(HTTPException) as exc_info:
            require_tenant_access("tenant-B", user)
        assert exc_info.value.status_code == 403

    def test_require_tenant_access_allows_own_tenant(self):
        from src.core.auth import require_tenant_access, AuthenticatedUser, UserRole
        user = AuthenticatedUser("uid", "e@x.com", "tenant-A", UserRole.ADMIN)
        result = require_tenant_access("tenant-A", user)
        assert result.tenant_id == "tenant-A"


# ═══════════════════════════════════════════
# TASK 3: Tenant-Scoped Persistence
# ═══════════════════════════════════════════

class TestTenantScopedPersistence:
    """Validate that persistence operations are scoped to tenant."""

    def _make_service(self):
        with patch("src.services.persistence.firestore.Client") as mock_fs, \
             patch("src.services.persistence.pubsub_v1.PublisherClient") as mock_pub:
            mock_db = MagicMock()
            mock_fs.return_value = mock_db
            mock_publisher = MagicMock()
            mock_pub.return_value = mock_publisher
            mock_publisher.topic_path.return_value = "projects/test/topics/test"
            mock_future = MagicMock()
            mock_future.result.return_value = "msg-123"
            mock_publisher.publish.return_value = mock_future

            from src.services.persistence import PersistenceService
            svc = PersistenceService()
            return svc, mock_db

    def test_entities_col_scoped_to_tenant(self):
        svc, mock_db = self._make_service()
        col_ref = svc._entities_col("tenant-A")
        # Verify the path: tenants -> tenant-A -> monitored_entities
        mock_db.collection.assert_called_with("tenants")
        mock_db.collection.return_value.document.assert_called_with("tenant-A")
        mock_db.collection.return_value.document.return_value.collection.assert_called_with(
            "monitored_entities"
        )

    def test_alerts_col_scoped_to_tenant(self):
        svc, mock_db = self._make_service()
        col_ref = svc._alerts_col("tenant-B")
        mock_db.collection.assert_called_with("tenants")
        mock_db.collection.return_value.document.assert_called_with("tenant-B")
        mock_db.collection.return_value.document.return_value.collection.assert_called_with(
            "strategic_alerts"
        )

    def test_portfolios_col_scoped_to_tenant(self):
        svc, mock_db = self._make_service()
        col_ref = svc._portfolios_col("tenant-C")
        mock_db.collection.assert_called_with("tenants")
        mock_db.collection.return_value.document.assert_called_with("tenant-C")
        mock_db.collection.return_value.document.return_value.collection.assert_called_with(
            "portfolios"
        )

    def test_update_adjacency_requires_tenant_id(self):
        """update_adjacency_score signature now requires tenant_id + entity_id."""
        svc, mock_db = self._make_service()
        # Should not raise — just verifying the method signature accepts tenant_id
        import inspect
        sig = inspect.signature(svc.update_adjacency_score)
        params = list(sig.parameters.keys())
        assert "tenant_id" in params
        assert "entity_id" in params

    def test_add_entity_includes_tenant_id_in_doc(self):
        svc, mock_db = self._make_service()
        # Mock the chain: db.collection("tenants").document("t1").collection("monitored_entities").document(id).set(data)
        mock_doc = MagicMock()
        mock_col = MagicMock()
        mock_col.document.return_value = mock_doc
        mock_db.collection.return_value.document.return_value.collection.return_value = mock_col

        asyncio.run(svc.add_entity("tenant-X", {
            "company_number": "12345678",
            "company_name": "Test Corp",
        }))

        # Verify set was called with tenant_id in the document data
        call_args = mock_doc.set.call_args
        doc_data = call_args[0][0]
        assert doc_data["tenant_id"] == "tenant-X"
        assert doc_data["company_number"] == "12345678"


# ═══════════════════════════════════════════
# TASK 4: UserRole Enum
# ═══════════════════════════════════════════

class TestUserRoleEnum:
    """Validate UserRole enum values and parsing."""

    def test_valid_roles(self):
        from src.core.auth import UserRole
        assert UserRole.ADMIN == "ADMIN"
        assert UserRole.ANALYST == "ANALYST"
        assert UserRole.VIEWER == "VIEWER"

    def test_invalid_role_raises(self):
        from src.core.auth import UserRole
        with pytest.raises(ValueError):
            UserRole("SUPERADMIN")

    def test_case_sensitivity(self):
        from src.core.auth import UserRole
        # Enum is case-sensitive
        with pytest.raises(ValueError):
            UserRole("admin")

    def test_role_hierarchy_ordering(self):
        from src.core.auth import _ROLE_HIERARCHY, UserRole
        assert _ROLE_HIERARCHY[UserRole.ADMIN] > _ROLE_HIERARCHY[UserRole.ANALYST]
        assert _ROLE_HIERARCHY[UserRole.ANALYST] > _ROLE_HIERARCHY[UserRole.VIEWER]
