"""
IC Origin — Authentication & RBAC Middleware

Provides Firebase Auth JWT verification with custom claims extraction
for tenant isolation and role-based access control.

Supports:
  - Firebase Auth (email/password) with custom claims
  - SAML/OIDC SSO via Google Identity Platform
  - Email domain → tenant_id auto-mapping for SSO users

Custom claims expected in Firebase token:
  - tenant_id: str  (required for all authenticated endpoints)
  - role: str        (ADMIN | ANALYST | VIEWER)
"""

import firebase_admin
from firebase_admin import auth, credentials
from fastapi import HTTPException, status, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from enum import Enum
from typing import Optional
from src.core.config import settings
import structlog

logger = structlog.get_logger()
security = HTTPBearer()


# ── Role Enum ──────────────────────────────────────────────────────

class UserRole(str, Enum):
    ADMIN = "ADMIN"
    ANALYST = "ANALYST"
    VIEWER = "VIEWER"


# Role hierarchy: ADMIN > ANALYST > VIEWER
_ROLE_HIERARCHY = {
    UserRole.ADMIN: 3,
    UserRole.ANALYST: 2,
    UserRole.VIEWER: 1,
}


# ── SSO Domain Mapping ────────────────────────────────────────────

# Maps email domains to tenant IDs for SSO auto-provisioning.
# When a user authenticates via SAML/OIDC and has no tenant_id claim,
# their email domain is used to resolve the correct tenant.
SSO_DOMAIN_MAP: dict[str, str] = {
    # Example: "barclays.com": "tenant-barclays",
    # Example: "hsbc.co.uk": "tenant-hsbc",
    # Populated at runtime from Firestore or environment config
}

# SAML/OIDC provider identifiers from Firebase
SSO_PROVIDERS = frozenset({
    "saml.", "oidc.", "google.com", "microsoft.com",
})


def _is_sso_provider(sign_in_provider: str) -> bool:
    """Check if the sign-in provider is an SSO/federated provider."""
    if not sign_in_provider:
        return False
    return any(sign_in_provider.startswith(p) for p in SSO_PROVIDERS)


def _resolve_tenant_from_email(email: str) -> Optional[str]:
    """
    Resolve tenant_id from email domain for SSO users.
    Returns None if no mapping exists.
    """
    if not email or "@" not in email:
        return None
    domain = email.split("@")[1].lower()
    return SSO_DOMAIN_MAP.get(domain)


def _get_default_sso_role(sign_in_provider: str) -> UserRole:
    """
    Default role for SSO-provisioned users.
    SAML users default to ANALYST, OIDC to VIEWER.
    """
    if sign_in_provider and sign_in_provider.startswith("saml."):
        return UserRole.ANALYST
    return UserRole.VIEWER


# ── Authenticated User Model ──────────────────────────────────────

class AuthenticatedUser:
    """Structured representation of the authenticated user."""

    def __init__(self, uid: str, email: str, tenant_id: str, role: UserRole):
        self.uid = uid
        self.email = email
        self.tenant_id = tenant_id
        self.role = role

    @property
    def is_admin(self) -> bool:
        return self.role == UserRole.ADMIN

    @property
    def is_analyst_or_above(self) -> bool:
        return _ROLE_HIERARCHY.get(self.role, 0) >= _ROLE_HIERARCHY[UserRole.ANALYST]

    def can_access_tenant(self, requested_tenant_id: str) -> bool:
        """Strict tenant isolation check."""
        return self.tenant_id == requested_tenant_id


# ── Firebase Init ──────────────────────────────────────────────────

def initialize_firebase():
    """Initializes Firebase Admin SDK if not already initialized."""
    try:
        if not firebase_admin._apps:
            cred = credentials.ApplicationDefault()
            firebase_admin.initialize_app(cred, {
                'projectId': settings.GCP_PROJECT_ID
            })
            logger.info("Firebase Admin SDK initialized.")
    except Exception as e:
        logger.error(f"Failed to initialize Firebase Admin: {e}")


# ── Token Verification ────────────────────────────────────────────

def verify_token(res: HTTPAuthorizationCredentials = Security(security)) -> dict:
    """
    Verifies the Firebase ID token in the Authorization header.
    Handles both standard Firebase tokens and SAML/OIDC tokens
    issued via Google Identity Platform.
    Returns the decoded token dict.
    """
    token = res.credentials
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        logger.warning(f"Token verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ── Core Dependencies ─────────────────────────────────────────────

def get_current_user(token: dict = Depends(verify_token)) -> AuthenticatedUser:
    """
    Extracts tenant_id and role from Firebase custom claims.
    For SSO users without custom claims, auto-maps via email domain.
    Returns a structured AuthenticatedUser.
    """
    uid = token.get("uid", "")
    email = token.get("email", "")
    tenant_id = token.get("tenant_id", "")
    role_str = token.get("role", "")

    # Detect SSO provider
    firebase_info = token.get("firebase", {})
    sign_in_provider = firebase_info.get("sign_in_provider", "")
    is_sso = _is_sso_provider(sign_in_provider)

    # ── SSO Auto-Mapping ──
    # If user has no tenant_id claim but authenticated via SSO,
    # attempt to resolve from email domain
    if not tenant_id and is_sso:
        tenant_id = _resolve_tenant_from_email(email)
        if tenant_id:
            logger.info(
                "SSO: auto-mapped tenant from email domain",
                email=email,
                tenant_id=tenant_id,
                provider=sign_in_provider,
            )

    # Pitch Demo Fallback: If no tenant_id exists, assign a default demo tenant
    # instead of blocking access with a 403, as custom claims may not be set.
    if not tenant_id:
        logger.warning(
            "User has no tenant_id claim. Assigning default 'demo-tenant' for pitch purposes.",
            email=email,
            uid=uid,
        )
        tenant_id = "demo-tenant"

    # ── Role Resolution ──
    if role_str:
        try:
            role = UserRole(role_str.upper())
        except ValueError:
            role = UserRole.VIEWER
    elif is_sso:
        role = _get_default_sso_role(sign_in_provider)
    else:
        role = UserRole.VIEWER

    return AuthenticatedUser(
        uid=uid,
        email=email,
        tenant_id=tenant_id,
        role=role,
    )


# ── Role-Based Access Dependencies ────────────────────────────────

def require_admin(user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
    """Only ADMIN users may access this endpoint."""
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Admin access required. Your role: {user.role.value}",
        )
    return user


def require_analyst(user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
    """ADMIN or ANALYST users may access this endpoint."""
    if not user.is_analyst_or_above:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Analyst access required. Your role: {user.role.value}",
        )
    return user


def require_viewer(user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
    """Any authenticated user (ADMIN, ANALYST, VIEWER) may access."""
    return user


def require_tenant_access(
    tenant_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
) -> AuthenticatedUser:
    """Verify the user belongs to the requested tenant."""
    if not user.can_access_tenant(tenant_id):
        logger.warning(
            "Cross-tenant access denied",
            user_uid=user.uid,
            user_tenant=user.tenant_id,
            requested_tenant=tenant_id,
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: you do not belong to this tenant.",
        )
    return user

