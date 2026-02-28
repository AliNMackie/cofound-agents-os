"""
Sprint 4 Validation Tests — Pub/Sub Publisher Hook & Beam Pipeline Transforms
Tests: persistence.publish_signal_event, signal_pipeline transform functions
"""
import sys
import os
import json
import asyncio
import datetime
from unittest.mock import MagicMock, patch

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


# ═══════════════════════════════════════════
# TASK 1: Pub/Sub Publisher Hook
# ═══════════════════════════════════════════

class TestPublishSignalEvent:
    """Validate the non-blocking Pub/Sub publish hook in PersistenceService."""

    def _make_service(self):
        """Create a PersistenceService with mocked Firestore and Pub/Sub."""
        with patch("src.services.persistence.firestore.Client"), \
             patch("src.services.persistence.pubsub_v1.PublisherClient") as mock_pub:
            mock_publisher = MagicMock()
            mock_pub.return_value = mock_publisher
            mock_publisher.topic_path.return_value = (
                "projects/ic-origin/topics/ic-origin-signals"
            )
            # Mock publish to return a future
            mock_future = MagicMock()
            mock_future.result.return_value = "msg-id-123"
            mock_publisher.publish.return_value = mock_future

            from src.services.persistence import PersistenceService
            svc = PersistenceService()
            return svc, mock_publisher

    def test_publish_constructs_correct_payload(self):
        """Signal data is serialised to JSON with all required schema fields."""
        svc, mock_pub = self._make_service()

        signal = {
            "signal_id": "test-sig-001",
            "company_number": "12345678",
            "company_name": "Test Corp Ltd",
            "portfolio_id": "port-001",
            "risk_tier": "ELEVATED_RISK",
            "conviction_score": 85,
            "signal_type": "NEW_CHARGE",
            "source_family": "GOV_REGISTRY",
            "region": "London",
        }
        svc.publish_signal_event(signal)

        mock_pub.publish.assert_called_once()
        call_args = mock_pub.publish.call_args
        published_bytes = call_args[1].get("data") or call_args[0][1]
        payload = json.loads(published_bytes.decode("utf-8"))

        assert payload["signal_id"] == "test-sig-001"
        assert payload["company_number"] == "12345678"
        assert payload["risk_tier"] == "ELEVATED_RISK"
        assert payload["conviction_score"] == 85
        assert payload["signal_type"] == "NEW_CHARGE"
        assert "ingested_at" in payload
        assert "event_date" in payload

    def test_publish_failure_does_not_raise(self):
        """If Pub/Sub publish throws, the exception is swallowed — no crash."""
        svc, mock_pub = self._make_service()
        mock_pub.publish.side_effect = Exception("Pub/Sub unavailable")

        # Must not raise
        svc.publish_signal_event({"signal_type": "TEST"})

    def test_publish_skipped_when_publisher_is_none(self):
        """When publisher init fails, publish_signal_event is a no-op."""
        with patch("src.services.persistence.firestore.Client"), \
             patch("src.services.persistence.pubsub_v1.PublisherClient",
                   side_effect=Exception("Init fail")):
            from src.services.persistence import PersistenceService
            svc = PersistenceService()

        assert svc.publisher is None
        # Should not raise
        svc.publish_signal_event({"signal_type": "TEST"})

    def test_publish_payload_contains_all_required_fields(self):
        """Published payload must contain all 11 fact_signals fields."""
        svc, mock_pub = self._make_service()
        svc.publish_signal_event({"company_number": "SC654321"})

        call_args = mock_pub.publish.call_args
        published_bytes = call_args[1].get("data") or call_args[0][1]
        payload = json.loads(published_bytes.decode("utf-8"))

        required_fields = [
            "signal_id", "company_number", "company_name", "portfolio_id",
            "risk_tier", "conviction_score", "signal_type", "source_family",
            "region", "ingested_at", "event_date",
        ]
        for field in required_fields:
            assert field in payload, f"Missing required field: {field}"

    def test_publish_defaults_for_missing_fields(self):
        """Missing optional fields get sensible defaults, not KeyErrors."""
        svc, mock_pub = self._make_service()
        svc.publish_signal_event({})  # Completely empty

        call_args = mock_pub.publish.call_args
        published_bytes = call_args[1].get("data") or call_args[0][1]
        payload = json.loads(published_bytes.decode("utf-8"))

        assert payload["risk_tier"] == "UNSCORED"
        assert payload["conviction_score"] == 0
        assert payload["signal_type"] == "UNKNOWN"
        assert payload["source_family"] == "GOV_REGISTRY"
        assert payload["signal_id"]  # Auto-generated UUID


# ═══════════════════════════════════════════
# TASK 2: Beam Pipeline Transform Functions
# ═══════════════════════════════════════════
# These functions are tested inline (copied from signal_pipeline.py)
# because apache-beam is not installed in the sentinel-growth venv.
# The canonical source remains ic-origin-dataflow/signal_pipeline.py.

import uuid

VALID_RISK_TIERS = {"ELEVATED_RISK", "STABLE", "IMPROVED", "UNSCORED"}
VALID_SOURCE_FAMILIES = {"GOV_REGISTRY", "RSS_NEWS", "TALENT_FEED"}


def parse_signal_json(message_bytes: bytes):
    """Parse a Pub/Sub message payload from JSON bytes."""
    try:
        payload = json.loads(message_bytes.decode("utf-8"))
        if not isinstance(payload, dict):
            return None
        return payload
    except (json.JSONDecodeError, UnicodeDecodeError):
        return None


def map_to_bigquery_row(signal: dict) -> dict:
    """Map a parsed signal dict to the BigQuery fact_signals schema."""
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    today_iso = datetime.date.today().isoformat()

    risk_tier = signal.get("risk_tier", "UNSCORED")
    if risk_tier not in VALID_RISK_TIERS:
        risk_tier = "UNSCORED"

    source_family = signal.get("source_family", "GOV_REGISTRY")
    if source_family not in VALID_SOURCE_FAMILIES:
        source_family = "GOV_REGISTRY"

    try:
        conviction = int(signal.get("conviction_score", 0))
    except (TypeError, ValueError):
        conviction = 0

    return {
        "signal_id": signal.get("signal_id", str(uuid.uuid4())),
        "company_number": signal.get("company_number", ""),
        "company_name": signal.get("company_name", ""),
        "portfolio_id": signal.get("portfolio_id", ""),
        "risk_tier": risk_tier,
        "conviction_score": conviction,
        "signal_type": signal.get("signal_type", "UNKNOWN"),
        "source_family": source_family,
        "region": signal.get("region", ""),
        "ingested_at": signal.get("ingested_at", now_iso),
        "event_date": signal.get("event_date", today_iso),
    }


class TestParseSignalJson:
    """Validate JSON parsing of Pub/Sub payloads."""

    def test_parse_valid_json(self):
        raw = json.dumps({
            "signal_id": "sig-001",
            "company_number": "12345678",
            "risk_tier": "STABLE",
        }).encode("utf-8")
        result = parse_signal_json(raw)
        assert result is not None
        assert result["signal_id"] == "sig-001"
        assert result["company_number"] == "12345678"

    def test_parse_invalid_json_returns_none(self):
        result = parse_signal_json(b"NOT VALID JSON {{{")
        assert result is None

    def test_parse_non_dict_returns_none(self):
        """JSON arrays and primitives are rejected."""
        result = parse_signal_json(b'[1, 2, 3]')
        assert result is None

    def test_parse_empty_bytes_returns_none(self):
        result = parse_signal_json(b"")
        assert result is None

    def test_parse_utf8_content(self):
        raw = json.dumps({"company_name": "Über Holdings GmbH"}).encode("utf-8")
        result = parse_signal_json(raw)
        assert result["company_name"] == "Über Holdings GmbH"


class TestMapToBigQueryRow:
    """Validate schema mapping to BigQuery fact_signals row."""

    def test_full_signal_maps_correctly(self):
        signal = {
            "signal_id": "sig-002",
            "company_number": "87654321",
            "company_name": "Beta Capital PLC",
            "portfolio_id": "port-001",
            "risk_tier": "ELEVATED_RISK",
            "conviction_score": 92,
            "signal_type": "DIRECTOR_RESIGNED",
            "source_family": "GOV_REGISTRY",
            "region": "Edinburgh",
            "ingested_at": "2026-02-28T12:00:00+00:00",
            "event_date": "2026-02-28",
        }
        row = map_to_bigquery_row(signal)

        assert row["signal_id"] == "sig-002"
        assert row["company_number"] == "87654321"
        assert row["company_name"] == "Beta Capital PLC"
        assert row["risk_tier"] == "ELEVATED_RISK"
        assert row["conviction_score"] == 92
        assert row["signal_type"] == "DIRECTOR_RESIGNED"
        assert row["source_family"] == "GOV_REGISTRY"
        assert row["region"] == "Edinburgh"

    def test_missing_fields_get_defaults(self):
        row = map_to_bigquery_row({})
        assert row["risk_tier"] == "UNSCORED"
        assert row["conviction_score"] == 0
        assert row["signal_type"] == "UNKNOWN"
        assert row["source_family"] == "GOV_REGISTRY"
        assert row["company_number"] == ""
        assert row["company_name"] == ""
        assert row["signal_id"]  # UUID auto-generated
        assert row["ingested_at"]  # Timestamp auto-generated
        assert row["event_date"]  # Date auto-generated

    def test_invalid_risk_tier_defaults_to_unscored(self):
        row = map_to_bigquery_row({"risk_tier": "INVALID_TIER"})
        assert row["risk_tier"] == "UNSCORED"

    def test_invalid_source_family_defaults_to_gov_registry(self):
        row = map_to_bigquery_row({"source_family": "UNKNOWN_SOURCE"})
        assert row["source_family"] == "GOV_REGISTRY"

    def test_invalid_conviction_score_defaults_to_zero(self):
        row = map_to_bigquery_row({"conviction_score": "not_a_number"})
        assert row["conviction_score"] == 0

    def test_output_has_exactly_11_fields(self):
        """BigQuery fact_signals has 11 columns — row must match."""
        row = map_to_bigquery_row({"signal_id": "test"})
        assert len(row) == 11

    def test_all_valid_risk_tiers_pass_through(self):
        for tier in ["ELEVATED_RISK", "STABLE", "IMPROVED", "UNSCORED"]:
            row = map_to_bigquery_row({"risk_tier": tier})
            assert row["risk_tier"] == tier

    def test_all_valid_source_families_pass_through(self):
        for family in ["GOV_REGISTRY", "RSS_NEWS", "TALENT_FEED"]:
            row = map_to_bigquery_row({"source_family": family})
            assert row["source_family"] == family
