"""
Sprint 1 Validation Tests — Counterparty Risk Intelligence
Tests: Schema, Portfolio Upload API, Market Sweep extension
"""
import sys
import os
import io
import csv
import asyncio
import pytest

# Ensure src is on the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.schemas.auctions import (
    AuctionData,
    AuctionDataEnriched,
    CompanyProfile,
    CounterpartyType,
    RiskTier,
)


# ═══════════════════════════════════════════
# TASK 1: Schema Validation
# ═══════════════════════════════════════════

class TestSchemaExpansion:
    """Validate CounterpartyType, RiskTier enums and new AuctionData fields."""

    def test_counterparty_type_enum_values(self):
        assert CounterpartyType.BORROWER.value == "BORROWER"
        assert CounterpartyType.SUPPLIER.value == "SUPPLIER"
        assert CounterpartyType.INSURED.value == "INSURED"

    def test_risk_tier_enum_values(self):
        assert RiskTier.ELEVATED_RISK.value == "ELEVATED_RISK"
        assert RiskTier.STABLE.value == "STABLE"
        assert RiskTier.IMPROVED.value == "IMPROVED"
        assert RiskTier.UNSCORED.value == "UNSCORED"

    def test_auction_data_defaults(self):
        """New fields should have correct defaults when not explicitly set."""
        data = AuctionData(company_name="Test Corp")
        assert data.counterparty_type is None
        assert data.risk_tier == RiskTier.UNSCORED
        assert data.monitoring_portfolio_id is None

    def test_auction_data_with_risk_fields(self):
        """New fields should accept valid enum values."""
        data = AuctionData(
            company_name="Acme Ltd",
            counterparty_type=CounterpartyType.BORROWER,
            risk_tier=RiskTier.ELEVATED_RISK,
            monitoring_portfolio_id="port-abc123",
        )
        assert data.counterparty_type == CounterpartyType.BORROWER
        assert data.risk_tier == RiskTier.ELEVATED_RISK
        assert data.monitoring_portfolio_id == "port-abc123"

    def test_auction_data_serialisation(self):
        """Enums should serialise to string values in JSON."""
        data = AuctionData(
            company_name="Acme Ltd",
            counterparty_type=CounterpartyType.SUPPLIER,
            risk_tier=RiskTier.STABLE,
        )
        dumped = data.model_dump()
        assert dumped["counterparty_type"] == "SUPPLIER"
        assert dumped["risk_tier"] == "STABLE"

    def test_auction_data_from_string(self):
        """Enums should be parseable from raw string values."""
        data = AuctionData(
            company_name="Test",
            counterparty_type="INSURED",
            risk_tier="IMPROVED",
        )
        assert data.counterparty_type == CounterpartyType.INSURED
        assert data.risk_tier == RiskTier.IMPROVED

    def test_auction_data_enriched_inherits_fields(self):
        """AuctionDataEnriched should inherit the new fields from AuctionData."""
        enriched = AuctionDataEnriched(
            company_name="Inherited Corp",
            counterparty_type=CounterpartyType.BORROWER,
            risk_tier=RiskTier.ELEVATED_RISK,
            monitoring_portfolio_id="port-inherit",
            company_profile=CompanyProfile(registration_number="12345678"),
        )
        assert enriched.counterparty_type == CounterpartyType.BORROWER
        assert enriched.monitoring_portfolio_id == "port-inherit"
        assert enriched.company_profile.registration_number == "12345678"

    def test_backward_compatibility(self):
        """Existing code should still work without new fields."""
        data = AuctionData(
            company_name="Legacy Corp",
            ebitda="£5.5m",
            signal_type="RESCUE",
            conviction_score=85,
        )
        assert data.company_name == "Legacy Corp"
        assert data.ebitda == "£5.5m"
        assert data.risk_tier == RiskTier.UNSCORED  # defaults


# ═══════════════════════════════════════════
# TASK 2: Portfolio Upload API Validation
# ═══════════════════════════════════════════

class TestPortfolioUploadHelpers:
    """Validate CSV parsing helpers in the portfolio API module."""

    def test_normalise_company_number_padding(self):
        from src.api.portfolio import _normalise_company_number
        assert _normalise_company_number("123456") == "00123456"
        assert _normalise_company_number("12345678") == "12345678"
        assert _normalise_company_number("SC123456") == "SC123456"  # Scottish company
        assert _normalise_company_number("") is None
        assert _normalise_company_number("   ") is None

    def test_parse_counterparty_type(self):
        from src.api.portfolio import _parse_counterparty_type
        assert _parse_counterparty_type("BORROWER") == CounterpartyType.BORROWER
        assert _parse_counterparty_type("supplier") == CounterpartyType.SUPPLIER
        assert _parse_counterparty_type("INSURED") == CounterpartyType.INSURED
        assert _parse_counterparty_type("") == CounterpartyType.BORROWER  # default
        assert _parse_counterparty_type(None) == CounterpartyType.BORROWER  # default
        assert _parse_counterparty_type("invalid") == CounterpartyType.BORROWER  # fallback

    def test_portfolio_entity_model(self):
        from src.api.portfolio import PortfolioEntity
        entity = PortfolioEntity(
            company_number="12345678",
            company_name="Test Ltd",
            counterparty_type=CounterpartyType.SUPPLIER,
        )
        assert entity.risk_tier == RiskTier.UNSCORED
        assert entity.company_number == "12345678"


class TestPortfolioUploadEndpoint:
    """Validate the upload endpoint via FastAPI TestClient."""

    @pytest.fixture
    def client(self):
        from fastapi import FastAPI
        from fastapi.testclient import TestClient
        from src.api.portfolio import router
        from src.core.auth import require_admin, AuthenticatedUser, UserRole

        app = FastAPI()
        app.include_router(router)

        # Override RBAC: inject a mock ADMIN user so endpoint tests
        # validate CSV parsing logic, not auth.
        mock_admin = AuthenticatedUser(
            uid="test-uid", email="test@test.com",
            tenant_id="test-tenant", role=UserRole.ADMIN,
        )
        app.dependency_overrides[require_admin] = lambda: mock_admin
        return TestClient(app)

    def _make_csv(self, rows: list[dict]) -> bytes:
        """Helper: create an in-memory CSV file from a list of dicts."""
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)
        return output.getvalue().encode("utf-8")

    def test_successful_upload(self, client):
        csv_bytes = self._make_csv([
            {"company_number": "12345678", "company_name": "Acme Ltd", "counterparty_type": "BORROWER"},
            {"company_number": "87654321", "company_name": "Beta Corp", "counterparty_type": "SUPPLIER"},
            {"company_number": "SC123456", "company_name": "Caledon Ltd", "counterparty_type": "INSURED"},
        ])
        response = client.post(
            "/api/v1/portfolio/upload",
            files={"file": ("test.csv", csv_bytes, "text/csv")},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["entities_parsed"] == 3
        assert data["entities_skipped"] == 0
        assert data["portfolio_id"].startswith("port-")
        assert len(data["entities"]) == 3

    def test_dedup_within_upload(self, client):
        csv_bytes = self._make_csv([
            {"company_number": "12345678", "company_name": "Acme Ltd", "counterparty_type": "BORROWER"},
            {"company_number": "12345678", "company_name": "Acme Ltd Dupe", "counterparty_type": "BORROWER"},
        ])
        response = client.post(
            "/api/v1/portfolio/upload",
            files={"file": ("test.csv", csv_bytes, "text/csv")},
        )
        data = response.json()
        assert data["entities_parsed"] == 1
        assert data["entities_skipped"] == 1

    def test_numeric_padding(self, client):
        csv_bytes = self._make_csv([
            {"company_number": "123", "company_name": "Short Num Ltd", "counterparty_type": "BORROWER"},
        ])
        response = client.post(
            "/api/v1/portfolio/upload",
            files={"file": ("test.csv", csv_bytes, "text/csv")},
        )
        data = response.json()
        assert data["entities"][0]["company_number"] == "00000123"

    def test_missing_column_rejected(self, client):
        csv_bytes = b"name,type\nAcme,BORROWER\n"
        response = client.post(
            "/api/v1/portfolio/upload",
            files={"file": ("test.csv", csv_bytes, "text/csv")},
        )
        assert response.status_code == 400

    def test_non_csv_rejected(self, client):
        response = client.post(
            "/api/v1/portfolio/upload",
            files={"file": ("test.txt", b"hello", "text/plain")},
        )
        assert response.status_code == 400

    def test_empty_csv_rejected(self, client):
        csv_bytes = b"company_number\n\n\n"
        response = client.post(
            "/api/v1/portfolio/upload",
            files={"file": ("test.csv", csv_bytes, "text/csv")},
        )
        assert response.status_code == 400


# ═══════════════════════════════════════════
# TASK 3: Market Sweep Extension Validation
# ═══════════════════════════════════════════

class TestRunPortfolioSweepMethod:
    """Validate that run_portfolio_sweep exists only (actual execution requires mocking CH API)."""

    def test_method_exists(self):
        """Verify the method signature exists on MarketSweepService."""
        from src.services.market_sweep import MarketSweepService
        assert hasattr(MarketSweepService, "run_portfolio_sweep")
        assert asyncio.iscoroutinefunction(MarketSweepService.run_portfolio_sweep)

    def test_method_accepts_correct_args(self):
        """Verify the method has the expected parameters."""
        import inspect
        from src.services.market_sweep import MarketSweepService
        sig = inspect.signature(MarketSweepService.run_portfolio_sweep)
        params = list(sig.parameters.keys())
        assert "portfolio_id" in params
        assert "company_numbers" in params
