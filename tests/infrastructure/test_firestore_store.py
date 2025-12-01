import pytest
from unittest.mock import patch, MagicMock
from cryptography.fernet import Fernet
from src.infrastructure.firestore_store import FirestoreTokenStore

# Generate a key for testing
TEST_KEY = Fernet.generate_key()

@patch('google.cloud.firestore.Client')
def test_save_tokens(mock_firestore_client):
    """Tests that tokens are saved to the correct user- and provider-specific path."""
    # Arrange
    mock_db = MagicMock()
    mock_firestore_client.return_value = mock_db
    store = FirestoreTokenStore(project_id="test-project", encryption_key=TEST_KEY)
    user_id = "test_user"
    provider = "google"
    tokens = {"refresh_token": "my-secret-token", "access_token": "123"}
    
    # Act
    store.save_tokens(user_id, provider, tokens)
    
    # Assert
    users_collection = mock_db.collection.return_value
    user_doc = users_collection.document.return_value
    tokens_collection = user_doc.collection.return_value
    provider_doc = tokens_collection.document.return_value
    
    mock_db.collection.assert_called_with("users")
    users_collection.document.assert_called_with(user_id)
    user_doc.collection.assert_called_with("tokens")
    tokens_collection.document.assert_called_with(provider)
    provider_doc.set.assert_called_once()

@patch('google.cloud.firestore.Client')
def test_get_tokens_found(mock_firestore_client):
    """Tests that tokens are retrieved from the correct user- and provider-specific path."""
    # Arrange
    mock_db = MagicMock()
    mock_doc = MagicMock()
    mock_doc.exists = True
    
    refresh_token = "my-secret-token"
    cipher_suite = Fernet(TEST_KEY)
    encrypted_token = cipher_suite.encrypt(refresh_token.encode('utf-8'))
    
    mock_doc.to_dict.return_value = {
        "refresh_token": encrypted_token,
        "access_token": "123"
    }
    mock_db.collection.return_value.document.return_value.collection.return_value.document.return_value.get.return_value = mock_doc
    mock_firestore_client.return_value = mock_db
    
    store = FirestoreTokenStore(project_id="test-project", encryption_key=TEST_KEY)
    
    # Act
    tokens = store.get_tokens("test_user", "google")
    
    # Assert
    assert tokens is not None
    assert tokens['access_token'] == "123"
    assert tokens['refresh_token'] == refresh_token
