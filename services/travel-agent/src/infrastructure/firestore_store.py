from typing import Dict, Any, Optional
from google.cloud import firestore
from cryptography.fernet import Fernet
from src.domain.interfaces import TokenStoreInterface

class FirestoreTokenStore(TokenStoreInterface):
    """
    A token store that uses Google Firestore for persistence with encryption,
    ensuring data is segmented by user.
    """

    def __init__(self, project_id: str, encryption_key: bytes):
        """
        Initializes the FirestoreTokenStore.
        """
        self.db = firestore.Client(project=project_id)
        self.cipher_suite = Fernet(encryption_key)

    def save_tokens(self, user_id: str, provider: str, tokens: Dict[str, Any]):
        """
        Saves a user's tokens for a specific provider to Firestore,
        encrypting the refresh token.
        """
        doc_ref = self.db.collection('users').document(user_id).collection('tokens').document(provider)
        
        if 'refresh_token' in tokens and tokens['refresh_token']:
            encrypted_refresh_token = self.cipher_suite.encrypt(tokens['refresh_token'].encode('utf-8'))
            tokens_to_store = tokens.copy()
            tokens_to_store['refresh_token'] = encrypted_refresh_token
        else:
            tokens_to_store = tokens

        doc_ref.set(tokens_to_store)

    def get_tokens(self, user_id: str, provider: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves and decrypts a user's tokens for a specific provider from Firestore.
        """
        doc_ref = self.db.collection('users').document(user_id).collection('tokens').document(provider)
        doc = doc_ref.get()

        if doc.exists:
            tokens = doc.to_dict()
            if 'refresh_token' in tokens and tokens['refresh_token']:
                decrypted_refresh_token = self.cipher_suite.decrypt(tokens['refresh_token']).decode('utf-8')
                tokens['refresh_token'] = decrypted_refresh_token
            return tokens
        else:
            return None
