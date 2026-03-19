"""
IC Origin — Portfolio Upload API (Sprint 5: Tenant-Scoped + RBAC)
Accepts CSV uploads and manages monitoring portfolios per tenant.
"""
import csv
import io
import uuid
import structlog
from typing import Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from pydantic import BaseModel, Field
from src.schemas.auctions import CounterpartyType, RiskTier
from src.core.auth import (
    AuthenticatedUser,
    get_current_user,
    require_admin,
    require_analyst,
    require_viewer,
)
from src.services.persistence import persistence_service

router = APIRouter(prefix="/api/v1/portfolio", tags=["Portfolio Management"])
logger = structlog.get_logger()


# ──────────────── Request / Response Models ────────────────

class PortfolioEntity(BaseModel):
    """A single entity parsed from the uploaded CSV."""
    company_number: str = Field(..., description="Companies House registration number")
    company_name: Optional[str] = Field(None, description="Optional company name from CSV")
    counterparty_type: CounterpartyType = Field(
        CounterpartyType.BORROWER,
        description="Relationship type (defaults to BORROWER if not specified in CSV)"
    )
    risk_tier: RiskTier = Field(RiskTier.UNSCORED, description="Initial risk tier")
    latest_ebitda_gbp: Optional[float] = Field(None, description="Optional EBITDA margin from CSV")
    primary_advisors: list[str] = Field(default_factory=list, description="Optional primary advisors list from CSV")


class PortfolioUploadResponse(BaseModel):
    """Response returned after a successful portfolio upload."""
    status: str = "success"
    portfolio_id: str = Field(..., description="Generated unique portfolio ID")
    tenant_id: str = Field(..., description="Owning tenant ID")
    entities_parsed: int = Field(..., description="Number of valid entities extracted")
    entities_skipped: int = Field(0, description="Rows skipped due to validation errors")
    entities: list[PortfolioEntity] = Field(..., description="List of parsed entities")
    errors: list[str] = Field(default_factory=list, description="Validation errors")


class AddEntityRequest(BaseModel):
    """Request body for adding a single entity."""
    company_number: str = Field(..., description="Companies House number")
    company_name: Optional[str] = None
    counterparty_type: CounterpartyType = CounterpartyType.BORROWER


class AddEntityResponse(BaseModel):
    status: str = "success"
    entity_id: str
    tenant_id: str


# ──────────────── Validation Helpers ────────────────

_VALID_COUNTERPARTY_TYPES = {ct.value for ct in CounterpartyType}


def _normalise_company_number(raw: str) -> Optional[str]:
    cleaned = raw.strip()
    if not cleaned:
        return None
    if cleaned.isdigit():
        cleaned = cleaned.zfill(8)
    return cleaned


def _parse_counterparty_type(raw: Optional[str]) -> CounterpartyType:
    if not raw:
        return CounterpartyType.BORROWER
    normalised = raw.strip().upper()
    if normalised in _VALID_COUNTERPARTY_TYPES:
        return CounterpartyType(normalised)
    return CounterpartyType.BORROWER

def _parse_float(raw: Optional[str]) -> Optional[float]:
    if not raw:
        return None
    try:
        cleaned = raw.replace(",", "").replace("£", "").replace("$", "").strip()
        return float(cleaned)
    except ValueError:
        return None


# ──────────────── Endpoints ────────────────

@router.post("/upload", response_model=PortfolioUploadResponse)
async def upload_portfolio(
    file: UploadFile = File(..., description="CSV file with company_number column"),
    user: AuthenticatedUser = Depends(require_admin),
):
    """
    Upload a CSV of Companies House numbers to create a monitoring portfolio.
    **ADMIN only** — creates the portfolio under the user's tenant.
    """
    # ── Validate file type ──
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a .csv file")

    # ── Read and decode ──
    try:
        contents = await file.read()
        text = contents.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=400,
            detail="File encoding not supported. Please upload a UTF-8 CSV."
        )

    # ── Parse CSV ──
    reader = csv.DictReader(io.StringIO(text))
    if not reader.fieldnames or "company_number" not in reader.fieldnames:
        raise HTTPException(
            status_code=400,
            detail=f"CSV must contain a 'company_number' column. Found: {reader.fieldnames}"
        )

    # ── Generate portfolio ID ──
    portfolio_id = f"port-{uuid.uuid4().hex[:12]}"

    entities: list[PortfolioEntity] = []
    errors: list[str] = []
    seen_numbers: set[str] = set()

    for row_idx, row in enumerate(reader, start=2):
        raw_number = row.get("company_number", "")
        company_number = _normalise_company_number(raw_number)

        if not company_number:
            errors.append(f"Row {row_idx}: empty or invalid company_number '{raw_number}'")
            continue

        if company_number in seen_numbers:
            errors.append(f"Row {row_idx}: duplicate company_number '{company_number}' (skipped)")
            continue
        seen_numbers.add(company_number)

        entity = PortfolioEntity(
            company_number=company_number,
            company_name=row.get("company_name", "").strip() or None,
            counterparty_type=_parse_counterparty_type(row.get("counterparty_type")),
            risk_tier=RiskTier.UNSCORED,
            latest_ebitda_gbp=_parse_float(row.get("ebitda")) or _parse_float(row.get("latest_ebitda_gbp")),
            primary_advisors=[a.strip() for a in row.get("advisor", "").split(",")] if row.get("advisor") else [],
        )
        entities.append(entity)

    if not entities:
        raise HTTPException(
            status_code=400,
            detail=f"No valid entities found in CSV. Errors: {errors}"
        )

    # ── Persist to Firestore (tenant-scoped) ──
    try:
        await persistence_service.create_portfolio(
            tenant_id=user.tenant_id,
            portfolio_id=portfolio_id,
            entities=[e.model_dump() for e in entities],
        )
    except Exception as e:
        logger.error("Failed to persist portfolio", error=str(e))
        # Return parsed data even if persistence fails
        pass

    logger.info(
        "Portfolio uploaded",
        tenant_id=user.tenant_id,
        portfolio_id=portfolio_id,
        entities_parsed=len(entities),
        entities_skipped=len(errors),
    )

    return PortfolioUploadResponse(
        portfolio_id=portfolio_id,
        tenant_id=user.tenant_id,
        entities_parsed=len(entities),
        entities_skipped=len(errors),
        entities=entities,
        errors=errors,
    )


@router.get("/entities")
async def list_entities(user: AuthenticatedUser = Depends(require_viewer)):
    """List all monitored entities for the user's tenant."""
    entities = await persistence_service.list_entities(tenant_id=user.tenant_id)
    return {"tenant_id": user.tenant_id, "entities": entities}


@router.post("/entities", response_model=AddEntityResponse, status_code=201)
async def add_entity(
    body: AddEntityRequest,
    user: AuthenticatedUser = Depends(require_analyst),
):
    """Add a single entity to monitoring. ANALYST or ADMIN only."""
    company_number = _normalise_company_number(body.company_number)
    if not company_number:
        raise HTTPException(status_code=400, detail="Invalid company number")

    entity_id = await persistence_service.add_entity(
        tenant_id=user.tenant_id,
        entity_data={
            "company_number": company_number,
            "company_name": body.company_name,
            "counterparty_type": body.counterparty_type.value,
        },
    )

    return AddEntityResponse(
        entity_id=entity_id,
        tenant_id=user.tenant_id,
    )


@router.delete("/entities/{entity_id}", status_code=204)
async def remove_entity(
    entity_id: str,
    user: AuthenticatedUser = Depends(require_admin),
):
    """Remove an entity from monitoring. ADMIN only."""
    await persistence_service.remove_entity(
        tenant_id=user.tenant_id,
        entity_id=entity_id,
    )
    return None
