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

    async def run_market_sweep(self, task_id: str = None):
        """
        Sweeps Google News RSS for distressed/private equity terms.
        Ingests valid findings and saves to Firestore (with dedup).
        Updates task status in Firestore if task_id is provided.
        """
        async def update_status(status, progress, message=None):
            if task_id and self.db:
                try:
                    update_data = {
                        "status": status,
                        "progress": progress,
                        "updated_at": datetime.datetime.now(datetime.timezone.utc)
                    }
                    if message:
                        update_data["message"] = message
                    self.db.collection("tasks").document(task_id).set(update_data, merge=True)
                except Exception as e:
                    logger.error("Failed to update task status", task_id=task_id, error=str(e))

        if not self.db:
            logger.error("Database not initialized, skipping sweep.")
            return {"status": "error", "detail": "Database unavailable"}
            
        await update_status("running", 5, "Initializing sweep...")

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
        await update_status("running", 25, "Scanning watchlists...")
        # Watchlist hits are currently treated as RESCUE by default, but we'll mark them
        watchlist_deals = await self.run_watchlist_scan()
        
        # 2b. RUN SHADOW MARKET SCAN (Companies House objective signals)
        await update_status("running", 40, "Scanning shadow market...")
        shadow_market_deals = await self.run_shadow_market_scan()

        total_scanned = 0
        new_deals = watchlist_deals + shadow_market_deals # Start count with watchlist and shadow market hits

        # 3. Running General RSS Scan (FAST MODE - No AI Processing)
        await update_status("running", 60, "Scanning general market news...")
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
                        "conviction_score": 75,
                        "tenant_id": "global" # RSS News is visible to all
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

        await update_status("completed", 100, f"Sweep complete. Found {new_deals} new deals.")
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
            # Fetch monitoring targets from ALL tenants using collection_group
            docs = self.db.collection_group("watchlist_targets").where("monitoring_active", "==", True).stream()
            
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
                                "signal_type": sig_type,
                                "source_family": "RSS_NEWS",
                                "conviction_score": 90, # High conviction for watchlist hits
                                "tenant_id": target.get("tenant_id", "default_tenant")
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
            # Fetch monitoring targets from ALL tenants
            docs = self.db.collection_group("watchlist_targets").where("monitoring_active", "==", True).stream()
            
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
                        signal_doc["tenant_id"] = target.get("tenant_id", "default")
                        
                        # Check for dupe by analysis text (unique enough for CH events)
                        existing = list(self.collection.where("headline", "==", signal_doc["headline"])
                                      .where("company_name", "==", company_name).limit(1).stream())
                        
                        if not existing:
                            self.collection.add(signal_doc)
                            count += 1
                            logger.info("Shadow Market Signal Found!", company=company_name, type=normalized["signal_type"])
                            
                            # PROACTIVE: Notify Orchestrator for Agentic Synthesis
                            try:
                                import httpx
                                orchestrator_url = settings.ORCHESTRATOR_INTERNAL_URL or "http://ic-origin-orchestrator:8080"
                                async with httpx.AsyncClient() as client:
                                    await client.post(
                                        f"{orchestrator_url}/strategize",
                                        json={
                                            "entity_id": company_name,
                                            "context": {
                                                "signal_type": normalized["signal_type"],
                                                "conviction": normalized["conviction_score"],
                                                "headline": normalized["headline"],
                                                "triggered_by": "sentinel_shadow_market"
                                            }
                                        },
                                        timeout=10.0
                                    )
                                logger.info("Orchestrator Notified", company=company_name)
                            except Exception as oe:
                                logger.warning("Orchestrator Notify Failed (Non-Blocking)", error=str(oe))

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

    # ──────────────── Counterparty Risk Intelligence (Sprint 1) ────────────────

    async def run_portfolio_sweep(self, portfolio_id: str, company_numbers: list[str]) -> dict:
        """
        Sweep a portfolio of Companies House numbers for counterparty risk signals.

        Iterates through each company number, fetches CH filings (charges, PSCs),
        scores them through the Shadow Market engine, and assigns a risk tier.

        Rate-limited to stay under the Companies House API limit of 600 req / 5 min
        (~2 req/sec). We use 0.5s delay per company as each company triggers
        2–3 API calls (search + charges + PSCs).

        Args:
            portfolio_id: The portfolio being swept.
            company_numbers: List of Companies House registration numbers.

        Returns:
            Summary dict with counts and per-entity results.
        """
        from src.schemas.auctions import RiskTier

        log = logger.bind(portfolio_id=portfolio_id)
        log.info("Portfolio sweep started", total_entities=len(company_numbers))

        results: list[dict] = []
        errors: list[dict] = []

        for idx, company_number in enumerate(company_numbers):
            entity_log = log.bind(company_number=company_number, index=idx + 1, total=len(company_numbers))

            # ── Rate Limiting ──
            # Companies House allows 600 requests per 5 minutes (~2 req/sec).
            # Each entity triggers up to 3 API calls (search, charges, PSCs),
            # so we sleep 0.5s per entity to stay safely under the limit.
            if idx > 0:
                await asyncio.sleep(0.5)

            try:
                # 1. Fetch company profile
                profile = await enrichment_service._fetch_company_profile(company_number)
                company_name = "Unknown"
                tenure_years = 0

                if profile:
                    company_name = profile.registration_number or company_number
                    if profile.incorporation_date:
                        try:
                            inc_date = datetime.datetime.fromisoformat(
                                profile.incorporation_date.replace("Z", "+00:00")
                            )
                            tenure_years = (
                                datetime.datetime.now(datetime.timezone.utc) - inc_date
                            ).days // 365
                        except (ValueError, TypeError):
                            pass

                # 2. Fetch filings (charges + PSCs)
                charges = await enrichment_service.fetch_company_charges(company_number)
                pscs = await enrichment_service.fetch_company_pscs(company_number)

                # 3. Score through Shadow Market engine
                all_events: list[dict] = []
                for charge in charges[:5]:
                    charge["type"] = "charge"
                    charge["tenure_years"] = tenure_years
                    charge["company_number"] = company_number
                    all_events.append(charge)
                for psc in pscs[:5]:
                    psc["type"] = "psc"
                    psc["tenure_years"] = tenure_years
                    psc["company_number"] = company_number
                    all_events.append(psc)

                max_conviction = 0
                signals_found = 0

                for event in all_events:
                    normalized = shadow_market.normalize_ch_event(event, company_name)
                    conviction = normalized.get("conviction_score", 0)
                    max_conviction = max(max_conviction, conviction)

                    if conviction >= 70:
                        signals_found += 1
                        signal_doc = shadow_market.map_to_signal(normalized)
                        signal_doc["monitoring_portfolio_id"] = portfolio_id
                        signal_doc["source_family"] = "GOV_REGISTRY"

                        # Persist if DB available
                        if self.db:
                            try:
                                self.collection.add(signal_doc)
                            except Exception as db_err:
                                entity_log.warning("Failed to persist signal", error=str(db_err))

                # 4. Assign Risk Tier based on max conviction score
                if max_conviction >= 80:
                    risk_tier = RiskTier.ELEVATED_RISK
                elif max_conviction >= 50:
                    risk_tier = RiskTier.STABLE
                elif max_conviction > 0:
                    risk_tier = RiskTier.IMPROVED
                else:
                    risk_tier = RiskTier.UNSCORED

                results.append({
                    "company_number": company_number,
                    "company_name": company_name,
                    "risk_tier": risk_tier.value,
                    "max_conviction_score": max_conviction,
                    "signals_found": signals_found,
                    "charges_checked": len(charges[:5]),
                    "pscs_checked": len(pscs[:5]),
                })

                entity_log.info(
                    "Entity scored",
                    risk_tier=risk_tier.value,
                    conviction=max_conviction,
                    signals=signals_found,
                )

            except Exception as e:
                entity_log.error("Failed to process entity", error=str(e))
                errors.append({
                    "company_number": company_number,
                    "error": str(e),
                })

        log.info(
            "Portfolio sweep completed",
            processed=len(results),
            errors=len(errors),
        )

        return {
            "status": "completed",
            "portfolio_id": portfolio_id,
            "total_entities": len(company_numbers),
            "processed": len(results),
            "errors_count": len(errors),
            "results": results,
            "errors": errors,
        }

    # ──────────────── Talent Intelligence (Sprint 8) ────────────────

    async def run_talent_sweep(self, company_name: str) -> dict:
        """
        Sweep public job posting feeds for talent signals related to a company.

        Parses RSS feeds from Google News (job posting proxy) and Reed.co.uk
        to identify hiring patterns, key departures, and talent concentration.
        Does NOT scrape LinkedIn (anti-bot). Uses public RSS only.

        Args:
            company_name: The company to search for job postings.

        Returns:
            dict with HumanCapital-shaped data:
                headcount_delta, key_hire_departures, hiring_velocity_pct,
                talent_concentration, active_job_postings, talent_signal
        """
        log = logger.bind(company=company_name, sweep_type="talent")
        log.info("Talent sweep started")

        postings: list[dict] = []

        # ── 1. Fetch job postings via Google News RSS (proxy for job activity) ──
        try:
            encoded = urllib.parse.quote(f'"{company_name}" (hiring OR "new role" OR vacancy OR appointment OR resign)')
            rss_url = f"https://news.google.com/rss/search?q={encoded}&hl=en-GB&gl=GB&ceid=GB:en"

            loop = asyncio.get_running_loop()
            feed = await loop.run_in_executor(None, feedparser.parse, rss_url)

            for entry in feed.entries[:15]:
                title = entry.get("title", "")
                summary = entry.get("summary", "")
                posting = self._classify_talent_posting(title, summary, company_name)
                if posting:
                    postings.append(posting)

        except Exception as e:
            log.warning("RSS talent sweep failed", error=str(e))

        # ── 2. Classify and aggregate ──
        active_job_postings = len([p for p in postings if p.get("type") == "HIRE"])
        departures = [p for p in postings if p.get("type") == "DEPARTURE"]

        # Department concentration
        dept_counts: dict[str, int] = {}
        for p in postings:
            dept = p.get("department", "other")
            dept_counts[dept] = dept_counts.get(dept, 0) + 1

        total = max(sum(dept_counts.values()), 1)
        talent_concentration = {
            dept: round(count / total, 2) for dept, count in dept_counts.items()
        }

        # Hiring velocity (simplified: postings found / expected baseline * 100 - 100)
        # Baseline: 3 postings per company per 30 days
        baseline = 3.0
        hiring_velocity_pct = round(((active_job_postings / baseline) * 100) - 100, 1)

        # ── 3. Run through talent scoring engine ──
        talent_payload = {
            "company_name": company_name,
            "hiring_velocity_pct": hiring_velocity_pct,
            "active_job_postings": active_job_postings,
            "key_hire_departures": departures,
        }

        talent_signal = shadow_market.evaluate_talent_signals(talent_payload)

        result = {
            "headcount_delta": active_job_postings - len(departures),
            "key_hire_departures": departures,
            "hiring_velocity_pct": hiring_velocity_pct,
            "talent_concentration": talent_concentration,
            "active_job_postings": active_job_postings,
            "talent_signal": talent_signal,
            "postings_analysed": len(postings),
        }

        log.info(
            "Talent sweep completed",
            postings=len(postings),
            signal=talent_signal,
            velocity=hiring_velocity_pct,
        )
        return result

    def _classify_talent_posting(
        self, title: str, summary: str, company_name: str
    ) -> dict | None:
        """Classify a news item as a hiring, departure, or irrelevant posting."""
        text = f"{title} {summary}".lower()

        # Skip if company name not mentioned
        if company_name.lower() not in text:
            return None

        # Determine type
        departure_keywords = [
            "resign", "departure", "steps down", "leaves",
            "exit", "fired", "terminated", "replaced",
        ]
        hire_keywords = [
            "hiring", "vacancy", "new role", "appointment",
            "appoints", "recruits", "onboard", "joins",
        ]

        posting_type = None
        if any(kw in text for kw in departure_keywords):
            posting_type = "DEPARTURE"
        elif any(kw in text for kw in hire_keywords):
            posting_type = "HIRE"
        else:
            return None  # Not relevant

        # Determine seniority
        c_suite = ["ceo", "cfo", "cto", "coo", "chief", "managing director", "head of"]
        seniority = "senior" if any(s in text for s in c_suite) else "mid"

        # Determine department
        dept_map = {
            "tech": ["engineer", "developer", "data", "ai", "ml", "devops", "cto", "technology"],
            "finance": ["finance", "accounting", "cfo", "treasurer", "controller"],
            "legal": ["legal", "counsel", "compliance", "regulatory"],
            "ops": ["operations", "logistics", "supply chain", "coo"],
            "sales": ["sales", "business development", "commercial", "revenue"],
            "hr": ["hr", "human resources", "people", "talent"],
        }

        department = "other"
        for dept, keywords in dept_map.items():
            if any(kw in text for kw in keywords):
                department = dept
                break

        # Extract role from title
        role = title.split("-")[0].strip() if "-" in title else title[:60]

        return {
            "name": "",
            "role": role,
            "type": posting_type,
            "date": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "seniority": seniority,
            "department": department,
            "company_name": company_name,
        }


sweep_service = MarketSweepService()
