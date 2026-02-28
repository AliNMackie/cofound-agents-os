"""
IC Origin — GRC Webhook Egress API

Provides endpoints for customers to register webhook subscriptions
and an outbound dispatcher that signs payloads with HMAC-SHA256.
"""

import datetime
import hashlib
import hmac
import json
import uuid

import httpx
import structlog
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List

from src.schemas.webhooks import (
    WebhookSubscription,
    WebhookSubscriptionCreate,
    WebhookPayload,
    WebhookDeliveryResult,
    WebhookEventType,
)

logger = structlog.get_logger()
router = APIRouter(prefix="/api/v1/webhooks", tags=["Webhooks"])

# ── In-memory subscription store (replaced by Firestore in production) ─
_subscriptions: Dict[str, WebhookSubscription] = {}


# ── HMAC Signature Generation ──────────────────────────────────────

def generate_hmac_signature(payload_bytes: bytes, secret_key: str) -> str:
    """
    Generate an HMAC-SHA256 hex digest of the JSON payload.
    This is attached as the X-IC-Signature header on outbound requests.
    """
    return hmac.new(
        key=secret_key.encode("utf-8"),
        msg=payload_bytes,
        digestmod=hashlib.sha256,
    ).hexdigest()


def verify_hmac_signature(payload_bytes: bytes, secret_key: str, signature: str) -> bool:
    """Verify an HMAC signature using constant-time comparison."""
    expected = generate_hmac_signature(payload_bytes, secret_key)
    return hmac.compare_digest(expected, signature)


# ── Outbound Webhook Dispatcher ────────────────────────────────────

async def dispatch_webhook_event(
    subscription: WebhookSubscription,
    event_type: str,
    payload: dict,
) -> WebhookDeliveryResult:
    """
    Dispatch an event to a customer's webhook endpoint.

    1. Serialises the payload to canonical JSON.
    2. Computes HMAC-SHA256 signature using the subscription's secret key.
    3. POSTs to the target URL with X-IC-Signature header.
    """
    event_id = str(uuid.uuid4())
    envelope = WebhookPayload(
        event_id=event_id,
        event_type=event_type,
        timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat(),
        data=payload,
    )

    payload_bytes = json.dumps(
        envelope.model_dump(), default=str, sort_keys=True
    ).encode("utf-8")
    signature = generate_hmac_signature(payload_bytes, subscription.secret_key)

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                subscription.target_url,
                content=payload_bytes,
                headers={
                    "Content-Type": "application/json",
                    "X-IC-Signature": signature,
                    "X-IC-Event-Type": event_type,
                    "X-IC-Event-ID": event_id,
                },
            )

        logger.info(
            "Webhook dispatched",
            subscription_id=subscription.subscription_id,
            event_type=event_type,
            status_code=response.status_code,
        )

        return WebhookDeliveryResult(
            subscription_id=subscription.subscription_id,
            event_id=event_id,
            status_code=response.status_code,
            success=200 <= response.status_code < 300,
        )

    except Exception as e:
        logger.error(
            "Webhook dispatch failed",
            subscription_id=subscription.subscription_id,
            error=str(e),
        )
        return WebhookDeliveryResult(
            subscription_id=subscription.subscription_id,
            event_id=event_id,
            success=False,
            error=str(e),
        )


# ── Fan-out dispatcher ─────────────────────────────────────────────

async def dispatch_to_all_subscribers(
    event_type: WebhookEventType,
    payload: dict,
) -> List[WebhookDeliveryResult]:
    """
    Fan-out: dispatch an event to all active subscriptions
    that are registered for this event type.
    """
    results = []
    for sub in _subscriptions.values():
        if sub.is_active and event_type in sub.event_types:
            result = await dispatch_webhook_event(sub, event_type, payload)
            results.append(result)
    return results


# ── API Endpoints ──────────────────────────────────────────────────

@router.post("/subscribe", response_model=WebhookSubscription, status_code=201)
async def create_subscription(body: WebhookSubscriptionCreate):
    """
    Register a new webhook subscription.
    The customer provides their target URL, a shared secret, and
    the event types they want to receive.
    """
    subscription_id = f"whsub_{uuid.uuid4().hex[:12]}"
    subscription = WebhookSubscription(
        subscription_id=subscription_id,
        tenant_id="default",  # TODO: extract from auth context
        target_url=body.target_url,
        secret_key=body.secret_key,
        event_types=body.event_types,
        description=body.description,
    )
    _subscriptions[subscription_id] = subscription
    logger.info(
        "Webhook subscription created",
        subscription_id=subscription_id,
        target_url=body.target_url,
        event_types=[e.value for e in body.event_types],
    )
    return subscription


@router.get("/subscriptions", response_model=List[WebhookSubscription])
async def list_subscriptions():
    """List all webhook subscriptions."""
    return list(_subscriptions.values())


@router.get("/subscriptions/{subscription_id}", response_model=WebhookSubscription)
async def get_subscription(subscription_id: str):
    """Get a specific webhook subscription."""
    sub = _subscriptions.get(subscription_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return sub


@router.delete("/subscriptions/{subscription_id}", status_code=204)
async def delete_subscription(subscription_id: str):
    """Delete a webhook subscription."""
    if subscription_id not in _subscriptions:
        raise HTTPException(status_code=404, detail="Subscription not found")
    del _subscriptions[subscription_id]
    logger.info("Webhook subscription deleted", subscription_id=subscription_id)
    return None


@router.post("/test/{subscription_id}", response_model=WebhookDeliveryResult)
async def test_webhook(subscription_id: str):
    """
    Send a test event to verify connectivity to the customer's endpoint.
    """
    sub = _subscriptions.get(subscription_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")

    test_payload = {
        "message": "IC Origin webhook connectivity test",
        "subscription_id": subscription_id,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    }
    result = await dispatch_webhook_event(sub, "TEST_EVENT", test_payload)
    return result
