"""
IC Origin — Probabilistic Entity Resolution Service

Uses splink (v4.x) with DuckDB backend for fuzzy matching of
company records across dirty registry data. Deduplicates entities
by comparing company_name and registered_address fields using
Jaro-Winkler string comparison.

Graceful degradation: if splink is not installed, returns
records unmatched.
"""

import hashlib
import structlog
from typing import Optional

logger = structlog.get_logger()

# Attempt splink import — optional dependency
_SPLINK_AVAILABLE = False
try:
    import splink
    _SPLINK_AVAILABLE = True
except ImportError:
    logger.warning(
        "EntityResolution: splink not installed — fuzzy matching disabled"
    )


class EntityResolutionService:
    """
    Probabilistic entity matching using splink with DuckDB backend.

    Given a list of company records, identifies fuzzy duplicates
    based on company_name and registered_address. Returns linked
    records with a match probability score.
    """

    def __init__(self):
        self._available = _SPLINK_AVAILABLE
        logger.info(
            "EntityResolutionService initialised",
            splink_available=self._available,
        )

    @property
    def available(self) -> bool:
        return self._available

    def find_fuzzy_matches(self, records: list[dict]) -> list[dict]:
        """
        Find probabilistic matches among a list of company records.

        Each record should have at minimum:
            - unique_id: str
            - company_name: str
            - registered_address: str (optional but improves matching)

        Returns a list of match dicts:
            [
                {
                    "record_id_l": str,
                    "record_id_r": str,
                    "company_name_l": str,
                    "company_name_r": str,
                    "match_probability": float,
                    "is_match": bool,
                }
            ]
        """
        if not self._available:
            logger.warning("EntityResolution: splink unavailable, returning empty")
            return []

        if len(records) < 2:
            return []

        # Ensure unique_id exists
        for i, rec in enumerate(records):
            if "unique_id" not in rec:
                rec["unique_id"] = str(i)

        try:
            return self._run_splink(records)
        except Exception as e:
            logger.error("EntityResolution: matching failed", error=str(e))
            return []

    def _run_splink(self, records: list[dict]) -> list[dict]:
        """Execute splink deduplication with DuckDB backend."""
        import splink.comparison_library as cl
        from splink import DuckDBAPI, Linker, SettingsCreator, block_on

        # Configure splink settings
        settings = SettingsCreator(
            link_type="dedupe_only",
            comparisons=[
                cl.JaroWinklerAtThresholds("company_name", [0.9, 0.7]),
                cl.JaroWinklerAtThresholds("registered_address", [0.9, 0.7]),
            ],
            blocking_rules_to_generate_predictions=[
                block_on("company_name"),
            ],
            retain_matching_columns=True,
            retain_intermediate_calculation_columns=False,
        )

        db_api = DuckDBAPI()
        linker = Linker(records, settings, db_api=db_api)

        # Train model using expectation-maximisation
        linker.training.estimate_u_using_random_sampling(max_pairs=1e4)

        # Predict matches
        predictions = linker.inference.predict(threshold_match_probability=0.5)
        df = predictions.as_pandas_dataframe()

        if df.empty:
            return []

        matches = []
        for _, row in df.iterrows():
            matches.append({
                "record_id_l": str(row.get("unique_id_l", "")),
                "record_id_r": str(row.get("unique_id_r", "")),
                "company_name_l": row.get("company_name_l", ""),
                "company_name_r": row.get("company_name_r", ""),
                "match_probability": float(
                    row.get("match_probability", 0.0)
                ),
                "is_match": float(row.get("match_probability", 0.0)) >= 0.7,
            })

        logger.info(
            "EntityResolution: matching complete",
            records=len(records),
            matches=len(matches),
        )
        return matches

    @staticmethod
    def generate_person_hash(
        name: str, date_of_birth: str = "", address: str = ""
    ) -> str:
        """
        Generate a deterministic hash for a person record.
        Used as the merge key in Neo4j :Person nodes.
        """
        normalised = f"{name.strip().lower()}|{date_of_birth}|{address.strip().lower()}"
        return hashlib.sha256(normalised.encode()).hexdigest()[:16]


# Singleton
entity_resolution_service = EntityResolutionService()
