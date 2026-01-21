import structlog
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional, Any
from google.cloud import firestore

router = APIRouter()
logger = structlog.get_logger()

# Constants
AUCTIONS_COL = "auctions"

# Models (Frontend IntelligenceSignal aligned)
# Models (Frontend IntelligenceSignal aligned)
class SignalResponse(BaseModel):
    id: str
    category: str = "DISTRESSED_ASSET" # Default category
    headline: str
    conviction: int = 75
    timestamp: str
    analysis: str
    source: Optional[str] = None
    # Rich fields for Deal Card
    ebitda: Optional[str] = None
    revenue: Optional[float] = None
    ev: Optional[float] = None
    advisor: Optional[str] = None
    advisor_url: Optional[str] = None
    deal_date: Optional[str] = None

# DB Helper
def get_db():
    from src.core.config import settings
    return firestore.Client(database=settings.FIRESTORE_DB_NAME)

@router.get("/signals", response_model=List[SignalResponse])
async def get_signals(industry_id: Optional[str] = Query(None)):
    """
    Fetch intelligence signals (auctions/deals) from Firestore.
    Optional filtering by industry/sector context if we had that field.
    """
    try:
        db = get_db()
        col_ref = db.collection(AUCTIONS_COL)
        
        # Order by newest first (ingestion time)
        # Increased limit to 500 to capture historical dataset
        query = col_ref.order_by("ingested_at", direction=firestore.Query.DESCENDING).limit(500)
        
        docs = query.stream()
        
        results = []
        for doc in docs:
            data = doc.to_dict()
            doc_id = doc.id
            
            # Map Firestore AuctionData to SignalResponse
            
            # Headline: Company Name + Status or Description snippet
            company = data.get("company_name", "Unknown Asset")
            status = data.get("process_status")
            headline = f"{company}"
            if status and status.lower() != "unknown":
                 headline += f" - {status}"
            
            # Analysis: Description or raw text snippet
            analysis = data.get("company_description") or data.get("company_profile", {}).get("sic_codes", ["No details"])[0]
            
            # Timestamp: Ingested At or Published At
            # Ensure it's string ISO format
            ts = data.get("ingested_at")
            if ts:
                # If it's a datetime object, isoformat it
                if hasattr(ts, 'isoformat'):
                    ts = ts.isoformat()
                else:
                    ts = str(ts)
            else:
                import datetime
                ts = datetime.datetime.now().isoformat()
            
            # Category inference (simple heuristic)
            cat = "DISTRESSED_ASSET"
            desc_lower = (data.get("company_description") or "").lower()
            if "refinanc" in desc_lower:
                cat = "REFINANCING"
            elif "rate" in desc_lower or "fomc" in desc_lower or "boe" in desc_lower:
                cat = "FOMC_PIVOT"

            # Source - check both 'source' (historical imports) and 'query_source' (live sweeps)
            src = data.get("source") or data.get("query_source") or "Sentinel Sweep"

            signal = SignalResponse(
                id=doc_id,
                category=cat,
                headline=headline,
                conviction=82, # Mock conviction for now until AI scoring is added
                timestamp=ts,
                analysis=analysis or "No deep analysis available.",
                source=src,
                # Map Rich Fields
                ebitda=data.get("ebitda"),
                revenue=data.get("revenue_eur_m"),
                ev=data.get("ev"),
                advisor=data.get("advisor"),
                advisor_url=data.get("advisor_url"),
                deal_date=data.get("deal_date")
            )
            results.append(signal)
            
        # In-memory Sort: specific 'deal_date' takes precedence over 'timestamp' (ingested_at)
        # This fixes the issue where historical imports (alphabetical in Excel) showed up alphabetically
        results.sort(key=lambda x: x.deal_date or x.timestamp, reverse=True)
            
        return results
        
    except Exception as e:
        logger.error("Failed to fetch signals", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))
