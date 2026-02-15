import pytest
from src.services.extraction_rules import SectorLogicController

class TestSectorLogicController:
    @pytest.fixture
    def controller(self):
        return SectorLogicController()

    def test_load_sector_config(self, controller):
        assert controller.config is not None
        assert "sectors" in controller.config
        assert "distressed_corporate" in controller.config["sectors"]

    def test_get_sector_context_valid(self, controller):
        context = controller.get_sector_context("real_estate")
        assert context["label"] == "Real Estate (Josh)"
        assert "yield_percent" in context["extraction_schema"]

    def test_get_sector_context_invalid_defaults(self, controller):
        context = controller.get_sector_context("invalid_sector_xyz")
        # Should default to distressed_corporate
        assert context["label"] == "Distressed Corporate / Special Situations" 

    def test_build_system_prompt(self, controller):
        prompt = controller.build_system_prompt("tech_ma")
        assert "expert Analyst specializing in Tech / M&A" in prompt
        assert "valuation metrics" in prompt
        assert "signal_type" in prompt

    def test_validate_extraction_success(self, controller):
        data = {"field1": "value", "field2": "value"}
        schema = ["field1", "field2"]
        assert controller.validate_extraction(data, schema) is True

    def test_validate_extraction_missing_keys(self, controller):
        data = {"field1": "value"}
        schema = ["field1", "field2"]
        assert controller.validate_extraction(data, schema) is False
