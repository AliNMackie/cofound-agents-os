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

# Singleton instance for easy import
rule_engine = SectorLogicController()
