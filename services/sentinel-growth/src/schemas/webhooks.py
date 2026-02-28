"""
IC Origin — Webhook Schemas

Pydantic models for GRC webhook subscription management
and outbound webhook payload structure.
"""

import datetime
from pydantic import BaseModel, Field, HttpUrl
from typing import List, Optional
from enum import Enum


class WebhookEventType(str, Enum):
    """Event types that can trigger outbound webhooks."""
    RISK_TIER_CHANGE = "RISK_TIER_CHANGE"
    NEW_SIGNAL = "NEW_SIGNAL"
    PORTFOLIO_SWEEP_COMPLETE = "PORTFOLIO_SWEEP_COMPLETE"
    STRATEGIC_ALERT = "STRATEGIC_ALERT"


class WebhookSubscription(BaseModel):
    """A customer's webhook endpoint registration."""
    subscription_id: str = Field(..., description="Unique subscription identifier")
    tenant_id: str = Field(..., description="Owning tenant")
    target_url: str = Field(..., description="HTTPS endpoint to receive events")
    secret_key: str = Field(..., description="Shared secret for HMAC-SHA256 signing")
    event_types: List[WebhookEventType] = Field(
        ..., description="Event types this subscription receives"
    )
    is_active: bool = Field(True, description="Whether the subscription is active")
    created_at: Optional[datetime.datetime] = Field(
        default_factory=lambda: datetime.datetime.now(datetime.timezone.utc)
    )
    description: Optional[str] = Field(None, description="Human-readable label")


class WebhookSubscriptionCreate(BaseModel):
    """Request body for creating a new webhook subscription."""
    target_url: str = Field(..., description="HTTPS endpoint to receive events")
    secret_key: str = Field(
        ..., min_length=16, description="Shared secret (min 16 chars)"
    )
    event_types: List[WebhookEventType] = Field(
        ..., min_length=1, description="At least one event type required"
    )
    description: Optional[str] = None


class WebhookPayload(BaseModel):
    """The envelope sent to the customer's webhook endpoint."""
    event_id: str = Field(..., description="Unique event identifier")
    event_type: WebhookEventType
    timestamp: str = Field(..., description="ISO-8601 timestamp")
    data: dict = Field(..., description="Event-specific payload data")


class WebhookDeliveryResult(BaseModel):
    """Result of an outbound webhook delivery attempt."""
    subscription_id: str
    event_id: str
    status_code: Optional[int] = None
    success: bool
    error: Optional[str] = None
