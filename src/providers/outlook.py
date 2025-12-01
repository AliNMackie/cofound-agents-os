"""
Outlook/Microsoft 365 provider implementation using the MailProvider interface.

This module implements the Outlook-specific logic for fetching emails
and creating drafts using the Microsoft Graph API with MSAL authentication.
"""
from typing import List, Optional, Dict, Any
import requests
import msal

from src.shared.interfaces import MailProvider
from src.shared.schema import EmailTask


class OutlookProvider(MailProvider):
    """
    Outlook/Microsoft 365 implementation of the MailProvider interface.
    
    Uses the Microsoft Graph API to fetch unread emails and create draft responses.
    Authenticates using MSAL (Microsoft Authentication Library) with client credentials flow.
    """
    
    GRAPH_API_BASE = "https://graph.microsoft.com/v1.0"
    AUTHORITY_BASE = "https://login.microsoftonline.com"
    SCOPES = ["https://graph.microsoft.com/.default"]
    
    def __init__(
        self,
        client_id: str,
        client_secret: str,
        tenant_id: str,
        target_user_email: str
    ):
        """
        Initialize the Outlook provider with MSAL authentication.
        
        Args:
            client_id: Azure AD application (client) ID.
            client_secret: Azure AD application client secret.
            tenant_id: Azure AD tenant ID.
            target_user_email: Email address of the user whose mailbox to access.
        """
        self._client_id = client_id
        self._client_secret = client_secret
        self._tenant_id = tenant_id
        self._target_user_email = target_user_email
        
        # Initialize MSAL confidential client application
        authority = f"{self.AUTHORITY_BASE}/{tenant_id}"
        self._msal_app = msal.ConfidentialClientApplication(
            client_id=client_id,
            client_credential=client_secret,
            authority=authority
        )
        
        self._needs_refresh = False
        self._new_access_token = None
    
    def _get_headers(self) -> dict:
        """
        Acquire an access token and return headers for Graph API requests.
        
        Returns:
            Dictionary with Authorization header containing Bearer token.
            
        Raises:
            RuntimeError: If token acquisition fails.
        """
        # Acquire token using client credentials flow
        result = self._msal_app.acquire_token_for_client(scopes=self.SCOPES)
        
        if "access_token" in result:
            return {
                'Authorization': f'Bearer {result["access_token"]}',
                'Content-Type': 'application/json'
            }
        else:
            error_description = result.get("error_description", "Unknown error")
            error_code = result.get("error", "unknown_error")
            raise RuntimeError(
                f"Failed to acquire access token: {error_code} - {error_description}"
            )
    
    def fetch_unread(self) -> List[EmailTask]:
        """
        Fetch unread emails from Outlook using Microsoft Graph API.
        
        Returns:
            A list of EmailTask objects representing unread emails.
            
        Raises:
            RuntimeError: If authentication fails.
            requests.RequestException: If the API request fails (401 sets needs_refresh).
        """
        try:
            headers = self._get_headers()
            endpoint = f"{self.GRAPH_API_BASE}/users/{self._target_user_email}/messages"
            
            params = {
                '$filter': 'isRead eq false',
                '$top': 10,
                '$select': 'id,conversationId,subject,from,body'
            }
            
            response = requests.get(endpoint, headers=headers, params=params)
            response.raise_for_status()
            
            data = response.json()
            messages = data.get('value', [])
            
            return self._parse_messages(messages)
            
        except requests.HTTPError as e:
            if e.response.status_code == 401:
                self._needs_refresh = True
            raise
    
    def create_draft(self, recipient: str, subject: str, body: str) -> str:
        """
        Create a draft email in Outlook using Microsoft Graph API.
        
        Args:
            recipient: Email address of the recipient.
            subject: Subject line of the email.
            body: Body content of the email.
            
        Returns:
            The Outlook message ID.
            
        Raises:
            RuntimeError: If authentication fails.
            requests.RequestException: If the API request fails (401 sets needs_refresh).
        """
        try:
            headers = self._get_headers()
            endpoint = f"{self.GRAPH_API_BASE}/users/{self._target_user_email}/messages"
            
            draft_payload = {
                "subject": subject,
                "body": {
                    "contentType": "Text",
                    "content": body
                },
                "toRecipients": [
                    {
                        "emailAddress": {
                            "address": recipient
                        }
                    }
                ]
            }
            
            response = requests.post(endpoint, headers=headers, json=draft_payload)
            response.raise_for_status()
            
            data = response.json()
            return data['id']
            
        except requests.HTTPError as e:
            if e.response.status_code == 401:
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
        token_url = f"https://login.microsoftonline.com/{self._tenant_id}/oauth2/v2.0/token"
        
        data = {
            'client_id': self._client_id,
            'client_secret': self._client_secret,
            'refresh_token': refresh_token,
            'grant_type': 'refresh_token',
            'scope': ' '.join(self.SCOPES)
        }
        
        response = requests.post(token_url, data=data)
        response.raise_for_status()
        
        token_data = response.json()
        
        # Store new access token for worker to persist
        self._new_access_token = token_data['access_token']
        self._needs_refresh = False
        
        # Rebuild MSAL app with new credentials
        authority = f"{self.AUTHORITY_BASE}/{self._tenant_id}"
        self._msal_app = msal.ConfidentialClientApplication(
            client_id=self._client_id,
            client_credential=self._client_secret,
            authority=authority
        )
        
        return token_data
    
    def needs_token_refresh(self) -> bool:
        """Check if token refresh is needed."""
        return self._needs_refresh
    
    def get_new_access_token(self) -> Optional[str]:
        """Get the new access token after refresh."""
        return self._new_access_token
    
    def _parse_messages(self, messages: List[dict]) -> List[EmailTask]:
        """
        Parse Microsoft Graph API message objects into EmailTask objects.
        
        Args:
            messages: List of message objects from Graph API.
            
        Returns:
            List of EmailTask objects.
        """
        email_tasks = []
        
        for msg in messages:
            # Extract sender email address
            sender = 'unknown'
            if 'from' in msg and msg['from']:
                email_address = msg['from'].get('emailAddress', {})
                sender = email_address.get('address', 'unknown')
            
            # Extract body content
            body_content = ''
            if 'body' in msg and msg['body']:
                body_content = msg['body'].get('content', '')
            
            # Create EmailTask
            email_task = EmailTask(
                email_id=msg.get('id', ''),
                thread_id=msg.get('conversationId', ''),
                body=body_content,
                sender=sender
            )
            email_tasks.append(email_task)
        
        return email_tasks
