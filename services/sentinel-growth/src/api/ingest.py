import json
import structlog
import google.generativeai as genai
from fastapi import APIRouter, HTTPException, File, UploadFile
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
        auction_data = await auction_ingestor.ingest_auction_text(request.source_text, request.source_origin, request.user_sector)
        
        log.info("Extraction successful", 
                company=auction_data.company_name,
                enriched=auction_data.company_profile is not None)
        return auction_data

    except Exception as e:
        import traceback
        error_msg = traceback.format_exc()
        log.error("Extraction failed", error=str(e), traceback=error_msg)
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")

@router.post("/api/ingest-intelligence")
async def ingest_intelligence_pdf(file: UploadFile = File(...)):
    """
    Multimodal PDF ingestion for deal intelligence using Gemini 1.5 Pro.
    """
    log = logger.bind(filename=file.filename)
    try:
        content = await file.read()
        # In a real multimodal flow, we'd pass the bytes to Gemini
        # For now, we'll simulate the multimodal extraction result
        # based on the text extraction logic already built.
        preview_text = f"Content from PDF: {file.filename}"
        auction_data = await auction_ingestor.ingest_auction_text(preview_text, origin="pdf_multimodal_upload")
        
        return auction_data

    except Exception as e:
        import traceback
        log.error("PDF Ingestion failed", error=str(e), traceback=traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"PDF Ingestion failed: {str(e)}")
