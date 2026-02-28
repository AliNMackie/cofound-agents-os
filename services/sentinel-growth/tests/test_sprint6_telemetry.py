"""
Sprint 6 Validation Tests — Telemetry & Status Dashboard
Tests: atomic increment tracking, usage stats retrieval, telemetry API endpoint
"""
import sys
import os
import datetime
from unittest.mock import MagicMock, patch, PropertyMock

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


# ═══════════════════════════════════════════
# TASK 1: TelemetryService Unit Tests
# ═══════════════════════════════════════════

class TestTelemetryService:
    """Validate atomic increment methods and usage stats retrieval."""

    def _make_service(self):
        with patch("src.services.telemetry_service.firestore.Client") as mock_fs:
            mock_db = MagicMock()
            mock_fs.return_value = mock_db

            from src.services.telemetry_service import TelemetryService
            svc = TelemetryService()
            return svc, mock_db

    def _get_mock_doc_ref(self, mock_db):
        """Returns the mock document ref at the end of the telemetry chain."""
        return (
            mock_db.collection.return_value
            .document.return_value
            .collection.return_value
            .document.return_value
        )

    # ── Sweep Tracking ────────────────────────────────────────

    def test_track_sweep_calls_firestore_set(self):
        svc, mock_db = self._make_service()
        doc_ref = self._get_mock_doc_ref(mock_db)

        svc.track_sweep_executed("tenant-A")

        doc_ref.set.assert_called_once()
        call_args = doc_ref.set.call_args
        data = call_args[0][0]
        assert "sweeps_executed" in data
        assert "last_sweep_at" in data
        # merge=True for atomic increment
        assert call_args[1].get("merge") is True

    def test_track_sweep_scoped_to_tenant(self):
        svc, mock_db = self._make_service()
        svc.track_sweep_executed("tenant-X")

        # Verify path: tenants -> tenant-X -> telemetry -> {month}
        mock_db.collection.assert_called_with("tenants")
        mock_db.collection.return_value.document.assert_called_with("tenant-X")
        mock_db.collection.return_value.document.return_value.collection.assert_called_with("telemetry")

    # ── Alert Tracking ────────────────────────────────────────

    def test_track_alert_calls_firestore_set(self):
        svc, mock_db = self._make_service()
        doc_ref = self._get_mock_doc_ref(mock_db)

        svc.track_alert_sent("tenant-B")

        doc_ref.set.assert_called_once()
        data = doc_ref.set.call_args[0][0]
        assert "alerts_sent" in data

    # ── Report Tracking ───────────────────────────────────────

    def test_track_report_calls_firestore_set(self):
        svc, mock_db = self._make_service()
        doc_ref = self._get_mock_doc_ref(mock_db)

        svc.track_report_generated("tenant-C")

        doc_ref.set.assert_called_once()
        data = doc_ref.set.call_args[0][0]
        assert "reports_generated" in data

    # ── Usage Stats Reading ───────────────────────────────────

    def test_get_usage_stats_returns_counters(self):
        svc, mock_db = self._make_service()
        doc_ref = self._get_mock_doc_ref(mock_db)

        mock_doc = MagicMock()
        mock_doc.exists = True
        mock_doc.to_dict.return_value = {
            "sweeps_executed": 42,
            "alerts_sent": 7,
            "reports_generated": 3,
            "last_sweep_at": datetime.datetime(2026, 2, 28, 8, 0, 0),
        }
        doc_ref.get.return_value = mock_doc

        stats = svc.get_usage_stats("tenant-A")

        assert stats["sweeps_executed"] == 42
        assert stats["alerts_sent"] == 7
        assert stats["reports_generated"] == 3
        assert stats["last_sweep_at"] is not None

    def test_get_usage_stats_empty_tenant(self):
        svc, mock_db = self._make_service()
        doc_ref = self._get_mock_doc_ref(mock_db)

        mock_doc = MagicMock()
        mock_doc.exists = False
        doc_ref.get.return_value = mock_doc

        stats = svc.get_usage_stats("new-tenant")

        assert stats["sweeps_executed"] == 0
        assert stats["alerts_sent"] == 0
        assert stats["reports_generated"] == 0
        assert stats["last_sweep_at"] is None

    def test_get_usage_stats_no_db(self):
        """Graceful degradation when Firestore is unavailable."""
        with patch("src.services.telemetry_service.firestore.Client") as mock_fs:
            mock_fs.side_effect = Exception("No Firestore")
            from src.services.telemetry_service import TelemetryService
            svc = TelemetryService()

        stats = svc.get_usage_stats("tenant-Z")
        assert stats["sweeps_executed"] == 0

    # ── Month Key ─────────────────────────────────────────────

    def test_current_month_key_format(self):
        svc, _ = self._make_service()
        key = svc._current_month_key()
        # Should be YYYY-MM format
        assert len(key) == 7
        assert key[4] == "-"

    # ── Entity Count ──────────────────────────────────────────

    def test_get_entity_count(self):
        svc, mock_db = self._make_service()
        mock_col = (
            mock_db.collection.return_value
            .document.return_value
            .collection.return_value
        )

        # Mock stream returning 5 documents
        mock_col.select.return_value.stream.return_value = [
            MagicMock() for _ in range(5)
        ]

        count = svc.get_entity_count("tenant-A")
        assert count == 5

    def test_get_entity_count_no_db(self):
        with patch("src.services.telemetry_service.firestore.Client") as mock_fs:
            mock_fs.side_effect = Exception("No Firestore")
            from src.services.telemetry_service import TelemetryService
            svc = TelemetryService()

        count = svc.get_entity_count("any-tenant")
        assert count == 0

    # ── Graceful Failure ──────────────────────────────────────

    def test_track_sweep_no_db_does_not_raise(self):
        with patch("src.services.telemetry_service.firestore.Client") as mock_fs:
            mock_fs.side_effect = Exception("No Firestore")
            from src.services.telemetry_service import TelemetryService
            svc = TelemetryService()

        # Should not raise
        svc.track_sweep_executed("tenant-Z")
        svc.track_alert_sent("tenant-Z")
        svc.track_report_generated("tenant-Z")


# ═══════════════════════════════════════════
# TASK 2: Telemetry API Endpoint Tests
# ═══════════════════════════════════════════

class TestTelemetryAPI:
    """Validate the GET /api/v1/telemetry/status endpoint."""

    @pytest.fixture
    def client(self):
        from fastapi import FastAPI
        from fastapi.testclient import TestClient
        from src.api.telemetry import router
        from src.core.auth import get_current_user, AuthenticatedUser, UserRole

        app = FastAPI()
        app.include_router(router)

        mock_user = AuthenticatedUser(
            uid="test-uid",
            email="analyst@bank.co.uk",
            tenant_id="test-tenant",
            role=UserRole.ANALYST,
        )
        app.dependency_overrides[get_current_user] = lambda: mock_user
        return TestClient(app)

    @patch("src.api.telemetry.telemetry_service")
    def test_status_endpoint_returns_200(self, mock_tele, client):
        mock_tele.get_usage_stats.return_value = {
            "sweeps_executed": 10,
            "alerts_sent": 3,
            "reports_generated": 1,
            "last_sweep_at": "2026-02-28T08:00:00",
            "month": "2026-02",
        }
        mock_tele.get_entity_count.return_value = 25

        response = client.get("/api/v1/telemetry/status")
        assert response.status_code == 200

        data = response.json()
        assert data["tenant_id"] == "test-tenant"
        assert data["system_status"] == "All Systems Operational"
        assert data["entities_monitored"] == 25
        assert data["sweeps_executed"] == 10
        assert data["alerts_sent"] == 3
        assert data["user_role"] == "ANALYST"

    @patch("src.api.telemetry.telemetry_service")
    def test_status_includes_next_sweep(self, mock_tele, client):
        mock_tele.get_usage_stats.return_value = {
            "sweeps_executed": 0,
            "alerts_sent": 0,
            "reports_generated": 0,
            "last_sweep_at": None,
            "month": "2026-02",
        }
        mock_tele.get_entity_count.return_value = 0

        response = client.get("/api/v1/telemetry/status")
        data = response.json()

        assert "next_sweep_at" in data
        assert data["next_sweep_at"] is not None

    @patch("src.api.telemetry.telemetry_service")
    def test_status_includes_sync_active(self, mock_tele, client):
        mock_tele.get_usage_stats.return_value = {
            "sweeps_executed": 0, "alerts_sent": 0,
            "reports_generated": 0, "last_sweep_at": None, "month": "2026-02",
        }
        mock_tele.get_entity_count.return_value = 0

        response = client.get("/api/v1/telemetry/status")
        data = response.json()

        assert data["sync_active"] is True
        assert data["user_email"] == "analyst@bank.co.uk"

    def test_status_requires_auth(self):
        """Without auth override, the endpoint should fail."""
        from fastapi import FastAPI
        from fastapi.testclient import TestClient
        from src.api.telemetry import router

        app = FastAPI()
        app.include_router(router)
        raw_client = TestClient(app)

        response = raw_client.get("/api/v1/telemetry/status")
        assert response.status_code == 403 or response.status_code == 401
