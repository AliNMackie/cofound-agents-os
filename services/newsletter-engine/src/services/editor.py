import os
import datetime
import google.generativeai as genai
from typing import List, Dict, Any, Optional

class NewsletterEditor:
    PROMPT_TEMPLATES = {
        "weekly_wrap": """
Role: Senior Partner.
Task: Summarize the top failed auctions of the week.
Focus: Identify the common thread (e.g., 'Retail struggles in the North', 'Industrial resilience').
Tone: Narrative, Strategic, and Insightful.

Constraint: You MUST cite the source for every specific deal mentioned using the format [Lot {{number}}, {{auction_house}}].
Constraint: Strictly use UK English spelling and vocabulary (e.g., 'Realise', 'Programme', 'Centre', 'Labour').
Constraint: Format all currency as GBP (£) unless specified otherwise.
Constraint: Maintain a professional London Financial City standard tone (no hyperbole).

Context (Failed Auctions):
{context_data}

Specific Instructions:
{user_notes}

Task: Write a weekly wrap-up newsletter based on the failed auctions above. End with a strong conclusion on market sentiment.
""",
        "opportunities": """
Role: Deal Originator.
Task: Highlight high-potential opportunities among the failures.
Focus: The 'Value Add'. Look for high yield potential, asset management angles, or mispricing in these failed lots.
Tone: Sales-focused, Deal-making, Optimistic but grounded.

Constraint: You MUST cite the source for every specific deal mentioned using the format [Lot {{number}}, {{auction_house}}]. Highlight the pricing gap where possible.
Constraint: Strictly use UK English spelling and vocabulary (e.g., 'Realise', 'Programme', 'Centre', 'Labour').
Constraint: Format all currency as GBP (£) unless specified otherwise.
Constraint: Maintain a professional London Financial City standard tone (no hyperbole).

Context (Failed Auctions):
{context_data}

Specific Instructions:
{user_notes}

Task: Write an opportunities memo highlighting the best picks from the list.
""",
        "risk_view": """
Role: Credit Analyst.
Task: Analyze WHY these lots failed.
Focus: Was the reserve too high? Legal issues? Short lease tails? Structural problems?
Tone: Critical, Cautious, and Analytical. "Buyer Beware".

Constraint: You MUST cite the source for every specific deal mentioned using the format [Lot {{number}}, {{auction_house}}].
Constraint: Strictly use UK English spelling and vocabulary (e.g., 'Realise', 'Programme', 'Centre', 'Labour').
Constraint: Format all currency as GBP (£) unless specified otherwise.
Constraint: Maintain a professional London Financial City standard tone (no hyperbole).
Specific Requirement: Calculate the percentage gap between Guide Price and Last Bid `((Guide - Bid) / Guide)` to quantify the pricing disconnect. Explicitly mention this 'Disconnect Gap' in the text.

Context (Failed Auctions):
{context_data}

Specific Instructions:
{user_notes}

Task: Write a risk analysis report on these failed auctions.
""",
        "sector_dive": """
Role: Market Researcher.
Task: Group results by sector (e.g., Retail, Industrial, Office, Residential) and compare performance.
Focus: Relative demand. Which sectors are clearing? Which are sticking?
Tone: Professional, organized, comparative.

Constraint: Use clear headers for each sector. You MUST cite the source for every specific deal mentioned using the format [Lot {{number}}, {{auction_house}}].
Constraint: Strictly use UK English spelling and vocabulary (e.g., 'Realise', 'Programme', 'Centre', 'Labour').
Constraint: Format all currency as GBP (£) unless specified otherwise.
Constraint: Maintain a professional London Financial City standard tone (no hyperbole).

Context (Failed Auctions):
{context_data}

Specific Instructions:
{user_notes}

Task: Write a market sweep summary.
""",
        "morning_pulse": """
Role: Senior M&A Associate at Neish Capital.
Task: Synthesise urgent capital structure intelligence for the IC ORIGIN morning briefing.
Focus: The 2026/27 maturity wall. Identify 'Zombie Assets' held by PE firms for >5 years. Monitor BoE 4% floor vs Fed 3.5% targets to predict refinancing velocity.
Tone: Sharp, Analytical, Conviction-driven. This is the "Morning Pulse" — the intelligence that moves capital.

Constraint: Strictly use UK English spelling and vocabulary (e.g., 'Realise', 'Programme', 'Centre', 'Labour').
Constraint: Format all currency as GBP (£) unless specified otherwise.
Constraint: Cite sources for every specific deal using format [Source: {{publication}}].
Constraint: End with a "Conviction Score" (0-100) and a one-line "Action Signal" recommendation.
Constraint: Include the watermark "IC ORIGIN: Proprietary Capital Structure Intelligence" at the end.

Signal Data:
{context_data}

Specific Instructions:
{user_notes}

Task: Write a high-conviction intelligence briefing for the signal(s) above. Structure:
1. **Headline Summary** (2-3 sentences)
2. **Maturity Wall Analysis** (Position within 2026/27 exposure)
3. **Zombie Asset Indicators** (PE hold duration, EBITDA trajectory)
4. **Monetary Policy Impact** (BoE/Fed divergence implications)
5. **Conviction Score & Action Signal**
""",
        "weekly_wrap_intelligence": """
Role: Senior Partner at Neish Capital / IC ORIGIN.
Task: Produce the Friday Weekly Intelligence Wrap — a Scope Ratings / PwC-calibre analytical document.
Focus: Aggregate the top 5 'High Conviction' signals from the week. Identify macro themes and emerging patterns.
Tone: Authoritative, Macro-aware, Publication-ready.

Constraint: Strictly use UK English spelling and vocabulary.
Constraint: Format all currency as GBP (£) unless specified otherwise.
Constraint: Include sector breakdown where applicable.
Constraint: Include the watermark "IC ORIGIN: Proprietary Capital Structure Intelligence" at the end.

Weekly Signal Summary:
{context_data}

Specific Instructions:
{user_notes}

Task: Write the Weekly Wrap Intelligence Report. Structure:
1. **Executive Summary** (Week's key theme in 3 sentences)
2. **Top 5 Signals** (Ranked by conviction score)
3. **Sector Heatmap** (Which sectors are stressed/clearing)
4. **Monetary Policy Watch** (BoE/Fed/ECB implications)
5. **Maturity Wall Tracker** (Upcoming 2026/27 exposures)
6. **Outlook & Positioning** (1-2 paragraph forward view)

---
*IC ORIGIN: Proprietary Capital Structure Intelligence*
*Weekly Intelligence Wrap — Prepared for Limited Distribution*
"""
    }

    def __init__(self):
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            print("Warning: GOOGLE_API_KEY not set")
        else:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-3-flash-preview')

    def _format_auction_data(self, auction_list: List[Dict[str, Any]]) -> str:
        """
        Formats the list of auction dicts (or Intelligence Signals) into a readable string for the LLM.
        Explicitly calculates and highlights the 'Pricing Disconnect' (Guide vs Final Bid).
        """
        formatted_text = ""
        for item in auction_list:
            # Check if this is an Intelligence Signal or legacy Auction Data
            # Signals have 'headline' and 'analysis'
            
            if 'headline' in item:
                 # Intelligence Signal Format
                headline = item.get('headline', 'Unknown Signal')
                analysis = item.get('analysis', '')
                source = item.get('source', 'Unknown Source')
                cat = item.get('category', 'General')
                advisor = item.get('advisor')
                ebitda = item.get('ebitda')
                
                formatted_text += f"- Signal: {headline} [{cat}]\n"
                formatted_text += f"  Source: {source}\n"
                if advisor:
                    formatted_text += f"  Advisor: {advisor}\n"
                if ebitda:
                    formatted_text += f"  EBITDA: {ebitda}\n"
                formatted_text += f"  Analysis: {analysis}\n\n"
            
            else:
                # Legacy Auction Format (keep as fallback)
                lot_num = item.get('lot_number', 'N/A')
                address = item.get('address', 'Unknown Address')
                guide = item.get('guide_price', 'N/A')
                final_bid = item.get('final_bid', 'N/A')
                house = item.get('auction_house', 'Unknown House')
                sector = item.get('sector', 'N/A')
                
                # Pricing Disconnect Calculation logic (if values are numeric-ish)
                # This is a simple string formatter, but prompts the LLM to notice the gap
                pricing_info = f"Guide: {guide} | Final Bid: {final_bid}"
                
                formatted_text += f"- Lot {lot_num} ({house}): {address} [{sector}]\n"
                formatted_text += f"  {pricing_info}\n"
                formatted_text += f"  Details: {item.get('description', '')}\n\n"
            
        return formatted_text

    async def generate_draft(self, raw_data: List[Dict[str, Any]], user_notes: Optional[str] = "", template_id: str = "weekly_wrap", user_signature: Optional[str] = None, branding_instruction: Optional[str] = None, industry_context: Optional[str] = None) -> str:
        
        # Select Template
        if template_id not in self.PROMPT_TEMPLATES:
            template_id = "weekly_wrap"
        
        # Pre-process Data
        context_string = self._format_auction_data(raw_data)
        
        # Construct Core Template
        base_prompt = self.PROMPT_TEMPLATES[template_id].format(
            context_data=context_string, 
            user_notes=user_notes or "No specific instructions."
        )

        # Build The Final System Prompt with strict overrides
        branding_block = ""
        if branding_instruction:
            branding_block = f"""
            ### BRAND VOICE INSTRUCTIONS (MUST FOLLOW)
            You are ghostwriting for a specific author. Adhere strictly to their voice profile:
            {branding_instruction}
            """

        final_prompt = f"""
        {base_prompt}

        ### INDUSTRY CONTEXT
        {industry_context or "Standard Financial Markets Context"}

        {branding_block}

        ### CRITICAL OVERRIDES (NON-NEGOTIABLE)
        Regardless of the Brand Voice above, you MUST strictly adhere to these rules:
        1. **CURRENT DATE:** Today is {datetime.datetime.now().strftime("%d %B %Y")}. You MUST use this date for the memo header/context. Do NOT make up a past date like 2023.
        2. **SPELLING:** Use UK English ONLY (e.g., 'Realise', 'Programme', 'Centre', 'Labour', 'Defence', 'Organise').
        3. **CURRENCY:** All monetary values MUST be in GBP (£). Never use USD ($) or EUR (€) unless explicitly quoting a foreign source. 
           - Format: £1.5m, £500k.
        4. **NO AMERICANISMS:** Avoid terms like 'Real Estate' (use 'Property'), 'Restroom' (use 'Toilet/Loo'), 'Trash' (use 'Rubbish').
        """

        try:
            generated_content = ""
            if not hasattr(self, 'model'):
                 generated_content = f"Error: Google API Key not configured. Mock draft for {template_id}.\n\nContext Preview:\n{context_string[:200]}..."
            else:
                response = await self.model.generate_content_async(final_prompt)
                generated_content = response.text
            
            # Append Signature if provided
            if user_signature:
                generated_content += f"\n\n---\n{user_signature}"
                
            return generated_content
            
        except Exception as e:
            return f"Error generating draft: {str(e)}"
