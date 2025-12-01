from typing import Dict, Any, Tuple
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials

# Scopes required for the application
SCOPES = [
    'https://www.googleapis.com/auth/calendar.readonly',
]

def initiate_auth(client_secrets_file: str, redirect_uri: str) -> Tuple[str, str]:
    """
    Initiates the Google OAuth 2.0 flow.

    Args:
        client_secrets_file: Path to the client secrets JSON file.
        redirect_uri: The URI to redirect to after the user grants consent.

    Returns:
        A tuple containing the authorization URL and the state.
    """
    flow = Flow.from_client_secrets_file(
        client_secrets_file,
        scopes=SCOPES,
        redirect_uri=redirect_uri
    )

    # The following two settings are crucial for getting a refresh token
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        prompt='consent'
    )
    
    return authorization_url, state

def handle_callback(client_secrets_file: str, redirect_uri: str, state: str, code: str) -> Credentials:
    """
    Handles the callback from the Google OAuth 2.0 flow.

    Args:
        client_secrets_file: Path to the client secrets JSON file.
        redirect_uri: The URI that was used in the initial auth request.
        state: The state from the initial auth request.
        code: The authorization code from the callback.

    Returns:
        The user's credentials, including the refresh token.
    """
    flow = Flow.from_client_secrets_file(
        client_secrets_file,
        scopes=SCOPES,
        state=state,
        redirect_uri=redirect_uri
    )

    flow.fetch_token(code=code)
    
    return flow.credentials
