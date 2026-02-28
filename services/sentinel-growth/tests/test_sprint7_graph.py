"""
Sprint 7 Validation Tests — Entity Resolution & Graph Intelligence
Tests: GraphService (mock Neo4j), EntityResolution (person hash),
       SystemicRisk (cross-tenant), Graph API endpoints
"""
import sys
import os
import hashlib
from unittest.mock import MagicMock, patch, PropertyMock

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


# ═══════════════════════════════════════════
# TASK 1: GraphService Tests
# ═══════════════════════════════════════════

class TestGraphServiceDegradedMode:
    """Validate graceful degradation when NEO4J_URI is empty."""

    def test_no_uri_returns_unavailable(self):
        with patch("src.services.graph_service.settings") as mock_settings:
            mock_settings.NEO4J_URI = ""
            from src.services.graph_service import GraphService
            svc = GraphService()
            assert svc.available is False

    def test_upsert_company_returns_false_when_unavailable(self):
        with patch("src.services.graph_service.settings") as mock_settings:
            mock_settings.NEO4J_URI = ""
            from src.services.graph_service import GraphService
            svc = GraphService()
            result = svc.upsert_company_node("12345678", "Test Corp")
            assert result is False

    def test_upsert_person_returns_false_when_unavailable(self):
        with patch("src.services.graph_service.settings") as mock_settings:
            mock_settings.NEO4J_URI = ""
            from src.services.graph_service import GraphService
            svc = GraphService()
            result = svc.upsert_person_node("John Smith")
            assert result is False

    def test_contagion_network_returns_empty_when_unavailable(self):
        with patch("src.services.graph_service.settings") as mock_settings:
            mock_settings.NEO4J_URI = ""
            from src.services.graph_service import GraphService
            svc = GraphService()
            network = svc.get_contagion_network("12345678")
            assert network["target"] is None
            assert network["nodes"] == []
            assert network["links"] == []


class TestGraphServicePayloadBuilder:
    """Validate the _build_graph_payload method."""

    def _make_service(self):
        with patch("src.services.graph_service.settings") as mock_settings:
            mock_settings.NEO4J_URI = ""
            from src.services.graph_service import GraphService
            svc = GraphService()
            return svc

    def test_build_graph_payload_with_target(self):
        svc = self._make_service()
        mock_record = {
            "target": {
                "ch_number": "12345678",
                "name": "Acme Ltd",
                "risk_tier": "ELEVATED_RISK",
            },
            "directors": [
                {"person_hash": "abc123", "name": "Jane Doe"},
            ],
            "dir_linked": [
                {"ch_number": "87654321", "name": "Beta Corp", "risk_tier": "STABLE"},
            ],
            "pscs": [
                {"person_hash": "def456", "name": "John Smith"},
            ],
            "psc_linked": [],
        }

        result = svc._build_graph_payload(mock_record)

        assert result["target"]["ch_number"] == "12345678"
        # Target + 1 director + 1 linked company + 1 PSC = 4 nodes
        assert len(result["nodes"]) == 4
        # 1 director link + 1 PSC link = 2 links
        assert len(result["links"]) == 2
        # Target node should have is_target=True
        target_node = next(n for n in result["nodes"] if n.get("is_target"))
        assert target_node["label"] == "Acme Ltd"
        assert target_node["risk_tier"] == "ELEVATED_RISK"

    def test_build_graph_payload_deduplicates_nodes(self):
        svc = self._make_service()
        mock_record = {
            "target": {"ch_number": "12345678", "name": "Acme"},
            "directors": [
                {"person_hash": "abc", "name": "Jane"},
                {"person_hash": "abc", "name": "Jane"},  # duplicate
            ],
            "dir_linked": [],
            "pscs": [],
            "psc_linked": [],
        }

        result = svc._build_graph_payload(mock_record)
        # Should be 2 nodes only: target + 1 unique person
        assert len(result["nodes"]) == 2

    def test_build_graph_payload_handles_none_entries(self):
        svc = self._make_service()
        mock_record = {
            "target": {"ch_number": "12345678", "name": "Acme"},
            "directors": [None, {"person_hash": "abc", "name": "Jane"}],
            "dir_linked": [None],
            "pscs": [None],
            "psc_linked": [None],
        }

        result = svc._build_graph_payload(mock_record)
        # Should skip all None entries
        assert len(result["nodes"]) == 2  # target + 1 person


# ═══════════════════════════════════════════
# TASK 2: EntityResolution Tests
# ═══════════════════════════════════════════

class TestEntityResolutionService:
    """Validate entity resolution utilities."""

    def test_person_hash_deterministic(self):
        from src.services.entity_resolution import EntityResolutionService
        hash1 = EntityResolutionService.generate_person_hash(
            "John Smith", "1980-01-01", "123 High St"
        )
        hash2 = EntityResolutionService.generate_person_hash(
            "John Smith", "1980-01-01", "123 High St"
        )
        assert hash1 == hash2
        assert len(hash1) == 16

    def test_person_hash_case_insensitive(self):
        from src.services.entity_resolution import EntityResolutionService
        hash1 = EntityResolutionService.generate_person_hash("JOHN SMITH")
        hash2 = EntityResolutionService.generate_person_hash("john smith")
        assert hash1 == hash2

    def test_person_hash_different_people(self):
        from src.services.entity_resolution import EntityResolutionService
        hash1 = EntityResolutionService.generate_person_hash("John Smith")
        hash2 = EntityResolutionService.generate_person_hash("Jane Doe")
        assert hash1 != hash2

    def test_find_fuzzy_matches_returns_empty_when_unavailable(self):
        """When splink is not available, return empty list."""
        from src.services.entity_resolution import EntityResolutionService
        svc = EntityResolutionService()
        svc._available = False  # Force unavailable
        result = svc.find_fuzzy_matches([
            {"company_name": "A", "registered_address": "X"},
            {"company_name": "B", "registered_address": "Y"},
        ])
        assert result == []

    def test_find_fuzzy_matches_returns_empty_for_single_record(self):
        from src.services.entity_resolution import EntityResolutionService
        svc = EntityResolutionService()
        result = svc.find_fuzzy_matches([
            {"company_name": "A", "registered_address": "X"},
        ])
        assert result == []


# ═══════════════════════════════════════════
# TASK 3: SystemicRisk Tests
# ═══════════════════════════════════════════

class TestSystemicRiskService:
    """Validate cross-portfolio systemic risk detection."""

    def _make_service(self):
        with patch("src.services.systemic_risk.firestore.Client") as mock_fs:
            mock_db = MagicMock()
            mock_fs.return_value = mock_db
            from src.services.systemic_risk import SystemicRiskService
            svc = SystemicRiskService()
            return svc, mock_db

    def test_empty_result_when_not_found(self):
        svc, mock_db = self._make_service()
        mock_db.collection_group.return_value.where.return_value.stream.return_value = []

        result = svc.evaluate_systemic_exposure("12345678")
        assert result["is_systemic"] is False
        assert result["tenant_exposure_count"] == 0

    def test_not_systemic_single_tenant(self):
        svc, mock_db = self._make_service()

        # Mock a single document from tenant-A
        mock_doc = MagicMock()
        mock_doc.to_dict.return_value = {"risk_tier": "ELEVATED_RISK", "company_number": "12345678"}
        mock_doc.reference.path = "tenants/tenant-A/monitored_entities/doc1"
        mock_db.collection_group.return_value.where.return_value.stream.return_value = [mock_doc]

        result = svc.evaluate_systemic_exposure("12345678")
        assert result["is_systemic"] is False  # Only 1 tenant
        assert result["tenant_exposure_count"] == 1

    def test_systemic_multi_tenant_elevated(self):
        svc, mock_db = self._make_service()

        # Mock docs from two different tenants
        doc_a = MagicMock()
        doc_a.to_dict.return_value = {"risk_tier": "ELEVATED_RISK"}
        doc_a.reference.path = "tenants/tenant-A/monitored_entities/doc1"

        doc_b = MagicMock()
        doc_b.to_dict.return_value = {"risk_tier": "ELEVATED_RISK"}
        doc_b.reference.path = "tenants/tenant-B/monitored_entities/doc2"

        mock_db.collection_group.return_value.where.return_value.stream.return_value = [doc_a, doc_b]

        result = svc.evaluate_systemic_exposure("12345678")
        assert result["is_systemic"] is True
        assert result["tenant_exposure_count"] == 2
        assert sorted(result["tenant_ids"]) == ["tenant-A", "tenant-B"]

    def test_not_systemic_multi_tenant_stable(self):
        svc, mock_db = self._make_service()

        doc_a = MagicMock()
        doc_a.to_dict.return_value = {"risk_tier": "STABLE"}
        doc_a.reference.path = "tenants/tenant-A/monitored_entities/doc1"

        doc_b = MagicMock()
        doc_b.to_dict.return_value = {"risk_tier": "STABLE"}
        doc_b.reference.path = "tenants/tenant-B/monitored_entities/doc2"

        mock_db.collection_group.return_value.where.return_value.stream.return_value = [doc_a, doc_b]

        result = svc.evaluate_systemic_exposure("12345678")
        # Multi-tenant but STABLE — not systemic
        assert result["is_systemic"] is False
        assert result["tenant_exposure_count"] == 2

    def test_no_db_returns_empty(self):
        with patch("src.services.systemic_risk.firestore.Client") as mock_fs:
            mock_fs.side_effect = Exception("No Firestore")
            from src.services.systemic_risk import SystemicRiskService
            svc = SystemicRiskService()

        result = svc.evaluate_systemic_exposure("any")
        assert result["is_systemic"] is False
        assert result["ch_number"] == "any"


# ═══════════════════════════════════════════
# TASK 4: Graph API Tests
# ═══════════════════════════════════════════

class TestGraphAPI:
    """Validate the graph API endpoints."""

    @pytest.fixture
    def client(self):
        from fastapi import FastAPI
        from fastapi.testclient import TestClient
        from src.api.graph import router
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

    @patch("src.api.graph.graph_service")
    def test_contagion_endpoint_returns_network(self, mock_gs, client):
        mock_gs.get_contagion_network.return_value = {
            "target": {"ch_number": "12345678", "name": "Acme", "risk_tier": "STABLE"},
            "nodes": [{"id": "co-12345678", "label": "Acme", "type": "Company"}],
            "links": [],
        }

        response = client.get("/api/v1/graph/contagion/12345678")
        assert response.status_code == 200
        data = response.json()
        assert data["target"]["ch_number"] == "12345678"
        assert len(data["nodes"]) == 1

    @patch("src.api.graph.graph_service")
    def test_contagion_endpoint_404_when_not_found(self, mock_gs, client):
        mock_gs.get_contagion_network.return_value = {
            "target": None, "nodes": [], "links": [],
        }

        response = client.get("/api/v1/graph/contagion/99999999")
        assert response.status_code == 404

    @patch("src.api.graph.systemic_risk_service")
    def test_systemic_endpoint_redacts_tenants_for_non_admin(self, mock_sr, client):
        mock_sr.evaluate_systemic_exposure.return_value = {
            "ch_number": "12345678",
            "is_systemic": True,
            "tenant_exposure_count": 3,
            "tenant_ids": ["t-A", "t-B", "t-C"],
            "risk_tier": "ELEVATED_RISK",
        }

        response = client.get("/api/v1/graph/systemic/12345678")
        assert response.status_code == 200
        data = response.json()
        # Non-admin should have tenant_ids redacted
        assert data["tenant_ids"] == []
        assert data["is_systemic"] is True

    @pytest.fixture
    def admin_client(self):
        from fastapi import FastAPI
        from fastapi.testclient import TestClient
        from src.api.graph import router
        from src.core.auth import get_current_user, AuthenticatedUser, UserRole

        app = FastAPI()
        app.include_router(router)
        mock_admin = AuthenticatedUser(
            uid="admin-uid", email="admin@bank.co.uk",
            tenant_id="test-tenant", role=UserRole.ADMIN,
        )
        app.dependency_overrides[get_current_user] = lambda: mock_admin
        return TestClient(app)

    @patch("src.api.graph.systemic_risk_service")
    def test_systemic_endpoint_shows_tenants_for_admin(self, mock_sr, admin_client):
        mock_sr.evaluate_systemic_exposure.return_value = {
            "ch_number": "12345678",
            "is_systemic": True,
            "tenant_exposure_count": 2,
            "tenant_ids": ["t-A", "t-B"],
            "risk_tier": "ELEVATED_RISK",
        }

        response = admin_client.get("/api/v1/graph/systemic/12345678")
        data = response.json()
        assert data["tenant_ids"] == ["t-A", "t-B"]
