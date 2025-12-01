import pytest
from unittest.mock import patch, MagicMock
from flask import Flask, g, jsonify
from src.middleware.auth import require_auth
from firebase_admin import auth

@pytest.fixture
def app():
    """Create a Flask app for testing."""
    app = Flask(__name__)
    app.config['TESTING'] = True

    @app.route('/test')
    @require_auth
    def test_route():
        return jsonify({'user_id': g.user_id})

    return app

@patch('firebase_admin.auth.verify_id_token')
def test_require_auth_success(mock_verify_token, app):
    """Tests that the decorator grants access with a valid token."""
    mock_verify_token.return_value = {'uid': 'test_user'}
    client = app.test_client()
    
    response = client.get('/test', headers={'Authorization': 'Bearer valid_token'})
    
    assert response.status_code == 200
    assert response.get_json() == {'user_id': 'test_user'}

def test_require_auth_no_header(app):
    """Tests that the decorator denies access without an Authorization header."""
    client = app.test_client()
    response = client.get('/test')
    assert response.status_code == 401

@patch('firebase_admin.auth.verify_id_token')
def test_require_auth_invalid_token(mock_verify_token, app):
    """Tests that the decorator denies access with an invalid token."""
    mock_verify_token.side_effect = auth.InvalidIdTokenError('Invalid token')
    client = app.test_client()
    
    response = client.get('/test', headers={'Authorization': 'Bearer invalid_token'})
    
    assert response.status_code == 401
