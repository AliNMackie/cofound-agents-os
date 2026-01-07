import json
import structlog
import google.generativeai as genai
from fastapi import APIRouter, HTTPException
from src.schemas.requests import AuctionIngestRequest
from src.schemas.auctions import AuctionDataEnriched
from src.core.config import settings
from src.services.ingest import auction_ingestor

router = APIRouter()
logger = structlog.get_logger()

@router.post("/ingest/auction", response_model=AuctionDataEnriched)
async def extract_auction_data(request: AuctionIngestRequest):
    """
    Extracts structured auction data from unstructured market intelligence text.
    Enriches with Companies House data.
    """
    log = logger.bind(source_origin=request.source_origin)
    log.info("Received auction ingestion request")

    try:
        # Use the reusable service (now with enrichment)
        auction_data = await auction_ingestor.ingest_auction_text(request.source_text, request.source_origin)
        
        log.info("Extraction successful", 
                company=auction_data.company_name,
                enriched=auction_data.company_profile is not None)
        return auction_data

    except Exception as e:
        log.error("Extraction failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")
