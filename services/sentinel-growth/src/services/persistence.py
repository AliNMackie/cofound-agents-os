import structlog
import datetime
import json
import uuid
from typing import Optional
from google.cloud import firestore
from google.cloud import pubsub_v1
from src.core.config import settings

logger = structlog.get_logger()


class TenantAccessError(Exception):
    """Raised when a tenant tries to access another tenant's data."""
    pass


class PersistenceService:
    """
    Tenant-scoped Firestore persistence layer.

    All data is stored under: tenants/{tenant_id}/...
    Every read/write method requires a tenant_id parameter.
    Cross-tenant access is impossible by design.
    """

    def __init__(self):
        self.db = firestore.Client(database=settings.FIRESTORE_DB_NAME)

        # --- Pub/Sub Publisher (lazy, fire-and-forget) ---
        try:
            self.publisher = pubsub_v1.PublisherClient()
            self.topic_path = self.publisher.topic_path(
                settings.GCP_PROJECT_ID, settings.PUBSUB_TOPIC_ID
            )
            logger.info(
                "Pub/Sub publisher initialised",
                topic=self.topic_path,
            )
        except Exception as e:
            self.publisher = None
            self.topic_path = None
            logger.warning(
                "Pub/Sub publisher unavailable — events will not be published",
                error=str(e),
            )

    # ── Tenant-scoped collection helpers ───────────────────────────

    def _tenant_ref(self, tenant_id: str):
        """Root reference for a tenant's document tree."""
        return self.db.collection("tenants").document(tenant_id)

    def _entities_col(self, tenant_id: str):
        """tenants/{tenant_id}/monitored_entities"""
        return self._tenant_ref(tenant_id).collection("monitored_entities")

    def _alerts_col(self, tenant_id: str):
        """tenants/{tenant_id}/strategic_alerts"""
        return self._tenant_ref(tenant_id).collection("strategic_alerts")

    def _portfolios_col(self, tenant_id: str):
        """tenants/{tenant_id}/portfolios"""
        return self._tenant_ref(tenant_id).collection("portfolios")

    # ── Pub/Sub publish hook ────────────────────────────────────────
    def publish_signal_event(self, signal_data: dict) -> None:
        """
        Non-blocking publish of a signal event to Pub/Sub.
        Graceful failure: logs errors but NEVER raises.
        """
        if self.publisher is None:
            logger.debug("Pub/Sub publisher not available, skipping publish")
            return

        try:
            payload = {
                "signal_id": signal_data.get("signal_id", str(uuid.uuid4())),
                "company_number": signal_data.get("company_number", ""),
                "company_name": signal_data.get("company_name", ""),
                "portfolio_id": signal_data.get("portfolio_id", ""),
                "risk_tier": signal_data.get("risk_tier", "UNSCORED"),
                "conviction_score": signal_data.get("conviction_score", 0),
                "signal_type": signal_data.get("signal_type", "UNKNOWN"),
                "source_family": signal_data.get("source_family", "GOV_REGISTRY"),
                "region": signal_data.get("region", ""),
                "tenant_id": signal_data.get("tenant_id", ""),
                "ingested_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "event_date": signal_data.get(
                    "event_date",
                    datetime.date.today().isoformat(),
                ),
            }
            data_bytes = json.dumps(payload).encode("utf-8")
            future = self.publisher.publish(self.topic_path, data=data_bytes)

            # Non-blocking callback for observability
            def _on_publish(fut):
                try:
                    message_id = fut.result(timeout=5)
                    logger.debug(
                        "Signal event published",
                        message_id=message_id,
                        signal_id=payload["signal_id"],
                    )
                except Exception as cb_err:
                    logger.error(
                        "Pub/Sub publish callback failed",
                        error=str(cb_err),
                        signal_id=payload["signal_id"],
                    )

            future.add_done_callback(_on_publish)

        except Exception as e:
            logger.error(
                "Failed to publish signal event to Pub/Sub",
                error=str(e),
                signal_data_keys=list(signal_data.keys()),
            )

    # ── Entity persistence (tenant-scoped) ─────────────────────────

    async def update_adjacency_score(
        self, tenant_id: str, entity_id: str, score: float, context: str
    ):
        """
        Updates the adjacency score for an entity within a tenant's scope.
        Path: tenants/{tenant_id}/monitored_entities/{entity_id}
        """
        try:
            doc_ref = self._entities_col(tenant_id).document(entity_id)
            doc = doc_ref.get()

            now = datetime.datetime.now(datetime.timezone.utc)
            history_entry = {
                "score": score,
                "context": context,
                "timestamp": now,
            }

            if doc.exists:
                data = doc.to_dict()
                old_score = data.get("current_score", 0.0)
                doc_ref.update({
                    "current_score": score,
                    "last_context": context,
                    "updated_at": now,
                    "score_history": firestore.ArrayUnion([history_entry]),
                })

                if score >= 80 and old_score < 80:
                    await self._trigger_strategic_alert(
                        tenant_id, entity_id, score, context, "THRESHOLD_CROSS"
                    )
            else:
                doc_ref.set({
                    "entity_id": entity_id,
                    "tenant_id": tenant_id,
                    "current_score": score,
                    "last_context": context,
                    "created_at": now,
                    "updated_at": now,
                    "score_history": [history_entry],
                })
                if score >= 80:
                    await self._trigger_strategic_alert(
                        tenant_id, entity_id, score, context, "INITIAL_HIGH_SCORE"
                    )

            # ── Publish signal event after successful Firestore write ──
            self.publish_signal_event({
                "signal_id": str(uuid.uuid4()),
                "company_number": entity_id,
                "tenant_id": tenant_id,
                "conviction_score": int(score),
                "signal_type": "SCORE_UPDATE",
                "risk_tier": "ELEVATED_RISK" if score >= 80 else "STABLE",
                "source_family": "GOV_REGISTRY",
            })

        except Exception as e:
            logger.error(
                "Failed to update adjacency score",
                tenant_id=tenant_id,
                entity_id=entity_id,
                error=str(e),
            )

    async def get_entity(self, tenant_id: str, entity_id: str) -> Optional[dict]:
        """Read a single entity within the tenant's scope."""
        try:
            doc = self._entities_col(tenant_id).document(entity_id).get()
            return doc.to_dict() if doc.exists else None
        except Exception as e:
            logger.error("Failed to get entity", tenant_id=tenant_id, entity_id=entity_id, error=str(e))
            return None

    async def list_entities(self, tenant_id: str, limit: int = 100) -> list[dict]:
        """List all monitored entities for a tenant."""
        try:
            docs = (
                self._entities_col(tenant_id)
                .order_by("updated_at", direction=firestore.Query.DESCENDING)
                .limit(limit)
                .stream()
            )
            return [doc.to_dict() for doc in docs]
        except Exception as e:
            logger.error("Failed to list entities", tenant_id=tenant_id, error=str(e))
            return []

    async def add_entity(self, tenant_id: str, entity_data: dict) -> str:
        """Add a new entity to the tenant's monitored set."""
        try:
            entity_id = entity_data.get("company_number", str(uuid.uuid4()))
            now = datetime.datetime.now(datetime.timezone.utc)
            doc_data = {
                **entity_data,
                "tenant_id": tenant_id,
                "created_at": now,
                "updated_at": now,
                "current_score": 0.0,
                "risk_tier": entity_data.get("risk_tier", "UNSCORED"),
            }
            self._entities_col(tenant_id).document(entity_id).set(doc_data)
            logger.info("Entity added", tenant_id=tenant_id, entity_id=entity_id)
            return entity_id
        except Exception as e:
            logger.error("Failed to add entity", tenant_id=tenant_id, error=str(e))
            raise

    async def remove_entity(self, tenant_id: str, entity_id: str) -> None:
        """Remove an entity from the tenant's monitored set."""
        try:
            self._entities_col(tenant_id).document(entity_id).delete()
            logger.info("Entity removed", tenant_id=tenant_id, entity_id=entity_id)
        except Exception as e:
            logger.error("Failed to remove entity", tenant_id=tenant_id, entity_id=entity_id, error=str(e))
            raise

    # ── Portfolio persistence (tenant-scoped) ──────────────────────

    async def create_portfolio(self, tenant_id: str, portfolio_id: str, entities: list[dict]) -> str:
        """Create a portfolio under the tenant's scope."""
        try:
            now = datetime.datetime.now(datetime.timezone.utc)
            portfolio_ref = self._portfolios_col(tenant_id).document(portfolio_id)
            portfolio_ref.set({
                "portfolio_id": portfolio_id,
                "tenant_id": tenant_id,
                "entity_count": len(entities),
                "created_at": now,
                "updated_at": now,
            })

            # Store each entity in the tenant's monitored_entities
            for entity in entities:
                entity_id = entity.get("company_number", str(uuid.uuid4()))
                self._entities_col(tenant_id).document(entity_id).set({
                    **entity,
                    "tenant_id": tenant_id,
                    "portfolio_id": portfolio_id,
                    "created_at": now,
                    "updated_at": now,
                    "current_score": 0.0,
                    "risk_tier": entity.get("risk_tier", "UNSCORED"),
                }, merge=True)

            logger.info(
                "Portfolio created",
                tenant_id=tenant_id,
                portfolio_id=portfolio_id,
                entity_count=len(entities),
            )
            return portfolio_id
        except Exception as e:
            logger.error("Failed to create portfolio", tenant_id=tenant_id, error=str(e))
            raise

    # ── Strategic alerts (tenant-scoped) ───────────────────────────

    async def _trigger_strategic_alert(
        self, tenant_id: str, entity_id: str, score: float, context: str, alert_type: str
    ):
        """
        Records a strategic alert within the tenant's scope.
        Path: tenants/{tenant_id}/strategic_alerts/{auto_id}
        """
        try:
            alert_data = {
                "entity_id": entity_id,
                "tenant_id": tenant_id,
                "score": score,
                "context": context,
                "alert_type": alert_type,
                "timestamp": datetime.datetime.now(datetime.timezone.utc),
                "status": "UNREAD",
            }
            self._alerts_col(tenant_id).add(alert_data)
            logger.info(
                "Strategic Alert Triggered!",
                tenant_id=tenant_id,
                entity_id=entity_id,
                score=score,
            )

            # ── Publish alert event to Pub/Sub ──
            self.publish_signal_event({
                "signal_id": str(uuid.uuid4()),
                "company_number": entity_id,
                "tenant_id": tenant_id,
                "conviction_score": int(score),
                "signal_type": f"ALERT_{alert_type}",
                "risk_tier": "ELEVATED_RISK",
                "source_family": "GOV_REGISTRY",
            })

        except Exception as e:
            logger.error(
                "Failed to trigger alert",
                tenant_id=tenant_id,
                entity_id=entity_id,
                error=str(e),
            )


persistence_service = PersistenceService()
