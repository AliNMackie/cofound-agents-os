import json
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional

logger = logging.getLogger("sentinel.extraction_rules")

class SectorLogicController:
    def __init__(self):
        self.config = self.load_sector_config()

    def load_sector_config(self) -> Dict[str, Any]:
        """
        Load the sector_presets.json file from the core directory.
        """
        try:
            # Assumes this file is in src/services/ and config is in src/core/
            config_path = Path(__file__).parent.parent / "core" / "sector_presets.json"
            
            if not config_path.exists():
                logger.critical(f"Sector configuration not found at {config_path}")
                raise FileNotFoundError(f"Missing sector_presets.json at {config_path}")
                
            with open(config_path, "r") as f:
                data = json.load(f)
                logger.info("Sector configuration loaded successfully.")
                return data
        except Exception as e:
            logger.critical(f"Failed to load sector configuration: {e}")
            raise

    def get_sector_context(self, user_sector: Optional[str]) -> Dict[str, Any]:
        """
        Retrieve context for a specific sector. 
        Defaults to 'real_estate' if sector is invalid or None (Legacy Fallback).
        """
        DEFAULT_SECTOR = "distressed_corporate"
        
        if not user_sector:
            logger.warning(f"No sector provided. Defaulting to {DEFAULT_SECTOR}.")
            return self.config["sectors"][DEFAULT_SECTOR]
            
        sector_data = self.config["sectors"].get(user_sector)
        
        if not sector_data:
            logger.warning(f"Invalid sector '{user_sector}'. Defaulting to {DEFAULT_SECTOR}.")
            return self.config["sectors"][DEFAULT_SECTOR]
            
        return sector_data

    def build_system_prompt(self, sector_key: str) -> str:
        """
        Construct the System Prompt for the LLM based on the sector configuration.
        """
        context = self.get_sector_context(sector_key)
        label = context.get("label", "General Analyst")
        schema = context.get("extraction_schema", [])
        
        # Define persona and tone based on sector (simplified logic)
        tone_instruction = "Ensure high accuracy and focus on key commercial terms."
        if "Real Estate" in label:
            tone_instruction += " Focus on yield, operational status, and potential distress indicators."
        elif "Tech" in label:
            tone_instruction += " Focus on valuation metrics, burn rate, and investment rounds."
        elif "Marine" in label:
            tone_instruction += " Focus on vessel specifications, charter rates, and route details."

        schema_list = ", ".join(schema)
        
        prompt = (
            f"You are an expert Analyst specializing in {label}.\n"
            f"Your task is to analyze the provided text and extract specific intelligence.\n\n"
            f"TONE RULES:\n{tone_instruction}\n\n"
            f"EXTRACTION SCHEMA:\n"
            f"Extract the following fields into a valid JSON object:\n"
            f"[{schema_list}, signal_type, conviction_score, sentiment_score, momentum_score]\n\n"
            f"INTELLIGENCE RULES:\n"
            f"- signal_type: 'RESCUE' if distressed/insolvent, 'GROWTH' if expansion/M&A.\n"
            f"- conviction_score: 0-100 indicating relevance and quality of the lead.\n"
            f"- sentiment_score: -1.0 (very negative) to 1.0 (very positive) about the company's future.\n"
            f"- momentum_score: 0.0 to 1.0 based on how active the sector/company is.\n\n"
            f"Output strictly valid JSON only. Do not include markdown formatting or explanations."
        )
        return prompt

    def validate_extraction(self, data: Dict[str, Any], schema: List[str]) -> bool:
        """
        Validate that the extracted data contains all required keys from the schema.
        Note: This checks for presence of keys, not non-null values (as some might be missing in source).
        """
        missing_keys = [key for key in schema if key not in data]
        
        if missing_keys:
            logger.warning(f"Extraction missing keys: {missing_keys}")
            return False
            
        return True


# ──────────────── Counterparty Risk Intelligence (Sprint 2) ────────────────

# The canonical schema for counterparty risk extraction.
# Every LLM response MUST include these keys.
RISK_EXTRACTION_SCHEMA: List[str] = [
    "company_name",
    "company_number",
    "new_charge_registered",      # bool — new charge/debenture filed
    "charge_description",         # str | null — description of the charge
    "director_resigned",          # bool — any director departures detected
    "director_appointed",         # bool — new director appointments
    "director_churn_count",       # int — net director changes
    "overdue_filings_detected",   # bool — annual accounts/confirmation overdue
    "debt_cleared",               # bool — charge fully satisfied
    "psc_change_detected",        # bool — person of significant control changed
    "accounts_category",          # str — FULL / SMALL / MICRO / DORMANT
    "incorporation_years",        # int — years since incorporation
    "risk_narrative",             # str — 2-3 sentence analyst note
]


def build_risk_system_prompt(sector_config: Optional[Dict[str, Any]] = None) -> str:
    """
    Construct a specialised LLM System Prompt for Counterparty Credit Risk Analysis.

    Instructs the model to act as a Senior Credit Risk Analyst, extracting
    structured signals from raw Companies House text (filing descriptions,
    charge data, PSC notifications, director change notices).

    Args:
        sector_config: Optional sector-specific overrides. If provided, may
                       contain 'label' and 'extraction_schema' keys to extend
                       the base risk schema.

    Returns:
        A fully formatted system prompt string.
    """
    # Allow sector_config to inject additional schema fields
    extra_fields: List[str] = []
    sector_label = "General Corporate"
    if sector_config:
        extra_fields = sector_config.get("extraction_schema", [])
        sector_label = sector_config.get("label", sector_label)

    # Merge base risk schema with any sector-specific extras
    full_schema = RISK_EXTRACTION_SCHEMA + [f for f in extra_fields if f not in RISK_EXTRACTION_SCHEMA]
    schema_list = ", ".join(full_schema)

    prompt = (
        "You are a Senior Credit Risk Analyst at an institutional intelligence firm.\n"
        f"Specialisation: {sector_label}.\n\n"
        "YOUR MANDATE:\n"
        "Analyze the provided Companies House text (filing descriptions, charge data,\n"
        "PSC notifications, director change notices, accounts filings) and extract\n"
        "structured counterparty risk signals.\n\n"
        "EXTRACTION SCHEMA:\n"
        f"Return a single JSON object with exactly these keys:\n"
        f"[{schema_list}]\n\n"
        "FIELD RULES:\n"
        "- new_charge_registered (bool): True if a new charge, debenture, or mortgage has been filed.\n"
        "- charge_description (str|null): Brief description of the charge. Null if no charge.\n"
        "- director_resigned (bool): True if any director has resigned or been removed.\n"
        "- director_appointed (bool): True if any new director has been appointed.\n"
        "- director_churn_count (int): Net count of director changes (appointments minus resignations). Can be negative.\n"
        "- overdue_filings_detected (bool): True if annual accounts or confirmation statement is overdue.\n"
        "- debt_cleared (bool): True if a charge has been fully satisfied or released.\n"
        "- psc_change_detected (bool): True if a Person of Significant Control has been added, removed, or changed.\n"
        "- accounts_category (str): One of 'FULL', 'SMALL', 'MICRO', 'DORMANT', or 'UNKNOWN'.\n"
        "- incorporation_years (int): Number of years since incorporation. Estimate from available data.\n"
        "- risk_narrative (str): A 2-3 sentence professional analyst note summarising the risk posture.\n\n"
        "CRITICAL OUTPUT RULES:\n"
        "1. Return ONLY valid JSON. No markdown code fences. No explanatory text.\n"
        "2. Do NOT wrap the output in ```json``` blocks.\n"
        "3. All boolean fields must be lowercase true/false.\n"
        "4. If a value cannot be determined from the source text, use null for strings, false for booleans, 0 for integers.\n"
        "5. Do not hallucinate data. Only extract what is explicitly present in the source text.\n"
    )
    return prompt


# Singleton instance for easy import
rule_engine = SectorLogicController()
