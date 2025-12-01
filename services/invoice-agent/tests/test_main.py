import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
import os
import sys

# Ensure backend is in path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Set env vars before importing main
os.environ["GOOGLE_CLOUD_PROJECT"] = "test-project"
os.environ["QUEUE_LOCATION"] = "us-central1"
os.environ["QUEUE_NAME"] = "invoice-processing-queue"
os.environ["SERVICE_URL"] = "http://test-url"
os.environ["STRIPE_SECRET_KEY"] = "sk_test_123"
os.environ["STRIPE_WEBHOOK_SECRET"] = "whsec_test_123"

from backend.main import app

client = TestClient(app)

@pytest.fixture
def mock_firestore():
    with patch("backend.main.firestore_client") as mock:
        yield mock

@pytest.fixture
def mock_tasks():
    with patch("backend.main.tasks_client") as mock:
        yield mock

@pytest.fixture
def mock_stripe():
    with patch("backend.main.stripe") as mock:
        yield mock

def test_enqueue(mock_firestore, mock_tasks):
    # Setup Mocks
    mock_doc_ref = MagicMock()
    mock_doc_ref.id = "test-doc-id"
    mock_collection = MagicMock()
    mock_collection.document.return_value = mock_doc_ref
    mock_firestore.collection.return_value = mock_collection

    mock_tasks.queue_path.return_value = "projects/test-project/locations/us-central1/queues/invoice-processing-queue"

    payload = {
        "client_name": "Test Client",
        "amount": 150.00,
        "email": "test@example.com",
        "description": "Test Description"
    }

    response = client.post("/enqueue", json=payload)

    assert response.status_code == 200
    assert response.json() == {"doc_id": "test-doc-id"}

    # Verify Firestore write
    mock_firestore.collection.assert_called_with("invoices")
    mock_doc_ref.set.assert_called_once()
    saved_data = mock_doc_ref.set.call_args[0][0]
    assert saved_data["status"] == "QUEUED"
    assert saved_data["client_name"] == "Test Client"

    # Verify Task creation
    mock_tasks.create_task.assert_called_once()
    call_args = mock_tasks.create_task.call_args[1]
    assert call_args["request"]["parent"] == "projects/test-project/locations/us-central1/queues/invoice-processing-queue"
    assert call_args["request"]["task"]["http_request"]["url"] == "http://test-url/process_worker"

def test_stripe_webhook(mock_firestore, mock_stripe):
    # Mock Stripe Webhook
    mock_event = {
        "id": "evt_test",
        "type": "invoice.payment_succeeded",
        "data": {
            "object": {
                "id": "in_test_123"
            }
        }
    }
    mock_stripe.Webhook.construct_event.return_value = mock_event

    # Mock Firestore for idempotency check (event not processed yet)
    mock_event_ref = MagicMock()
    mock_event_ref.get.return_value.exists = False
    
    # Mock Firestore for invoice lookup
    mock_invoice_ref = MagicMock()
    mock_query_snapshot = MagicMock()
    mock_query_snapshot.reference = mock_invoice_ref
    mock_query = MagicMock()
    mock_query.stream.return_value = [mock_query_snapshot]

    # Setup side effects for collection calls
    mock_events_collection = MagicMock()
    mock_events_collection.document.return_value = mock_event_ref
    
    mock_invoices_collection = MagicMock()
    mock_invoices_collection.where.return_value = mock_query

    def collection_side_effect(name):
        if name == "processed_events":
            return mock_events_collection
        elif name == "invoices":
            return mock_invoices_collection
        return MagicMock()

    mock_firestore.collection.side_effect = collection_side_effect

    headers = {"Stripe-Signature": "test_sig"}
    response = client.post("/stripe_webhook", json={"data": "raw"}, headers=headers)

    assert response.status_code == 200
    assert response.json() == {"status": "success"}

    # Verify Logic
    mock_stripe.Webhook.construct_event.assert_called_once()
    mock_invoices_collection.where.assert_called_with(field_path="stripe_invoice_id", op_string="==", value="in_test_123")
    mock_invoice_ref.update.assert_called_once()
    assert mock_invoice_ref.update.call_args[0][0]["status"] == "PAID"
    
    # Verify event recording
    mock_event_ref.set.assert_called_once()
