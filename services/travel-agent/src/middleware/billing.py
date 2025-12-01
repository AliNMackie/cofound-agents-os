from functools import wraps
from flask import g, jsonify
from google.cloud import firestore

def require_subscription(f):
    """
    Decorator to ensure the user has an active subscription.
    
    This decorator must be used *after* @require_auth, as it relies on
    g.user_id being set.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not hasattr(g, 'user_id'):
            return jsonify({'error': 'Authentication required before subscription check'}), 500

        db = firestore.Client()
        doc_ref = db.collection('users').document(g.user_id)
        doc = doc_ref.get()

        if doc.exists:
            user_data = doc.to_dict()
            if user_data.get('subscription_status') == 'active':
                return f(*args, **kwargs)

        return jsonify({'error': 'An active subscription is required'}), 402
    
    return decorated_function
