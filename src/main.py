import os
import stripe
from flask import Flask, request, jsonify, g, redirect
from src.middleware.auth import initialize_firebase, configure_cors, require_auth
from src.middleware.billing import require_subscription
from src.infrastructure import oauth
from google.cloud import firestore

# Initialize Flask app
app = Flask(__name__)
configure_cors(app)

# Configure Stripe
stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")

@app.route('/api/agent', methods=['POST'])
@require_auth
@require_subscription
def agent_endpoint():
    """A placeholder endpoint for the main agent functionality."""
    user_id = g.user_id
    return jsonify({
        'status': 'success',
        'message': f'Authenticated request received for user {user_id}.'
    })

@app.route('/api/create-checkout-session', methods=['POST'])
@require_auth
def create_checkout_session():
    """Creates a Stripe checkout session to initiate a subscription."""
    user_id = g.user_id
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
        return jsonify({'sessionId': session.id, 'url': session.url})
    except Exception as e:
        return jsonify(error=str(e)), 400

@app.route('/api/webhooks/stripe', methods=['POST'])
def stripe_webhook():
    """Handles webhooks from Stripe."""
    payload = request.get_data(as_text=True)
    sig_header = request.headers.get('Stripe-Signature')
    webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
    except ValueError as e:
        return 'Invalid payload', 400
    except stripe.error.SignatureVerificationError as e:
        return 'Invalid signature', 400

    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        user_id = session.get('client_reference_id')
        if user_id:
            db = firestore.Client()
            user_ref = db.collection('users').document(user_id)
            user_ref.set({'subscription_status': 'active'}, merge=True)

    return jsonify({'status': 'success'})

@app.route('/auth/login')
def auth_login():
    """Initiates the Google OAuth flow."""
    auth_url, _ = oauth.initiate_auth(
        "client_secrets.json", 
        os.environ.get("GOOGLE_OAUTH_CALLBACK_URL")
    )
    return redirect(auth_url)

@app.route('/auth/callback')
@require_auth
def auth_callback():
    """Handles the OAuth callback and stores credentials."""
    user_id = g.user_id
    code = request.args.get('code')
    state = request.args.get('state')
    
    if not code:
        return jsonify({'error': 'Authorization code not provided'}), 400
    
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
        return redirect(f"{frontend_url}/dashboard?auth=success")
        
    except Exception as e:
        return jsonify({'error': 'OAuth callback failed', 'details': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for GCP monitoring and load balancer."""
    return jsonify({
        'status': 'healthy',
        'service': 'travel-agent',
        'version': '1.0.0'
    }), 200

def validate_environment():
    """Validate that required environment variables are set and have valid values."""
    required_vars = [
        'STRIPE_SECRET_KEY',
        'FIREBASE_CREDENTIALS_JSON',
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

    # Check for placeholder values
    placeholder_indicators = ["your-", "replace-me", "example"]
    invalid_vars = []
    
    for var in required_vars:
        value = os.environ.get(var, "")
        if any(indicator in value.lower() for indicator in placeholder_indicators):
            # Exception for project IDs which might legitimately contain "example"
            if var != 'GCP_PROJECT_ID' and var != 'GOOGLE_CLIENT_ID': 
                invalid_vars.append(f"{var} seems to contain a placeholder value: '{value}'")

    # Specific format checks
    stripe_key = os.environ.get('STRIPE_SECRET_KEY', '')
    if stripe_key and not stripe_key.startswith(('sk_test_', 'sk_live_')):
         invalid_vars.append(f"STRIPE_SECRET_KEY should start with 'sk_test_' or 'sk_live_'")

    if invalid_vars:
        raise EnvironmentError(
            "Environment validation failed:\n" + "\n".join(invalid_vars)
        )

if __name__ == '__main__':
    validate_environment()
    initialize_firebase()
    port = int(os.environ.get('PORT', 8080))
    app.run(port=port, host='0.0.0.0')
