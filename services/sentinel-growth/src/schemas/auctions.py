from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum


class CounterpartyType(str, Enum):
    """Classification of the entity's relationship to the monitoring institution."""
    BORROWER = "BORROWER"
    SUPPLIER = "SUPPLIER"
    INSURED = "INSURED"


class RiskTier(str, Enum):
    """Risk classification assigned by the Shadow Market scoring engine."""
    ELEVATED_RISK = "ELEVATED_RISK"
    STABLE = "STABLE"
    IMPROVED = "IMPROVED"
    UNSCORED = "UNSCORED"


class TalentSignal(str, Enum):
    """Talent-derived signal classification."""
    RAPID_GROWTH = "RAPID_GROWTH"
    KEY_PERSON_RISK = "KEY_PERSON_RISK"
    CONTRACTION_SIGNAL = "CONTRACTION_SIGNAL"
    CRITICAL_DISTRESS = "CRITICAL_DISTRESS"
    STABLE_TALENT = "STABLE_TALENT"


class HumanCapital(BaseModel):
    """Human capital analytics sub-schema for talent intelligence (Sprint 8)."""
    headcount_delta: int = Field(0, description="Net change in headcount over analysis period")
    key_hire_departures: List[dict] = Field(default_factory=list, description="List of key hire/departure events: [{name, role, type: 'HIRE'|'DEPARTURE', date}]")
    hiring_velocity_pct: float = Field(0.0, description="Percentage change in job posting volume over 30 days")
    talent_concentration: dict = Field(default_factory=dict, description="Department breakdown: {tech: 0.4, ops: 0.3, sales: 0.2, other: 0.1}")
    active_job_postings: int = Field(0, description="Current number of active job postings")
    talent_signal: Optional[str] = Field(None, description="Derived talent signal: RAPID_GROWTH, KEY_PERSON_RISK, etc.")


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

    # Counterparty Risk Intelligence Fields (Sprint 1)
    counterparty_type: Optional[CounterpartyType] = Field(None, description="Relationship type: BORROWER, SUPPLIER, or INSURED")
    risk_tier: RiskTier = Field(RiskTier.UNSCORED, description="Risk classification: ELEVATED_RISK, STABLE, IMPROVED, UNSCORED")
    monitoring_portfolio_id: Optional[str] = Field(None, description="ID of the monitoring portfolio this entity belongs to")

    # Human Capital Analytics (Sprint 8)
    human_capital: Optional[HumanCapital] = Field(None, description="Talent intelligence data: hiring velocity, departures, concentration")

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
