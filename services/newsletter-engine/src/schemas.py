from pydantic import BaseModel
from typing import List, Dict, Optional, Any

class DraftRequest(BaseModel):
    # The list of failed auctions selected by the user
    # Each dict typically contains: lot_number, auction_house, guide_price, final_bid, description, etc.
    raw_data: List[Dict[str, Any]] 
    
    # The selected mode: "weekly_wrap", "opportunities", "risk_view", "sector_dive", "market_sweep"
    template_id: str 
    
    # The free-form text box for specific instructions
    free_form_instruction: Optional[str] = None 
    
    # The user's saved HTML signature
    user_signature: Optional[str] = None

    # The branding voice instruction block (optional)
    branding_instruction: Optional[str] = None

    # The Industry Context macro string (optional)
    industry_context: Optional[str] = None
