import os
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

Task: Write a sector breakdown analysis.
""",
        "market_sweep": """
Role: Data Analyst.
Task: A rapid-fire, comprehensive list of every failed lot.
Focus: Pure data. No fluff. Just the facts, the numbers, and the result.
Tone: Concise, Bulleted, High-density.

Constraint: List format. Citation format: [Lot {{number}}, {{auction_house}}]. Include Address and Guide Price.
Constraint: Strictly use UK English spelling and vocabulary (e.g., 'Realise', 'Programme', 'Centre', 'Labour').
Constraint: Format all currency as GBP (£) unless specified otherwise.
Constraint: Maintain a professional London Financial City standard tone (no hyperbole).

Context (Failed Auctions):
{context_data}

Specific Instructions:
{user_notes}

Task: Write a market sweep summary.
"""
    }

    def __init__(self):
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            print("Warning: GOOGLE_API_KEY not set")
        else:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')

    def _format_auction_data(self, auction_list: List[Dict[str, Any]]) -> str:
        """
        Formats the list of auction dicts into a readable string for the LLM.
        Explicitly calculates and highlights the 'Pricing Disconnect' (Guide vs Final Bid).
        """
        formatted_text = ""
        for item in auction_list:
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

    async def generate_draft(self, raw_data: List[Dict[str, Any]], user_notes: Optional[str] = "", template_id: str = "weekly_wrap", user_signature: Optional[str] = None) -> str:
        
        # Select Template
        if template_id not in self.PROMPT_TEMPLATES:
            template_id = "weekly_wrap"
        
        # Pre-process Data
        context_string = self._format_auction_data(raw_data)
        
        # Construct Prompt
        prompt = self.PROMPT_TEMPLATES[template_id].format(
            context_data=context_string, 
            user_notes=user_notes or "No specific instructions."
        )

        try:
            generated_content = ""
            if not hasattr(self, 'model'):
                 generated_content = f"Error: Google API Key not configured. Mock draft for {template_id}.\n\nContext Preview:\n{context_string[:200]}..."
            else:
                response = await self.model.generate_content_async(prompt)
                generated_content = response.text
            
            # Append Signature if provided
            if user_signature:
                generated_content += f"\n\n---\n{user_signature}"
                
            return generated_content
            
        except Exception as e:
            return f"Error generating draft: {str(e)}"
