"""
IC Origin — Graph API

Provides endpoints for entity relationship graph queries.
RBAC-protected via get_current_user.
"""

import structlog
from fastapi import APIRouter, Depends, HTTPException

from src.core.auth import AuthenticatedUser, get_current_user
from src.services.graph_service import graph_service
from src.services.systemic_risk import systemic_risk_service

logger = structlog.get_logger()
router = APIRouter(prefix="/api/v1/graph", tags=["Graph"])


@router.get("/contagion/{ch_number}")
async def get_contagion_network(
    ch_number: str,
    user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Returns the 2-hop contagion network for a given company.
    Includes directors, PSCs, and linked companies.
    """
    network = graph_service.get_contagion_network(ch_number)

    if not network.get("target"):
        raise HTTPException(
            status_code=404,
            detail=f"Entity {ch_number} not found in graph",
        )

    return network


@router.get("/systemic/{ch_number}")
async def get_systemic_exposure(
    ch_number: str,
    user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Check if an entity is a systemic risk (appears in ≥2 tenant portfolios
    with degraded risk tier).
    """
    result = systemic_risk_service.evaluate_systemic_exposure(ch_number)

    # Redact tenant_ids for non-admin users (they shouldn't see other tenants)
    if not user.is_admin:
        result["tenant_ids"] = []

    return result
