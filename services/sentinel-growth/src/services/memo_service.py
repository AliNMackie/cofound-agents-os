
import structlog
import datetime
import asyncio
from typing import Dict, Any, Optional
from src.services.content import ContentGenerator
from src.services.pdf_factory import render_pdf
from src.services.storage import storage_service

logger = structlog.get_logger()
content_gen = ContentGenerator()

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
            
            # Use 'domain_profile' to tweak tone if needed
            # We assume ContentGenerator returns a SectionContent model
            # But ContentGenerator.generate_section might be too specific.
            # Let's see if we can use it or need a raw call.
            # generate_section(prompt, domain_profile) -> SectionContent
            
            # Let's skip ContentGenerator for now if it's too specific to "proposals" 
            # and just use a mock or simple synthesis for this iteration, 
            # OR better: use ContentGenerator but adapt it.
            # Ideally we want a specialized prompt.
            
            # For this Ralph loop, let's focus on the PIPELINE (Data -> PDF -> URL).
            # We can stub the AI part if needed or use the existing one.
            
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

memo_service = MemoService()
