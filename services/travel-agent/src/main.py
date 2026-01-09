import os
import stripe
import uvicorn
from fastapi import FastAPI, Depends, Request, HTTPException
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from src.middleware.auth import initialize_firebase, get_current_user
from src.middleware.billing import require_subscription
from src.infrastructure import oauth
from google.cloud import firestore

# Initialize FastAPI app
app = FastAPI()

# Configure CORS
origins = [os.environ.get("CORS_ORIGIN", "http://localhost:3000")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Stripe
stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")

@app.post('/api/agent')
async def agent_endpoint(user_id: str = Depends(require_subscription)):
    """A placeholder endpoint for the main agent functionality."""
    return {
        'status': 'success',
        'message': f'Authenticated request received for user {user_id}.'
    }

@app.post('/api/create-checkout-session')
async def create_checkout_session(user_id: str = Depends(get_current_user)):
    """Creates a Stripe checkout session to initiate a subscription."""
    try:
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price': os.environ.get("STRIPE_PRICE_ID"),
                'quantity': 1,
            }],
            mode='subscription',
            success_url=os.environ.get("STRIPE_SUCCESS_URL"),
            cancel_url=os.environ.get("STRIPE_CANCEL_URL"),
            client_reference_id=user_id,
        )
        return {'sessionId': session.id, 'url': session.url}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post('/api/webhooks/stripe')
async def stripe_webhook(request: Request):
    """Handles webhooks from Stripe."""
    payload = await request.body()
    sig_header = request.headers.get('Stripe-Signature')
    webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
    except ValueError as e:
        raise HTTPException(status_code=400, detail='Invalid payload')
    except stripe.error.SignatureVerificationError as e:
        raise HTTPException(status_code=400, detail='Invalid signature')

    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        user_id = session.get('client_reference_id')
        if user_id:
            db = firestore.Client()
            user_ref = db.collection('users').document(user_id)
            user_ref.set({'subscription_status': 'active'}, merge=True)

    return {'status': 'success'}

@app.get('/auth/login')
async def auth_login():
    """Initiates the Google OAuth flow."""
    auth_url, _ = oauth.initiate_auth(
        "client_secrets.json", 
        os.environ.get("GOOGLE_OAUTH_CALLBACK_URL")
    )
    return RedirectResponse(auth_url)

@app.get('/auth/callback')
async def auth_callback(code: str, state: str, user_id: str = Depends(get_current_user)):
    """Handles the OAuth callback and stores credentials."""
    # NOTE: The original logic required auth for callback. 
    # Usually callback hits from Google directly or user redirect?
    # If user redirect, they should have their JWT on the frontend BUT
    # Google redirects the browser. The browser might NOT send the Authorization header 
    # if it's a direct redirect from Google unless stored in cookie.
    # PROCEEDING WITH ORIGINAL LOGIC assuming frontend handles auth attachment or param.
    
    if not code:
        raise HTTPException(status_code=400, detail='Authorization code not provided')
    
    try:
        # Exchange authorization code for credentials
        credentials = oauth.handle_callback(
            "client_secrets.json",
            os.environ.get("GOOGLE_OAUTH_CALLBACK_URL"),
            state,
            code
        )
        
        # Store credentials in Firestore for the user
        db = firestore.Client()
        user_ref = db.collection('users').document(user_id)
        user_ref.set({
            'google_credentials': {
                'token': credentials.token,
                'refresh_token': credentials.refresh_token,
                'token_uri': credentials.token_uri,
                'client_id': credentials.client_id,
                'client_secret': credentials.client_secret,
                'scopes': credentials.scopes
            }
        }, merge=True)
        
        # Redirect to frontend dashboard
        frontend_url = os.environ.get("CORS_ORIGIN", "http://localhost:3000")
        return RedirectResponse(f"{frontend_url}/dashboard?auth=success")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'OAuth callback failed: {str(e)}')

@app.get('/health')
async def health_check():
    """Health check endpoint for GCP monitoring and load balancer."""
    return {
        'status': 'healthy',
        'service': 'travel-agent',
        'version': '1.0.0'
    }

def validate_environment():
    """Validate that required environment variables are set and have valid values."""
    required_vars = [
        'STRIPE_SECRET_KEY',
        'GOOGLE_CLIENT_ID',
        'GOOGLE_CLIENT_SECRET',
        'GCP_PROJECT_ID',
        'GOOGLE_OAUTH_CALLBACK_URL'
    ]
    
    missing_vars = [var for var in required_vars if not os.environ.get(var)]
    
    if missing_vars:
        raise EnvironmentError(
            f"Missing required environment variables: {', '.join(missing_vars)}\n"
            f"Please check your .env file or environment configuration."
        )

if __name__ == '__main__':
    validate_environment()
    initialize_firebase()
    port = int(os.environ.get('PORT', 8080))
    uvicorn.run(app, host='0.0.0.0', port=port)
