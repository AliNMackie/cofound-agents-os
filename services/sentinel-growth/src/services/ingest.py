import json
import structlog
import google.generativeai as genai
from src.core.config import settings
from src.schemas.auctions import AuctionData, AuctionDataEnriched, CompanyProfile
from src.services.enrichment import enrichment_service

logger = structlog.get_logger()

class AuctionIngestor:
    def __init__(self):
        if settings.GOOGLE_API_KEY:
            genai.configure(api_key=settings.GOOGLE_API_KEY)
            self.model = genai.GenerativeModel('gemini-3-pro-preview')
        else:
            logger.warning("GOOGLE_API_KEY not set. Extraction will fail.")
            self.model = None

    async def ingest_auction_text(self, source_text: str, origin: str) -> AuctionDataEnriched:
        """
        Extracts auction data from text using Gemini and enriches with Companies House data.
        """
        if not self.model:
            raise ValueError("Google API Key not configured")

        log = logger.bind(origin=origin)
        
        prompt = f"""
        You are a financial analyst extraction engine.
        Extract the following fields from the text below into JSON format:
        - Company Name
        - Company Description
        - EBITDA
        - Ownership
        - Advisor
        - Process Status

        Input Text:
        "{source_text}"

        Output JSON only.
        """

        try:
            response = self.model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                     response_mime_type="application/json"
                )
            )
            
            try:
                extracted_json = json.loads(response.text)
            except json.JSONDecodeError:
                 log.error("Failed to parse JSON from model response", response_text=response.text)
                 raise ValueError("Model did not return valid JSON")
            
            # Validate and create AuctionData
            auction_data = AuctionData(**extracted_json)
            
            # Enrich with Companies House data
            log.info("Enriching company data", company_name=auction_data.company_name)
            company_profile = await enrichment_service.enrich_company_data(auction_data.company_name)
            
            # Create enriched version
            enriched_data = AuctionDataEnriched(
                **auction_data.model_dump(),
                company_profile=company_profile
            )
            
            if company_profile:
                log.info("Successfully enriched company data",
                        registration_number=company_profile.registration_number)
            else:
                log.warning("No enrichment data found for company")
            
            return enriched_data

        except Exception as e:
            log.error("Extraction failed", error=str(e))
            raise e

# Singleton instance
auction_ingestor = AuctionIngestor()
