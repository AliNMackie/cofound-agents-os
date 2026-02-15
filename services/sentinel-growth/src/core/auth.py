
import firebase_admin
from firebase_admin import auth, credentials
from fastapi import HTTPException, status, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from src.core.config import settings
import structlog

logger = structlog.get_logger()
security = HTTPBearer()

def initialize_firebase():
    """Initializes Firebase Admin SDK if not already initialized."""
    try:
        if not firebase_admin._apps:
            # automatic credentials search (GOOGLE_APPLICATION_CREDENTIALS)
            cred = credentials.ApplicationDefault()
            firebase_admin.initialize_app(cred, {
                'projectId': settings.FIRESTORE_DB_NAME
            })
            logger.info("Firebase Admin SDK initialized.")
    except Exception as e:
        logger.error(f"Failed to initialize Firebase Admin: {e}")
        # Dont raise here, allow app to start but auth will fail

def verify_token(res: HTTPAuthorizationCredentials = Security(security)):
    """
    Verifies the Firebase ID token in the Authorization header.
    Returns the decoded token (user info).
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

def get_current_user(token: dict = Depends(verify_token)):
    """
    Returns the current user dict from the token.
    Contains 'uid', 'email', etc.
    """
    return token
