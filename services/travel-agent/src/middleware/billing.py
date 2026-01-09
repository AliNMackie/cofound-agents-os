from fastapi import Depends, HTTPException
from google.cloud import firestore
from src.middleware.auth import get_current_user

def require_subscription(user_id: str = Depends(get_current_user)) -> str:
    """
    Dependency to ensure the user has an active subscription.
    Returns the user_id if valid, otherwise raises 402 or 500.
    """
    try:
        db = firestore.Client()
        doc_ref = db.collection('users').document(user_id)
        doc = doc_ref.get()

        if doc.exists:
            user_data = doc.to_dict()
            if user_data.get('subscription_status') == 'active':
                return user_id
        
        # If we get here, no active subscription
        raise HTTPException(
            status_code=402, 
            detail="An active subscription is required"
        )
            
    except HTTPException:
        raise
    except Exception as e:
        # Log unexpected errors?
        raise HTTPException(status_code=500, detail=f"Subscription check failed: {str(e)}")
