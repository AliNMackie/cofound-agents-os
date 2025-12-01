"""
Abstract interfaces for the Communication Agent.

This module defines the abstract base classes that enable the Adapter Pattern
for supporting multiple email providers (Gmail, Outlook, etc.).
"""
from abc import ABC, abstractmethod
from typing import List

from src.shared.schema import EmailTask


class MailProvider(ABC):
    """
    Abstract base class for email provider implementations.
    
    This interface enables the Adapter Pattern, allowing the agent to work
    with different email providers (Gmail, Outlook, etc.) through a common API.
    """
    
    @abstractmethod
    def fetch_unread(self) -> List[EmailTask]:
        """
        Fetch unread emails from the provider.
        
        Returns:
            A list of EmailTask objects representing unread emails.
            
        Raises:
            Exception: If fetching emails fails.
        """
        pass
    
    @abstractmethod
    def create_draft(self, recipient: str, subject: str, body: str) -> str:
        """
        Create a draft email in the provider.
        
        Args:
            recipient: Email address of the recipient.
            subject: Subject line of the email.
            body: Body content of the email.
            
        Returns:
            The draft ID or identifier from the provider.
            
        Raises:
            Exception: If draft creation fails.
        """
        pass

    @abstractmethod
    def refresh_access_token(self, refresh_token: str) -> dict:
        """
        Refresh the access token using the refresh token.
        
        Args:
            refresh_token: The refresh token.
            
        Returns:
            Dictionary containing new token data.
        """
        pass

    @abstractmethod
    def needs_token_refresh(self) -> bool:
        """Check if token refresh is needed."""
        pass

    @abstractmethod
    def get_new_access_token(self) -> str:
        """Get the new access token after refresh."""
        pass
