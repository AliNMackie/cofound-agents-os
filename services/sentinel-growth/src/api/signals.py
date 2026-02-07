from fastapi import APIRouter, HTTPException, Query, Response
from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from google.cloud import firestore
import datetime
from src.services.pdf_factory import render_pdf

router = APIRouter()
logger = structlog.get_logger()

# Constants
AUCTIONS_COL = "auctions"

class DossierRequest(BaseModel):
    signal_id: str
    theme: str = "INSTITUTIONAL"

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
    source_link: Optional[str] = None

# DB Helper
def get_db():
    from src.core.config import settings
    return firestore.Client(database=settings.FIRESTORE_DB_NAME)

@router.get("/signals", response_model=List[SignalResponse])
async def get_signals(
    industry_id: Optional[str] = Query(None),
    days: Optional[int] = Query(None, description="Number of days of history to fetch"),
    q: Optional[str] = Query(None, description="Search query for company or sector")
):
    """
    Fetch intelligence signals (auctions/deals) from Firestore.
    """
    try:
        db = get_db()
        col_ref = db.collection(AUCTIONS_COL)
        
        # Base query: Order by newest first (ingestion time)
        query = col_ref.order_by("ingested_at", direction=firestore.Query.DESCENDING)
        
        # Apply time filter if requested
        if days:
            import datetime
            cutoff_date = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=days)
            query = query.where("ingested_at", ">=", cutoff_date)
        
        # Limit to avoid massive payloads
        query = query.limit(1000)
        
        docs = query.stream()
        
        results = []
        q_lower = q.lower() if q else None
        
        for doc in docs:
            data = doc.to_dict()
            doc_id = doc.id
            
            # Map Firestore AuctionData to SignalResponse
            
            # Headline: Company Name + Status or Description snippet
            company = data.get("company_name", "Unknown Asset")
            status = data.get("process_status")
            analysis = data.get("company_description") or data.get("company_profile", {}).get("sic_codes", ["No details"])[0]
            
            # Keyword Filtering (Case-Insensitive)
            if q_lower:
                match = (
                    q_lower in company.lower() or
                    q_lower in (analysis or "").lower() or
                    q_lower in (status or "").lower() or
                    q_lower in (data.get("industry_id") or "").lower()
                )
                if not match:
                    continue

            headline = f"{company}"
            if status and status.lower() != "unknown":
                 headline += f" - {status}"
            
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
                deal_date=data.get("deal_date"),
                source_link=data.get("source_link")
            )
            results.append(signal)
            
        # In-memory Sort: Prioritize 'timestamp' (ingested_at) to ensure the LATEST sweep results appear top of feed.
        # Fallback to 'deal_date' only if useful, but for a "Pulse", recency of discovery is king.
        results.sort(key=lambda x: x.timestamp, reverse=True)
            
        return results
        
    except Exception as e:
        logger.error("Failed to fetch signals", error=str(e))
        raise HTTPException(
            status_code=500, 
            detail=f"Signal Repository Offline: {str(e)}"
        )

@router.post("/generate/dossier")
async def generate_dossier(request: DossierRequest):
    """
    Generates a high-fidelity institutional intelligence dossier for a specific signal.
    """
    try:
        db = get_db()
        doc_ref = db.collection(AUCTIONS_COL).document(request.signal_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Signal not found")
        
        data = doc.to_dict()
        company_name = data.get("company_name", "Unknown Asset")
        
        # 1. Fetch historical momentum (12 months)
        cutoff_date = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=365)
        momentum_query = db.collection(AUCTIONS_COL)\
            .where("company_name", "==", company_name)\
            .where("ingested_at", ">=", cutoff_date)\
            .order_by("ingested_at", direction=firestore.Query.DESCENDING)\
            .limit(10)
        
        momentum_docs = momentum_query.stream()
        momentum_timeline = []
        for mdoc in momentum_docs:
            mdata = mdoc.to_dict()
            ts = mdata.get("ingested_at")
            date_str = ts.strftime("%b %Y") if hasattr(ts, 'strftime') else "Recent"
            momentum_timeline.append({
                "date": date_str,
                "headline": mdata.get("headline", "Signal Detected"),
                "analysis": mdata.get("analysis", "Market sweep detection.")[:200] + "..."
            })

        # 2. Prepare data contract
        dossier_data = {
            "company_name": company_name,
            "signal_type": data.get("signal_type", "RESCUE"),
            "signal_id": request.signal_id,
            "source_family": data.get("source_family", "RSS_NEWS"),
            "current_date": datetime.datetime.now().strftime("%d %B %Y"),
            "executive_summary": data.get("analysis", "Institutional grade intelligence sweep in progress."),
            "financial_indicators": {
                "ebitda": data.get("ebitda", "TBC"),
                "revenue": f"€{data.get('revenue_eur_m', 'TBC')}M" if data.get('revenue_eur_m') else "TBC",
                "ev": f"€{data.get('ev', 'TBC')}M" if data.get('ev') else "TBC",
                "leverage": data.get("leverage", "TBC"),
            },
            "financial_benchmarks": {
                "ebitda": "Sector average: 4.5x",
                "revenue": "Top quartile",
                "ev": "Market cap weighted",
                "leverage": "High risk > 4.0x"
            },
            "momentum_timeline": momentum_timeline,
            "sector": data.get("industry_id", "General Mid-Market"),
            "sector_context": "The target operates within a high-sensitivity sector currently experiencing significant consolidation pressure.",
            "theme": request.theme.upper() if request.theme else "INSTITUTIONAL"
        }

        # 3. Render PDF
        pdf_bytes = await render_pdf(dossier_data, "dossier_intelligence.html")
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=Dossier_{company_name.replace(' ', '_')}.pdf"
            }
        )

    except Exception as e:
        logger.error("Dossier generation failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/signals/{signal_id}/watchlist")
async def add_to_watchlist(signal_id: str):
    """
    Marks a signal as 'WATCHLIST' for tracking.
    """
    try:
        db = get_db()
        doc_ref = db.collection(AUCTIONS_COL).document(signal_id)
        doc_ref.update({
            "review_status": "WATCHLIST",
            "reviewed_at": datetime.datetime.now(datetime.timezone.utc)
        })
        return {"status": "success", "message": f"Signal {signal_id} added to watchlist"}
    except Exception as e:
        logger.error("Failed to add signal to watchlist", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/signals/{signal_id}/ignore")
async def ignore_signal(signal_id: str):
    """
    Marks a signal as 'IGNORED' so it can be filtered out.
    """
    try:
        db = get_db()
        doc_ref = db.collection(AUCTIONS_COL).document(signal_id)
        doc_ref.update({
            "review_status": "IGNORED",
            "reviewed_at": datetime.datetime.now(datetime.timezone.utc)
        })
        return {"status": "success", "message": f"Signal {signal_id} ignored"}
    except Exception as e:
        logger.error("Failed to ignore signal", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/pulses/latest")
async def get_latest_pulse():
    """
    Retrieves the most recent Morning Pulse.
    """
    try:
        db = get_db()
        # Get pulse for today, or most recent.
        pulses = db.collection("morning_pulses")\
            .order_by("generated_at", direction=firestore.Query.DESCENDING)\
            .limit(1)\
            .stream()
        
        for p in pulses:
            return p.to_dict()
            
        raise HTTPException(status_code=404, detail="No pulse available")
    except Exception as e:
        logger.error("Failed to fetch latest pulse", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))
