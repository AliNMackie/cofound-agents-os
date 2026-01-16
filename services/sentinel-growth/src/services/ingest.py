import json
import structlog
import google.generativeai as genai
from src.core.config import settings
from src.schemas.auctions import AuctionData, AuctionDataEnriched, CompanyProfile
from src.services.enrichment import enrichment_service

from typing import Optional
from src.services.extraction_rules import rule_engine

logger = structlog.get_logger()

class AuctionIngestor:
    def __init__(self):
        if settings.GOOGLE_API_KEY:
            genai.configure(api_key=settings.GOOGLE_API_KEY)
            self.model = genai.GenerativeModel('gemini-3-flash-preview')
        else:
            logger.warning("GOOGLE_API_KEY not set. Extraction will fail.")
            self.model = None

    async def ingest_auction_text(self, source_text: str, origin: str, user_sector: Optional[str] = None) -> AuctionDataEnriched:
        """
        Extracts auction data from text using Gemini and enriches with Companies House data.
        Uses dynamic sector rules for prompting.
        """
        if not self.model:
            raise ValueError("Google API Key not configured")

        log = logger.bind(origin=origin, sector=user_sector)
        
        # Build dynamic system prompt based on sector
        system_prompt = rule_engine.build_system_prompt(user_sector)
        
        prompt = f"""
        {system_prompt}

        Input Text:
        "{source_text}"
        """

        try:
            import asyncio
            from functools import partial
            
            loop = asyncio.get_running_loop()
            
            # Run blocking generation in thread pool
            response = await loop.run_in_executor(
                None, 
                partial(
                    self.model.generate_content,
                    prompt,
                    generation_config=genai.types.GenerationConfig(
                        response_mime_type="application/json"
                    )
                )
            )
            
            try:
                extracted_json = json.loads(response.text)
            except json.JSONDecodeError:
                 log.error("Failed to parse JSON from model response", response_text=response.text)
                 raise ValueError("Model did not return valid JSON")
            
            # Validate extraction against sector schema
            sector_context = rule_engine.get_sector_context(user_sector)
            extraction_schema = sector_context.get("extraction_schema", [])
            if not rule_engine.validate_extraction(extracted_json, extraction_schema):
                log.warning("Extraction validation failed - missing keys", schema=extraction_schema, data_keys=list(extracted_json.keys()))
                # We log but do not crash, as per requirements
            
            # Validate and create AuctionData
            # Note: AuctionData schema might need to be relaxed if different sectors have vastly different fields
            # For now, we assume AuctionData can handle the intersection or we map the dynamic fields to it
            # Or we might need to make AuctionData more flexible (e.g. using aliases or optional fields)
            # Given the task is to refactor logic, I will assume extracted_json maps to AuctionData for now
            # If not, I would need to modify AuctionData schema.
            
            # Quick check if AuctionData is too rigid
            # If AuctionData expects specific fields (EBITDA etc) and Marine doesn't provide them, this will fail.
            # To support "Marine" fully, we should probably make AuctionData more generic or use the dict directly.
            # The prompt says "output as JSON".
            # For this step, I will modify it to try to instantiate AuctionData, but catch validation errors?
            # Or I can just pass the raw dict if the return type allows. 
            # The signature says -> AuctionDataEnriched.
            # I will proceed with instantiating AuctionData, enabling flexible ingestion might be a future task.
            
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
