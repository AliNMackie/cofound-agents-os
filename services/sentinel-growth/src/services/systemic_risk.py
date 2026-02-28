"""
IC Origin — Cross-Portfolio Systemic Risk Service

Evaluates whether a degraded entity appears across multiple tenant
portfolios, flagging systemic exposure. If Entity X is ELEVATED_RISK
and exists in ≥2 different tenant portfolios, it represents a
systemic risk that no single tenant can see.

Uses the admin SDK to query across tenant boundaries (server-side only).
"""

import structlog
from google.cloud import firestore
from src.core.config import settings

logger = structlog.get_logger()


class SystemicRiskService:
    """
    Detects cross-portfolio systemic exposure.

    A systemic entity is one that:
      1. Has risk_tier == ELEVATED_RISK
      2. Exists in monitored_entities collections of ≥2 different tenants

    This service uses server-side admin access to query across tenant
    boundaries — it is NOT exposed to tenant-scoped APIs directly.
    """

    def __init__(self):
        try:
            self.db = firestore.Client(database=settings.FIRESTORE_DB_NAME)
            logger.info("SystemicRiskService initialised")
        except Exception as e:
            self.db = None
            logger.warning(
                "SystemicRiskService: Firestore unavailable", error=str(e)
            )

    def evaluate_systemic_exposure(self, ch_number: str) -> dict:
        """
        Check if a company (by CH number) exists across ≥2 tenant portfolios
        and is in a degraded state.

        Returns:
            {
                "ch_number": str,
                "is_systemic": bool,
                "tenant_exposure_count": int,
                "tenant_ids": list[str],
                "risk_tier": str | None,
            }
        """
        if not self.db:
            return self._empty_result(ch_number)

        try:
            return self._query_cross_tenant(ch_number)
        except Exception as e:
            logger.error(
                "SystemicRisk: evaluation failed",
                ch_number=ch_number,
                error=str(e),
            )
            return self._empty_result(ch_number)

    def _query_cross_tenant(self, ch_number: str) -> dict:
        """
        Query all tenant collections for the given company number.
        Uses collection_group query on monitored_entities across tenants.
        """
        # Use collection group query to find the entity across all tenants
        query = (
            self.db.collection_group("monitored_entities")
            .where("company_number", "==", ch_number)
        )

        docs = list(query.stream())

        if not docs:
            return self._empty_result(ch_number)

        tenant_ids = set()
        risk_tier = None

        for doc in docs:
            data = doc.to_dict()
            # Extract tenant_id from document path: tenants/{tenant_id}/monitored_entities/{id}
            path_parts = doc.reference.path.split("/")
            if len(path_parts) >= 2 and path_parts[0] == "tenants":
                tenant_ids.add(path_parts[1])

            # Use the most severe risk_tier found
            doc_tier = data.get("risk_tier", "UNSCORED")
            if doc_tier == "ELEVATED_RISK":
                risk_tier = "ELEVATED_RISK"
            elif risk_tier is None:
                risk_tier = doc_tier

        tenant_list = sorted(tenant_ids)
        is_systemic = len(tenant_list) >= 2 and risk_tier == "ELEVATED_RISK"

        result = {
            "ch_number": ch_number,
            "is_systemic": is_systemic,
            "tenant_exposure_count": len(tenant_list),
            "tenant_ids": tenant_list,
            "risk_tier": risk_tier,
        }

        if is_systemic:
            logger.warning(
                "SystemicRisk: SYSTEMIC EXPOSURE DETECTED",
                ch_number=ch_number,
                tenants=len(tenant_list),
            )

        return result

    def _empty_result(self, ch_number: str) -> dict:
        return {
            "ch_number": ch_number,
            "is_systemic": False,
            "tenant_exposure_count": 0,
            "tenant_ids": [],
            "risk_tier": None,
        }


# Singleton
systemic_risk_service = SystemicRiskService()
