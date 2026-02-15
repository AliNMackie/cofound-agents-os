
import sys
from unittest.mock import MagicMock

# MOCK WEASYPRINT BEFORE ANYTHING ELES
sys.modules["weasyprint"] = MagicMock()

import os
# Add src to path
sys.path.append(os.path.join(os.getcwd(), "services", "sentinel-growth"))

from fastapi.testclient import TestClient
from src.main import app
from src.core.auth import get_current_user

# Override auth dependency
mock_user = {"uid": "test_user", "email": "test@example.com"}

def verify_public_routes():
    client = TestClient(app)
    resp = client.get("/health")
    print(f"GET /health: {resp.status_code}")
    assert resp.status_code == 200

def verify_protected_route_block():
    client = TestClient(app)
    resp = client.get("/signals")
    print(f"GET /signals (No Token): {resp.status_code}")
    assert resp.status_code in [401, 403]

def verify_protected_route_success():
    # Override
    app.dependency_overrides[get_current_user] = lambda: mock_user
    client = TestClient(app)
    
    # Mock Firestore to prevent errors
    from unittest.mock import patch
    with patch("src.api.signals.firestore.Client"):
        # We also need to mock the collection/query chain
        with patch("src.api.signals.get_db") as mock_get_db:
            mock_get_db.return_value.collection.return_value.order_by.return_value.limit.return_value.stream.return_value = []
            
            resp = client.get("/signals")
            print(f"GET /signals (With Token): {resp.status_code}")
            assert resp.status_code == 200

if __name__ == "__main__":
    try:
        verify_public_routes()
        verify_protected_route_block()
        verify_protected_route_success()
        print("SUCCESS: Auth Middleware Verified")
    except AssertionError as e:
        print(f"FAILED: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"ERROR: {e}")
        sys.exit(1)
