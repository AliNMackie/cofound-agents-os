
import structlog
import datetime
import asyncio
from typing import Dict, Any, Optional, List
from src.services.content import ContentGenerator
from src.services.pdf_factory import render_pdf, render_pdf_sync
from src.services.storage import storage_service

logger = structlog.get_logger()
content_gen = ContentGenerator()


# ──────────────── Portfolio Risk Report Template (Sprint 2) ────────────────

RISK_REPORT_TEMPLATE = """\
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Portfolio Risk Report — {{ portfolio_id }}</title>
    <style>
        @page { size: A4; margin: 2cm; }
        body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            color: #1a1a2e;
            line-height: 1.5;
            font-size: 11pt;
        }
        .header {
            border-bottom: 3px solid #0f3460;
            padding-bottom: 12px;
            margin-bottom: 24px;
        }
        .header h1 {
            color: #0f3460;
            margin: 0 0 4px 0;
            font-size: 20pt;
        }
        .header .meta {
            color: #666;
            font-size: 9pt;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 16px;
        }
        th {
            background: #0f3460;
            color: #fff;
            padding: 8px 12px;
            text-align: left;
            font-size: 9pt;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        td {
            padding: 8px 12px;
            border-bottom: 1px solid #e0e0e0;
            font-size: 10pt;
        }
        tr:nth-child(even) { background: #f8f9fa; }
        .risk-elevated { color: #d32f2f; font-weight: bold; }
        .risk-stable { color: #1976d2; }
        .risk-improved { color: #388e3c; font-weight: bold; }
        .risk-unscored { color: #9e9e9e; }
        .summary {
            margin-top: 24px;
            padding: 12px 16px;
            background: #e8eaf6;
            border-radius: 6px;
            font-size: 10pt;
        }
        .footer {
            margin-top: 32px;
            text-align: center;
            font-size: 8pt;
            color: #999;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Portfolio Risk Report</h1>
        <div class="meta">
            Portfolio: <strong>{{ portfolio_id }}</strong> |
            Generated: {{ generated_at }} |
            Entities: {{ entity_count }}
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Company</th>
                <th>CH Number</th>
                <th>Type</th>
                <th>Risk Tier</th>
                <th>Conviction</th>
            </tr>
        </thead>
        <tbody>
            {% for entity in entities %}
            <tr>
                <td>{{ loop.index }}</td>
                <td>{{ entity.company_name or 'Unknown' }}</td>
                <td>{{ entity.company_number or '—' }}</td>
                <td>{{ entity.counterparty_type or '—' }}</td>
                <td>
                    {% if entity.risk_tier == 'ELEVATED_RISK' %}
                        <span class="risk-elevated">⬤ ELEVATED RISK</span>
                    {% elif entity.risk_tier == 'IMPROVED' %}
                        <span class="risk-improved">⬤ IMPROVED</span>
                    {% elif entity.risk_tier == 'STABLE' %}
                        <span class="risk-stable">⬤ STABLE</span>
                    {% else %}
                        <span class="risk-unscored">⬤ UNSCORED</span>
                    {% endif %}
                </td>
                <td>{{ entity.max_conviction_score | default(0) }}/100</td>
            </tr>
            {% endfor %}
        </tbody>
    </table>

    <div class="summary">
        {% set elevated_count = entities | selectattr('risk_tier', 'eq', 'ELEVATED_RISK') | list | length %}
        {% set improved_count = entities | selectattr('risk_tier', 'eq', 'IMPROVED') | list | length %}
        {% set stable_count   = entities | selectattr('risk_tier', 'eq', 'STABLE') | list | length %}
        <strong>Summary:</strong>
        {{ elevated_count }} elevated risk,
        {{ stable_count }} stable,
        {{ improved_count }} improved
        out of {{ entity_count }} monitored counterparties.
    </div>

    <div class="footer">
        IC Origin Counterparty Risk Intelligence — Confidential
    </div>
</body>
</html>
"""


class MemoService:
    def __init__(self):
        # We might inject db if needed, but for now we accept data
        pass

    async def generate_morning_briefing(self, pulse_data: Dict[str, Any], user_context: Optional[Dict] = None) -> str:
        """
        Generates a PDF briefing from Morning Pulse data.
        Returns the signed URL of the uploaded document.
        """
        pulse_id = pulse_data.get("date", datetime.datetime.now().strftime("%Y-%m-%d"))
        logger.info("Generating Morning Briefing", pulse_id=pulse_id)

        try:
            # 1. AI Synthesis (using ContentGenerator)
            # We want an Executive Summary that synthesizes the signals
            signals = pulse_data.get("signals", [])
            signal_summaries = "\n".join([
                f"- {s.get('company_name')}: {s.get('headline')} ({s.get('signal_type', 'RESCUE')})"
                for s in signals
            ])
            
            prompt = f"Write an executive briefing for an investment committee for today {pulse_id}. Synthesize these key market signals into a coherent narrative about market distress and opportunity:\n{signal_summaries}"
            
            # Using ContentGenerator for "Synthesis"
            synthesis = content_gen.generate_section(prompt, {"industry": "Private Equity", "tone": "Professional"})
            executive_summary = synthesis.content # Markdown text
            
            # 2. Prepare Template Data
            template_data = {
                "date": pulse_id,
                "executive_summary": executive_summary,
                "signals": signals[:5], # Top 5
                "generated_at": datetime.datetime.now().strftime("%H:%M %d %b %Y")
            }
            
            # 3. Render PDF
            pdf_bytes = await render_pdf(template_data, "morning_briefing.html")
            
            # 4. Upload
            filename = f"briefing_{pulse_id}.pdf"
            url = storage_service.upload_and_sign(pdf_bytes, filename, "application/pdf")
            
            return url

        except Exception as e:
            logger.error("Failed to generate briefing", error=str(e))
            raise e

    # ──────────────── Counterparty Risk Intelligence (Sprint 2) ────────────────

    async def generate_portfolio_risk_pdf(
        self,
        portfolio_id: str,
        entities: List[Dict[str, Any]],
    ) -> bytes:
        """
        Generate a Portfolio Risk Report as a PDF byte stream.

        Renders an institutional-grade HTML report from the provided entity data
        and converts it to PDF using WeasyPrint. Falls back to a dummy PDF if
        WeasyPrint/GTK is unavailable (dev/CI environments).

        Args:
            portfolio_id: The portfolio being reported on.
            entities: List of entity dicts, each expected to contain:
                      - company_name (str)
                      - company_number (str)
                      - counterparty_type (str)
                      - risk_tier (str) — one of ELEVATED_RISK, STABLE, IMPROVED, UNSCORED
                      - max_conviction_score (int)

        Returns:
            PDF file content as bytes.
        """
        from jinja2 import Environment

        log = logger.bind(portfolio_id=portfolio_id)
        log.info("Generating portfolio risk PDF", entity_count=len(entities))

        try:
            # 1. Render HTML from inline template
            jinja_env = Environment(autoescape=True)
            template = jinja_env.from_string(RISK_REPORT_TEMPLATE)

            html_content = template.render(
                portfolio_id=portfolio_id,
                entities=entities,
                entity_count=len(entities),
                generated_at=datetime.datetime.now().strftime("%H:%M %d %b %Y"),
            )

            # 2. Convert to PDF (runs in thread pool to avoid blocking)
            pdf_bytes = await asyncio.to_thread(render_pdf_sync, html_content)

            log.info(
                "Portfolio risk PDF generated",
                size_bytes=len(pdf_bytes),
            )
            return pdf_bytes

        except Exception as e:
            log.error("Failed to generate portfolio risk PDF", error=str(e))
            raise


memo_service = MemoService()

