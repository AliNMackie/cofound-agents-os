import structlog
import asyncio
import feedparser
import datetime
import urllib.parse
from google.cloud import firestore
from src.services.ingest import auction_ingestor
from src.services.enrichment import enrichment_service
from src.services.shadow_market import shadow_market

logger = structlog.get_logger()

class MarketSweepService:
    def __init__(self):
        try:
            # Assumes default credentials (from Cloud Run SA)
            from src.core.config import settings
            self.db = firestore.Client(database=settings.FIRESTORE_DB_NAME)
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
                {"name": "Google News (Bankruptcy)", "url": "https://news.google.com/rss/search?q=bankruptcy+UK+when:28d&hl=en-GB&gl=GB&ceid=GB:en", "type": "RSS", "active": True, "signal_type": "RESCUE"},
                {"name": "Google News (Insolvency)", "url": "https://news.google.com/rss/search?q=insolvency+UK+when:28d&hl=en-GB&gl=GB&ceid=GB:en", "type": "RSS", "active": True, "signal_type": "RESCUE"},
                {"name": "Google News (Acquisitions)", "url": "https://news.google.com/rss/search?q=acquisition+UK+when:14d&hl=en-GB&gl=GB&ceid=GB:en", "type": "RSS", "active": True, "signal_type": "GROWTH"},
                {"name": "Google News (Private Equity)", "url": "https://news.google.com/rss/search?q=private+equity+exit+UK+when:14d&hl=en-GB&gl=GB&ceid=GB:en", "type": "RSS", "active": True, "signal_type": "GROWTH"},
                {"name": "Insider Media (Deals)", "url": "https://news.google.com/rss/search?q=site:insidermedia.com+deals+UK+when:7d&hl=en-GB&gl=GB&ceid=GB:en", "type": "RSS", "active": True, "signal_type": "GROWTH"},
                {"name": "The BusinessDesk (M&A)", "url": "https://news.google.com/rss/search?q=site:thebusinessdesk.com+acquisition+UK+when:7d&hl=en-GB&gl=GB&ceid=GB:en", "type": "RSS", "active": True, "signal_type": "GROWTH"}
            ],
            "industry_context": {
                 "pvt_credit": "Focus on EBITDA add-backs, covenant breaches, and 2026 cliff.",
                 "real_estate": "Focus on occupancy rates, cap rate expansion, and refinancing.",
                 "mid_market_ma": "Focus on deal multiples, lead advisors, and buy-and-build potential."
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
                app_settings = DEFAULT_CONFIG
            else:
                app_settings = doc.to_dict()
                
            # Extract active RSS sources
            for source in app_settings.get("data_sources", []):
                if source.get("active") and source.get("type") == "RSS":
                    active_sources.append({
                        "url": source.get("url"),
                        "signal_type": source.get("signal_type", "RESCUE")
                    })
                    
        except Exception as e:
            logger.error("Failed to fetch dynamic settings", error=str(e))
            # Fallback to defaults in memory if DB fails
            for source in DEFAULT_CONFIG["data_sources"]:
                active_sources.append({
                    "url": source["url"],
                    "signal_type": source["signal_type"]
                })

        # 2. RUN WATCHLIST SCAN (New Step)
        # Watchlist hits are currently treated as RESCUE by default, but we'll mark them
        watchlist_deals = await self.run_watchlist_scan()
        
        # 2b. RUN SHADOW MARKET SCAN (Companies House objective signals)
        shadow_market_deals = await self.run_shadow_market_scan()

        total_scanned = 0
        new_deals = watchlist_deals + shadow_market_deals # Start count with watchlist and shadow market hits

        # 3. Running General RSS Scan (FAST MODE - No AI Processing)
        for source_info in active_sources:
            rss_url = source_info["url"]
            source_signal_type = source_info["signal_type"]
            
            logger.info("Fetching RSS feed", url=rss_url, signal_type=source_signal_type)
            loop = asyncio.get_running_loop()
            feed = await loop.run_in_executor(None, feedparser.parse, rss_url)
            
            total_entries = len(feed.entries)
            logger.info("RSS Feed Response", url=rss_url, total_entries=total_entries, feed_status=feed.get('status', 'unknown'))
            
            # Process top 20 entries to get good historical coverage
            entries = feed.entries[:20]
            logger.info("Processing entries", count=len(entries))
            
            for entry in entries:
                total_scanned += 1
                title = entry.get('title', '')
                summary = entry.get('summary', '')
                link = entry.get('link', '')
                published = entry.get('published', '')
                
                logger.info("Processing RSS entry", title=title[:50], published=published)
                
                try:
                    # FAST MODE: Save raw RSS data without AI processing
                    doc_data = {
                        "headline": title,
                        "analysis": summary[:500] if summary else "No summary available",
                        "source": "Google News RSS",
                        "source_link": link,
                        "published_at": published,
                        "ingested_at": datetime.datetime.now(datetime.timezone.utc),
                        "query_source": "rss_fast_sweep",
                        "category": "NEWS",
                        "company_name": title.split('-')[0].strip() if '-' in title else title[:50],
                        "advisor": "Unknown",
                        "ebitda": None,
                        "deal_date": published,
                        # NEW FIELDS
                        "signal_type": source_signal_type,
                        "source_family": "RSS_NEWS",
                        "conviction_score": 75
                    }
                    
                    # Check for duplicate by link
                    existing = list(self.collection.where("source_link", "==", link).limit(1).stream())
                    if not existing:
                        self.collection.add(doc_data)
                        new_deals += 1
                        logger.info("Saved RSS entry", title=title[:30], signal_type=source_signal_type)
                    else:
                        logger.info("Duplicate link, skipping", link=link[:50])
                    
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
                query = f'"{company_name}" AND (acquisition OR restructuring OR "strategic review" OR PE OR refinancing) when:28d'
                encoded_query = urllib.parse.quote(query)
                rss_url = f"https://news.google.com/rss/search?q={encoded_query}&hl=en-GB&gl=GB&ceid=GB:en"
                
                logger.info(f"Scanning watchlist target: {company_name}")
                
                loop = asyncio.get_running_loop()
                feed = await loop.run_in_executor(None, feedparser.parse, rss_url)
                entries = feed.entries[:5] # Check top 5 news items
                
                for entry in entries:
                    title = entry.get('title', '')
                    summary = entry.get('summary', '')
                    link = entry.get('link', '')
                    published = entry.get('published', '')
                    
                    full_text = f"{title}\n\n{summary}"
                    
                    try:
                        # Watchlist hits use the AI ingestor for deep analysis
                        auction_data = await auction_ingestor.ingest_auction_text(full_text, origin="watchlist_sweep")
                        
                        # Enforce the company name matches the target (Ingest might hallucinate)
                        # We force the name to match the target we are searching for to ensure linkage
                        auction_data.company_name = company_name 
                        auction_data.company_description = f"[WATCHLIST ALERT] {auction_data.company_description or ''}"
                        
                        # Infer signal type from content if possible, or default to RESCUE for watchlist
                        sig_type = "RESCUE"
                        if "acquisition" in title.lower() or "investment" in title.lower():
                            sig_type = "GROWTH"

                        saved = self._save_auction_if_new(
                            auction_data, 
                            link, 
                            published, 
                            source_type="watchlist_hit", 
                            extra_data={
                                "is_watchlist_hit": True, 
                                "watchlist_id": doc.id,
                                "signal_type": sig_type,
                                "source_family": "RSS_NEWS",
                                "conviction_score": 90 # High conviction for watchlist hits
                            }
                        )
                        
                        if saved:
                             count += 1
                             logger.info("Watchlist Hit Found!", company=company_name)

                    except Exception as e:
                        logger.error(f"Error processing watchlist item {company_name}", error=str(e))
                        
        except Exception as e:
            logger.error("Failed to run watchlist scan", error=str(e))
            
        return count

    async def run_shadow_market_scan(self):
        """
        Scans Companies House for objective signals (Charges, PSCs) for watchlist companies.
        """
        logger.info("Starting Shadow Market Scan...")
        count = 0
        
        try:
            # Fetch monitoring targets
            docs = self.db.collection("watchlists/neish_capital/targets").where("monitoring_active", "==", True).stream()
            
            for doc in docs:
                target = doc.to_dict()
                company_name = target.get("company_name")
                if not company_name:
                    continue
                
                logger.info(f"Checking Shadow Market for: {company_name}")
                
                # 1. Get Company Number
                company_number = await enrichment_service._search_company(company_name)
                if not company_number:
                    continue
                
                # 2. Fetch Full Profile for Tenure Calculation
                profile = await enrichment_service.enrich_company_data(company_name)
                tenure_years = 0
                if profile and profile.incorporation_date:
                    try:
                        inc_date = datetime.datetime.fromisoformat(profile.incorporation_date.replace('Z', '+00:00'))
                        tenure_years = (datetime.datetime.now(datetime.timezone.utc) - inc_date).days // 365
                    except:
                        pass

                # 3. Fetch Charges & PSCs
                charges = await enrichment_service.fetch_company_charges(company_number)
                pscs = await enrichment_service.fetch_company_pscs(company_number)
                
                # 4. Process Events through Shadow Market Engine
                all_events = []
                for char in charges[:3]: # Only check recent 3
                    char["type"] = "charge"
                    char["tenure_years"] = tenure_years
                    all_events.append(char)
                for psc in pscs[:3]:
                    psc["type"] = "psc"
                    psc["tenure_years"] = tenure_years
                    all_events.append(psc)
                    
                for event in all_events:
                    # Enrich event with company number for links
                    event["company_number"] = company_number
                    
                    normalized = shadow_market.normalize_ch_event(event, company_name)
                    
                    # Only save if it's a high-conviction signal (>70)
                    if normalized["conviction_score"] >= 70:
                        signal_doc = shadow_market.map_to_signal(normalized)
                        
                        # Check for dupe by analysis text (unique enough for CH events)
                        existing = list(self.collection.where("headline", "==", signal_doc["headline"])
                                      .where("company_name", "==", company_name).limit(1).stream())
                        
                        if not existing:
                            self.collection.add(signal_doc)
                            count += 1
                            logger.info("Shadow Market Signal Found!", company=company_name, type=normalized["signal_type"])

        except Exception as e:
            logger.error("Failed to run shadow market scan", error=str(e))
            
        return count

    def _save_auction_if_new(self, auction_data, link, published, source_type, extra_data=None, skip_dupe_check=False):
        """Helper to check dupe and save"""
        if not skip_dupe_check:
            query_ref = self.collection.where("company_name", "==", auction_data.company_name).limit(1)
            existing = list(query_ref.stream())
            
            if existing:
                # Check if existing is recent? For now just skip
                logger.info("Duplicate deal found, skipping", company=auction_data.company_name)
                return False
        else:
            logger.info("Skipping duplicate check (debug mode)", company=auction_data.company_name)
            
        doc_data = auction_data.model_dump()
        doc_data["source_link"] = link
        doc_data["published_at"] = published
        doc_data["ingested_at"] = datetime.datetime.now(datetime.timezone.utc)
        doc_data["query_source"] = source_type
        
        # Ensure default evolution fields are present if not in extra_data
        if not extra_data or "signal_type" not in extra_data:
            doc_data["signal_type"] = "RESCUE"
        if not extra_data or "source_family" not in extra_data:
            doc_data["source_family"] = "RSS_NEWS"
        if not extra_data or "conviction_score" not in extra_data:
            doc_data["conviction_score"] = 75

        if extra_data:
            doc_data.update(extra_data)
        
        self.collection.add(doc_data)
        logger.info("New deal saved", company=auction_data.company_name, signal_type=doc_data["signal_type"])
        return True

sweep_service = MarketSweepService()
