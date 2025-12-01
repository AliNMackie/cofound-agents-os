# FastAPI User Onboarding API

## Overview

FastAPI application for onboarding users into the Communication Agent multi-tenant SaaS platform via OAuth.

## Features

- **Google OAuth**: Connect Gmail accounts
- **Outlook OAuth**: Connect Microsoft 365/Outlook accounts
- **Token Encryption**: Secure storage of user credentials
- **Firestore Integration**: Automatic user creation/update

## Endpoints

### Google OAuth

**Login:**
```
GET /auth/google/login
```
Redirects to Google consent screen.

**Callback:**
```
GET /auth/google/callback?code=...&state=...
```
Handles OAuth callback, creates user in Firestore.

### Outlook OAuth

**Login:**
```
GET /auth/outlook/login
```
Redirects to Microsoft consent screen.

**Callback:**
```
GET /auth/outlook/callback?code=...&state=...
```
Handles OAuth callback, creates user in Firestore.

### Utility

**Health Check:**
```
GET /health
```

**Root:**
```
GET /
```

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in values:

```bash
cp .env.example .env
```

**Required Variables:**
- `PROJECT_ID`: GCP project ID
- `ENCRYPTION_KEY`: Base64-encoded Fernet key
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `OUTLOOK_CLIENT_ID`: Azure AD app client ID
- `OUTLOOK_CLIENT_SECRET`: Azure AD app client secret

### 3. Generate Encryption Key

```python
from cryptography.fernet import Fernet
key = Fernet.generate_key()
print(key.decode())  # Use this as ENCRYPTION_KEY
```

### 4. Configure OAuth Apps

**Google:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add redirect URI: `http://localhost:8000/auth/google/callback`
4. Enable Gmail API
5. Scopes: `gmail.readonly`, `gmail.compose`

**Outlook:**
1. Go to [Azure Portal](https://portal.azure.com)
2. Register application
3. Add redirect URI: `http://localhost:8000/auth/outlook/callback`
4. API permissions: `Mail.ReadWrite`, `offline_access`
5. Grant admin consent

## Running Locally

```bash
python -m src.api.run
```

Or with uvicorn directly:

```bash
uvicorn src.api.main:app --reload --port 8000
```

Visit: http://localhost:8000

## Testing OAuth Flows

### Test Google OAuth

1. Visit: http://localhost:8000/auth/google/login
2. Sign in with Google account
3. Grant permissions
4. Verify user created in Firestore

### Test Outlook OAuth

1. Visit: http://localhost:8000/auth/outlook/login
2. Sign in with Microsoft account
3. Grant permissions
4. Verify user created in Firestore

## Deployment

### Cloud Run

```bash
# Build container
gcloud builds submit --tag gcr.io/PROJECT_ID/onboarding-api

# Deploy
gcloud run deploy onboarding-api \
  --image gcr.io/PROJECT_ID/onboarding-api \
  --platform managed \
  --region europe-west2 \
  --allow-unauthenticated \
  --set-env-vars PROJECT_ID=your-project \
  --set-secrets ENCRYPTION_KEY=encryption-key:latest
```

### Update Redirect URIs

After deployment, update OAuth redirect URIs:
- Google: `https://your-app.run.app/auth/google/callback`
- Outlook: `https://your-app.run.app/auth/outlook/callback`

## Security Considerations

- **HTTPS Required**: Always use HTTPS in production
- **State Validation**: CSRF protection via state parameter
- **Token Encryption**: All tokens encrypted at rest
- **Secure Storage**: Use Secret Manager for sensitive config
- **Session Management**: Consider Redis for production state storage

## API Documentation

Visit `/docs` for interactive Swagger UI documentation.

## Troubleshooting

### OAuth Error: redirect_uri_mismatch

Update redirect URIs in Google/Azure console to match your deployment URL.

### Token Encryption Error

Verify `ENCRYPTION_KEY` is a valid Fernet key:
```python
from cryptography.fernet import Fernet
Fernet(your_key.encode())  # Should not raise error
```

### Firestore Permission Denied

Ensure service account has `datastore.user` role.
