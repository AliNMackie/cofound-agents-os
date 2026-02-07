import firebase_admin
from firebase_admin import auth
import structlog

logger = structlog.get_logger()

# Singleton initialization
_initialized = False

def initialize_firebase():
    global _initialized
    if not _initialized:
        try:
            # On Cloud Run, default credentials are automatically populated.
            # If running locally, you might need GOOGLE_APPLICATION_CREDENTIALS env var.
            if not firebase_admin._apps:
                firebase_admin.initialize_app()
            _initialized = True
            logger.info("Firebase Admin initialized")
        except Exception as e:
            logger.error("Failed to initialize Firebase Admin", error=str(e))
            # Don't crash if it's just "already initialized" race condition
            if "The default Firebase app already exists" in str(e):
                _initialized = True
            else:
                raise e

def verify_token(token: str) -> dict:
    """
    Verifies a Firebase ID token and returns the decoded token payload.
    Raises an exception if verification fails.
    """
    initialize_firebase()
    try:
        # verify_id_token(token, check_revoked=True/False)
        # check_revoked=True requires an extra network call, generally safer but slower.
        # For now, default is False which is fine for stateless JWT validation.
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        logger.warning("Token verification failed", error=str(e))
        raise e
