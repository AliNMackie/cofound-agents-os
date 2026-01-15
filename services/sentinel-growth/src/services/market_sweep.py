import structlog
import feedparser
import datetime
import urllib.parse
from google.cloud import firestore
from src.services.ingest import auction_ingestor

logger = structlog.get_logger()

class MarketSweepService:
    def __init__(self):
        try:
            # Assumes default credentials (from Cloud Run SA)
            self.db = firestore.Client()
            self.collection = self.db.collection("auctions")
        except Exception as e:
            logger.error("Failed to initialize Firestore", error=str(e))
            self.db = None

    async def run_market_sweep(self):
        """
        Sweeps Google News RSS for distressed/private equity terms.
        Ingests valid findings and saves to Firestore (with dedup).
        """
        if not self.db:
            logger.error("Database not initialized, skipping sweep.")
            return {"status": "error", "detail": "Database unavailable"}

        # DEFAULT CONFIGURATION (Self-Healing Fallback)
        DEFAULT_CONFIG = {
            "data_sources": [
                {"name": "Google News (Bankruptcy)", "url": "https://news.google.com/rss/search?q=bankruptcy+UK&hl=en-GB&gl=GB&ceid=GB:en", "type": "RSS", "active": True},
                {"name": "Google News (Insolvency)", "url": "https://news.google.com/rss/search?q=insolvency+UK&hl=en-GB&gl=GB&ceid=GB:en", "type": "RSS", "active": True}
            ],
            "industry_context": {
                 "pvt_credit": "Focus on EBITDA add-backs, covenant breaches, and 2026 cliff.",
                 "real_estate": "Focus on occupancy rates, cap rate expansion, and refinancing."
            }
        }

        # 1. Fetch Dynamic Settings with Self-Healing
        active_sources = []
        try:
            doc_ref = self.db.collection("user_settings").document("default_tenant")
            doc = doc_ref.get()
            
            if not doc.exists:
                logger.warning("Default tenant settings not found. Self-healing...")
                doc_ref.set(DEFAULT_CONFIG)
                settings = DEFAULT_CONFIG
            else:
                settings = doc.to_dict()
                
            # Extract active RSS sources
            for source in settings.get("data_sources", []):
                if source.get("active") and source.get("type") == "RSS":
                    active_sources.append(source.get("url"))
                    
        except Exception as e:
            logger.error("Failed to fetch dynamic settings", error=str(e))
            # Fallback to defaults in memory if DB fails
            for source in DEFAULT_CONFIG["data_sources"]:
                active_sources.append(source["url"])

        # 2. RUN WATCHLIST SCAN (New Step)
        watchlist_deals = await self.run_watchlist_scan()

        total_scanned = 0
        new_deals = watchlist_deals # Start count with watchlist hits

        # 3. Running General RSS Scan
        for rss_url in active_sources:
            logger.info("Fetching RSS feed", url=rss_url)
            feed = feedparser.parse(rss_url)
            
            # Limit to top 10 per query to avoid spam/cost
            entries = feed.entries[:10]
            
            for entry in entries:
                total_scanned += 1
                title = entry.get('title', '')
                summary = entry.get('summary', '')
                link = entry.get('link', '')
                published = entry.get('published', '')
                
                # Combine title and summary for context
                full_text = f"{title}\n\n{summary}"
                
                try:
                    # 1. Ingest/Extract
                    auction_data = auction_ingestor.ingest_auction_text(full_text, origin="market_sweep_rss")
                    
                    # 2. Validation
                    if not auction_data.company_name or len(auction_data.company_name) < 3:
                        continue
                        
                    # 3. Duplicate Check & Save
                    saved = self._save_auction_if_new(auction_data, link, published, "dynamic_feed")
                    if saved:
                        new_deals += 1
                    
                except Exception as e:
                    logger.warning("Failed to process entry", title=title, error=str(e))
                    continue

        return {
            "status": "success", 
            "scanned": total_scanned, 
            "new_deals": new_deals
        }

    async def run_watchlist_scan(self):
        """
        Scans news for companies in the watchlist (e.g. Broken/Paused deals).
        """
        logger.info("Starting Watchlist Scan...")
        count = 0
        
        try:
            # Fetch monitoring targets
            docs = self.db.collection("watchlists/neish_capital/targets").where("monitoring_active", "==", True).stream()
            
            for doc in docs:
                target = doc.to_dict()
                company_name = target.get("company_name")
                if not company_name:
                    continue
                    
                # Targeted Query
                # e.g. "Company Name" AND (acquisition OR restructuring OR ...)
                query = f'"{company_name}" AND (acquisition OR restructuring OR "strategic review" OR PE OR refinancing)'
                encoded_query = urllib.parse.quote(query)
                rss_url = f"https://news.google.com/rss/search?q={encoded_query}&hl=en-GB&gl=GB&ceid=GB:en"
                
                logger.info(f"Scanning watchlist target: {company_name}")
                
                feed = feedparser.parse(rss_url)
                entries = feed.entries[:5] # Check top 5 news items
                
                for entry in entries:
                    title = entry.get('title', '')
                    summary = entry.get('summary', '')
                    link = entry.get('link', '')
                    published = entry.get('published', '')
                    
                    full_text = f"{title}\n\n{summary}"
                    
                    try:
                        auction_data = auction_ingestor.ingest_auction_text(full_text, origin="watchlist_sweep")
                        
                        # Enforce the company name matches the target (Ingest might hallucinate)
                        # We force the name to match the target we are searching for to ensure linkage
                        auction_data.company_name = company_name 
                        auction_data.company_description = f"[WATCHLIST ALERT] {auction_data.company_description or ''}"
                        
                        saved = self._save_auction_if_new(
                            auction_data, 
                            link, 
                            published, 
                            source_type="watchlist_hit", 
                            extra_data={"is_watchlist_hit": True, "watchlist_id": doc.id}
                        )
                        
                        if saved:
                             count += 1
                             logger.info("Watchlist Hit Found!", company=company_name)

                    except Exception as e:
                        logger.error(f"Error processing watchlist item {company_name}", error=str(e))
                        
        except Exception as e:
            logger.error("Failed to run watchlist scan", error=str(e))
            
        return count

    def _save_auction_if_new(self, auction_data, link, published, source_type, extra_data=None):
        """Helper to check dupe and save"""
        query_ref = self.collection.where("company_name", "==", auction_data.company_name).limit(1)
        existing = list(query_ref.stream())
        
        if existing:
            # Check if existing is recent? For now just skip
            logger.info("Duplicate deal found, skipping", company=auction_data.company_name)
            return False
            
        doc_data = auction_data.model_dump()
        doc_data["source_link"] = link
        doc_data["published_at"] = published
        doc_data["ingested_at"] = datetime.datetime.now(datetime.timezone.utc)
        doc_data["query_source"] = source_type
        
        if extra_data:
            doc_data.update(extra_data)
        
        self.collection.add(doc_data)
        logger.info("New deal saved", company=auction_data.company_name)
        return True

sweep_service = MarketSweepService()
