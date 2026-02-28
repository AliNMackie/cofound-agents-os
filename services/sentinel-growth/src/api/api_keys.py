"""
IC Origin — Enterprise API Key Management

Secure API key lifecycle: generate, list, revoke.
Keys are SHA-256 hashed before storage — the raw key is returned
to the user exactly once on creation.

Tenant-scoped: keys are stored under tenants/{tenant_id}/api_keys/.
ADMIN-only for create/revoke. Any authenticated user can list their own.
"""

import uuid
import hashlib
import datetime
import secrets
import structlog
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import Optional
from google.cloud import firestore

from src.core.auth import (
    AuthenticatedUser,
    get_current_user,
    require_admin,
    UserRole,
)
from src.core.config import settings

router = APIRouter(prefix="/api/v1/keys", tags=["API Keys"])
logger = structlog.get_logger()


# ── Models ──────────────────────────────────────────────────────

class ApiKeyCreateRequest(BaseModel):
    label: str
    scopes: list[str] = ["read"]


class ApiKeyResponse(BaseModel):
    id: str
    label: str
    prefix: str
    scopes: list[str]
    created_at: str
    status: str


# ── Helpers ─────────────────────────────────────────────────────

def _get_db():
    return firestore.Client(database=settings.FIRESTORE_DB_NAME)


def _hash_key(raw_key: str) -> str:
    """SHA-256 hash of the raw API key. One-way, irreversible."""
    return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()


def _generate_raw_key() -> str:
    """Generate a cryptographically secure API key."""
    return f"sk_live_{secrets.token_hex(24)}"


# ── Key Verification Dependency ─────────────────────────────────

async def verify_api_key(
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    authorization: Optional[str] = Header(None),
) -> AuthenticatedUser:
    """
    FastAPI dependency for headless/programmatic API access.

    Accepts the API key via:
      - X-API-Key header
      - Authorization: Bearer <key> header

    Hashes the provided key and looks it up in Firestore.
    Returns an AuthenticatedUser with the key's tenant context.
    """
    raw_key = None

    # Try X-API-Key header first
    if x_api_key:
        raw_key = x_api_key
    # Fall back to Bearer token (if it looks like an API key)
    elif authorization and authorization.startswith("Bearer sk_live_"):
        raw_key = authorization[7:]  # Strip "Bearer "

    if not raw_key:
        raise HTTPException(
            status_code=401,
            detail="API key required. Provide via X-API-Key header or Bearer token.",
        )

    # Hash the provided key and look up
    key_hash = _hash_key(raw_key)

    try:
        db = _get_db()
        # Search across all tenant api_keys collections
        query = (
            db.collection_group("api_keys")
            .where("key_hash", "==", key_hash)
            .where("status", "==", "active")
            .limit(1)
        )

        docs = list(query.stream())

        if not docs:
            raise HTTPException(
                status_code=401,
                detail="Invalid or revoked API key.",
            )

        doc = docs[0]
        data = doc.to_dict()

        # Extract tenant_id from document path
        path_parts = doc.reference.path.split("/")
        tenant_id = path_parts[1] if len(path_parts) >= 2 else data.get("tenant_id", "")

        return AuthenticatedUser(
            uid=f"apikey-{doc.id}",
            email=data.get("created_by_email", "api@system"),
            tenant_id=tenant_id,
            role=UserRole(data.get("role", "ANALYST")),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("API key verification failed", error=str(e))
        raise HTTPException(status_code=500, detail="Key verification error.")


# ── Endpoints ───────────────────────────────────────────────────

@router.post("/generate", response_model=dict)
async def generate_api_key(
    request: ApiKeyCreateRequest,
    user: AuthenticatedUser = Depends(require_admin),
):
    """
    Generate a new API key for the tenant. ADMIN only.
    The raw key is returned exactly once — store it securely.
    """
    raw_key = _generate_raw_key()
    key_hash = _hash_key(raw_key)
    prefix = raw_key[:12] + "..."

    key_data = {
        "key_hash": key_hash,
        "prefix": prefix,
        "label": request.label,
        "scopes": request.scopes,
        "role": "ANALYST",  # API keys default to ANALYST role
        "created_by": user.uid,
        "created_by_email": user.email,
        "tenant_id": user.tenant_id,
        "created_at": datetime.datetime.now(datetime.timezone.utc),
        "status": "active",
    }

    try:
        db = _get_db()
        doc_ref = (
            db.collection("tenants")
            .document(user.tenant_id)
            .collection("api_keys")
            .document()
        )
        doc_ref.set(key_data)

        logger.info(
            "API key generated",
            key_id=doc_ref.id,
            tenant=user.tenant_id,
            label=request.label,
        )

        return {
            "id": doc_ref.id,
            "key": raw_key,  # Returned ONCE only
            "prefix": prefix,
            "label": request.label,
            "scopes": request.scopes,
            "created_at": key_data["created_at"].isoformat(),
            "status": "active",
            "warning": "This key will not be shown again. Store it securely.",
        }

    except Exception as e:
        logger.error("Failed to generate API key", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to generate key.")


@router.get("/", response_model=list[dict])
async def list_api_keys(user: AuthenticatedUser = Depends(get_current_user)):
    """List all API keys for the user's tenant. Shows prefix only, never the key."""
    try:
        db = _get_db()
        keys_ref = (
            db.collection("tenants")
            .document(user.tenant_id)
            .collection("api_keys")
            .stream()
        )

        results = []
        for doc in keys_ref:
            data = doc.to_dict()
            results.append({
                "id": doc.id,
                "label": data.get("label", ""),
                "prefix": data.get("prefix", "****"),
                "scopes": data.get("scopes", []),
                "created_at": data.get("created_at").isoformat() if data.get("created_at") else None,
                "created_by": data.get("created_by_email", ""),
                "status": data.get("status", "unknown"),
            })

        results.sort(key=lambda x: x["created_at"] or "", reverse=True)
        return results

    except Exception as e:
        logger.error("Failed to list API keys", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to list keys.")


@router.delete("/{key_id}")
async def revoke_api_key(
    key_id: str,
    user: AuthenticatedUser = Depends(require_admin),
):
    """Revoke an API key. ADMIN only. Soft-delete (sets status to 'revoked')."""
    try:
        db = _get_db()
        doc_ref = (
            db.collection("tenants")
            .document(user.tenant_id)
            .collection("api_keys")
            .document(key_id)
        )
        doc = doc_ref.get()

        if not doc.exists:
            raise HTTPException(status_code=404, detail="Key not found.")

        doc_ref.update({
            "status": "revoked",
            "revoked_at": datetime.datetime.now(datetime.timezone.utc),
            "revoked_by": user.uid,
        })

        logger.info("API key revoked", key_id=key_id, tenant=user.tenant_id)
        return {"status": "success", "message": "Key revoked."}

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to revoke API key", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to revoke key.")
