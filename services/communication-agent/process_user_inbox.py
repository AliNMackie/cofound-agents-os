"""
Worker Cloud Function - Process inbox for a specific user with self-healing token refresh.
"""
import os
import json
import traceback
import functions_framework
from google.cloud import firestore
from googleapiclient.errors import HttpError
from vertexai.generative_models import GenerativeModel
from datetime import datetime, timedelta

from src.agents.inbox_reader.logic import InboxAgent
from src.shared.schema import UserModel, TokenEncryption, Status
from src.providers.gmail import GmailProvider
from src.providers.outlook import OutlookProvider


def _get_mail_provider_for_user(user: UserModel, encryption: TokenEncryption):
    """
    Create mail provider for specific user.
    
    Args:
        user: UserModel with encrypted credentials
        encryption: TokenEncryption instance
        
    Returns:
        MailProvider instance configured for the user
    """
    if user.provider == "GMAIL":
        from google.oauth2.credentials import Credentials
        from googleapiclient.discovery import build
        
        access_token = encryption.decrypt(user.access_token_encrypted)
        creds = Credentials(token=access_token)
        gmail_service = build('gmail', 'v1', credentials=creds)
        
        # Pass client credentials for token refresh
        client_id = os.environ.get('GOOGLE_CLIENT_ID')
        client_secret = os.environ.get('GOOGLE_CLIENT_SECRET')
        
        return GmailProvider(
            gmail_service=gmail_service,
            client_id=client_id,
            client_secret=client_secret
        )
        
    elif user.provider == "OUTLOOK":
        # Decrypt client secret for Outlook
        client_secret = encryption.decrypt(user.access_token_encrypted)
        
        return OutlookProvider(
            client_id=user.client_id,
            client_secret=client_secret,
            tenant_id=user.tenant_id,
            target_user_email=user.target_email
        )
    
    raise ValueError(f"Unknown provider: {user.provider}")


def _handle_token_refresh(
    provider,
    user: UserModel,
    user_id: str,
    encryption: TokenEncryption,
    firestore_client: firestore.Client
):
    """
    Handle token refresh and persist new tokens to Firestore.
    
    Args:
        provider: Mail provider instance
        user: UserModel with current credentials
        user_id: Firestore document ID
        encryption: TokenEncryption instance
        firestore_client: Firestore client
    """
    if not user.refresh_token_encrypted:
        raise RuntimeError(f"No refresh token available for user {user_id}")
    
    # Decrypt refresh token
    refresh_token = encryption.decrypt(user.refresh_token_encrypted)
    
    # Refresh the access token
    token_data = provider.refresh_access_token(refresh_token)
    
    # Encrypt new access token
    new_access_token_encrypted = encryption.encrypt(token_data['access_token'])
    
    # Update Firestore with new credentials
    update_data = {
        'access_token_encrypted': new_access_token_encrypted,
        'updated_at': firestore.SERVER_TIMESTAMP
    }
    
    # Update expiry if provided
    if 'expires_in' in token_data:
        expires_at = datetime.utcnow() + timedelta(seconds=token_data['expires_in'])
        update_data['expires_at'] = expires_at
    
    # Persist to Firestore
    firestore_client.collection('users').document(user_id).update(update_data)
    
    print(f"✅ Token refreshed and persisted for user {user_id}")


@functions_framework.http
def handler(request):
    """
    Worker: Process inbox for a specific user with self-healing token refresh.
    
    Expects JSON body: {"user_id": "..."}
    """
    # Parse input
    request_json = request.get_json(silent=True)
    if not request_json or 'user_id' not in request_json:
        return {'error': 'user_id required'}, 400, {'Content-Type': 'application/json'}
    
    user_id = request_json['user_id']
    
    # Initialize
    project_id = os.environ.get('PROJECT_ID')
    encryption_key = os.environ.get('ENCRYPTION_KEY')
    
    firestore_client = firestore.Client(project=project_id)
    encryption = TokenEncryption(encryption_key)
    vertex_model = GenerativeModel('gemini-1.5-flash')
    
    try:
        # Fetch user
        user_doc = firestore_client.collection('users').document(user_id).get()
        if not user_doc.exists:
            return {'error': 'User not found'}, 404, {'Content-Type': 'application/json'}
        
        user_data = user_doc.to_dict()
        user_data['id'] = user_id
        user = UserModel(**user_data)
        
        # Create provider
        mail_provider = _get_mail_provider_for_user(user, encryption)
        
        # Create agent (simplified - no job_manager for now)
        # agent = InboxAgent(
        #     mail_provider=mail_provider,
        #     vertex_model=vertex_model
        # )
        
        results = {
            'user_id': user_id,
            'processed': 0,
            'skipped': 0,
            'failed': 0,
            'total': 0,
            'token_refreshed': False
        }
        
        # Fetch emails with automatic retry on 401
        max_retries = 1
        for attempt in range(max_retries + 1):
            try:
                email_tasks = mail_provider.fetch_unread()
                results['total'] = len(email_tasks)
                
                # Process each email
                for email_task in email_tasks:
                    try:
                        # Simplified processing (no actual agent logic for now)
                        # result = agent.process_email(email_task)
                        # For now, just count as processed
                        results['processed'] += 1
                        
                    except Exception as e:
                        print(f"❌ Error processing email {email_task.email_id}: {e}")
                        results['failed'] += 1
                
                # Success - break retry loop
                break
                
            except (HttpError, Exception) as e:
                # Check if provider needs token refresh
                if mail_provider.needs_token_refresh() and attempt < max_retries:
                    print(f"🔄 Token expired for user {user_id}, refreshing...")
                    _handle_token_refresh(mail_provider, user, user_id, encryption, firestore_client)
                    results['token_refreshed'] = True
                    # Retry with refreshed token
                    continue
                else:
                    # No refresh needed or max retries exceeded
                    raise
        
        return results, 200, {'Content-Type': 'application/json'}
        
    except Exception as e:
        error_response = {
            'error': str(e),
            'traceback': traceback.format_exc(),
            'user_id': user_id
        }
        print(f"❌ Worker error for user {user_id}: {e}")
        return error_response, 500, {'Content-Type': 'application/json'}
