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

import io
from pypdf import PdfReader

@router.post("/api/ingest-intelligence")
async def ingest_intelligence_pdf(file: UploadFile = File(...)):
    """
    Multimodal PDF ingestion for deal intelligence using Gemini 1.5 Pro.
    Now with Active Optic Nerve: Extracts real text from PDF files.
    """
    log = logger.bind(filename=file.filename)
    try:
        content = await file.read()
        
        # 1. Active Optic Nerve: Extract Text from PDF Bytes
        pdf_file = io.BytesIO(content)
        reader = PdfReader(pdf_file)
        
        full_text = []
        for i, page in enumerate(reader.pages):
           try:
               text = page.extract_text()
               if text:
                   full_text.append(f"--- Page {i+1} ---\n{text}")
           except Exception as e:
               log.warning("Failed to extract page text", page=i, error=str(e))
               
        extracted_text = "\n".join(full_text)
        
        # Fallback if PDF is image-only (Scanned)
        if not extracted_text.strip():
             log.warning("PDF appears to be empty or scanned images only", pages=len(reader.pages))
             extracted_text = f"[WARNING: PDF Scanned/Empty] Filename: {file.filename}"

        log.info("PDF Text Extracted", pages=len(reader.pages), chars=len(extracted_text))

        # 2. Pass REAL text to the AI Engine
        auction_data = await auction_ingestor.ingest_auction_text(
            extracted_text, 
            origin=f"pdf_upload:{file.filename}"
        )
        
        return auction_data

    except Exception as e:
        import traceback
        log.error("PDF Ingestion failed", error=str(e), traceback=traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"PDF Ingestion failed: {str(e)}")
