from pydantic import BaseModel, Field
from typing import Optional, List

class AuctionData(BaseModel):
    company_name: Optional[str] = Field(None, description="Name of the company involved in the auction")
    company_description: Optional[str] = Field(None, description="Context/Description of the business")
    ebitda: Optional[str] = Field(None, description="EBITDA figures (e.g. £5.5m)")
    ownership: Optional[str] = Field(None, description="Current ownership (e.g. Private Equity backer)")
    advisor: Optional[str] = Field(None, description="Advisor managing the process (e.g. Rothschild)")
    process_status: Optional[str] = Field(None, description="Status of the auction (e.g. Postponed, H1 2024)")

    # Advanced Intelligence Fields
    signal_type: str = Field("GROWTH", description="RESCUE or GROWTH")
    conviction_score: int = Field(0, ge=0, le=100)
    sentiment_score: float = Field(0.0, description="-1.0 to 1.0 sentiment analysis")
    momentum_score: float = Field(0.0, description="0.0 to 1.0 based on historical activity")

    class Config:
        extra = "allow"

class CompanyProfile(BaseModel):
    """Enriched company data from Companies House or other sources"""
    registration_number: Optional[str] = Field(None, description="Company registration number")
    incorporation_date: Optional[str] = Field(None, description="Date of incorporation (YYYY-MM-DD)")
    sic_codes: Optional[List[str]] = Field(None, description="SIC codes with descriptions")
    registered_address: Optional[str] = Field(None, description="Registered office address")
    company_status: Optional[str] = Field(None, description="Company status (e.g. active, dissolved)")
    company_type: Optional[str] = Field(None, description="Company type (e.g. ltd, plc)")

class AuctionDataEnriched(AuctionData):
    """AuctionData with enriched company profile"""
    company_profile: Optional[CompanyProfile] = Field(None, description="Enriched company data")
