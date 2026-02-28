"""
Sprint 4 Validation Tests — Notification Service & Webhook Egress
Tests: notification_service, webhook schemas, HMAC signing, webhook dispatch
"""
import sys
import os
import json
import hashlib
import hmac
import asyncio
import datetime
from unittest.mock import MagicMock, patch, AsyncMock

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


# ═══════════════════════════════════════════
# TASK 1: Notification Service
# ═══════════════════════════════════════════

class TestNotificationService:
    """Validate unified notification dispatch with channel isolation."""

    def _mock_entity(self):
        return {
            "company_name": "Acme Holdings Ltd",
            "company_number": "12345678",
            "risk_tier": "ELEVATED_RISK",
        }

    def _make_service(self):
        """Create a NotificationService with mocked Resend."""
        with patch("src.services.notification_service.settings") as mock_settings, \
             patch("src.services.notification_service.resend") as mock_resend:
            mock_settings.RESEND_API_KEY = "re_test_key_123"
            mock_settings.ALERT_SENDER_EMAIL = "alerts@icorigin.ai"
            mock_settings.SLACK_WEBHOOK_URL = "https://hooks.slack.com/test"

            from src.services.notification_service import NotificationService
            svc = NotificationService()
            return svc, mock_resend

    def test_send_email_alert_success(self):
        """Email alert sends via Resend when API key is set."""
        with patch("src.services.notification_service.settings") as mock_settings, \
             patch("src.services.notification_service.resend") as mock_resend:
            mock_settings.RESEND_API_KEY = "re_test_key_123"
            mock_settings.ALERT_SENDER_EMAIL = "alerts@icorigin.ai"
            mock_settings.SLACK_WEBHOOK_URL = ""

            mock_resend.Emails.send.return_value = {"id": "email-123"}

            from src.services.notification_service import NotificationService
            svc = NotificationService()

            result = asyncio.run(
                svc.send_risk_alert(
                    entity=self._mock_entity(),
                    previous_tier="STABLE",
                    new_tier="ELEVATED_RISK",
                    signals=["New charge registered", "Director resigned"],
                    channels=["email"],
                    recipient_email="analyst@bank.co.uk",
                )
            )
            assert result["email"] == "sent"
            mock_resend.Emails.send.assert_called_once()

    def test_send_email_skipped_without_api_key(self):
        """Email is skipped gracefully when RESEND_API_KEY is empty."""
        with patch("src.services.notification_service.settings") as mock_settings, \
             patch("src.services.notification_service.resend"):
            mock_settings.RESEND_API_KEY = ""
            mock_settings.ALERT_SENDER_EMAIL = "alerts@icorigin.ai"
            mock_settings.SLACK_WEBHOOK_URL = ""

            from src.services.notification_service import NotificationService
            svc = NotificationService()

        result = asyncio.run(
            svc.send_risk_alert(
                entity=self._mock_entity(),
                previous_tier="STABLE",
                new_tier="ELEVATED_RISK",
                signals=["Test"],
                channels=["email"],
                recipient_email="test@test.com",
            )
        )
        assert result["email"] == "skipped"

    def test_send_email_skipped_without_recipient(self):
        """Email is skipped when no recipient is provided."""
        svc, _ = self._make_service()

        result = asyncio.run(
            svc.send_risk_alert(
                entity=self._mock_entity(),
                previous_tier="STABLE",
                new_tier="ELEVATED_RISK",
                signals=["Test"],
                channels=["email"],
                recipient_email=None,
            )
        )
        assert result["email"] == "skipped"

    def test_email_failure_does_not_block_slack(self):
        """Email failure is isolated — Slack channel still executes."""
        with patch("src.services.notification_service.settings") as mock_settings, \
             patch("src.services.notification_service.resend") as mock_resend:
            mock_settings.RESEND_API_KEY = "re_test_key_123"
            mock_settings.ALERT_SENDER_EMAIL = "alerts@icorigin.ai"
            mock_settings.SLACK_WEBHOOK_URL = "https://hooks.slack.com/test"
            mock_resend.Emails.send.side_effect = Exception("Resend API error")

            from src.services.notification_service import NotificationService
            svc = NotificationService()

            with patch.object(svc, "_send_slack_alert", new_callable=AsyncMock, return_value="sent"):
                result = asyncio.run(
                    svc.send_risk_alert(
                        entity=self._mock_entity(),
                        previous_tier="STABLE",
                        new_tier="ELEVATED_RISK",
                        signals=["Test"],
                        channels=["email", "slack"],
                        recipient_email="test@test.com",
                    )
                )

        assert result["email"] == "failed"
        assert result["slack"] == "sent"

    def test_slack_failure_does_not_block_email(self):
        """Slack failure is isolated — Email channel still executes."""
        with patch("src.services.notification_service.settings") as mock_settings, \
             patch("src.services.notification_service.resend") as mock_resend:
            mock_settings.RESEND_API_KEY = "re_test_key_123"
            mock_settings.ALERT_SENDER_EMAIL = "alerts@icorigin.ai"
            mock_settings.SLACK_WEBHOOK_URL = "https://hooks.slack.com/test"
            mock_resend.Emails.send.return_value = {"id": "email-ok"}

            from src.services.notification_service import NotificationService
            svc = NotificationService()

            with patch.object(svc, "_send_slack_alert", new_callable=AsyncMock, return_value="failed"):
                result = asyncio.run(
                    svc.send_risk_alert(
                        entity=self._mock_entity(),
                        previous_tier="STABLE",
                        new_tier="ELEVATED_RISK",
                        signals=["Test"],
                        channels=["email", "slack"],
                        recipient_email="test@test.com",
                    )
                )

        assert result["email"] == "sent"
        assert result["slack"] == "failed"

    def test_unknown_channel_returns_skipped(self):
        """Unknown channels return 'skipped' without error."""
        svc, _ = self._make_service()

        result = asyncio.run(
            svc.send_risk_alert(
                entity=self._mock_entity(),
                previous_tier="STABLE",
                new_tier="ELEVATED_RISK",
                signals=["Test"],
                channels=["sms"],
            )
        )
        assert result["sms"] == "skipped"

    def test_slack_skipped_without_webhook_url(self):
        """Slack is skipped when SLACK_WEBHOOK_URL is empty."""
        with patch("src.services.notification_service.settings") as mock_settings, \
             patch("src.services.notification_service.resend"):
            mock_settings.RESEND_API_KEY = ""
            mock_settings.ALERT_SENDER_EMAIL = ""
            mock_settings.SLACK_WEBHOOK_URL = ""

            from src.services.notification_service import NotificationService
            svc = NotificationService()

        result = asyncio.run(
            svc.send_risk_alert(
                entity=self._mock_entity(),
                previous_tier="STABLE",
                new_tier="ELEVATED_RISK",
                signals=["Test"],
                channels=["slack"],
            )
        )
        assert result["slack"] == "skipped"


# ═══════════════════════════════════════════
# TASK 2: Webhook Schemas
# ═══════════════════════════════════════════

class TestWebhookSchemas:
    """Validate Pydantic webhook schema models."""

    def test_subscription_create_requires_secret_min_length(self):
        from src.schemas.webhooks import WebhookSubscriptionCreate
        with pytest.raises(Exception):
            WebhookSubscriptionCreate(
                target_url="https://example.com/hook",
                secret_key="short",  # < 16 chars
                event_types=["RISK_TIER_CHANGE"],
            )

    def test_subscription_create_valid(self):
        from src.schemas.webhooks import WebhookSubscriptionCreate
        sub = WebhookSubscriptionCreate(
            target_url="https://example.com/hook",
            secret_key="a_very_secure_secret_key_123",
            event_types=["RISK_TIER_CHANGE", "NEW_SIGNAL"],
            description="Test subscription",
        )
        assert sub.target_url == "https://example.com/hook"
        assert len(sub.event_types) == 2

    def test_webhook_payload_serialisation(self):
        from src.schemas.webhooks import WebhookPayload, WebhookEventType
        payload = WebhookPayload(
            event_id="evt-001",
            event_type=WebhookEventType.RISK_TIER_CHANGE,
            timestamp="2026-02-28T12:00:00Z",
            data={"company_number": "12345678", "new_tier": "ELEVATED_RISK"},
        )
        d = payload.model_dump()
        assert d["event_id"] == "evt-001"
        assert d["data"]["company_number"] == "12345678"

    def test_event_type_enum_values(self):
        from src.schemas.webhooks import WebhookEventType
        assert WebhookEventType.RISK_TIER_CHANGE == "RISK_TIER_CHANGE"
        assert WebhookEventType.NEW_SIGNAL == "NEW_SIGNAL"
        assert WebhookEventType.PORTFOLIO_SWEEP_COMPLETE == "PORTFOLIO_SWEEP_COMPLETE"
        assert WebhookEventType.STRATEGIC_ALERT == "STRATEGIC_ALERT"


# ═══════════════════════════════════════════
# TASK 3: HMAC-SHA256 Signing
# ═══════════════════════════════════════════

class TestHmacSigning:
    """Validate HMAC-SHA256 signature generation and verification."""

    def test_generate_hmac_signature(self):
        from src.api.webhooks import generate_hmac_signature
        payload = b'{"event_type":"RISK_TIER_CHANGE","data":{"company":"Test"}}'
        secret = "my_secure_secret_key_123"
        sig = generate_hmac_signature(payload, secret)

        # Manually compute expected HMAC
        expected = hmac.new(
            key=secret.encode("utf-8"),
            msg=payload,
            digestmod=hashlib.sha256,
        ).hexdigest()
        assert sig == expected

    def test_verify_hmac_signature_correct(self):
        from src.api.webhooks import generate_hmac_signature, verify_hmac_signature
        payload = b'{"test": "data"}'
        secret = "another_secure_key_456"
        sig = generate_hmac_signature(payload, secret)
        assert verify_hmac_signature(payload, secret, sig) is True

    def test_verify_hmac_signature_wrong_key(self):
        from src.api.webhooks import generate_hmac_signature, verify_hmac_signature
        payload = b'{"test": "data"}'
        sig = generate_hmac_signature(payload, "correct_key_1234567")
        assert verify_hmac_signature(payload, "wrong_key_12345678", sig) is False

    def test_verify_hmac_signature_tampered_payload(self):
        from src.api.webhooks import generate_hmac_signature, verify_hmac_signature
        secret = "shared_secret_key_789"
        sig = generate_hmac_signature(b'{"original": true}', secret)
        assert verify_hmac_signature(b'{"tampered": true}', secret, sig) is False

    def test_signature_is_hex_string(self):
        from src.api.webhooks import generate_hmac_signature
        sig = generate_hmac_signature(b"test", "key_1234567890123")
        assert all(c in "0123456789abcdef" for c in sig)
        assert len(sig) == 64  # SHA-256 hex digest = 64 chars


# ═══════════════════════════════════════════
# TASK 4: Webhook Dispatch
# ═══════════════════════════════════════════

class TestWebhookDispatch:
    """Validate outbound webhook dispatcher with HMAC headers."""

    def _make_subscription(self):
        from src.schemas.webhooks import WebhookSubscription, WebhookEventType
        return WebhookSubscription(
            subscription_id="whsub_test001",
            tenant_id="tenant-01",
            target_url="https://grc.example.com/webhook",
            secret_key="test_secret_key_for_hmac",
            event_types=[WebhookEventType.RISK_TIER_CHANGE],
        )

    def test_dispatch_sends_correct_headers(self):
        from src.api.webhooks import dispatch_webhook_event
        sub = self._make_subscription()

        with patch("src.api.webhooks.httpx.AsyncClient") as mock_client_cls:
            mock_client = AsyncMock()
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_client.post.return_value = mock_response
            mock_client_cls.return_value.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=False)

            result = asyncio.run(
                dispatch_webhook_event(sub, "RISK_TIER_CHANGE", {"test": True})
            )

        assert result.success is True
        assert result.status_code == 200

        # Verify X-IC-Signature header was sent
        call_kwargs = mock_client.post.call_args
        headers = call_kwargs.kwargs.get("headers") or call_kwargs[1].get("headers")
        assert "X-IC-Signature" in headers
        assert "X-IC-Event-Type" in headers
        assert headers["X-IC-Event-Type"] == "RISK_TIER_CHANGE"
        assert len(headers["X-IC-Signature"]) == 64  # SHA-256 hex

    def test_dispatch_failure_returns_error(self):
        from src.api.webhooks import dispatch_webhook_event
        sub = self._make_subscription()

        with patch("src.api.webhooks.httpx.AsyncClient") as mock_client_cls:
            mock_client = AsyncMock()
            mock_client.post.side_effect = Exception("Connection refused")
            mock_client_cls.return_value.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=False)

            result = asyncio.run(
                dispatch_webhook_event(sub, "RISK_TIER_CHANGE", {"test": True})
            )

        assert result.success is False
        assert "Connection refused" in result.error

    def test_dispatch_non_2xx_is_not_success(self):
        from src.api.webhooks import dispatch_webhook_event
        sub = self._make_subscription()

        with patch("src.api.webhooks.httpx.AsyncClient") as mock_client_cls:
            mock_client = AsyncMock()
            mock_response = MagicMock()
            mock_response.status_code = 500
            mock_client.post.return_value = mock_response
            mock_client_cls.return_value.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=False)

            result = asyncio.run(
                dispatch_webhook_event(sub, "RISK_TIER_CHANGE", {"test": True})
            )

        assert result.success is False
        assert result.status_code == 500
