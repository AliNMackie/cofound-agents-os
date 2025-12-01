import pytest
from unittest.mock import patch, MagicMock
from src.main import app
import os

@pytest.fixture
def client():
    """Create a Flask test client."""
    app.config['TESTING'] = True
    os.environ['CORS_ORIGIN'] = 'http://localhost:3000'
    with app.test_client() as client:
        yield client

@patch('firebase_admin.auth.verify_id_token')
@patch('google.cloud.firestore.Client')
def test_saas_flow_no_subscription(mock_firestore_client, mock_verify_token, client):
    """
    Tests that a user without an active subscription is blocked with a 402 error.
    """
    # Arrange: Mock a valid user token but no subscription
    mock_verify_token.return_value = {'uid': 'test_user'}
    mock_db = MagicMock()
    mock_doc = MagicMock()
    mock_doc.exists = False  # No user document means no subscription
    mock_db.collection.return_value.document.return_value.get.return_value = mock_doc
    mock_firestore_client.return_value = mock_db

    # Act
    response = client.post('/api/agent', headers={'Authorization': 'Bearer valid_token'})
    
    # Assert
    assert response.status_code == 402
    assert 'active subscription is required' in response.get_json()['error']

@patch('firebase_admin.auth.verify_id_token')
@patch('google.cloud.firestore.Client')
def test_saas_flow_with_subscription(mock_firestore_client, mock_verify_token, client):
    """
    Tests that a user with an active subscription can access the agent endpoint.
    """
    # Arrange: Mock a valid user token and an active subscription
    mock_verify_token.return_value = {'uid': 'test_user'}
    mock_db = MagicMock()
    mock_doc = MagicMock()
    mock_doc.exists = True
    mock_doc.to_dict.return_value = {'subscription_status': 'active'}
    mock_db.collection.return_value.document.return_value.get.return_value = mock_doc
    mock_firestore_client.return_value = mock_db
    
    # Act
    response = client.post('/api/agent', headers={'Authorization': 'Bearer valid_token'})
    
    # Assert
    assert response.status_code == 200
    assert response.get_json()['status'] == 'success'
