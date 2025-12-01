"""
Gmail provider implementation using the MailProvider interface.

This module implements the Gmail-specific logic for fetching emails
and creating drafts using the Gmail API.
"""
import base64
import requests
from typing import Any, List, Optional, Dict
from googleapiclient.errors import HttpError

from googleapiclient.discovery import build, Resource

from src.shared.interfaces import MailProvider
from src.shared.schema import EmailTask


class GmailProvider(MailProvider):
    """
    Gmail implementation of the MailProvider interface.
    
    Uses the Gmail API to fetch unread emails and create draft responses.
    """
    
    def __init__(self, gmail_service: Resource = None, client_id: str = None, client_secret: str = None):
        """
        Initialize the Gmail provider.
        
        Args:
            gmail_service: An authenticated Gmail API service resource.
            client_id: Google OAuth client ID (for token refresh).
            client_secret: Google OAuth client secret (for token refresh).
        """
        if gmail_service is None:
            self._gmail_service = build('gmail', 'v1')
        else:
            self._gmail_service = gmail_service
        
        self._client_id = client_id
        self._client_secret = client_secret
        self._needs_refresh = False
        self._new_access_token = None
    
    def fetch_unread(self) -> List[EmailTask]:
        """
        Fetch unread emails from Gmail.
        
        Returns:
            A list of EmailTask objects representing unread emails.
            
        Raises:
            HttpError: If API call fails with 401, sets needs_refresh flag.
        """
        try:
            results = self._gmail_service.users().messages().list(
                userId='me',
                q='is:unread',
                maxResults=10
            ).execute()
            
            messages = results.get('messages', [])
            email_tasks = []
            
            for message in messages:
                msg_id = message['id']
                
                msg = self._gmail_service.users().messages().get(
                    userId='me',
                    id=msg_id,
                    format='full'
                ).execute()
                
                headers = msg['payload']['headers']
                sender = next((h['value'] for h in headers if h['name'] == 'From'), 'unknown')
                thread_id = msg['threadId']
                body = self._extract_body(msg['payload'])
                
                email_task = EmailTask(
                    email_id=msg_id,
                    thread_id=thread_id,
                    body=body,
                    sender=sender
                )
                email_tasks.append(email_task)
            
            return email_tasks
            
        except HttpError as e:
            if e.resp.status == 401:
                self._needs_refresh = True
            raise
    
    def create_draft(self, recipient: str, subject: str, body: str) -> str:
        """
        Create a draft email in Gmail.
        
        Args:
            recipient: Email address of the recipient.
            subject: Subject line of the email.
            body: Body content of the email.
            
        Returns:
            The Gmail draft ID.
            
        Raises:
            HttpError: If API call fails with 401, sets needs_refresh flag.
        """
        from email.mime.text import MIMEText
        
        try:
            message = MIMEText(body)
            message['to'] = recipient
            message['subject'] = subject
            
            create_message = {
                'message': {
                    'raw': base64.urlsafe_b64encode(message.as_bytes()).decode(),
                }
            }
            
            draft = self._gmail_service.users().drafts().create(
                userId='me',
                body=create_message
            ).execute()
            
            return draft['id']
            
        except HttpError as e:
            if e.resp.status == 401:
                self._needs_refresh = True
            raise
    
    def refresh_access_token(self, refresh_token: str) -> Dict[str, Any]:
        """
        Refresh the access token using the refresh token.
        
        Args:
            refresh_token: The refresh token from initial OAuth flow.
            
        Returns:
            Dictionary containing new access_token, expires_in, etc.
            
        Raises:
            requests.HTTPError: If token refresh fails.
        """
        token_url = "https://oauth2.googleapis.com/token"
        
        data = {
            'client_id': self._client_id,
            'client_secret': self._client_secret,
            'refresh_token': refresh_token,
            'grant_type': 'refresh_token'
        }
        
        response = requests.post(token_url, data=data)
        response.raise_for_status()
        
        token_data = response.json()
        
        # Store new access token for worker to persist
        self._new_access_token = token_data['access_token']
        self._needs_refresh = False
        
        # Rebuild Gmail service with new token
        from google.oauth2.credentials import Credentials
        creds = Credentials(token=token_data['access_token'])
        self._gmail_service = build('gmail', 'v1', credentials=creds)
        
        return token_data
    
    def needs_token_refresh(self) -> bool:
        """Check if token refresh is needed."""
        return self._needs_refresh
    
    def get_new_access_token(self) -> Optional[str]:
        """Get the new access token after refresh."""
        return self._new_access_token
    
    def _extract_body(self, payload: dict) -> str:
        """
        Extract plain text body from Gmail message payload.
        
        Args:
            payload: The Gmail message payload.
            
        Returns:
            The extracted body text.
        """
        body = ''
        
        if 'parts' in payload:
            for part in payload['parts']:
                if part['mimeType'] == 'text/plain':
                    body = base64.urlsafe_b64decode(part['body']['data']).decode('utf-8')
                    break
        elif 'body' in payload and 'data' in payload['body']:
            body = base64.urlsafe_b64decode(payload['body']['data']).decode('utf-8')
        
        return body
