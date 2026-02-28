"""
IC Origin — Tenant-Aware Telemetry Service

Tracks per-tenant usage metrics using atomic Firestore increments.
Stores counters under: tenants/{tenant_id}/telemetry/current_month
"""

import datetime
import structlog
from google.cloud import firestore
from src.core.config import settings

logger = structlog.get_logger()


class TelemetryService:
    """
    Tracks tenant-scoped usage telemetry with atomic Firestore increments.

    Counters are stored per calendar month to support billing and audit.
    Path: tenants/{tenant_id}/telemetry/{YYYY-MM}
    """

    def __init__(self):
        try:
            self.db = firestore.Client(database=settings.FIRESTORE_DB_NAME)
            logger.info("TelemetryService initialised")
        except Exception as e:
            self.db = None
            logger.warning("TelemetryService: Firestore unavailable", error=str(e))

    def _current_month_key(self) -> str:
        """Returns the current month key, e.g. '2026-02'."""
        return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m")

    def _telemetry_ref(self, tenant_id: str):
        """
        Reference to the tenant's current-month telemetry document.
        Path: tenants/{tenant_id}/telemetry/{YYYY-MM}
        """
        return (
            self.db.collection("tenants")
            .document(tenant_id)
            .collection("telemetry")
            .document(self._current_month_key())
        )

    # ── Atomic Increment Methods ───────────────────────────────────

    def track_sweep_executed(self, tenant_id: str) -> None:
        """Atomically increment the sweep counter for this tenant."""
        if not self.db:
            return
        try:
            self._telemetry_ref(tenant_id).set(
                {
                    "sweeps_executed": firestore.Increment(1),
                    "last_sweep_at": datetime.datetime.now(datetime.timezone.utc),
                    "updated_at": datetime.datetime.now(datetime.timezone.utc),
                },
                merge=True,
            )
            logger.debug("Telemetry: sweep tracked", tenant_id=tenant_id)
        except Exception as e:
            logger.error("Telemetry: failed to track sweep", error=str(e))

    def track_alert_sent(self, tenant_id: str) -> None:
        """Atomically increment the alert counter for this tenant."""
        if not self.db:
            return
        try:
            self._telemetry_ref(tenant_id).set(
                {
                    "alerts_sent": firestore.Increment(1),
                    "updated_at": datetime.datetime.now(datetime.timezone.utc),
                },
                merge=True,
            )
            logger.debug("Telemetry: alert tracked", tenant_id=tenant_id)
        except Exception as e:
            logger.error("Telemetry: failed to track alert", error=str(e))

    def track_report_generated(self, tenant_id: str) -> None:
        """Atomically increment the report counter for this tenant."""
        if not self.db:
            return
        try:
            self._telemetry_ref(tenant_id).set(
                {
                    "reports_generated": firestore.Increment(1),
                    "updated_at": datetime.datetime.now(datetime.timezone.utc),
                },
                merge=True,
            )
            logger.debug("Telemetry: report tracked", tenant_id=tenant_id)
        except Exception as e:
            logger.error("Telemetry: failed to track report", error=str(e))

    # ── Read Methods ───────────────────────────────────────────────

    def get_usage_stats(self, tenant_id: str) -> dict:
        """
        Read the current month's usage stats for a tenant.
        Returns a dict with all counters and metadata.
        """
        if not self.db:
            return self._empty_stats()

        try:
            doc = self._telemetry_ref(tenant_id).get()
            if doc.exists:
                data = doc.to_dict()
                return {
                    "sweeps_executed": data.get("sweeps_executed", 0),
                    "alerts_sent": data.get("alerts_sent", 0),
                    "reports_generated": data.get("reports_generated", 0),
                    "last_sweep_at": (
                        data["last_sweep_at"].isoformat()
                        if data.get("last_sweep_at")
                        else None
                    ),
                    "month": self._current_month_key(),
                }
            return self._empty_stats()
        except Exception as e:
            logger.error("Telemetry: failed to read stats", error=str(e))
            return self._empty_stats()

    def get_entity_count(self, tenant_id: str) -> int:
        """Count monitored entities for this tenant."""
        if not self.db:
            return 0
        try:
            col = (
                self.db.collection("tenants")
                .document(tenant_id)
                .collection("monitored_entities")
            )
            # Use aggregation query if available, else count docs
            docs = col.select([]).stream()
            return sum(1 for _ in docs)
        except Exception as e:
            logger.error("Telemetry: failed to count entities", error=str(e))
            return 0

    def _empty_stats(self) -> dict:
        return {
            "sweeps_executed": 0,
            "alerts_sent": 0,
            "reports_generated": 0,
            "last_sweep_at": None,
            "month": self._current_month_key(),
        }


telemetry_service = TelemetryService()
