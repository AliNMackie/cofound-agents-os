import os
import google.generativeai as genai
from typing import Optional

class NewsletterEditor:
    PROMPT_TEMPLATES = {
        "weekly_memo": """
Role: Deal Partner. 
Goal: Rapid-fire deal analysis. 
Focus: Execution speed, fresh rumors, and immediate opportunities. 
Tone: Punchy, bulleted, high-energy.

Context: {context_data}
User Notes: {user_notes}

Task: Write a weekly deal memo based on the context above. Keep it brief and actionable.
""",
        "quarterly_review": """
Role: Chief Investment Officer. 
Goal: Strategic retrospective. 
Focus: Macro trends, sector shifts (e.g., Retail vs Tech), and 3-month outlook. 
Tone: Thoughtful, data-heavy, narrative-driven.

Context: {context_data}
User Notes: {user_notes}

Task: Write a quarterly review newsletter based on the context above. Focus on the bigger picture.
""",
        "capital_markets": """
Role: Debt Specialist. 
Goal: Credit market update. 
Focus: Leverage multiples, lender appetite, and interest rate impacts. 
Tone: Technical, precise, numerical.

Context: {context_data}
User Notes: {user_notes}

Task: Write a capital markets update based on the context above. Focus on the numbers and technical details.
"""
    }

    def __init__(self):
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            # For development/testing without key, we might want to handle this gracefully
            print("Warning: GOOGLE_API_KEY not set")
        else:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')

    async def generate_draft(self, context_data: str, user_notes: str = "", template_type: str = "weekly_memo") -> str:
        if template_type not in self.PROMPT_TEMPLATES:
            template_type = "weekly_memo"
            
        prompt = self.PROMPT_TEMPLATES[template_type].format(
            context_data=context_data, 
            user_notes=user_notes
        )

        try:
            if not hasattr(self, 'model'):
                 return f"Error: Google API Key not configured. Mock draft for {template_type}: \n\n# Draft\n\nContext: {context_data}"

            response = await self.model.generate_content_async(prompt)
            return response.text
        except Exception as e:
            return f"Error generating draft: {str(e)}"
