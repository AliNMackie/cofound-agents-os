import os
import base64
import json
from functools import wraps
from unittest.mock import MagicMock
from flask import request, g, jsonify
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, auth

def initialize_firebase():
    """Initializes the Firebase Admin SDK if not already initialized."""
    if not firebase_admin._apps:
        # Get base64-encoded credentials from environment
        cred_json_b64 = os.environ.get("FIREBASE_CREDENTIALS_JSON")
        
        if not cred_json_b64:
            print("FIREBASE_CREDENTIALS_JSON not set. Using Application Default Credentials.")
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

def configure_cors(app):
    """Configures CORS for the Flask app."""
    CORS(app, resources={r"/api/*": {"origins": os.environ.get("CORS_ORIGIN", "http://localhost:3000")}})

import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def require_auth(f):
    """Decorator to verify Firebase JWT and set user ID in Flask's global context."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Handle CORS pre-flight requests
        if request.method == 'OPTIONS':
            return jsonify({'status': 'ok'}), 200

        auth_header = request.headers.get('Authorization')
        if not auth_header:
            logger.warning("Authorization header missing")
            return jsonify({'error': 'Authorization header is missing'}), 401

        try:
            id_token = auth_header.split('Bearer ')[1]
            decoded_token = auth.verify_id_token(id_token)
            g.user_id = decoded_token['uid']
        except (IndexError, auth.InvalidIdTokenError) as e:
            logger.warning(f"Invalid auth token: {str(e)}")
            return jsonify({'error': 'Invalid or expired token', 'details': str(e)}), 401
        except Exception as e:
            # Catching a broad exception is not ideal, but we want to avoid 500s
            logger.error(f"Unexpected auth error: {str(e)}", exc_info=True)
            return jsonify({'error': 'An unexpected error occurred during auth', 'details': str(e)}), 401

        return f(*args, **kwargs)
    return decorated_function
