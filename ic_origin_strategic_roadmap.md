# IC Origin: Strategic Capability & Adjacency Roadmap

**Date**: 2026-02-28 | **Version**: 3.0 | **Classification**: Board-Ready  
**Delta from V2.0**: Deepened technical architectures with service-level prescriptions. Pressure-tested all 9 sprints with failure-mode analysis. Expanded Vectors B/C to engineering-spec depth. Rebuilt Phase 4 as a concrete multi-agent deployment plan with cost modelling.

---

## Phase 1: Capability Surface Audit

### 1.1 Current Capability Matrix

| # | Capability | Service | Tech | Maturity |
|---|-----------|---------|------|----------|
| 1 | RSS Market Sweep (Google News, distressed/PE terms) | sentinel-growth | Python, feedparser | **Production** |
| 2 | Companies House Deep Crawl (profiles, charges, PSCs) | sentinel-growth | httpx, CH API | **Production** |
| 3 | Shadow Market Signal Scoring (CH filings → GROWTH/RESCUE signals) | sentinel-growth | Python rules engine | **Production** |
| 4 | LLM-Driven Text Extraction (sector-aware prompting) | sentinel-growth | Gemini Flash | **Production** |
| 5 | Sector-Configurable Prompt Engine (`sector_presets.json`) | sentinel-growth | JSON config + template builder | **Production** |
| 6 | Companies House Enrichment (search → profile → charges → PSCs) | sentinel-growth | httpx, CH API | **Production** |
| 7 | Morning Pulse (top-5 signals digest + Slack push) | sentinel-growth | Firestore, APScheduler | **Production** |
| 8 | Executive Briefing PDF Generation (AI synthesis → PDF → signed URL) | sentinel-growth | Gemini, WeasyPrint, GCS | **Production** |
| 9 | Dossier Generation (per-signal deep-dive PDFs) | sentinel-growth | Gemini, WeasyPrint | **Production** |
| 10 | Domain-Profiled Content Generation (consulting/tech/finance tones) | sentinel-growth | Gemini, Pydantic | **Production** |
| 11 | Adjacency Score Tracking (score history, threshold alerts) | sentinel-growth | Firestore | **Production** |
| 12 | Watchlist Management (track/ignore signals) | sentinel-growth | Firestore | **Production** |
| 13 | Data Source CRUD (RSS feeds) | sentinel-growth | Firestore | **Production** |
| 14 | Strategic Alert System (threshold crossing → Slack) | sentinel-growth | Firestore, Slack webhook | **Production** |
| 15 | Agentic Strategy Synthesis ("Zombie Hunter" — defend/expand/originate) | orchestrator | Gemini Pro, FastAPI | **Production** |
| 16 | Entity Resolution + Adjacency Scoring | ingest | FastAPI | **Stub** → §1.3 |
| 17 | BigQuery Data Pipelines | dataflow | Apache Beam | **Production** ✅ Sprint 4 |
| 18 | Executive Dashboard (TAM/SAM/SOM, topology map, signal feed) | dashboard | Next.js 14, Recharts | **Production** |
| 19 | Command Terminal (natural language → Firestore filters) | dashboard | Next.js | **Production** |
| 20 | Entity Detail Modal (deep-dive per entity) | dashboard | Next.js, Framer Motion | **Production** |
| 21 | Firebase Auth (multi-tenant RBAC) | dashboard + API | Firebase Auth, Custom Claims | **Production** ✅ Sprint 5 |
| 22 | Counterparty Risk AI Prompt (13-field extraction schema) | sentinel-growth | Gemini, Pydantic | **Production** ✅ Sprint 2 |
| 23 | Deterministic Risk Rules Engine (CH signals → RiskTier) | sentinel-growth | Python rules engine | **Production** ✅ Sprint 2 |
| 24 | Portfolio Risk PDF Generation (A4 institutional report) | sentinel-growth | Jinja2, WeasyPrint, GCS | **Production** ✅ Sprint 2 |
| 25 | Portfolio Upload API (CSV → parsed portfolio with dedup) | sentinel-growth | FastAPI, Pydantic | **Production** ✅ Sprint 1 |
| 26 | Counterparty Risk Dashboard (PortfolioRisk + RiskTrend) | dashboard | Next.js 14, Recharts | **Production** ✅ Sprint 3 |
| 27 | Universal Notification Service (Email + Slack, channel isolation) | sentinel-growth | Resend SDK, httpx | **Production** ✅ Sprint 4 |
| 28 | GRC Webhook Egress (HMAC-SHA256 signed payloads) | sentinel-growth | httpx, hmac | **Production** ✅ Sprint 4 |
| 29 | Pub/Sub → Dataflow → BigQuery Pipeline | dataflow | Apache Beam, Pub/Sub | **Production** ✅ Sprint 4 |
| 30 | Tenant-Scoped Persistence (all paths under `tenants/{id}/...`) | sentinel-growth | Firestore | **Production** ✅ Sprint 5 |
| 31 | RBAC Middleware (ADMIN/ANALYST/VIEWER + claim extraction) | sentinel-growth | Firebase Auth, FastAPI | **Production** ✅ Sprint 5 |
| 32 | Portfolio Manager UI (add/remove/upload, role-gated) | dashboard | Next.js, Framer Motion | **Production** ✅ Sprint 5 |
| 33 | Firestore Security Rules (tenant claim enforcement) | sentinel-growth | Firestore Rules | **Production** ✅ Sprint 5 |
| 34 | Tenant-Aware Telemetry (atomic Firestore counters) | sentinel-growth | Firestore Increment | **Production** ✅ Sprint 6 |
| 35 | Portfolio Command Centre (system status + metrics) | dashboard | Next.js, SWR | **Production** ✅ Sprint 6 |

### 1.2 Hidden Leverage Points (Underutilised Assets)

| Asset | Current Use | Untapped Potential |
|-------|------------|-------------------|
| **SectorLogicController** | 3 sector presets (real_estate, tech, marine) | Can drive **any** vertical by adding a JSON config file — zero code changes. The prompt builder, schema validator, and extraction pipeline are already sector-agnostic. |
| **ShadowMarketService** | Scores CH charges + PSC changes; maps to RiskTier taxonomy | The normalisation pipeline can ingest **any** structured regulatory filing (HMRC, FCA, Charity Commission) with minimal adaptation. The dual taxonomy (GROWTH/RESCUE + ELEVATED_RISK/STABLE/IMPROVED) is universal. |
| **ContentGenerator domain profiles** | 3 profiles (consulting, tech, finance) | Adding new profiles is a dictionary entry. Could power sector-specific report generation for **legal**, **healthcare**, **infrastructure** clients with no code changes. |
| **PersistenceService score_history** | Stores point-in-time adjacency scores | The time-series data already exists for **trend analysis**, **anomaly detection**, and **predictive scoring** — just needs a query layer on top. |
| **Morning Pulse + Slack pipeline** | Daily digest of top 5 signals | The push intelligence framework (Firestore query → synthesis → notification) is **fully reusable** for any alert type — regulatory deadlines, talent drain triggers, funding round detection. |
| **PDF/DOCX factory pipeline** | Proposals, briefings, portfolio risk reports | The template → render → GCS → signed URL pipeline is sector-agnostic. Could generate **compliance reports**, **due diligence packs**, **investor updates** with new templates only. |
| **Entity Resolution (dormant)** | Stub returning mock adjacency scores | The API contract is defined. Wiring it to the enrichment service + a graph database would unlock **entity relationship mapping** — the highest-value capability for institutional clients. |
| **Telemetry Service** | Per-tenant monthly counters | Ready for **usage-based billing** (Stripe metering API), **capacity planning** (entity growth curves), and **SLA monitoring** (sweep success rate). |
| **Webhook Egress** | Signed event delivery to GRC platforms | Ready for **marketplace integrations** (ServiceNow store, OneTrust App Gallery), **partner API** (white-label data delivery), and **event-driven automation** (trigger downstream workflows). |

---

### §1.3 — Entity Resolution: Recommended Architecture (Stub → Production)

> **Problem**: Companies share directors, PSCs, and charges but this connectivity is invisible. A single distressed PSC controlling 12 entities creates contagion risk that no flat data model can surface.

#### Recommended Stack

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Graph Database** | **Neo4j Aura Professional (managed)** | Native graph with Cypher query language. Purpose-built for entity-relationship traversal. Aura Professional is serverless, GCP-hosted (us-east1 / eu-west1), and eliminates ops burden. 200K nodes included in base tier. |
| **Fallback (budget)** | **Memgraph** on Cloud Run | Open-source, Cypher-compatible, runs in Docker. ~£0 at low scale. Upgrade to Neo4j Aura when ARR > £50K justifies the cost. |
| **Entity Matching** | **splink 4.x** (Python, DuckDB backend) | Probabilistic record linkage using Fellegi–Sunter model. Handles fuzzy matching across CH numbers, director names, and registered addresses. Configurable prior probabilities. Free, open-source, maintained by UK MoJ. |
| **Graph Sync** | **Firestore → Neo4j CDC via Cloud Functions (2nd gen)** | On write to `tenants/{id}/monitored_entities`, a Cloud Function pushes to Neo4j. Event-driven, exactly-once semantics via Firestore triggers. ~£0.40/million invocations. |
| **Visualisation** | **React Force Graph** (2D/3D) | Lightweight force-directed graph renderer for the dashboard Contagion Map. WebGL-accelerated, handles 5K+ nodes interactively. |

#### Complementary GCP Services

| Service | Role in Pipeline | Monthly Cost Estimate |
|---------|-----------------|----------------------|
| **Cloud Functions (2nd gen)** | CDC bridge: Firestore write → Neo4j upsert | ~£5 (at 50K events/mo) |
| **Cloud Scheduler** | Trigger nightly graph materialisation (compute `:SHARES_DIRECTOR` edges) | £0 (free tier) |
| **Secret Manager** | Store Neo4j Aura credentials, rotate quarterly | £0 (free tier at < 10K access/mo) |
| **Cloud Monitoring** | Alert on graph sync failures, query latency > 500ms | £0 (bundled) |

#### Data Model (Cypher Schema)

```cypher
// Core nodes
(:Company {ch_number, name, risk_tier, region, tenant_id, conviction_score})
(:Person  {name, date_of_birth, nationality, person_hash})  // person_hash = splink dedup key
(:Charge  {type, holder, status, date_registered, date_satisfied})

// Core relationships
(:Person)-[:DIRECTOR_OF {appointed, resigned, role}]->(:Company)
(:Person)-[:PSC_OF {nature_of_control, notified}]->(:Company)
(:Company)-[:HAS_CHARGE {status, amount}]->(:Charge)

// Materialised edges (computed nightly, not inferred at query time)
(:Company)-[:SHARES_DIRECTOR {shared_count, confidence}]->(:Company)
(:Company)-[:SHARES_PSC {shared_count, confidence}]->(:Company)
(:Company)-[:SAME_REGISTERED_ADDRESS]->(:Company)
```

#### Contagion Query Examples

```cypher
// 1. Find all companies sharing a PSC with a distressed entity
MATCH (distressed:Company {risk_tier: 'ELEVATED_RISK'})<-[:PSC_OF]-(psc:Person)-[:PSC_OF]->(linked:Company)
WHERE linked.ch_number <> distressed.ch_number
RETURN linked.name, linked.risk_tier, psc.name, COUNT(*) AS shared_connections
ORDER BY linked.risk_tier DESC, shared_connections DESC

// 2. Find 2-hop contagion path
MATCH path = (source:Company {ch_number: $ch})-[:SHARES_DIRECTOR|SHARES_PSC*1..2]-(related:Company)
WHERE related.risk_tier = 'ELEVATED_RISK'
RETURN nodes(path), relationships(path), length(path) as hops

// 3. Portfolio-level systemic risk (entities appearing in multiple tenant portfolios)
MATCH (c:Company)
WHERE SIZE([(c)<-[:MONITORS]-(:Portfolio) | 1]) >= 2 AND c.risk_tier = 'ELEVATED_RISK'
RETURN c.name, c.risk_tier, SIZE([(c)<-[:MONITORS]-(:Portfolio) | 1]) as portfolio_count
```

#### Implementation Phases

| Phase | Scope | Effort | Sprint |
|-------|-------|--------|--------|
| **Phase A** (Day 61–70) | Deploy Neo4j Aura Professional. Build `services/graph_service.py` with `upsert_company()`, `upsert_person()`, `create_relationship()`. Ingest current `monitored_entities` as `:Company` nodes and existing PSC/director data as `:Person` nodes. | 5 days | Sprint 7 |
| **Phase B** (Day 71–80) | Build materialised edge computation: nightly Cloud Function runs splink dedup → creates `:SHARES_DIRECTOR` and `:SHARES_PSC` edges. Expose Cypher query API via `GET /api/v1/graph/contagion/{ch_number}`. | 5 days | Sprint 7 |
| **Phase C** (Day 81–90) | Wire graph data into dashboard: add "Contagion Map" component to entity detail modal showing 2-hop network. Alert pipeline: if any linked entity degrades tier, flag the connection and notify the monitoring tenant. | 5 days | Sprint 7 |

---

### §1.4 — BigQuery Data Pipelines: Architecture (Now in Production)

> **Status**: ✅ Phase A and B completed in Sprint 4. Pub/Sub publisher hook deployed in `persistence.py`. Beam pipeline operational.

#### Production Stack (Deployed)

| Component | GCP Service | Status |
|-----------|------------|--------|
| **Stream Ingest** | Pub/Sub topic `ic-origin-signals` | ✅ Deployed |
| **Stream Processing** | Dataflow (Apache Beam, Python SDK) | ✅ Deployed |
| **Warehouse** | BigQuery: `fact_signals` + `dim_portfolio_membership` + `vw_systemic_risk` | ✅ DDL Applied |
| **Tenant Isolation** | Pub/Sub payloads include `tenant_id`; BigQuery queries filtered by tenant | ✅ Sprint 5 |

#### Remaining Work (Sprint 7+)

| Component | GCP Service | Purpose | Sprint |
|-----------|------------|---------|--------|
| **Batch Backfill** | Dataflow Flex Templates | One-time historical backfill from Firestore exports. Re-runnable for schema migrations. | Sprint 7 |
| **Orchestration** | Cloud Scheduler → Cloud Functions | Daily aggregation: portfolio-level risk score rollups, cross-portfolio heatmaps. | Sprint 8 |
| **BI Layer** | Looker Studio (short-term), Dashboard API (long-term) | Looker for internal analytics; `/api/v1/analytics` for cross-portfolio tenant-scoped metrics. | Sprint 8 |
| **Data Quality** | Great Expectations on Dataflow | Schema validation, null rate checks, conviction_score range assertions. Alert on anomalies. | Sprint 9 |

#### Complementary GCP Services for Pipeline Hardening

| Service | Purpose | Cost |
|---------|---------|------|
| **Cloud Monitoring + Alerting** | Alert on: Pub/Sub backlog > 1000 msgs, Dataflow worker failures, BigQuery slot saturation | Free tier covers |
| **Cloud DLP** | Scan BigQuery tables for PII leakage (names, addresses that shouldn't persist in analytics) | ~£2/TB scanned |
| **Data Catalog** | Auto-discover and tag BigQuery tables. Enables governance dashboards for SOC 2. | Free tier covers |
| **Dataflow Prime** | Right-sizing: auto-scales workers based on backlog. Reduces cost for bursty signal patterns. | Pay-per-use |

---

## Phase 2: Adjacency Discovery — Three Expansion Vectors

### Vector A: Supply Chain & Counterparty Risk Intelligence

> **Shift from**: M&A target identification → **Shift to**: Live counterparty risk monitoring for institutional credit and procurement teams.

**Market Thesis**: UK institutions (banks, insurers, large corporates) spend £2–8B/yr on third-party risk monitoring. Most solutions (Dun & Bradstreet, Moody's Orbis) are slow, expensive, and batch-processed. IC Origin's **real-time** CH filing detection + LLM synthesis is a pure wedge.

**Competitive Moat Analysis**:

| Competitor | Update Frequency | UK Coverage | Entity Resolution | Price | IC Origin Advantage |
|-----------|-----------------|-------------|------------------|-------|-------------------|
| Moody's Orbis | Weekly batch | 4M+ entities | Manual | £50-200K/yr | Real-time vs. weekly; 10x cheaper |
| D&B Finance Analytics | Daily batch | 6M+ entities | Proprietary | £30-150K/yr | LLM-synthesised analysis vs. flat scores |
| CreditSafe | Daily batch | 2M+ entities | None | £15-60K/yr | Contagion mapping (Neo4j) — no competitor offers |
| Bureau van Dijk (Orbis) | Monthly | 400M+ global | Manual | £80-300K/yr | UK-focused depth > global breadth |

**Implementation Status (Sprints 1–6 Complete)**:

| Deliverable | Status | Sprint |
|-------------|--------|--------|
| Schema: `CounterpartyType`, `RiskTier` enums, `AuctionData` extensions | ✅ Done | Sprint 1 |
| Portfolio Upload API: CSV → parsed portfolio with dedup + normalisation | ✅ Done | Sprint 1 |
| Portfolio Sweep: `run_portfolio_sweep()` with rate limiter | ✅ Done | Sprint 1 |
| AI Risk Prompt: `build_risk_system_prompt()`, 13-field extraction | ✅ Done | Sprint 2 |
| Taxonomy Engine: `evaluate_risk_signals()` → deterministic RiskTier | ✅ Done | Sprint 2 |
| PDF Pipeline: A4 institutional report via Jinja2 + WeasyPrint | ✅ Done | Sprint 2 |
| Dashboard: PortfolioRisk grid + RiskTrend chart | ✅ Done | Sprint 3 |
| Pub/Sub → Dataflow → BigQuery pipeline | ✅ Done | Sprint 4 |
| Universal Notification Service (Email + Slack, channel isolation) | ✅ Done | Sprint 4 |
| GRC Webhook Egress (HMAC-SHA256 signed payloads) | ✅ Done | Sprint 4 |
| Tenant Isolation (Firestore paths + security rules) | ✅ Done | Sprint 5 |
| RBAC Middleware (ADMIN/ANALYST/VIEWER) | ✅ Done | Sprint 5 |
| Portfolio Manager UI (role-gated CRUD) | ✅ Done | Sprint 5 |
| Telemetry Service (atomic counters) + Command Centre UI | ✅ Done | Sprint 6 |
| **Remaining**: Entity resolution, SSO, SOC 2, Vector B/C data sources | 🔲 Planned | Sprints 7–9 |

---

### Vector B: Talent Intelligence & Human Capital Analytics

> **Shift from**: Financial signal detection → **Shift to**: Real-time talent flow analysis for PE firms, growth equity, and corporate strategy teams.

**Market Thesis**: PE firms increasingly use talent data as leading indicators. A company hiring 10 ML engineers signals AI pivot before any filing. A company losing its CFO + Head of Legal signals pre-deal activity. IC Origin's LLM extraction pipeline can parse job postings and LinkedIn signals with minimal modification.

**Target Customers**:

| Segment | Use Case | ACV | Deal Cycle |
|---------|----------|-----|-----------|
| PE / Growth Equity | Monitor portfolio company hiring velocity as growth proxy; detect talent drain as distress signal | £40–80K | 6–8 weeks |
| Corporate M&A / Corp Dev | Detect competitor talent acquisition patterns before public announcements | £25–50K | 8–12 weeks |
| HR Consulting / RPO | Sector-level hiring trend intelligence for workforce planning | £15–30K | 4–6 weeks |
| Executive Search Firms | Track C-suite departures and appointments across target sectors | £20–40K | 4–6 weeks |

**Technical Requirements (Engineering-Spec)**:

| Layer | Change | Effort | Files | Dependencies |
|-------|--------|--------|-------|-------------|
| **Schema** | Add `human_capital` sub-schema to `AuctionData`: `headcount_delta: int`, `key_hire_departures: list[dict]`, `hiring_velocity_pct: float`, `talent_concentration: dict` (tech/ops/sales split), `glassdoor_sentiment: float` | 2 days | `schemas/auctions.py` | None |
| **Sector Config** | New preset `talent_intelligence` with extraction schema: `[role_title, department, seniority, location, company_name, hiring_signal_type, compensation_band]`. Add `talent_intelligence_pe` variant for PE-specific signals (e.g., "Head of Integration" = post-acquisition indicator) | 1 day | `core/sector_presets.json` | Schema changes |
| **Data Sources** | Add RSS/API sources: Indeed RSS (UK jobs, per-sector feeds available), Reed.co.uk RSS (structured, 50K+ active UK listings), Adzuna API (free tier: 250 calls/day, structured JSON). Extend `MarketSweepService` with `run_talent_sweep()`. **Avoid LinkedIn** (aggressive anti-scraping). | 5 days | `services/market_sweep.py`, `sector_presets.json` | Config changes |
| **AI Prompt** | New prompt: "Analyze this job posting/talent movement. Classify as: `EXPANSION_SIGNAL`, `DEPARTURE_SIGNAL`, `REORG_SIGNAL`, `ACQUISITION_PREP`. Extract: role, seniority, department, compensation_band, timing, company_stage_indicator. Score conviction 0-100." Add Gemini function-calling schema for structured extraction. | 2 days | `services/extraction_rules.py` | Schema |
| **Shadow Market** | Extend `ShadowMarketService` with `evaluate_talent_signals()`: hiring_velocity > 30% → `RAPID_GROWTH`; CFO/CTO departure → `KEY_PERSON_RISK`; hiring_freeze + layoffs → `CONTRACTION_SIGNAL`; "Head of Integration" + "VP Corporate Development" → `MAA_PREP_SIGNAL`. | 3 days | `services/shadow_market.py` | AI Prompt |
| **Cross-Vector** | Wire talent signals into counterparty risk portfolio. `hiring_velocity_6mo_pct < 0 && active_job_postings == 0` → "Talent Freeze" shadow signal. Compound with financial distress: if CH risk_tier == ELEVATED + Talent Freeze → auto-escalate to CRITICAL. | 2 days | `PortfolioRisk.tsx`, `shadow_market.py` | Shadow Market |
| **Dashboard** | New "Talent Radar" tab: hiring velocity sparklines per entity, key departure alert cards, talent concentration donut charts (D3 or Recharts PieChart), sector-level hiring heatmap (Recharts HeatMapGrid). | 5 days | `components/dashboard/TalentRadar.tsx` (new) | Data Sources |
| **PDF Reports** | New Jinja2 template: "Talent Intelligence Briefing" — portfolio-level hiring trends, key departures, sector benchmarks. Reuses existing PDF factory pipeline. | 2 days | `templates/talent_briefing.html`, `memo_service.py` | Dashboard |
| **Notifications** | Talent alerts via existing `NotificationService`: "CFO of [Entity X] resigned — 3rd C-suite departure in 90 days" → Email + Slack. Uses existing channel isolation. | 1 day | `services/notification_service.py` | NotificationService |
| **BigQuery** | Add `source_family: 'TALENT_FEED'` to existing Beam pipeline. No schema changes needed — `fact_signals` already has `source_family` column. | 0.5 days | `signal_pipeline.py` | Pipeline |

**Total Engineering Effort**: ~23.5 days (1 engineer) / ~12 days (2 engineers)

**Go-to-Market**:

| Activity | Timeline | Owner | Success Metric |
|----------|----------|-------|---------------|
| Build demo portfolio: 20 UK PE portfolio companies with seeded talent data (real Indeed/Reed scrapes) | Week 1 | Engineering | 20 entities with hiring_velocity populated |
| Produce 2-page sales collateral: "How Talent Data Predicts M&A 90 Days Before Filing" | Week 2 | Product + Marketing | Collateral approved by CEO |
| Outbound to 10 UK PE firms: Inflexion, Hg Capital, Bridgepoint, ECI Partners, Bowmark, LDC, August Equity, NorthEdge, BGF, Lyceum Capital | Week 3–4 | Sales | 5 meetings booked |
| Pilot: 1 PE firm monitors 30 portfolio companies for hiring signals alongside CH filings | Week 5–8 | All | Pilot live, weekly feedback loop |
| Case study: "How [Firm] detected a talent freeze 60 days before the company missed covenant" | Week 10 | Marketing | Published case study |
| Pricing validation: test £40K vs. £60K ACV via split proposals | Week 6–8 | Sales | Price sensitivity data |

---

### Vector C: Regulatory & Compliance Event Monitoring

> **Shift from**: Companies House-only signals → **Shift to**: Multi-registry regulatory event stream covering FCA, HMRC, Charity Commission, and environmental agencies.

**Market Thesis**: Post-Brexit UK regulatory fragmentation means compliance teams monitor 5–10 registries manually. IC Origin's signal-scoring pipeline is registry-agnostic — the `ShadowMarketService.normalize_ch_event()` pattern works for any structured filing. First-mover advantage in unified regulatory event intelligence.

**Target Customers**:

| Segment | Use Case | ACV | Deal Cycle | Procurement Route |
|---------|----------|-----|-----------|------------------|
| Law Firms (Top 50 UK) | Cross-registry enforcement monitoring for client base; automated alerting when named in regulatory actions | £60–120K | 8–12 weeks | Compliance Partner → IT procurement |
| Compliance Consultancies | Multi-registry monitoring delivered as SaaS to their own client base (white-label opportunity) | £30–60K | 6–8 weeks | Direct to MD |
| ESG / Impact Funds | Environmental agency penalty tracking against portfolio companies; greenwashing detection | £25–50K | 6–10 weeks | ESG team lead → fund manager |
| Charity Sector (CFOs/Trustees) | Charity Commission action monitoring; proactive compliance alerts before investigations escalate | £10–25K | 4–6 weeks | Direct to CFO/Trustee |
| Corporate Treasury / GRC | Unified regulatory feed into existing GRC platforms (ServiceNow, Archer, OneTrust) | £40–80K | 10–16 weeks | GRC team → CISO → procurement |

**UK Regulatory RSS/API Landscape (Validated)**:

| Registry | Data Availability | Format | Rate Limits | Signal Quality |
|----------|------------------|--------|-------------|---------------|
| **Companies House** | ✅ REST API + streaming | JSON | 600/5min | High — structured filings |
| **FCA** | ✅ RSS feed (enforcement notices, final notices, warnings list) | Atom/RSS | None documented | High — enforcement actions are binary events |
| **Charity Commission** | ✅ API v1 (charity details, accounts, events, regulatory actions) | JSON | Fair use (~100/min observed) | Medium — requires LLM extraction for event classification |
| **HMRC** | ⚠️ Limited: defaulters list (monthly CSV), some RSS for guidance | HTML/CSV | N/A | Medium — defaulters list is high-signal but monthly |
| **Environment Agency** | ✅ RSS (enforcement, prosecutions) + data.gov.uk pollution incident datasets | RSS/CSV | None | High — enforcement = confirmed violation |
| **ICO** | ✅ RSS feed (enforcement actions, monetary penalties) | RSS | None | High — penalty amounts are quantified |
| **Ofcom** | ✅ RSS feed (broadcasting standards, investigations) | RSS | None | Low — niche applicability |

**Technical Requirements (Engineering-Spec)**:

| Layer | Change | Effort | Files | Dependencies |
|-------|--------|--------|-------|-------------|
| **Schema** | Add `regulatory_source` enum: `COMPANIES_HOUSE`, `FCA`, `HMRC`, `CHARITY_COMMISSION`, `ENVIRONMENT_AGENCY`, `ICO`, `OFCOM`. Extend `source_family` taxonomy in `fact_signals`. Add `penalty_amount_gbp: Optional[float]`, `frn_number: Optional[str]`, `infraction_type: Optional[str]` to `AuctionData`. | 2 days | `schemas/auctions.py` | None |
| **Data Sources** | Add RSS feeds per registry. Each feed gets its own entry in `sector_presets.json` with registry-specific extraction schemas. FCA: `https://www.fca.org.uk/news/rss.xml`. EA: `https://www.gov.uk/environment-agency/enforcement.atom`. ICO: `https://ico.org.uk/action-weve-taken/enforcement.rss`. | 3 days | `sector_presets.json`, `market_sweep.py` | Schema |
| **Shadow Market** | Generalise `normalize_ch_event()` → `normalize_regulatory_event(registry_type, raw_event)`. Add scoring rules per registry: FCA final notice = conviction 95, FCA warning letter = conviction 60, EA prosecution = conviction 90, ICO monetary penalty = conviction 85, HMRC defaulter = conviction 80. | 3 days | `services/shadow_market.py` | Schema |
| **AI Prompt** | Registry-specific prompts with Gemini function-calling: "Analyze this FCA enforcement notice. Extract: `firm_name`, `frn_number`, `infraction_type`, `penalty_amount_gbp`, `remediation_required`, `systemic_risk_indicator`, `prohibition_order`, `related_firms[]`." Similar for each registry. | 3 days | `services/extraction_rules.py` | Shadow Market |
| **Cross-Reference Engine** | When a regulatory event is ingested, auto-query CH API to match the regulated entity → Companies House number. Link to existing `monitored_entities` for cross-vector correlation. Use splink for fuzzy matching (firm name ≠ CH registered name in ~30% of cases). | 5 days | `services/enrichment.py`, `services/graph_service.py` | Entity Resolution |
| **Dashboard** | "Regulatory Radar" view: multi-registry filter in signal feed, colour-coded by source (FCA=blue, EA=green, ICO=purple). Per-entity regulatory timeline. Penalty amount sparkline. | 5 days | `components/dashboard/RegulatoryRadar.tsx` (new) | Data Sources |
| **BigQuery Pipeline** | Add `source_family: 'FCA'/'EA'/'ICO'` to existing Beam pipeline. Add `penalty_amount_gbp` to `fact_signals` schema (ALTERable). Batch-process 12 months of historical FCA enforcement notices. | 3 days | `signal_pipeline.py`, `bigquery_schema.sql` | Pipeline |
| **PDF Reports** | New template: "Regulatory Exposure Report" — per-entity regulatory history, sector benchmarks, penalty amount trends, peer comparison table. | 2 days | `templates/regulatory_report.html`, `memo_service.py` | Dashboard |
| **GRC Integration** | Extend existing webhook egress with FCA/EA-specific event types: `REGULATORY_ENFORCEMENT`, `REGULATORY_WARNING`, `PENALTY_ISSUED`. GRC platforms subscribe to these via existing `/api/v1/webhooks/subscribe`. | 1 day | `schemas/webhooks.py` | Webhook Egress |

**Total Engineering Effort**: ~27 days (1 engineer) / ~14 days (2 engineers)

**Go-to-Market**:

| Activity | Timeline | Owner | Success Metric |
|----------|----------|-------|---------------|
| Build FCA enforcement feed: ingest 12 months of historical final notices, parse + score + cross-ref with CH | Week 1–2 | Engineering | 200+ FCA enforcement actions ingested with CH number matches |
| Demo: show 10 FCA-regulated entities with cross-referenced CH filings and combined risk scores | Week 3 | Engineering + Sales | Working demo |
| Identify 5 Magic Circle / Top 20 UK law firms compliance partners by name (desk research) | Week 3 | Sales | Named contact list |
| Outbound to 5 law firms: Clifford Chance, Linklaters, Allen & Overy, Freshfields, Slaughter and May | Week 4–6 | Sales | 3 meetings booked |
| Pilot: 1 law firm monitors 200 regulated entities across FCA + CH | Week 7–10 | All | Pilot live |
| Add Charity Commission + Environment Agency feeds during pilot | Week 8–12 | Engineering | 3 registries live |
| Case study: "How [Firm] detected an FCA enforcement action 48 hours before public announcement" | Week 14 | Marketing | Published |

---

## Phase 3: Actionable Roadmap — 30/60/90 Day Plan (Pressure-Tested)

### Selected Vector: **A — Supply Chain & Counterparty Risk Intelligence**

**Rationale**: Lowest friction (90% reuses existing code), highest immediate revenue potential (banks/insurers have budget), fastest time-to-demo. Vectors B and C are additive once A's infrastructure is proven.

---

### Days 1–30: Foundation & First Demo — ✅ COMPLETE

**Sprint 1 (Days 1–10): Schema & Config** ✅ **Sprint 2 (Days 11–20): AI & Intelligence** ✅ **Sprint 3 (Days 21–30): Dashboard & Demo** ✅

All 12 tasks delivered. 58 tests pass.

| Risk | Probability | Impact | Mitigation | Status |
|------|-------------|--------|------------|--------|
| CH API rate-limit exceeded during portfolio sweep | Medium | Demo blocked | ✅ Mitigated: 0.5s delay per entity in `run_portfolio_sweep()`. Caps at ~120 entities/min, well within 600/5min CH limit. | Resolved |
| LLM hallucination in risk extraction (false positives) | Medium | Client trust | ✅ Mitigated: Deterministic `evaluate_risk_signals()` runs *after* LLM extraction. Rules engine is the source of truth for RiskTier. | Resolved |
| WeasyPrint/GTK not available in deployment | Low | PDF fails | ✅ Mitigated: `render_pdf_sync()` fallback + production Dockerfile includes GTK libs. | Resolved |
| Firestore unavailable during demo | Low | Data lost | ✅ Mitigated: SWR `fallbackData` + `DEMO_COUNTERPARTIES` static module. | Resolved |

**Business Milestone**: ✅ Live demo ready.

---

### Days 31–60: Hardening & Pilot — ✅ COMPLETE

**Sprint 4 (Days 31–40): Scale & Reliability** ✅

| # | Task | Status | Files |
|---|------|--------|-------|
| 13 | Deploy Pub/Sub topic + publish hook in persistence layer | ✅ Done | `services/persistence.py` |
| 14 | Build Beam pipeline: Pub/Sub → BigQuery `fact_signals` | ✅ Done | `signal_pipeline.py`, `bigquery_schema.sql` |
| 15 | Universal Notification Service (Email via Resend + Slack, channel isolation) | ✅ Done | `services/notification_service.py` |
| 16 | GRC Webhook Egress (HMAC-SHA256, subscription CRUD) | ✅ Done | `api/webhooks.py`, `schemas/webhooks.py` |

| Risk | Status | Mitigation Applied |
|------|--------|--------------------|
| CH API downtime (~2hr monthly maintenance) | ✅ Mitigated | Retry-with-backoff in enrichment_service. `sweep_status` field tracks COMPLETE/PARTIAL/FAILED. |
| Pub/Sub → BigQuery pipeline lag | ✅ Mitigated | Dataflow `allowedLateness` windowing. Dashboard queries include freshness guard. |
| Resend email deliverability to bank domains | ✅ Mitigated | Custom domain `alerts@icorigin.ai` with SPF/DKIM/DMARC. Slack + GCS URL fallback. |

**Sprint 5 (Days 41–50): Multi-Tenancy** ✅

| # | Task | Status | Files |
|---|------|--------|-------|
| 17 | Tenant isolation: all Firestore paths under `tenants/{tenant_id}/...` | ✅ Done | `services/persistence.py` |
| 18 | RBAC: ADMIN/ANALYST/VIEWER roles via Firebase custom claims | ✅ Done | `core/auth.py`, `firestore.rules` |
| 19 | Portfolio Manager UI: role-gated add/remove/upload | ✅ Done | `PortfolioManager.tsx` |

| Risk | Status | Mitigation Applied |
|------|--------|--------------------|
| Cross-tenant data leakage | ✅ Mitigated | All queries scoped by `tenant_id` in path. Firestore security rules enforce claim matching. 23 tests verify tenant isolation. |
| Role bypass via direct API | ✅ Mitigated | JWT + role validated on every endpoint. All role-permission combinations unit tested. |

**Sprint 6 (Days 51–60): Pilot Launch** ✅

| # | Task | Status | Files |
|---|------|--------|-------|
| 20 | Onboard first pilot customer (50-company portfolio) | 🔲 Pending | Deployment |
| 21 | Tenant-aware usage telemetry (atomic Firestore counters) | ✅ Done | `services/telemetry_service.py`, `api/telemetry.py` |
| 22 | Portfolio Command Centre UI (system status, metrics, polling) | ✅ Done | `PortfolioStatus.tsx` |

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Pilot portfolio > 500 entities (exceeds single-sweep capacity) | Medium | Timeout | Implement batched sweeping via Cloud Tasks: 50 entities/job. Dashboard shows progress bar ("142/500 swept"). |
| LLM extraction latency at scale (Gemini Flash ~1-2s/entity) | Medium | 500-entity sweep = 15+ min | Make sweeps asynchronous via Cloud Tasks + Firestore status doc. Consider Gemini Flash 2.0 batch mode. |
| Pilot customer requires SSO (Azure AD) before go-live | High | Blocks pilot launch | Pre-build Azure AD SAML config (most common UK enterprise IdP). Have working SSO in 48 hours if needed. |

**Business Milestone**: ✅ Infrastructure ready for pilot. 133 tests pass across all sprints.

---

### Days 61–90: Scale & Expansion

**Sprint 7 (Days 61–70): Entity Resolution + Advanced Intelligence**

| # | Task | Owner | Files |
|---|------|-------|-------|
| 23 | Deploy Neo4j Aura Professional; ingest entities + persons from PSC/director data | Backend | `services/graph_service.py` (new) |
| 24 | Build materialised `:SHARES_DIRECTOR` / `:SHARES_PSC` edges; Cypher query API | Backend | `services/graph_service.py` |
| 25 | Cross-portfolio risk correlation: entity in 3+ portfolios + degrading → systemic flag | Backend | `services/systemic_risk.py` (new) |
| 26 | "Contagion Map" in entity detail modal: 2-hop network vis (React Force Graph) | Frontend | `components/dashboard/ContagionMap.tsx` (new) |

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Neo4j Aura cold-start latency on first query | Low | Slow modal | Pre-warm graph with Cloud Scheduler health-check query every 5 min. Cache hot paths in Redis/Memorystore. |
| Fuzzy entity matching (splink) produces false links | Medium | Misleading contagion | Require 2+ matching fields (name + DoB, name + address). Flag low-confidence links as "Probable" in UI. Manual override workflow. |
| Graph > 200K nodes exceeds Aura Professional free tier | Low (near-term) | Service degrades | Monitor node count via telemetry. Budget for Aura Professional paid tier (~$65/mo) at 100K+ nodes. Alert at 80% capacity. |

**Sprint 8 (Days 71–80): Vector B Groundwork**

| # | Task | Owner | Files |
|---|------|-------|-------|
| 27 | Add Indeed/Reed.co.uk/Adzuna RSS parsing to `run_talent_sweep()` | Backend | `services/market_sweep.py` |
| 28 | Extend `AuctionData` with `human_capital` sub-schema | Backend | `schemas/auctions.py` |
| 29 | Add `evaluate_talent_signals()` to `ShadowMarketService` | Backend | `services/shadow_market.py` |
| 30 | Build "Talent Signals" column in PortfolioRisk grid | Frontend | `PortfolioRisk.tsx` |

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Indeed/LinkedIn block scraping or deprecate RSS | High | Data source lost | Abstract behind interface pattern. Fallback: Adzuna API (free tier), CH director appointment/resignation dates as proxy, HMRC PAYE RTI (batched). |
| Talent data noise (duplicates, stale postings) | Medium | Low signal quality | Dedup by (company, role_title, location) tuple. Discard > 60d old. Gemini classifies posting freshness. |
| Legal risk of scraping job boards | Medium | Cease-and-desist | Use only public RSS feeds and official APIs. Adzuna explicitly permits API use. Reed.co.uk RSS is public. No scraping. |

**Sprint 9 (Days 81–90): Enterprise Readiness**

| # | Task | Owner | Files |
|---|------|-------|-------|
| 31 | SOC 2 compliance: audit logging for all data access (BigQuery, not Firestore) | Backend | `core/audit.py` (new) |
| 32 | SSO integration: SAML/OIDC via Firebase Auth + Google Identity Platform | Backend | `core/auth.py` |
| 33 | API-first packaging: OpenAPI spec, rate-limited API keys per tenant | Backend | `api/api_keys.py` |
| 34 | Customer self-service onboarding flow | Frontend | `app/onboarding/page.tsx` (new) |

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| SOC 2 audit logging cost (Firestore writes) | Medium | Bill spike | Log to BigQuery (batch) via Cloud Logging export. Zero additional Firestore writes. |
| SSO config complexity per enterprise | High | Slow onboarding | Self-service SAML metadata upload. Pre-built configs for Azure AD, Okta, Google Workspace (90% of UK enterprise). |
| API key management complexity | Medium | Security gap | Use GCP API Gateway or Apigee X. Per-tenant rate limits enforced at infrastructure level, not application. |
| SOC 2 Type II audit timeline (12 months continuous) | Certain | Cannot report for 12+ months | Start Type II clock on Day 81. Engage auditor (Vanta/Drata for automated evidence collection). Target Type I report by Day 120. |

**Business Milestone**: 3+ paying customers, 10+ qualified pipeline, SOC 2 Type I underway, Neo4j entity resolution live, Vector B demo-ready.

---

## Phase 4: Autonomous Operations — The AI Agent Endgame

> **Vision**: IC Origin evolves from a dashboard-with-intelligence into an autonomous multi-agent system that executes strategy directly for the client — monitoring, analysing, deciding, and acting without human intervention beyond governance approvals.

### Evolution Trajectory

```
CURRENT STATE (Phase 1–3)                    TARGET STATE (Phase 4)
┌──────────────────────┐                     ┌────────────────────────────┐
│ Human uploads CSV    │                     │ Agent discovers entities   │
│ Human reads dashboard│   ──────────▶       │ Agent generates analysis   │
│ Human decides action │                     │ Agent recommends action    │
│ Human exports PDF    │                     │ Agent executes (w/ approval│
└──────────────────────┘                     └────────────────────────────┘
```

### Agent Architecture

| Agent | Role | Autonomy Level | Built | Remaining |
|-------|------|---------------|-------|-----------|
| **Scout Agent** | Discovers new entities to monitor. Self-expands the watchlist based on contagion signals from Neo4j graph. Runs on Cloud Scheduler, consumes RSS + CH streaming API + regulatory feeds. | **Full Autonomy** | 80% | Wire Neo4j auto-expansion, regulatory RSS sources |
| **Analyst Agent** | Ingests raw filings, extracts signals via LLM, scores risk, assigns tiers. Generates "analyst notes" per entity. Multi-source fusion (CH + talent + regulatory). | **Full Autonomy** | 90% | Multi-source fusion, vector-combined scoring |
| **Strategist Agent** | Synthesises cross-entity, cross-vector patterns. Generates board-ready memos with recommendations: defend, divest, acquire, escalate. Portfolio-level risk synthesis. | **Supervised Autonomy** | 60% | Weekly autonomous synthesis, confidence-gated recommendations |
| **Executor Agent** | Acts on approved strategies: sends alerts, generates reports, updates thresholds, triggers GRC webhooks, emails credit committees. | **Human-in-the-Loop** | 40% | Action queue UI, one-click approval, auto-approval rules |
| **Governor Agent** | Meta-agent monitoring all other agents: LLM hallucination detection, anomalous scoring spikes, cost overruns, rate-limit violations. Can pause agents autonomously. | **Full Autonomy** (safety) | 0% | Entire capability is new |

### Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AGENT COMMUNICATION BUS                    │
│              (Cloud Pub/Sub — topic per agent)                │
│                                                              │
│  scout-discoveries ──▶  analyst-signals ──▶  strategist-recs │
│        │                     │                      │        │
│        ▼                     ▼                      ▼        │
│  ┌──────────┐         ┌──────────┐          ┌──────────┐    │
│  │  SCOUT   │         │ ANALYST  │          │STRATEGIST│    │
│  │  Agent   │         │  Agent   │          │  Agent   │    │
│  └──────────┘         └──────────┘          └──────────┘    │
│                                                    │        │
│                                             executor-actions │
│                                                    │        │
│                                              ┌──────────┐   │
│                                              │ EXECUTOR │   │
│                                              │  Agent   │   │
│                                              └──────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              GOVERNOR AGENT (subscribes to ALL)       │   │
│  │  - Schema compliance validation                       │   │
│  │  - Hallucination detection (re-prompt + compare)      │   │
│  │  - Cost monitoring (LLM tokens/day, Firestore writes) │   │
│  │  - Rate limit enforcement                             │   │
│  │  - Agent health monitoring                            │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Implementation Roadmap (Days 91–180)

#### Sprint 10–11 (Days 91–110): Agent Communication Bus

| # | Task | Details | GCP Services |
|---|------|---------|-------------|
| 35 | Deploy agent communication bus | Pub/Sub topics per agent: `scout-discoveries`, `analyst-signals`, `strategist-recommendations`, `executor-actions`, `governor-alerts`. Dead-letter topics for failed messages. | Cloud Pub/Sub |
| 36 | Define agent message schema | `AgentMessage(agent_id: str, timestamp: datetime, message_type: str, payload: dict, confidence: float, requires_approval: bool, governor_approved: Optional[bool])`. Pydantic models in `schemas/agents.py`. | — |
| 37 | Build agent orchestration layer | Finite state machine in `services/agent_orchestrator.py`: SCOUT → ANALYST → STRATEGIST → EXECUTOR. Each transition gated by confidence thresholds (configurable per tenant). | Cloud Functions (2nd gen) |
| 38 | Implement Governor Agent | Subscribes to all agent topics. Validates: (1) JSON schema compliance, (2) hallucination detection via re-prompt-and-compare, (3) conviction score range [0, 100], (4) LLM token budget per tenant/day. Adds `governor_approved: bool` to all messages. Can pause any agent by publishing to `governor-alerts`. | Cloud Functions, Cloud Monitoring |

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Pub/Sub message ordering issues (out-of-order processing) | Medium | Stale data overwrites fresh | Use ordering keys: `tenant_id + entity_id`. Enable message ordering on subscriptions. |
| Governor Agent becomes bottleneck (validates every message) | Medium | Pipeline latency | Governor runs asynchronously (does not block pipeline). Non-blocking validation with post-hoc correction. |
| LLM token cost explosion from Governor re-prompting | Medium | Unexpected bill | Governor re-prompts only for confidence < 0.6. Cap re-prompts at 2x per message. Daily token budget alert at 80% threshold. |

#### Sprint 12–13 (Days 111–140): Autonomous Discovery Loop

| # | Task | Details |
|---|------|---------|
| 39 | Scout Agent: auto-expand watchlist | When Analyst detects ELEVATED_RISK for Entity X, Scout auto-queries Neo4j for `:SHARES_PSC` / `:SHARES_DIRECTOR` linked entities (2-hop). Adds new entities to monitoring with `source: 'contagion_auto_discover'`. Caps auto-expansion at 50 entities/day/tenant. |
| 40 | Analyst Agent: multi-source fusion | For each entity, fuse: CH filings + regulatory events + talent signals + RSS news. Produce unified "Entity Intelligence Dossier" JSON combining all vectors. Weighted conviction: CH (40%), regulatory (30%), talent (20%), news (10%). |
| 41 | Strategist Agent: portfolio-level synthesis | Weekly autonomous run: score each portfolio's aggregate exposure, identify concentration risk (> 30% elevated entities), generate strategic recommendations with citations. Push to Strategist output topic with `requires_approval: true`. |

#### Sprint 14–15 (Days 141–180): Supervised Execution

| # | Task | Details |
|---|------|---------|
| 42 | Executor Agent: action proposal queue | Dashboard shows "Proposed Actions" panel with action cards: "Send escalation email to Credit Committee about Entity X deterioration", "Generate updated risk report for Portfolio Y", "Add 5 contagion entities to monitoring". Each has Approve / Reject buttons with inline reasoning. |
| 43 | Approval workflows | One-click approval triggers action chain. Configurable per-tenant auto-approval rules: auto-approve report generation (low risk), require manual approval for alert escalation (high risk), auto-approve monitoring additions (medium risk). Full audit trail in BigQuery. |
| 44 | Client-facing agent transparency | "Agent Activity" dashboard tab: real-time feed showing what each agent is doing, what it discovered, what it recommends. Full explainability chain: source data → LLM extraction → rules engine → recommendation → action. |

### Autonomy Graduation Model

| Level | Name | Description | Gate Criteria | Revenue Multiplier |
|-------|------|-------------|--------------|-------------------|
| **L0** | Tool | Human operates all workflows manually | Ship MVP | 1.0x |
| **L1** | Assistant | System generates analysis; human decides and acts | Ship Sprints 1–3 ✅ | 1.0x |
| **L2** | Advisor | System generates recommendations with confidence scores; human approves | Deploy Strategist Agent + Governor | 1.5x |
| **L3** | Co-Pilot | System proposes actions; human approves with one click | Deploy Executor Agent + approval queue | 2.5x |
| **L4** | Autonomous (supervised) | System auto-executes low-risk actions; human approves high-risk only | Configurable auto-approval thresholds + 6 months L3 track record + Governor validated | 4.0x |
| **L5** | Autonomous (full) | System operates independently within guardrails; human receives weekly summaries | Governor Agent + SOC 2 audit trail + 12 months L4 track record + zero critical incidents | 6.0x |

### Cost Model (Phase 4 Infrastructure)

| Service | Monthly Cost (at 10 tenants, 5K entities) | Notes |
|---------|-----------------------------------------|-------|
| Cloud Pub/Sub | ~£10 | 5 topics × ~100K messages/month |
| Cloud Functions (2nd gen) | ~£20 | Agent orchestration + Governor |
| Gemini Flash (LLM) | ~£80 | ~200K extraction calls/month at $0.35/1M tokens |
| Neo4j Aura Professional | ~£50 | 200K nodes, 1M relationships |
| BigQuery | ~£15 | 500GB storage, 5TB queries/month |
| Dataflow | ~£30 | 2 streaming workers (n1-standard-1) |
| **Total** | **~£205/month** | **< 2% of ARR at 3 customers** |

### Revenue Impact

| Phase | Product Tier | Pricing Model | Target ACV | Gross Margin |
|-------|-------------|--------------|------------|-------------|
| Phase 3 (current) | **IC Origin Pro** — Dashboard + alerts + reports | Per-portfolio seat licence | £20–40K | 85% |
| Phase 4 L2–L3 | **IC Origin Autonomous** — Advisor + Co-Pilot agents | Per-entity monitored (usage-based) | £60–120K | 80% |
| Phase 4 L4–L5 | **IC Origin Enterprise** — Full autonomous + custom agent workflows | Platform fee + per-action billing | £150–300K | 75% |

---

## Appendix A: Capability vs. Asset Utilisation Matrix (V3.0)

```
                    ◀── CURRENT USE ──▶  ◀── UNTAPPED POTENTIAL ──▶
┌─────────────────────────────────────────────────────────────────┐
│ SectorLogicController  [███░░] 3 sectors → any vertical        │
│ ShadowMarketService    [████░] CH + RiskTier → any registry    │
│ ContentGenerator       [███░░] 3 profiles → any domain         │
│ Score History          [██░░░] Storage + chart → trend/predict  │
│ Morning Pulse Pipeline [██░░░] Daily signals → any alert type  │
│ PDF/DOCX Factory       [████░] Risk reports → any doc type     │
│ Entity Resolution      [░░░░░] Stub → Neo4j graph              │
│ BigQuery Pipelines     [████░] Pub/Sub + Beam (live)           │
│ Firebase Auth          [████░] Multi-tenant RBAC (live)         │
│ Orchestrator           [██░░░] Single prompt → multi-agent FSM │
│ Risk Extraction        [████░] 13-field LLM schema             │
│ Portfolio Upload API   [████░] CSV → parsed + deduped          │
│ Risk Dashboard         [████░] Grid + Trend + Manager + Status │
│ Notification Service   [████░] Email + Slack (channel isolated)│
│ Webhook Egress         [████░] HMAC-signed → GRC platforms     │
│ Telemetry Service      [███░░] Usage counters → billing/SLA    │
└─────────────────────────────────────────────────────────────────┘
```

## Appendix B: Test Coverage Summary (133 Tests, 0 Failures)

| Sprint | Focus | Tests |
|--------|-------|-------|
| Sprint 1 | Schema, CSV parsing, portfolio upload | 19 |
| Sprint 2 | AI extraction, risk rules, PDF generation | 22 |
| Sprint 3 | Dashboard data models, chart rendering | 17 |
| Sprint 4 | Pub/Sub, Beam pipeline, notifications, webhooks | 37 |
| Sprint 5 | Multi-tenancy, RBAC, tenant isolation | 23 |
| Sprint 6 | Telemetry, API status endpoint | 15 |
| **Total** | | **133** |

---

**End of Document**  
**Next Review**: Sprint 7 kickoff  
**Document Owner**: Engineering Lead  
**Distribution**: Board, Engineering, Product, Sales
