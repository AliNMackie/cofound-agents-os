"""
IC Origin — Universal Notification Service

Unified alerting layer that routes risk alerts to multiple channels
(Email via Resend, Slack via webhook). Channel failures are isolated —
a Slack outage never blocks email delivery and vice versa.
"""

import datetime
import structlog
import httpx
import resend
from typing import List, Dict, Any, Optional

from src.core.config import settings

logger = structlog.get_logger()


# ── HTML email template for risk degradation alerts ────────────────

RISK_ALERT_EMAIL_TEMPLATE = """\
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body {{ font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; padding: 0; background: #0f172a; color: #e2e8f0; }}
  .container {{ max-width: 600px; margin: 0 auto; padding: 32px 24px; }}
  .header {{ background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border: 1px solid #334155; border-radius: 12px; padding: 24px; margin-bottom: 24px; }}
  .header h1 {{ margin: 0 0 8px 0; font-size: 20px; color: #f8fafc; }}
  .header .subtitle {{ color: #94a3b8; font-size: 14px; margin: 0; }}
  .badge {{ display: inline-block; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }}
  .badge-elevated {{ background: #7f1d1d; color: #fca5a5; }}
  .badge-stable {{ background: #1e3a5f; color: #93c5fd; }}
  .badge-improved {{ background: #14532d; color: #86efac; }}
  .card {{ background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 20px; margin-bottom: 16px; }}
  .card h2 {{ margin: 0 0 12px 0; font-size: 16px; color: #f8fafc; }}
  .signal-list {{ list-style: none; padding: 0; margin: 0; }}
  .signal-list li {{ padding: 8px 0; border-bottom: 1px solid #334155; font-size: 14px; color: #cbd5e1; }}
  .signal-list li:last-child {{ border-bottom: none; }}
  .signal-list li::before {{ content: "⚠ "; }}
  .footer {{ text-align: center; padding: 24px 0; color: #64748b; font-size: 12px; }}
  .tier-change {{ display: flex; align-items: center; gap: 8px; margin: 12px 0; font-size: 14px; }}
  .arrow {{ color: #ef4444; font-weight: bold; }}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>⚡ IC Origin — Risk Alert</h1>
    <p class="subtitle">Counterparty risk tier change detected</p>
  </div>

  <div class="card">
    <h2>{company_name} ({company_number})</h2>
    <div class="tier-change">
      <span class="badge badge-{previous_tier_class}">{previous_tier}</span>
      <span class="arrow">→</span>
      <span class="badge badge-{new_tier_class}">{new_tier}</span>
    </div>
  </div>

  <div class="card">
    <h2>Triggering Signals</h2>
    <ul class="signal-list">
      {signal_items}
    </ul>
  </div>

  <div class="footer">
    IC Origin — Institutional Risk Intelligence<br>
    Generated {timestamp}
  </div>
</div>
</body>
</html>
"""


def _tier_css_class(tier: str) -> str:
    """Map RiskTier enum value to CSS class."""
    mapping = {
        "ELEVATED_RISK": "elevated",
        "STABLE": "stable",
        "IMPROVED": "improved",
        "UNSCORED": "stable",
    }
    return mapping.get(tier, "stable")


class NotificationService:
    """
    Unified alert dispatcher supporting Email (Resend) and Slack channels.
    Channel failures are fully isolated.
    """

    def __init__(self):
        # Resend configuration
        self.resend_api_key = settings.RESEND_API_KEY
        self.sender_email = settings.ALERT_SENDER_EMAIL
        if self.resend_api_key:
            resend.api_key = self.resend_api_key
            logger.info("Resend email provider initialised", sender=self.sender_email)
        else:
            logger.warning("RESEND_API_KEY not set — email notifications disabled")

        # Slack configuration (reuse existing SlackNotifier pattern)
        self.slack_webhook_url = settings.SLACK_WEBHOOK_URL

    # ── Public API ─────────────────────────────────────────────────

    async def send_risk_alert(
        self,
        entity: dict,
        previous_tier: str,
        new_tier: str,
        signals: List[str],
        channels: List[str],
        recipient_email: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Dispatches a risk degradation alert to the specified channels.

        Args:
            entity: Dict with company_name, company_number, etc.
            previous_tier: e.g. "STABLE"
            new_tier: e.g. "ELEVATED_RISK"
            signals: List of triggering signal descriptions
            channels: List of channels to notify: ["email", "slack"]
            recipient_email: Target email address (required if "email" in channels)

        Returns:
            Dict of channel → status ("sent" | "failed" | "skipped")
        """
        results: Dict[str, Any] = {}

        for channel in channels:
            if channel == "email":
                results["email"] = await self._send_email_alert(
                    entity, previous_tier, new_tier, signals, recipient_email
                )
            elif channel == "slack":
                results["slack"] = await self._send_slack_alert(
                    entity, previous_tier, new_tier, signals
                )
            else:
                logger.warning("Unknown notification channel", channel=channel)
                results[channel] = "skipped"

        return results

    # ── Email (Resend) ─────────────────────────────────────────────

    async def _send_email_alert(
        self,
        entity: dict,
        previous_tier: str,
        new_tier: str,
        signals: List[str],
        recipient_email: Optional[str],
    ) -> str:
        """Send a risk alert email via Resend. Returns status string."""
        if not self.resend_api_key:
            logger.debug("Email skipped — RESEND_API_KEY not configured")
            return "skipped"

        if not recipient_email:
            logger.warning("Email skipped — no recipient_email provided")
            return "skipped"

        try:
            company_name = entity.get("company_name", "Unknown Entity")
            company_number = entity.get("company_number", "N/A")
            signal_items = "\n".join(f"<li>{s}</li>" for s in signals)
            timestamp = datetime.datetime.now(datetime.timezone.utc).strftime(
                "%H:%M %d %b %Y UTC"
            )

            html_body = RISK_ALERT_EMAIL_TEMPLATE.format(
                company_name=company_name,
                company_number=company_number,
                previous_tier=previous_tier.replace("_", " "),
                previous_tier_class=_tier_css_class(previous_tier),
                new_tier=new_tier.replace("_", " "),
                new_tier_class=_tier_css_class(new_tier),
                signal_items=signal_items,
                timestamp=timestamp,
            )

            params: resend.Emails.SendParams = {
                "from": f"IC Origin Alerts <{self.sender_email}>",
                "to": [recipient_email],
                "subject": f"⚡ Risk Alert: {company_name} — {new_tier.replace('_', ' ')}",
                "html": html_body,
            }
            response = resend.Emails.send(params)
            logger.info(
                "Risk alert email sent",
                recipient=recipient_email,
                company=company_name,
                resend_id=response.get("id") if isinstance(response, dict) else str(response),
            )
            return "sent"

        except Exception as e:
            logger.error(
                "Failed to send risk alert email",
                error=str(e),
                recipient=recipient_email,
            )
            return "failed"

    # ── Slack ──────────────────────────────────────────────────────

    async def _send_slack_alert(
        self,
        entity: dict,
        previous_tier: str,
        new_tier: str,
        signals: List[str],
    ) -> str:
        """Send a risk alert to Slack via webhook. Returns status string."""
        if not self.slack_webhook_url:
            logger.debug("Slack skipped — SLACK_WEBHOOK_URL not configured")
            return "skipped"

        try:
            company_name = entity.get("company_name", "Unknown Entity")
            company_number = entity.get("company_number", "N/A")
            signal_bullets = "\n".join(f"• {s}" for s in signals)

            blocks = [
                {
                    "type": "header",
                    "text": {
                        "type": "plain_text",
                        "text": f"⚡ Risk Alert: {company_name}",
                        "emoji": True,
                    },
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": (
                            f"*Company:* {company_name} (`{company_number}`)\n"
                            f"*Tier Change:* `{previous_tier}` → `{new_tier}`"
                        ),
                    },
                },
                {"type": "divider"},
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"*Triggering Signals:*\n{signal_bullets}",
                    },
                },
            ]

            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    self.slack_webhook_url, json={"blocks": blocks}
                )
                response.raise_for_status()

            logger.info(
                "Risk alert sent to Slack",
                company=company_name,
            )
            return "sent"

        except Exception as e:
            logger.error("Failed to send Slack risk alert", error=str(e))
            return "failed"


notification_service = NotificationService()
