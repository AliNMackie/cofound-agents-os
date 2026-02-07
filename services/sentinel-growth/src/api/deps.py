from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from src.core.auth import verify_token
import structlog

logger = structlog.get_logger()
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    FastAPI dependency to validate the Bearer token.
    Returns the decoded token payload (dict) containing user info (uid, email, etc).
    """
    token = credentials.credentials
    try:
        payload = verify_token(token)
        return payload
    except Exception as e:
        # We log the specific error for debugging but return a generic 401 to the user
        logger.error("Authentication failed inside dependency", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

# Optional: Dependency to require specific roles/claims if needed later
# def require_role(role: str): ... 
