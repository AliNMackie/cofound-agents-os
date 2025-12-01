import os
import logging
import base64
import json
from google.cloud import firestore
import functions_framework

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Firestore
db = None

def get_db():
    global db
    if db is None:
        db = firestore.Client()
    return db

@functions_framework.cloud_event
def delivery_agent(cloud_event):
    """
    Cloud Function triggered by Eventarc (e.g., via Pub/Sub or direct Storage trigger)
    when a contract is processed.
    
    The event payload is expected to contain the userId and status of processing.
    """
    data = cloud_event.data
    
    # If using Pub/Sub, data is base64 encoded JSON in 'message.data'
    if 'message' in data and 'data' in data['message']:
        pubsub_message = base64.b64decode(data['message']['data']).decode('utf-8')
        payload = json.loads(pubsub_message)
    else:
        # Assume direct JSON payload
        payload = data

    user_id = payload.get('userId')
    report_status = payload.get('status') # e.g., 'completed'
    contract_id = payload.get('contractId')

    if not user_id:
        logger.error("No userId in payload")
        return

    if report_status == 'completed':
        handle_report_ready(user_id, contract_id)

def handle_report_ready(user_id, contract_id):
    """
    Updates user status to 'report_ready' and notifies the user.
    """
    logger.info(f"Report ready for user {user_id}, contract {contract_id}")
    
    database = get_db()
    user_ref = database.collection('users').document(user_id)
    
    # Update status
    # We might also want to set 'reportReadyAt' timestamp for Trigger C timing
    user_ref.set({
        'activationStatus': 'report_ready',
        'reportReadyAt': firestore.SERVER_TIMESTAMP
    }, merge=True)
    
    # Notify User
    notify_user(user_id, "Your Verified Report is ready.")

def notify_user(user_id, message):
    """
    Mocks sending an immediate notification (SMS/Email).
    """
    # Fetch user email/phone from Firestore if needed
    database = get_db()
    user_doc = database.collection('users').document(user_id).get()
    user_data = user_doc.to_dict()
    email = user_data.get('email')
    
    logger.info(f"Notifying user {user_id} ({email}): {message}")
    
    # Log to activity_log
    log_ref = database.collection('users').document(user_id).collection('activity_log').document()
    log_ref.set({
        'type': 'notification',
        'sentAt': firestore.SERVER_TIMESTAMP,
        'channel': 'sms', # Defaulting to SMS as per prompt "Delivery Agent notifies user via SMS/Email"
        'context': message
    })
