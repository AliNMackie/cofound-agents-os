import msal
from typing import Tuple, Optional

# Scopes required for the Microsoft Graph API
SCOPES = ["https://graph.microsoft.com/.default"]

def initiate_auth(client_id: str, authority: str, redirect_uri: str) -> Tuple[str, str]:
    """
    Initiates the Azure AD OAuth 2.0 flow for a confidential client.

    Args:
        client_id: The Application (client) ID.
        authority: The authority URL for the Azure AD tenant.
        redirect_uri: The URI to redirect to after the user grants consent.

    Returns:
        A tuple containing the authorization URL and the state.
    """
    app = msal.ConfidentialClientApplication(
        client_id=client_id, 
        authority=authority
    )
    
    flow = app.initiate_auth_code_flow(
        scopes=SCOPES,
        redirect_uri=redirect_uri
    )
    
    return flow["auth_uri"], flow["state"]

def handle_callback(
    client_id: str,
    client_secret: str,
    authority: str, 
    redirect_uri: str, 
    auth_response: dict
) -> Optional[dict]:
    """
    Handles the callback from the Azure AD OAuth 2.0 flow.

    Args:
        client_id: The Application (client) ID.
        client_secret: The client secret.
        authority: The authority URL for the Azure AD tenant.
        redirect_uri: The URI that was used in the initial auth request.
        auth_response: The full response from the authorization server.

    Returns:
        A dictionary containing the token response if successful, otherwise None.
    """
    app = msal.ConfidentialClientApplication(
        client_id=client_id,
        client_credential=client_secret,
        authority=authority
    )
    
    try:
        result = app.acquire_token_by_auth_code_flow(
            auth_code_flow=auth_response, 
            auth_response=auth_response,
            scopes=SCOPES
        )

        if "access_token" in result:
            return result
        else:
            print(f"Authentication failed: {result.get('error_description')}")
            return None
    except ValueError as e:
        print(f"Error handling callback: {e}")
        return None
