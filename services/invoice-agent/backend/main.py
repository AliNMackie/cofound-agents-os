import os
import json
import datetime
from fastapi import FastAPI, HTTPException, Request, Header
from pydantic import BaseModel
from google.cloud import firestore
from google.cloud import tasks_v2
import stripe

app = FastAPI()

# Configuration
stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET")
PROJECT_ID = os.environ.get("GOOGLE_CLOUD_PROJECT", "default-project")
LOCATION = os.environ.get("QUEUE_LOCATION", "us-central1")
QUEUE_NAME = os.environ.get("QUEUE_NAME", "invoice-processing-queue")
SERVICE_URL = os.environ.get("SERVICE_URL", "http://localhost:8080")

# Initialize Clients
# Note: Clients are initialized lazily or globally depending on the framework pattern.
# Here we initialize globally assuming the container handles auth.
try:
    firestore_client = firestore.Client(project=PROJECT_ID)
    tasks_client = tasks_v2.CloudTasksClient()
except Exception as e:
    print(f"Warning: GCP clients failed to initialize (expected in local/test env without creds): {e}")
    firestore_client = None
    tasks_client = None


class InvoiceRequest(BaseModel):
    client_name: str
    amount: float
    email: str
    description: str


class TaskPayload(BaseModel):
    doc_id: str


@app.post("/process_worker")
async def process_invoice(payload: TaskPayload):
    if not firestore_client:
        raise HTTPException(status_code=500, detail="Firestore client not available")
        
    doc_id = payload.doc_id
    doc_ref = firestore_client.collection("invoices").document(doc_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        # Cloud Tasks will retry 500s, but 404 implies data issue. 
        # We return 200 to stop retry loop if data is missing, or raise error if we want retry?
        # Usually for missing data we stop retrying.
        print(f"Document {doc_id} not found.")
        return {"status": "skipped", "reason": "document_not_found"}
        
    data = doc.to_dict()
    
    # Idempotency check: if already processed, skip
    if data.get("status") == "SENT":
        return {"status": "already_processed"}

    try:
        # 2. Create Stripe Customer
        # In a real app we might search for existing customer by email
        customer = stripe.Customer.create(
            email=data["email"],
            name=data["client_name"]
        )
        
        # 3. Create Invoice Item
        # Stripe expects amount in cents
        amount_cents = int(round(data["amount"] * 100))
        stripe.InvoiceItem.create(
            customer=customer.id,
            amount=amount_cents,
            currency="usd",
            description=data["description"]
        )
        
        # 4. Create and Finalize Invoice
        invoice = stripe.Invoice.create(
            customer=customer.id,
            auto_advance=True # Auto-finalize
        )
        
        finalized_invoice = stripe.Invoice.finalize_invoice(invoice.id)
        
        # 5. Update Firestore
        doc_ref.update({
            "status": "SENT",
            "stripe_payment_link": finalized_invoice.hosted_invoice_url,
            "stripe_invoice_id": finalized_invoice.id,
            "processed_at": datetime.datetime.now(datetime.timezone.utc)
        })
        
        return {"status": "success", "invoice_url": finalized_invoice.hosted_invoice_url}

    except Exception as e:
        print(f"Error processing invoice: {e}")
        # Return 500 to trigger Cloud Tasks retry
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/enqueue")
async def enqueue_invoice(invoice: InvoiceRequest):
    if not firestore_client or not tasks_client:
        raise HTTPException(status_code=500, detail="GCP services not available")

    # 1. Write the request data to a new Firestore document
    doc_ref = firestore_client.collection("invoices").document()
    invoice_data = invoice.model_dump()
    invoice_data["status"] = "QUEUED"
    invoice_data["created_at"] = datetime.datetime.now(datetime.timezone.utc)
    
    doc_ref.set(invoice_data)
    doc_id = doc_ref.id

    # 2. Create a task in the 'invoice-processing-queue'
    parent = tasks_client.queue_path(PROJECT_ID, LOCATION, QUEUE_NAME)
    
    task_payload = {
        "doc_id": doc_id
    }
    
    # Construct the request body
    task = {
        "http_request": {
            "http_method": tasks_v2.HttpMethod.POST,
            "url": f"{SERVICE_URL}/process_worker",
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps(task_payload).encode(),
        }
    }

    try:
        response = tasks_client.create_task(request={"parent": parent, "task": task})
    except Exception as e:
        # If task creation fails, we might want to fail the request or update status.
        # For this exercise, we'll raise HTTP 500
        raise HTTPException(status_code=500, detail=f"Failed to create task: {str(e)}")

    # 4. Return the document ID immediately
    return {"doc_id": doc_id}


@app.post("/stripe_webhook")
async def stripe_webhook(request: Request, stripe_signature: str = Header(None)):
    if not firestore_client:
        raise HTTPException(status_code=500, detail="Firestore client not available")

    payload = await request.body()

    try:
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        raise HTTPException(status_code=400, detail="Invalid signature")

    event_id = event["id"]
    event_type = event["type"]

    # Check for idempotency
    event_ref = firestore_client.collection("processed_events").document(event_id)
    if event_ref.get().exists:
        return {"status": "skipped", "reason": "already_processed"}

    # Process the event
    if event_type == "invoice.payment_succeeded":
        invoice = event["data"]["object"]
        stripe_invoice_id = invoice["id"]
        
        # Find the invoice in Firestore
        invoices_ref = firestore_client.collection("invoices")
        query = invoices_ref.where(field_path="stripe_invoice_id", op_string="==", value=stripe_invoice_id)
        results = list(query.stream())
        
        if results:
            doc_ref = results[0].reference
            doc_ref.update({
                "status": "PAID",
                "paid_at": datetime.datetime.now(datetime.timezone.utc)
            })
            print(f"Invoice {stripe_invoice_id} marked as PAID.")
        else:
            print(f"No corresponding invoice found for {stripe_invoice_id}")

    # Save event ID to prevent replay
    try:
        event_ref.set({
            "received_at": datetime.datetime.now(datetime.timezone.utc),
            "type": event_type
        })
    except Exception as e:
        print(f"Failed to record event {event_id}: {e}")
        # Even if recording fails, we processed the logic. 
        # But for strict idempotency, we might want to fail? 
        # Usually it's better to return 200 to Stripe so it doesn't retry infinitely if just the write failed 
        # but the business logic succeeded.

    return {"status": "success"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))

