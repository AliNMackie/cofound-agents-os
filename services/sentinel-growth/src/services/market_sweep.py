import structlog
import feedparser
import datetime
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

        # High-Priority Entities and Keywords from IC ORIGIN roadmap
        # Fetch dynamic sources from Firestore
        sources_ref = self.db.collection("settings").document("global").collection("data_sources")
        docs = sources_ref.where("active", "==", True).stream()
        
        dynamic_sources = []
        for doc in docs:
            data = doc.to_dict()
            if data.get("type") == "RSS":
                dynamic_sources.append(data.get("url"))

        # Fallback to defaults if no dynamic sources found (during migration)
        if not dynamic_sources:
            PRIORITY_KEYWORDS = [
                "Failed Auction", "Passed In", "Postponed", "Process Restarted", 
                "Debt Restructuring", "Sale Put on Hold"
            ]
            ADVISORS = [
                "Rothschild", "KPMG", "Deloitte", "Houlihan Lokey", "Grant Thornton"
            ]
            queries = [f'"{kw}" deal' for kw in PRIORITY_KEYWORDS] + \
                      [f'"{adv}" auction process' for adv in ADVISORS]
            
            # Convert queries to RSS URLs
            for query in queries:
                 dynamic_sources.append(f"https://news.google.com/rss/search?q={query.replace(' ', '+')}&hl=en-GB&gl=GB&ceid=GB:en")

        total_scanned = 0
        new_deals = 0

        for rss_url in dynamic_sources:
            # RSS URL is now direct from DB or constructed above
            query_label = rss_url  # checking simplistic logging

            
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
                    # If company name is generic or empty, skip
                    if not auction_data.company_name or len(auction_data.company_name) < 3:
                        continue
                        
                    # 3. Duplicate Check
                    # Create a composite key or query
                    # We'll query for same company name within last 30 days
                    
                    query_ref = self.collection.where("company_name", "==", auction_data.company_name).limit(1)
                    existing = list(query_ref.stream())
                    
                    if existing:
                        logger.info("Duplicate deal found, skipping", company=auction_data.company_name)
                        continue
                        
                    # 4. Save to Firestore
                    doc_data = auction_data.model_dump()
                    doc_data["source_link"] = link
                    doc_data["published_at"] = published
                    doc_data["ingested_at"] = datetime.datetime.now(datetime.timezone.utc)
                    doc_data["query_source"] = "dynamic_feed"
                    
                    self.collection.add(doc_data)
                    new_deals += 1
                    logger.info("New deal saved", company=auction_data.company_name)
                    
                except Exception as e:
                    # Log but continue sweeping
                    logger.warning("Failed to process entry", title=title, error=str(e))
                    continue

        return {
            "status": "success", 
            "scanned": total_scanned, 
            "new_deals": new_deals
        }

sweep_service = MarketSweepService()
