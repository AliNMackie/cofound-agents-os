import structlog
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from src.schemas.auctions import AuctionData, RiskTier

logger = structlog.get_logger()

class ShadowMarketService:
    """
    Transforms objective Companies House filings into actionable Growth & Rescue signals.
    """
    
    def normalize_ch_event(self, raw_event: Dict[str, Any], company_name: str) -> Dict[str, Any]:
        """
        Normalizes raw CH API data (charges, psc, filings) into an internal lead model.
        """
        event_type = raw_event.get("type", "generic_filing")
        
        # Scoring logic based on strategic plan
        score = 50 # Default middle ground
        signal_type = "RESCUE" # Default to rescue (risk)
        reason = "New regulatory filing detected"
        
        # 1. CHARGES / DEBENTURES (Growth Signal)
        if "charge" in event_type or "debenture" in raw_event.get("description", "").lower():
            signal_type = "GROWTH"
            score = 85
            reason = "New Debt/Debenture registration (Potential M&A or expansion financing)"
            
        # 2. PSC CHANGES (Ownership/Growth)
        elif "psc" in event_type:
            description = raw_event.get("description", "").lower()
            if any(k in description for k in ["fund", "llp", "private equity", "investment"]):
                signal_type = "GROWTH"
                score = 90
                reason = "Ownership change to Investment/PE vehicle (Confirmed M&A)"
            else:
                reason = "Control change detected"

        # 3. TENURE-BASED EXIT TRIGGER
        # (Assuming 'tenure_years' is passed in or calculated from incorporation)
        tenure = raw_event.get("tenure_years", 0)
        if tenure >= 5:
            score = max(score, 70)
            reason += " | High-Likelihood Exit (PE hold > 5 years)"

        return {
            "company_name": company_name,
            "signal_type": signal_type,
            "conviction_score": score,
            "analysis": reason,
            "source_family": "GOV_REGISTRY",
            "metadata": raw_event
        }

    def map_to_signal(self, normalized_lead: Dict[str, Any]) -> Dict[str, Any]:
        """
        Maps the normalized lead to the 'auctions' Firestore schema.
        """
        return {
            "company_name": normalized_lead["company_name"],
            "headline": f"CH ALERT: {normalized_lead['analysis']}",
            "analysis": f"Companies House event detected for {normalized_lead['company_name']}. Score: {normalized_lead['conviction_score']}/100.",
            "source": "Companies House API",
            "source_link": f"https://find-and-update.company-information.service.gov.uk/company/{normalized_lead.get('metadata', {}).get('company_number', '')}",
            "published_at": datetime.now(timezone.utc).isoformat(),
            "ingested_at": datetime.now(timezone.utc),
            "signal_type": normalized_lead["signal_type"],
            "source_family": "GOV_REGISTRY",
            "conviction_score": normalized_lead["conviction_score"],
            "category": "INSIDER_SIGNAL"
        }

    # ──────────────── Counterparty Risk Intelligence (Sprint 2) ────────────────

    def evaluate_risk_signals(self, extracted_json: Dict[str, Any]) -> RiskTier:
        """
        Deterministic rules engine: maps LLM-extracted Companies House signals
        to the RiskTier taxonomy.

        Decision tree (evaluated top-down, first match wins):
        ┌─────────────────────────────────────────────────────────────┐
        │ ELEVATED_RISK  if ANY of:                                   │
        │   • new_charge_registered == True                           │
        │   • director_resigned == True                               │
        │   • overdue_filings_detected == True                        │
        │   • psc_change_detected == True                             │
        │   • director_churn_count is negative (net loss of directors) │
        ├─────────────────────────────────────────────────────────────┤
        │ IMPROVED  if ALL of:                                        │
        │   • debt_cleared == True                                    │
        │   • None of the ELEVATED triggers fired                     │
        ├─────────────────────────────────────────────────────────────┤
        │ STABLE  otherwise                                           │
        └─────────────────────────────────────────────────────────────┘

        Args:
            extracted_json: The parsed JSON dict from the LLM extraction containing
                           boolean signal fields and metadata.

        Returns:
            A RiskTier enum value.
        """
        # ── Elevated Risk Triggers ──
        elevated_triggers = [
            extracted_json.get("new_charge_registered", False) is True,
            extracted_json.get("director_resigned", False) is True,
            extracted_json.get("overdue_filings_detected", False) is True,
            extracted_json.get("psc_change_detected", False) is True,
            (extracted_json.get("director_churn_count", 0) or 0) < 0,
        ]

        if any(elevated_triggers):
            logger.info(
                "Risk evaluation: ELEVATED_RISK",
                company=extracted_json.get("company_name", "Unknown"),
                triggers=[
                    name for name, fired in zip(
                        ["new_charge", "director_resigned", "overdue_filings", "psc_change", "negative_churn"],
                        elevated_triggers,
                    ) if fired
                ],
            )
            return RiskTier.ELEVATED_RISK

        # ── Improved Triggers ──
        if extracted_json.get("debt_cleared", False) is True:
            logger.info(
                "Risk evaluation: IMPROVED",
                company=extracted_json.get("company_name", "Unknown"),
            )
            return RiskTier.IMPROVED

        # ── Default ──
        logger.info(
            "Risk evaluation: STABLE",
            company=extracted_json.get("company_name", "Unknown"),
        )
        return RiskTier.STABLE

    # ──────────────── Talent Intelligence (Sprint 8) ────────────────

    def evaluate_talent_signals(self, talent_data: Dict[str, Any]) -> str:
        """
        Deterministic rules engine for talent-derived signals.

        Decision tree (evaluated top-down, first match wins):
        ┌──────────────────────────────────────────────────────────┐
        │ KEY_PERSON_RISK if:                                       │
        │   • Any key_hire_departure has role containing             │
        │     CFO, CTO, CEO, COO, General Counsel, Head of Legal    │
        │     AND type == 'DEPARTURE'                               │
        ├──────────────────────────────────────────────────────────┤
        │ CONTRACTION_SIGNAL if:                                    │
        │   • hiring_velocity_pct < -20%                            │
        │   • AND active_job_postings == 0                           │
        ├──────────────────────────────────────────────────────────┤
        │ RAPID_GROWTH if:                                          │
        │   • hiring_velocity_pct > 30%                             │
        ├──────────────────────────────────────────────────────────┤
        │ STABLE_TALENT otherwise                                   │
        └──────────────────────────────────────────────────────────┘
        """
        company = talent_data.get("company_name", "Unknown")
        hiring_velocity = talent_data.get("hiring_velocity_pct", 0.0)
        active_postings = talent_data.get("active_job_postings", 0)
        departures = talent_data.get("key_hire_departures", [])

        # ── KEY_PERSON_RISK ──
        key_roles = {
            "cfo", "cto", "ceo", "coo", "chief financial officer",
            "chief technology officer", "chief executive officer",
            "chief operating officer", "general counsel",
            "head of legal", "chief legal officer",
        }
        for dep in departures:
            role = str(dep.get("role", "")).lower().strip()
            dep_type = str(dep.get("type", "")).upper()
            if dep_type == "DEPARTURE" and any(kr in role for kr in key_roles):
                logger.info(
                    "Talent evaluation: KEY_PERSON_RISK",
                    company=company,
                    role=dep.get("role"),
                )
                return "KEY_PERSON_RISK"

        # ── CONTRACTION_SIGNAL ──
        if hiring_velocity < -20.0 and active_postings == 0:
            logger.info(
                "Talent evaluation: CONTRACTION_SIGNAL",
                company=company,
                hiring_velocity=hiring_velocity,
            )
            return "CONTRACTION_SIGNAL"

        # ── RAPID_GROWTH ──
        if hiring_velocity > 30.0:
            logger.info(
                "Talent evaluation: RAPID_GROWTH",
                company=company,
                hiring_velocity=hiring_velocity,
            )
            return "RAPID_GROWTH"

        # ── Default ──
        logger.info("Talent evaluation: STABLE_TALENT", company=company)
        return "STABLE_TALENT"

    def evaluate_cross_vector_risk(
        self,
        financial_risk_tier: str,
        talent_signal: str,
    ) -> Optional[str]:
        """
        Cross-vector fusion: compound financial and talent signals.

        If financial risk is ELEVATED_RISK AND talent is CONTRACTION_SIGNAL,
        return CRITICAL_DISTRESS — a compounded signal that neither vector
        alone can produce.

        Returns:
            'CRITICAL_DISTRESS' if both conditions met, else None.
        """
        if (
            financial_risk_tier == "ELEVATED_RISK"
            and talent_signal == "CONTRACTION_SIGNAL"
        ):
            logger.warning(
                "Cross-vector fusion: CRITICAL_DISTRESS detected",
                financial=financial_risk_tier,
                talent=talent_signal,
            )
            return "CRITICAL_DISTRESS"
        return None


shadow_market = ShadowMarketService()

