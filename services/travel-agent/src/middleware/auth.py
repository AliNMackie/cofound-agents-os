import os
import base64
import json
import logging
from typing import Optional

from fastapi import HTTPException, Security, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import firebase_admin
from firebase_admin import credentials, auth

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

security = HTTPBearer()

def initialize_firebase():
    """Initializes the Firebase Admin SDK if not already initialized."""
    if not firebase_admin._apps:
        # Get base64-encoded credentials from environment
        cred_json_b64 = os.environ.get("FIREBASE_CREDENTIALS_JSON")
        
        if not cred_json_b64:
            logger.info("FIREBASE_CREDENTIALS_JSON not set. Using Application Default Credentials.")
            firebase_admin.initialize_app()
        else:
            try:
                # Decode base64 and parse JSON
                cred_json_str = base64.b64decode(cred_json_b64).decode('utf-8')
                cred_dict = json.loads(cred_json_str)
                cred = credentials.Certificate(cred_dict)
                firebase_admin.initialize_app(cred)
            except Exception as e:
                raise ValueError(
                    f"Failed to decode FIREBASE_CREDENTIALS_JSON: {str(e)}\n"
                    f"Ensure the value is a valid base64-encoded JSON string."
                )

def get_current_user(token: HTTPAuthorizationCredentials = Security(security)) -> str:
    """
    Verifies the Firebase JWT and returns the user ID.
    Exceptions raised here return 401/403 automatically.
    """
    if not token or not token.credentials:
        # Should be caught by HTTPBearer but safe check
        raise HTTPException(status_code=401, detail="Authorization header is missing")

    try:
        decoded_token = auth.verify_id_token(token.credentials)
        return decoded_token['uid']
    except (IndexError, auth.InvalidIdTokenError) as e:
        logger.warning(f"Invalid auth token: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Invalid or expired token: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected auth error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=401, detail="An unexpected error occurred during auth")
