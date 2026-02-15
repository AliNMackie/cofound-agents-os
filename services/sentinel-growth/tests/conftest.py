import sys
from unittest.mock import MagicMock, patch

# Global mock for weasyprint to prevent GTK errors on Windows
sys.modules["weasyprint"] = MagicMock()

import pytest
import os

# Ensure src is in python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

@pytest.fixture
def mock_firestore():
    with patch('google.cloud.firestore.Client') as mock:
        yield mock

@pytest.fixture
def mock_feedparser():
    with patch('feedparser.parse') as mock:
        yield mock

@pytest.fixture
def mock_settings():
    with patch('src.core.config.settings') as mock:
        mock.FIRESTORE_DB_NAME = "test-db"
        yield mock

@pytest.fixture
def mock_current_user():
    return {"uid": "test_user_123", "email": "test@example.com"}
