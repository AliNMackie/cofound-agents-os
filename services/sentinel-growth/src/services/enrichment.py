# src/services/enrichment.py
import os
import structlog
from typing import Optional, List, Dict, Any
import httpx
from src.schemas.auctions import CompanyProfile

logger = structlog.get_logger()

class CompanyEnrichmentService:
    """
    Service for enriching company data using Companies House API.
    
    API Docs: https://developer.company-information.service.gov.uk/
    """
    
    def __init__(self):
        self.api_key = os.getenv("COMPANIES_HOUSE_API_KEY", "")
        self.base_url = "https://api.company-information.service.gov.uk"
        self.cache = {}  # Simple in-memory cache
        
    async def enrich_company_data(self, company_name: str) -> Optional[CompanyProfile]:
        """
        Enriches company data by searching Companies House and fetching company profile.
        
        Args:
            company_name: Name of the company to enrich
            
        Returns:
            CompanyProfile with enriched data, or None if not found
        """
        if not company_name or len(company_name) < 2:
            logger.warning("Company name too short for enrichment", company_name=company_name)
            return None
            
        # Check cache first
        cache_key = company_name.lower().strip()
        if cache_key in self.cache:
            logger.info("Returning cached company profile", company_name=company_name)
            return self.cache[cache_key]
        
        log = logger.bind(company_name=company_name)
        
        # If no API key, return stubbed data for development
        if not self.api_key:
            log.warning("No Companies House API key configured, returning stub data")
            return self._get_stub_data(company_name)
        
        try:
            # Step 1: Search for company to get company number
            company_number = await self._search_company(company_name)
            if not company_number:
                log.info("Company not found in Companies House search")
                return None
            
            # Step 2: Fetch full company profile
            profile = await self._fetch_company_profile(company_number)
            
            # Cache the result
            if profile:
                self.cache[cache_key] = profile
                log.info("Successfully enriched company data", 
                        registration_number=profile.registration_number)
            
            return profile
            
        except Exception as e:
            log.error("Error enriching company data", error=str(e))
            return None
    
    async def _search_company(self, company_name: str) -> Optional[str]:
        """Search for company and return company number"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/search/companies",
                params={"q": company_name, "items_per_page": 1},
                auth=(self.api_key, ""),
                timeout=10.0
            )
            
            if response.status_code != 200:
                logger.error("Companies House search failed", 
                           status_code=response.status_code)
                return None
            
            data = response.json()
            items = data.get("items", [])
            
            if not items:
                return None
            
            # Return the company number of the first match
            return items[0].get("company_number")
    
    async def _fetch_company_profile(self, company_number: str) -> Optional[CompanyProfile]:
        """Fetch full company profile from Companies House"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/company/{company_number}",
                auth=(self.api_key, ""),
                timeout=10.0
            )
            
            if response.status_code != 200:
                logger.error("Failed to fetch company profile",
                           company_number=company_number,
                           status_code=response.status_code)
                return None
            
            data = response.json()
            
            # Extract registered address
            address_data = data.get("registered_office_address", {})
            address_parts = [
                address_data.get("address_line_1"),
                address_data.get("address_line_2"),
                address_data.get("locality"),
                address_data.get("postal_code"),
            ]
            registered_address = ", ".join([p for p in address_parts if p])
            
            # Extract SIC codes with descriptions
            sic_codes = []
            for sic in data.get("sic_codes", []):
                sic_codes.append(sic)
            
            return CompanyProfile(
                registration_number=data.get("company_number"),
                incorporation_date=data.get("date_of_creation"),
                sic_codes=sic_codes,
                registered_address=registered_address,
                company_status=data.get("company_status"),
                company_type=data.get("type")
            )

    async def fetch_company_charges(self, company_number: str) -> List[Dict[str, Any]]:
        """Fetch company charges/mortgages from Companies House"""
        if not self.api_key:
            return []
            
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/company/{company_number}/charges",
                auth=(self.api_key, ""),
                timeout=10.0
            )
            
            if response.status_code != 200:
                logger.error("Failed to fetch charges", company_number=company_number)
                return []
                
            return response.json().get("items", [])

    async def fetch_company_pscs(self, company_number: str) -> List[Dict[str, Any]]:
        """Fetch Persons with Significant Control (PSC) from Companies House"""
        if not self.api_key:
            return []
            
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/company/{company_number}/persons-with-significant-control",
                auth=(self.api_key, ""),
                timeout=10.0
            )
            
            if response.status_code != 200:
                logger.error("Failed to fetch PSCs", company_number=company_number)
                return []
                
            return response.json().get("items", [])
    
    def _get_stub_data(self, company_name: str) -> CompanyProfile:
        """Returns stub data for development/testing when no API key is available"""
        # Provide realistic stub data based on company name
        stubs = {
            "gamenation": CompanyProfile(
                registration_number="12345678",
                incorporation_date="2010-05-20",
                sic_codes=["92000 - Gambling and betting activities"],
                registered_address="123 High Street, London, SW1A 1AA",
                company_status="active",
                company_type="ltd"
            ),
            "default": CompanyProfile(
                registration_number="00000000",
                incorporation_date="2020-01-01",
                sic_codes=["99999 - Other service activities"],
                registered_address="1 Example Street, London, EC1A 1BB",
                company_status="active",
                company_type="ltd"
            )
        }
        
        # Try to match company name to stub
        name_key = company_name.lower().replace(" ", "")
        return stubs.get(name_key, stubs["default"])

# Singleton instance
enrichment_service = CompanyEnrichmentService()
