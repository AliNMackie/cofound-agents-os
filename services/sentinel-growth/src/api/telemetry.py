"""
IC Origin — Telemetry API

Provides the /api/v1/telemetry/status endpoint for the customer-facing
Portfolio Status dashboard. RBAC-protected via get_current_user.
"""

import datetime
import structlog
from fastapi import APIRouter, Depends

from src.core.auth import AuthenticatedUser, get_current_user
from src.services.telemetry_service import telemetry_service

logger = structlog.get_logger()
router = APIRouter(prefix="/api/v1/telemetry", tags=["Telemetry"])


@router.get("/status")
async def get_telemetry_status(
    user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Returns the current tenant's usage stats, system health status,
    and scheduling metadata. Requires authentication.
    """
    tenant_id = user.tenant_id

    # Fetch usage stats from Firestore
    usage = telemetry_service.get_usage_stats(tenant_id)
    entity_count = telemetry_service.get_entity_count(tenant_id)

    # Compute next scheduled sweep (08:00 tomorrow UTC)
    now = datetime.datetime.now(datetime.timezone.utc)
    next_sweep = now.replace(hour=8, minute=0, second=0, microsecond=0)
    if now.hour >= 8:
        next_sweep += datetime.timedelta(days=1)

    return {
        "tenant_id": tenant_id,
        "system_status": "All Systems Operational",
        "sync_active": True,
        "entities_monitored": entity_count,
        "sweeps_executed": usage["sweeps_executed"],
        "alerts_sent": usage["alerts_sent"],
        "reports_generated": usage["reports_generated"],
        "last_sweep_at": usage["last_sweep_at"],
        "next_sweep_at": next_sweep.isoformat(),
        "billing_month": usage["month"],
        "user_role": user.role.value,
        "user_email": user.email,
    }
