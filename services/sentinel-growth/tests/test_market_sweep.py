import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from src.services.market_sweep import MarketSweepService

class TestMarketSweepService:
    @pytest.fixture
    def service(self, mock_firestore):
        # Setup mock db
        db_mock = MagicMock()
        mock_firestore.return_value = db_mock
        # Setup collection mock
        collection_mock = MagicMock()
        db_mock.collection.return_value = collection_mock
        
        service = MarketSweepService()
        service.db = db_mock
        service.collection = collection_mock
        return service

    @pytest.mark.asyncio
    async def test_run_market_sweep_success(self, service):
        # Mock user_settings to not exist, triggering default_config
        mock_settings_doc = MagicMock()
        mock_settings_doc.exists = False
        service.db.collection.return_value.document.return_value.get.return_value = mock_settings_doc

        # Mock feedparser
        with patch("feedparser.parse") as mock_parse:
            mock_feed = MagicMock()
            mock_feed.entries = [
                {
                    "title": "Test Company - Insolvency",
                    "summary": "Company is insolvent",
                    "link": "http://example.com",
                    "published": "2023-01-01"
                }
            ]
            mock_parse.return_value = mock_feed
            
            # Mock Firestore query for dupe check
            service.collection.where.return_value.limit.return_value.stream.return_value = []

            result = await service.run_market_sweep()
            
            assert result["status"] == "success"
            assert result["new_deals"] > 0
            
            # Verify save called
            service.collection.add.assert_called()

    @pytest.mark.asyncio
    async def test_run_market_sweep_duplicate(self, service):
        # Mock user_settings to not exist
        mock_settings_doc = MagicMock()
        mock_settings_doc.exists = False
        service.db.collection.return_value.document.return_value.get.return_value = mock_settings_doc

         # Mock feedparser
        with patch("feedparser.parse") as mock_parse:
            mock_feed = MagicMock()
            mock_feed.entries = [
                 {
                    "title": "Dup Deal",
                    "link": "http://dup.com",
                    "summary": "dup",
                    "published": "now"
                }
            ]
            mock_parse.return_value = mock_feed
            
            # Mock Firestore finding duplicate
            mock_doc = MagicMock()
            service.collection.where.return_value.limit.return_value.stream.return_value = [mock_doc]

            result = await service.run_market_sweep()
            
            assert result["new_deals"] == 0 # Should skip duplicate

    @pytest.mark.asyncio
    async def test_run_watchlist_scan(self, service):
        # Mock Firestore watchlist targets
        mock_target = MagicMock()
        mock_target.to_dict.return_value = {"company_name": "Target Co", "tenant_id": "test_tenant"}
        mock_target.id = "target_id"
        
        # Mock collection_group
        collection_group_mock = MagicMock()
        service.db.collection_group.return_value = collection_group_mock
        collection_group_mock.where.return_value.stream.return_value = [mock_target]
        
        # Mock feedparser
        with patch("feedparser.parse") as mock_parse:
            mock_feed = MagicMock()
            mock_feed.entries = [
                 {
                    "title": "Target Co Acquisition",
                    "link": "http://target.com/news",
                    "summary": "Acquired by PE",
                    "published": "now"
                }
            ]
            mock_parse.return_value = mock_feed
            
            # Mock AI ingestor
            with patch("src.services.ingest.auction_ingestor.ingest_auction_text", new_callable=AsyncMock) as mock_ingest:
                mock_data = MagicMock()
                mock_data.company_name = "Target Co"
                mock_data.model_dump.return_value = {"company_name": "Target Co"} 
                mock_ingest.return_value = mock_data

                # Mock save helper (or rely on real method mocking collection)
                # Since we are calling real method, we need duplicate check to return empty
                service.collection.where.return_value.limit.return_value.stream.return_value = []
                
                count = await service.run_watchlist_scan()
                
                assert count == 1
                service.collection.add.assert_called()
