import httpx
import structlog
from src.core.config import settings
from typing import List, Dict, Any

logger = structlog.get_logger()

class SlackNotifier:
    """
    Sends premium intelligence alerts to Slack using Block Kit for high-fidelity presentation.
    """
    def __init__(self):
        self.webhook_url = settings.SLACK_WEBHOOK_URL

    async def send_pulse_alert(self, pulse_data: Dict[str, Any]):
        """
        Sends a Morning Pulse alert with interactive buttons.
        """
        if not self.webhook_url:
            logger.warning("Slack Webhook URL not configured. Skipping alert.")
            return

        try:
            date_str = pulse_data.get("date", "Today")
            signals = pulse_data.get("signals", [])
            
            blocks = [
                {
                    "type": "header",
                    "text": {
                        "type": "plain_text",
                        "text": f"🚀 IC ORIGIN: Morning Pulse — {date_str}",
                        "emoji": True
                    }
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"*Summary:* {pulse_data.get('summary', 'New high-conviction signals detected.')}"
                    }
                },
                {"type": "divider"}
            ]

            for signal in signals:
                signal_id = signal.get("id")
                company = signal.get("company_name", "Unknown")
                score = signal.get("conviction_score", 0)
                type_label = signal.get("signal_type", "SIGNAL")
                
                blocks.append({
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"*[{type_label}] {company}* (Conviction: {score}%)\n_{signal.get('headline', 'No headline available.')}_"
                    }
                })
                
                # Add action buttons for each signal
                blocks.append({
                    "type": "actions",
                    "elements": [
                        {
                            "type": "button",
                            "text": {"type": "plain_text", "text": "📝 Generate Dossier"},
                            "style": "primary",
                            "value": f"dossier_{signal_id}",
                            "action_id": f"generate_dossier_{signal_id}"
                        },
                        {
                            "type": "button",
                            "text": {"type": "plain_text", "text": "👁 Watchlist"},
                            "value": f"watchlist_{signal_id}",
                            "action_id": f"add_watchlist_{signal_id}"
                        },
                        {
                            "type": "button",
                            "text": {"type": "plain_text", "text": "✖ Ignore"},
                            "style": "danger",
                            "value": f"ignore_{signal_id}",
                            "action_id": f"ignore_signal_{signal_id}"
                        }
                    ]
                })
                blocks.append({"type": "divider"})

            payload = {"blocks": blocks}
            
            async with httpx.AsyncClient() as client:
                response = await client.post(self.webhook_url, json=payload)
                response.raise_for_status()
                
            logger.info("Slack pulse alert sent successfully")

        except Exception as e:
            logger.error("Failed to send Slack alert", error=str(e))

slack_notifier = SlackNotifier()
