import pytest
from unittest.mock import patch, MagicMock
from flask import Flask, g, jsonify
from src.middleware.billing import require_subscription

@pytest.fixture
def app():
    """Create a Flask app for testing."""
    app = Flask(__name__)
    app.config['TESTING'] = True

    @app.route('/test')
    @require_subscription
    def test_route():
        return jsonify({'status': 'ok'})

    return app

@patch('google.cloud.firestore.Client')
def test_require_subscription_active(mock_firestore_client, app):
    """Tests that the decorator grants access with an active subscription."""
    mock_db = MagicMock()
    mock_doc = MagicMock()
    mock_doc.exists = True
    mock_doc.to_dict.return_value = {'subscription_status': 'active'}
    mock_db.collection.return_value.document.return_value.get.return_value = mock_doc
    mock_firestore_client.return_value = mock_db
    
    with app.test_request_context():
        g.user_id = 'test_user'
        client = app.test_client()
        response = client.get('/test')
    
    assert response.status_code == 200

@patch('google.cloud.firestore.Client')
def test_require_subscription_inactive(mock_firestore_client, app):
    """Tests that the decorator denies access with an inactive subscription."""
    mock_db = MagicMock()
    mock_doc = MagicMock()
    mock_doc.exists = True
    mock_doc.to_dict.return_value = {'subscription_status': 'inactive'}
    mock_db.collection.return_value.document.return_value.get.return_value = mock_doc
    mock_firestore_client.return_value = mock_db
    
    with app.test_request_context():
        g.user_id = 'test_user'
        client = app.test_client()
        response = client.get('/test')
    
    assert response.status_code == 402
