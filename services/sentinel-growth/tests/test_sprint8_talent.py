"""
Sprint 8 Validation Tests — Talent Intelligence & Human Capital Analytics
Tests: Schema (HumanCapital, TalentSignal), ShadowMarket (talent signals,
       cross-vector fusion), MarketSweep (_classify_talent_posting),
       Sector Presets (talent_intelligence preset)
"""
import sys
import os
import json
from unittest.mock import MagicMock, patch

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


# ═══════════════════════════════════════════
# TASK 1: Schema & Config Tests
# ═══════════════════════════════════════════

class TestHumanCapitalSchema:
    """Validate the HumanCapital sub-schema and TalentSignal enum."""

    def test_talent_signal_enum_values(self):
        from src.schemas.auctions import TalentSignal
        assert TalentSignal.RAPID_GROWTH == "RAPID_GROWTH"
        assert TalentSignal.KEY_PERSON_RISK == "KEY_PERSON_RISK"
        assert TalentSignal.CONTRACTION_SIGNAL == "CONTRACTION_SIGNAL"
        assert TalentSignal.CRITICAL_DISTRESS == "CRITICAL_DISTRESS"
        assert TalentSignal.STABLE_TALENT == "STABLE_TALENT"

    def test_human_capital_defaults(self):
        from src.schemas.auctions import HumanCapital
        hc = HumanCapital()
        assert hc.headcount_delta == 0
        assert hc.hiring_velocity_pct == 0.0
        assert hc.active_job_postings == 0
        assert hc.key_hire_departures == []
        assert hc.talent_concentration == {}
        assert hc.talent_signal is None

    def test_human_capital_with_data(self):
        from src.schemas.auctions import HumanCapital
        hc = HumanCapital(
            headcount_delta=5,
            hiring_velocity_pct=42.3,
            active_job_postings=12,
            key_hire_departures=[{"name": "Jane", "role": "CFO", "type": "DEPARTURE"}],
            talent_concentration={"tech": 0.4, "sales": 0.3, "other": 0.3},
            talent_signal="RAPID_GROWTH",
        )
        assert hc.headcount_delta == 5
        assert hc.hiring_velocity_pct == 42.3
        assert len(hc.key_hire_departures) == 1

    def test_auction_data_with_human_capital(self):
        from src.schemas.auctions import AuctionData, HumanCapital
        ad = AuctionData(
            company_name="Test Corp",
            human_capital=HumanCapital(headcount_delta=10),
        )
        assert ad.human_capital is not None
        assert ad.human_capital.headcount_delta == 10

    def test_auction_data_without_human_capital_still_works(self):
        from src.schemas.auctions import AuctionData
        ad = AuctionData(company_name="Legacy Corp")
        assert ad.human_capital is None
        # Ensure existing fields still work
        assert ad.risk_tier.value == "UNSCORED"

    def test_counterparty_type_still_exists(self):
        from src.schemas.auctions import CounterpartyType
        assert CounterpartyType.BORROWER == "BORROWER"
        assert CounterpartyType.SUPPLIER == "SUPPLIER"

    def test_risk_tier_still_exists(self):
        from src.schemas.auctions import RiskTier
        assert RiskTier.ELEVATED_RISK == "ELEVATED_RISK"
        assert RiskTier.STABLE == "STABLE"


class TestSectorPresets:
    """Validate the talent_intelligence sector preset."""

    def test_talent_preset_exists(self):
        preset_path = os.path.join(
            os.path.dirname(__file__), "..", "src", "core", "sector_presets.json"
        )
        with open(preset_path) as f:
            data = json.load(f)
        assert "talent_intelligence" in data["sectors"]

    def test_talent_preset_has_extraction_schema(self):
        preset_path = os.path.join(
            os.path.dirname(__file__), "..", "src", "core", "sector_presets.json"
        )
        with open(preset_path) as f:
            data = json.load(f)
        schema = data["sectors"]["talent_intelligence"]["extraction_schema"]
        assert "role_title" in schema
        assert "department" in schema
        assert "seniority" in schema
        assert "company_name" in schema
        assert "hiring_signal_type" in schema

    def test_talent_preset_has_sources(self):
        preset_path = os.path.join(
            os.path.dirname(__file__), "..", "src", "core", "sector_presets.json"
        )
        with open(preset_path) as f:
            data = json.load(f)
        sources = data["sectors"]["talent_intelligence"]["standard_sources"]
        assert len(sources) == 2
        assert any("Reed" in s["name"] for s in sources)


# ═══════════════════════════════════════════
# TASK 3: Shadow Market Talent Logic Tests
# ═══════════════════════════════════════════

class TestTalentSignalEvaluation:
    """Validate the evaluate_talent_signals deterministic rules."""

    def test_cfo_departure_triggers_key_person_risk(self):
        """The core test: a CFO departure must trigger KEY_PERSON_RISK."""
        from src.services.shadow_market import ShadowMarketService
        svc = ShadowMarketService()
        result = svc.evaluate_talent_signals({
            "company_name": "Acme Ltd",
            "hiring_velocity_pct": 10.0,
            "active_job_postings": 5,
            "key_hire_departures": [
                {"role": "Chief Financial Officer", "type": "DEPARTURE", "date": "2026-02-01"}
            ],
        })
        assert result == "KEY_PERSON_RISK"

    def test_cto_departure_triggers_key_person_risk(self):
        from src.services.shadow_market import ShadowMarketService
        svc = ShadowMarketService()
        result = svc.evaluate_talent_signals({
            "key_hire_departures": [
                {"role": "CTO", "type": "DEPARTURE"}
            ],
        })
        assert result == "KEY_PERSON_RISK"

    def test_general_counsel_departure_triggers_key_person_risk(self):
        from src.services.shadow_market import ShadowMarketService
        svc = ShadowMarketService()
        result = svc.evaluate_talent_signals({
            "key_hire_departures": [
                {"role": "General Counsel", "type": "DEPARTURE"}
            ],
        })
        assert result == "KEY_PERSON_RISK"

    def test_hire_does_not_trigger_key_person_risk(self):
        """A CFO HIRE should not trigger KEY_PERSON_RISK."""
        from src.services.shadow_market import ShadowMarketService
        svc = ShadowMarketService()
        result = svc.evaluate_talent_signals({
            "key_hire_departures": [
                {"role": "CFO", "type": "HIRE"}
            ],
        })
        assert result != "KEY_PERSON_RISK"

    def test_contraction_signal(self):
        from src.services.shadow_market import ShadowMarketService
        svc = ShadowMarketService()
        result = svc.evaluate_talent_signals({
            "hiring_velocity_pct": -30.0,
            "active_job_postings": 0,
            "key_hire_departures": [],
        })
        assert result == "CONTRACTION_SIGNAL"

    def test_rapid_growth(self):
        from src.services.shadow_market import ShadowMarketService
        svc = ShadowMarketService()
        result = svc.evaluate_talent_signals({
            "hiring_velocity_pct": 45.0,
            "active_job_postings": 15,
            "key_hire_departures": [],
        })
        assert result == "RAPID_GROWTH"

    def test_stable_talent(self):
        from src.services.shadow_market import ShadowMarketService
        svc = ShadowMarketService()
        result = svc.evaluate_talent_signals({
            "hiring_velocity_pct": 10.0,
            "active_job_postings": 3,
            "key_hire_departures": [],
        })
        assert result == "STABLE_TALENT"

    def test_key_person_risk_has_priority_over_contraction(self):
        """KEY_PERSON_RISK should take priority over CONTRACTION_SIGNAL."""
        from src.services.shadow_market import ShadowMarketService
        svc = ShadowMarketService()
        result = svc.evaluate_talent_signals({
            "hiring_velocity_pct": -50.0,
            "active_job_postings": 0,
            "key_hire_departures": [
                {"role": "CEO", "type": "DEPARTURE"}
            ],
        })
        assert result == "KEY_PERSON_RISK"


class TestCrossVectorFusion:
    """Validate the cross-vector risk fusion logic."""

    def test_critical_distress_triggered(self):
        from src.services.shadow_market import ShadowMarketService
        svc = ShadowMarketService()
        result = svc.evaluate_cross_vector_risk(
            financial_risk_tier="ELEVATED_RISK",
            talent_signal="CONTRACTION_SIGNAL",
        )
        assert result == "CRITICAL_DISTRESS"

    def test_no_fusion_when_stable_financial(self):
        from src.services.shadow_market import ShadowMarketService
        svc = ShadowMarketService()
        result = svc.evaluate_cross_vector_risk(
            financial_risk_tier="STABLE",
            talent_signal="CONTRACTION_SIGNAL",
        )
        assert result is None

    def test_no_fusion_when_rapid_growth_talent(self):
        from src.services.shadow_market import ShadowMarketService
        svc = ShadowMarketService()
        result = svc.evaluate_cross_vector_risk(
            financial_risk_tier="ELEVATED_RISK",
            talent_signal="RAPID_GROWTH",
        )
        assert result is None


# ═══════════════════════════════════════════
# TASK 2: Talent Posting Classifier Tests
# ═══════════════════════════════════════════

class TestTalentPostingClassifier:
    """Validate the _classify_talent_posting helper."""

    def _make_sweep(self):
        with patch("src.services.market_sweep.firestore.Client"):
            from src.services.market_sweep import MarketSweepService
            svc = MarketSweepService()
            return svc

    def test_classify_cfo_departure(self):
        svc = self._make_sweep()
        result = svc._classify_talent_posting(
            title="Acme Ltd CFO Steps Down After 10 Years",
            summary="The Chief Financial Officer of Acme Ltd has resigned.",
            company_name="Acme Ltd",
        )
        assert result is not None
        assert result["type"] == "DEPARTURE"
        assert result["seniority"] == "senior"
        assert result["department"] == "finance"

    def test_classify_hiring_posting(self):
        svc = self._make_sweep()
        result = svc._classify_talent_posting(
            title="Acme Ltd Hiring 20 Engineers - Expansion",
            summary="Acme Ltd recruits engineers for new AI division.",
            company_name="Acme Ltd",
        )
        assert result is not None
        assert result["type"] == "HIRE"
        assert result["department"] == "tech"

    def test_classify_irrelevant_posting(self):
        svc = self._make_sweep()
        result = svc._classify_talent_posting(
            title="Market Report Q4 2026",
            summary="Overall UK markets showed signs of recovery.",
            company_name="Acme Ltd",
        )
        assert result is None  # Company name not found

    def test_classify_irrelevant_but_company_mentioned(self):
        svc = self._make_sweep()
        result = svc._classify_talent_posting(
            title="Acme Ltd Reports Q4 Earnings",
            summary="Acme Ltd saw revenue growth of 12%.",
            company_name="Acme Ltd",
        )
        assert result is None  # No hire/departure keywords

    def test_classify_legal_departure(self):
        svc = self._make_sweep()
        result = svc._classify_talent_posting(
            title="Head of Legal Leaves Acme Ltd",
            summary="Acme Ltd head of legal counsel has resigned effective immediately.",
            company_name="Acme Ltd",
        )
        assert result is not None
        assert result["type"] == "DEPARTURE"
        assert result["department"] == "legal"
        assert result["seniority"] == "senior"


# ═══════════════════════════════════════════
# INTEGRATION: Reed.co.uk RSS Mock Test
# ═══════════════════════════════════════════

class TestReedRSSIntegration:
    """
    Simulates a Reed.co.uk RSS payload with a CFO job posting,
    passes it through the classifier and talent evaluator,
    and asserts KEY_PERSON_RISK is triggered.
    """

    def test_reed_cfo_posting_end_to_end(self):
        """Mock Reed RSS → classify → evaluate → KEY_PERSON_RISK."""
        with patch("src.services.market_sweep.firestore.Client"):
            from src.services.market_sweep import MarketSweepService
            from src.services.shadow_market import ShadowMarketService

            sweep = MarketSweepService()
            shadow = ShadowMarketService()

            # Simulate a Reed.co.uk RSS entry for a CFO departure
            posting = sweep._classify_talent_posting(
                title="Chief Financial Officer Departure - Barclays PLC",
                summary="The CFO of Barclays PLC steps down amid strategic review. Barclays PLC resign.",
                company_name="Barclays PLC",
            )

            assert posting is not None
            assert posting["type"] == "DEPARTURE"

            # Build talent payload
            talent_data = {
                "company_name": "Barclays PLC",
                "hiring_velocity_pct": 5.0,
                "active_job_postings": 10,
                "key_hire_departures": [posting],
            }

            result = shadow.evaluate_talent_signals(talent_data)
            assert result == "KEY_PERSON_RISK"
