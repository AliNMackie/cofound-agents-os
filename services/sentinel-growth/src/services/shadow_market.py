import structlog
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from src.schemas.auctions import AuctionData

logger = structlog.get_logger()

class ShadowMarketService:
    """
    Transforms objective Companies House filings into actionable Growth & Rescue signals.
    """
    
    def normalize_ch_event(self, raw_event: Dict[str, Any], company_name: str) -> Dict[str, Any]:
        """
        Normalizes raw CH API data (charges, psc, filings) into an internal lead model.
        """
        event_type = raw_event.get("type", "generic_filing")
        
        # Scoring logic based on strategic plan
        score = 50 # Default middle ground
        signal_type = "RESCUE" # Default to rescue (risk)
        reason = "New regulatory filing detected"
        
        # 1. CHARGES / DEBENTURES (Growth Signal)
        if "charge" in event_type or "debenture" in raw_event.get("description", "").lower():
            signal_type = "GROWTH"
            score = 85
            reason = "New Debt/Debenture registration (Potential M&A or expansion financing)"
            
        # 2. PSC CHANGES (Ownership/Growth)
        elif "psc" in event_type:
            description = raw_event.get("description", "").lower()
            if any(k in description for k in ["fund", "llp", "private equity", "investment"]):
                signal_type = "GROWTH"
                score = 90
                reason = "Ownership change to Investment/PE vehicle (Confirmed M&A)"
            else:
                reason = "Control change detected"

        # 3. TENURE-BASED EXIT TRIGGER
        # (Assuming 'tenure_years' is passed in or calculated from incorporation)
        tenure = raw_event.get("tenure_years", 0)
        if tenure >= 5:
            score = max(score, 70)
            reason += " | High-Likelihood Exit (PE hold > 5 years)"

        return {
            "company_name": company_name,
            "signal_type": signal_type,
            "conviction_score": score,
            "analysis": reason,
            "source_family": "GOV_REGISTRY",
            "metadata": raw_event
        }

    def map_to_signal(self, normalized_lead: Dict[str, Any]) -> Dict[str, Any]:
        """
        Maps the normalized lead to the 'auctions' Firestore schema.
        """
        return {
            "company_name": normalized_lead["company_name"],
            "headline": f"CH ALERT: {normalized_lead['analysis']}",
            "analysis": f"Companies House event detected for {normalized_lead['company_name']}. Score: {normalized_lead['conviction_score']}/100.",
            "source": "Companies House API",
            "source_link": f"https://find-and-update.company-information.service.gov.uk/company/{normalized_lead.get('metadata', {}).get('company_number', '')}",
            "published_at": datetime.now(timezone.utc).isoformat(),
            "ingested_at": datetime.now(timezone.utc),
            "signal_type": normalized_lead["signal_type"],
            "source_family": "GOV_REGISTRY",
            "conviction_score": normalized_lead["conviction_score"],
            "category": "INSIDER_SIGNAL"
        }

shadow_market = ShadowMarketService()
