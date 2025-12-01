"""
FastAPI application for user onboarding with OAuth.

Provides endpoints for Google and Outlook OAuth flows to onboard users
into the multi-tenant Communication Agent SaaS.
"""
import os
import secrets
from datetime import datetime, timedelta

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.responses import RedirectResponse, HTMLResponse
from google.cloud import firestore
from google_auth_oauthlib.flow import Flow
from msal import ConfidentialClientApplication
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired

from src.shared.schema import TokenEncryption

app = FastAPI(
    title="Communication Agent - User Onboarding",
    description="OAuth-based user onboarding for multi-tenant email automation",
    version="1.0.0"
)

# Configuration
PROJECT_ID = os.environ.get('PROJECT_ID')
ENCRYPTION_KEY = os.environ.get('ENCRYPTION_KEY')
BASE_URL = os.environ.get('BASE_URL', 'http://localhost:8000')
SECRET_KEY = os.environ.get('SECRET_KEY', secrets.token_urlsafe(32))

# Google OAuth
GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET')
GOOGLE_REDIRECT_URI = f"{BASE_URL}/auth/google/callback"
GOOGLE_SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.compose'
]

# Outlook OAuth
OUTLOOK_CLIENT_ID = os.environ.get('OUTLOOK_CLIENT_ID')
OUTLOOK_CLIENT_SECRET = os.environ.get('OUTLOOK_CLIENT_SECRET')
OUTLOOK_TENANT_ID = os.environ.get('OUTLOOK_TENANT_ID', 'common')
OUTLOOK_REDIRECT_URI = f"{BASE_URL}/auth/outlook/callback"
OUTLOOK_SCOPES = ['Mail.ReadWrite', 'offline_access']

# Initialize
firestore_client = firestore.Client(project=PROJECT_ID)
encryption = TokenEncryption(ENCRYPTION_KEY)
signer = URLSafeTimedSerializer(SECRET_KEY)

# Cookie configuration
COOKIE_NAME = "oauth_state"
COOKIE_MAX_AGE = 600  # 10 minutes


@app.get("/", response_class=HTMLResponse)
async def root():
    """Landing page with OAuth connection buttons."""
    html_content = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AI Inbox Agent</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            .container {
                background: white;
                border-radius: 20px;
                padding: 60px 40px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                max-width: 500px;
                width: 100%;
                text-align: center;
            }
            h1 {
                color: #2d3748;
                font-size: 36px;
                margin-bottom: 12px;
                font-weight: 700;
            }
            p {
                color: #718096;
                font-size: 18px;
                margin-bottom: 40px;
                line-height: 1.6;
            }
            .btn {
                display: block;
                padding: 18px 32px;
                border-radius: 12px;
                text-decoration: none;
                font-weight: 600;
                font-size: 16px;
                transition: all 0.3s ease;
                margin-bottom: 16px;
            }
            .btn-gmail {
                background: #EA4335;
                color: white;
            }
            .btn-gmail:hover {
                background: #d33426;
                transform: translateY(-2px);
                box-shadow: 0 10px 20px rgba(234, 67, 53, 0.3);
            }
            .btn-outlook {
                background: #0078D4;
                color: white;
            }
            .btn-outlook:hover {
                background: #006abc;
                transform: translateY(-2px);
                box-shadow: 0 10px 20px rgba(0, 120, 212, 0.3);
            }
            .footer {
                margin-top: 40px;
                color: #a0aec0;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>AI Inbox Agent</h1>
            <p>Secure, Private, Autonomous.</p>
            <a href="/auth/google/login" class="btn btn-gmail">📧 Connect Gmail</a>
            <a href="/auth/outlook/login" class="btn btn-outlook">📨 Connect Outlook</a>
            <div class="footer">Secure OAuth 2.0 authentication</div>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)


@app.get("/auth/google/login")
async def google_login(response: Response):
    """Initiate Google OAuth flow."""
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [GOOGLE_REDIRECT_URI]
            }
        },
        scopes=GOOGLE_SCOPES,
        redirect_uri=GOOGLE_REDIRECT_URI
    )
    
    state = secrets.token_urlsafe(32)
    signed_state = signer.dumps(state)
    response.set_cookie(
        key=COOKIE_NAME,
        value=signed_state,
        max_age=COOKIE_MAX_AGE,
        httponly=True,
        secure=BASE_URL.startswith('https'),
        samesite='lax'
    )
    
    authorization_url, _ = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        state=state,
        prompt='consent'
    )
    
    return RedirectResponse(url=authorization_url)


@app.get("/auth/google/callback")
async def google_callback(code: str, state: str, request: Request, response: Response):
    """Handle Google OAuth callback."""
    signed_state = request.cookies.get(COOKIE_NAME)
    if not signed_state:
        raise HTTPException(status_code=400, detail="Missing state cookie")
    
    try:
        cookie_state = signer.loads(signed_state, max_age=COOKIE_MAX_AGE)
    except (SignatureExpired, BadSignature):
        raise HTTPException(status_code=400, detail="Invalid state cookie")
    
    if cookie_state != state:
        raise HTTPException(status_code=400, detail="State mismatch")
    
    response.delete_cookie(key=COOKIE_NAME)
    
    try:
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [GOOGLE_REDIRECT_URI]
                }
            },
            scopes=GOOGLE_SCOPES,
            redirect_uri=GOOGLE_REDIRECT_URI,
            state=state
        )
        
        flow.fetch_token(code=code)
        credentials = flow.credentials
        
        from googleapiclient.discovery import build
        gmail_service = build('gmail', 'v1', credentials=credentials)
        profile = gmail_service.users().getProfile(userId='me').execute()
        user_email = profile['emailAddress']
        
        access_token_encrypted = encryption.encrypt(credentials.token)
        refresh_token_encrypted = encryption.encrypt(credentials.refresh_token) if credentials.refresh_token else None
        
        user_data = {
            'email': user_email,
            'provider': 'GMAIL',
            'access_token_encrypted': access_token_encrypted,
            'refresh_token_encrypted': refresh_token_encrypted,
            'expires_at': credentials.expiry,
            'next_check_time': datetime.utcnow(),
            'check_interval_minutes': 15,
            'is_active': True,
            'created_at': firestore.SERVER_TIMESTAMP,
            'updated_at': firestore.SERVER_TIMESTAMP
        }
        
        users_ref = firestore_client.collection('users')
        existing = users_ref.where('email', '==', user_email).where('provider', '==', 'GMAIL').limit(1).get()
        
        if existing:
            doc_id = existing[0].id
            users_ref.document(doc_id).update(user_data)
        else:
            doc_ref = users_ref.add(user_data)
            doc_id = doc_ref[1].id
        
        return {
            "status": "success",
            "message": "Gmail account connected successfully",
            "user_id": doc_id,
            "email": user_email
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OAuth error: {str(e)}")


@app.get("/auth/outlook/login")
async def outlook_login(response: Response):
    """Initiate Outlook OAuth flow."""
    msal_app = ConfidentialClientApplication(
        client_id=OUTLOOK_CLIENT_ID,
        client_credential=OUTLOOK_CLIENT_SECRET,
        authority=f"https://login.microsoftonline.com/{OUTLOOK_TENANT_ID}"
    )
    
    state = secrets.token_urlsafe(32)
    signed_state = signer.dumps(state)
    response.set_cookie(
        key=COOKIE_NAME,
        value=signed_state,
        max_age=COOKIE_MAX_AGE,
        httponly=True,
        secure=BASE_URL.startswith('https'),
        samesite='lax'
    )
    
    authorization_url = msal_app.get_authorization_request_url(
        scopes=OUTLOOK_SCOPES,
        redirect_uri=OUTLOOK_REDIRECT_URI,
        state=state
    )
    
    return RedirectResponse(url=authorization_url)


@app.get("/auth/outlook/callback")
async def outlook_callback(code: str, state: str, request: Request, response: Response):
    """Handle Outlook OAuth callback."""
    signed_state = request.cookies.get(COOKIE_NAME)
    if not signed_state:
        raise HTTPException(status_code=400, detail="Missing state cookie")
    
    try:
        cookie_state = signer.loads(signed_state, max_age=COOKIE_MAX_AGE)
    except (SignatureExpired, BadSignature):
        raise HTTPException(status_code=400, detail="Invalid state cookie")
    
    if cookie_state != state:
        raise HTTPException(status_code=400, detail="State mismatch")
    
    response.delete_cookie(key=COOKIE_NAME)
    
    try:
        msal_app = ConfidentialClientApplication(
            client_id=OUTLOOK_CLIENT_ID,
            client_credential=OUTLOOK_CLIENT_SECRET,
            authority=f"https://login.microsoftonline.com/{OUTLOOK_TENANT_ID}"
        )
        
        result = msal_app.acquire_token_by_authorization_code(
            code=code,
            scopes=OUTLOOK_SCOPES,
            redirect_uri=OUTLOOK_REDIRECT_URI
        )
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result.get("error_description"))
        
        import jwt
        id_token = result.get('id_token')
        decoded = jwt.decode(id_token, options={"verify_signature": False})
        user_email = decoded.get('preferred_username') or decoded.get('email')
        
        access_token_encrypted = encryption.encrypt(result['access_token'])
        refresh_token_encrypted = encryption.encrypt(result['refresh_token']) if 'refresh_token' in result else None
        
        expires_at = datetime.utcnow() + timedelta(seconds=result.get('expires_in', 3600))
        
        user_data = {
            'email': user_email,
            'provider': 'OUTLOOK',
            'access_token_encrypted': access_token_encrypted,
            'refresh_token_encrypted': refresh_token_encrypted,
            'expires_at': expires_at,
            'next_check_time': datetime.utcnow(),
            'check_interval_minutes': 15,
            'is_active': True,
            'target_email': user_email,
            'client_id': OUTLOOK_CLIENT_ID,
            'tenant_id': OUTLOOK_TENANT_ID,
            'created_at': firestore.SERVER_TIMESTAMP,
            'updated_at': firestore.SERVER_TIMESTAMP
        }
        
        users_ref = firestore_client.collection('users')
        existing = users_ref.where('email', '==', user_email).where('provider', '==', 'OUTLOOK').limit(1).get()
        
        if existing:
            doc_id = existing[0].id
            users_ref.document(doc_id).update(user_data)
        else:
            doc_ref = users_ref.add(user_data)
            doc_id = doc_ref[1].id
        
        return {
            "status": "success",
            "message": "Outlook account connected successfully",
            "user_id": doc_id,
            "email": user_email
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OAuth error: {str(e)}")


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}
