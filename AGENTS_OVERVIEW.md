# Cofound Agents OS - Complete Agent Overview

## 🏢 Monorepo Architecture

This monorepo contains 8 specialized AI agents that form a complete business automation platform. Each agent is deployed independently on Google Cloud Platform with its own infrastructure, but they work together as a cohesive system.

---

## 📊 Agent Catalog

### 1. **Sentinel Growth** - Market Intelligence & V2 Swarm
**Location**: `services/sentinel-growth`  
**Status**: ✅ V2.5 Deployed (Dormant)  
**Tech Stack**: Python, FastAPI, Google Gemini, AlloyDB (RAG), GKE Autopilot, Dataflow

**V2 Capabilities**:
- **Scale-to-Zero Ingest**: Serverless endpoint for Companies House & RSS feeds.
- **Thema Adjacency Engine**: Multi-agent orchestration for 'Defend/Expand/Originate' strategies.
- **AlloyDB RAG**: pgvector-powered semantic search for non-obvious deal discovery.
- **Shadow Market Layer**: Private deal tracking (OTC/Secondary signals).

**V2 Core Endpoints**:
- `POST /ingest` - [Ingest URL](https://ic-origin-ingest-1005792944830.europe-west2.run.app)
- `POST /strategize` - [Orchestrator URL](https://ic-origin-orchestrator-1005792944830.europe-west2.run.app)
- `POST /activate` - Wake dormant crons and GKE agents.
- `POST /demo` - Trigger mock 2-hour web-scale crawl simulation.

---

### 2. **Communication Agent** - Gmail Automation
**Location**: `services/communication-agent`  
**Status**: ✅ Active  
**Tech Stack**: Python, Gmail API, Vertex AI (Gemini), Firestore, OpenTelemetry

**Purpose**:
Intelligent Gmail automation that processes unread emails, generates AI-powered draft replies, and maintains idempotency through Firestore.

**Key Capabilities**:
- **Email Monitoring**: Automatically scans Gmail inbox for unread emails
- **AI Summarization**: Uses Vertex AI to summarize emails and understand context
- **Draft Generation**: Creates professional reply drafts using Gemini
- **Idempotency**: Firestore-based duplicate prevention ensures each email processed once
- **Spam Filtering**: AI-powered spam detection
- **Privacy-First**: Email bodies never logged, GDPR-compliant

**Deployment**:
- Cloud Functions Gen 2 (europe-west2)
- Cloud Scheduler (15-minute intervals)
- OpenTelemetry tracing for observability

---

### 3. **Calendar Agent** - Calendar Integration System
**Location**: `services/calendar-agent`  
**Status**: ✅ Active  
**Tech Stack**: Python, Flask, Google Calendar API, Microsoft Graph API, Terraform

**Purpose**:
Calendar integration system that handles user consent, authentication, and event processing for both Google Calendar and Outlook/Microsoft calendars.

**Key Capabilities**:
- **Multi-Platform Support**: Google Calendar and Microsoft Outlook integration
- **Onboarding API**: Flask-based API for user consent and OAuth flows
- **Event Processing**: Serverless functions for calendar event management
- **Secret Management**: GCP Secret Manager for secure credential storage

**Deployment**:
- Cloud Run (onboarding API)
- Cloud Functions (event processing)
- Terraform-managed infrastructure

---

### 4. **Travel Agent** - Voice-Activated Trip Planning
**Location**: `services/travel-agent`  
**Status**: ✅ Active  
**Tech Stack**: Python (Backend), Next.js (Frontend), Firebase, Stripe, Google OAuth

**Purpose**:
Multi-tenant SaaS application providing voice-activated travel planning assistance that integrates with calendar events.

**Key Capabilities**:
- **Voice Interaction**: Voice-activated trip planning interface
- **Calendar Integration**: Automatically plans trips around calendar events
- **Multi-Tenancy**: SaaS platform supporting multiple users/organizations
- **Payment Processing**: Stripe integration for subscriptions
- **User Authentication**: Firebase Auth with Google OAuth
- **Frontend Dashboard**: Next.js-based user interface

**Deployment**:
- Backend: Cloud Run (europe-west2)
- Frontend: Separate deployment (Next.js)
- Firebase for authentication and real-time data

---

### 5. **Invoice Agent** - Invoice Processing & Management
**Location**: `services/invoice-agent`  
**Status**: ✅ Active  
**Tech Stack**: Python, FastAPI, Document AI, Cloud Storage

**Purpose**:
Automated invoice processing system that extracts data from invoices, validates information, and manages invoice workflows.

**Key Capabilities**:
- **Document Parsing**: Extracts structured data from invoice PDFs
- **Data Validation**: Validates invoice information against business rules
- **Storage Management**: Organizes invoices in Cloud Storage
- **API Integration**: RESTful API for invoice submission and retrieval

**Deployment**:
- Cloud Run (europe-west2)
- Cloud Storage for document storage
- Document AI for OCR and extraction

---

### 6. **Delivery Agent** - Fulfillment & Logistics
**Location**: `services/delivery-agent`  
**Status**: ✅ Active  
**Tech Stack**: Python, Stripe Webhooks, Cloud Functions

**Purpose**:
Handles order fulfillment, delivery tracking, and logistics automation triggered by payment events.

**Key Capabilities**:
- **Stripe Integration**: Webhook handlers for payment events
- **Order Processing**: Automated order fulfillment workflows
- **Delivery Tracking**: Integration with logistics providers
- **Notification System**: Customer notifications for order status

**Deployment**:
- Cloud Functions (webhook handlers)
- Cloud Run (main service)
- Stripe webhook endpoints

---

### 7. **Newsletter Engine** - Content Distribution
**Location**: `services/newsletter-engine`  
**Status**: ✅ Active  
**Tech Stack**: Python, SendGrid, Cloud Scheduler

**Purpose**:
Automated newsletter generation and distribution system for content marketing and customer engagement.

**Key Capabilities**:
- **Content Aggregation**: Collects and curates content for newsletters
- **Email Distribution**: SendGrid integration for bulk email sending
- **Scheduling**: Automated newsletter campaigns via Cloud Scheduler
- **Template Management**: Customizable email templates
- **Analytics**: Track open rates and engagement

**Deployment**:
- Cloud Run (europe-west2)
- Cloud Scheduler for automated sends
- SendGrid for email delivery

---

### 8. **Vesper GTM** - Go-To-Market Intelligence
**Location**: `services/vesper-gtm`  
**Status**: ✅ Active  
**Tech Stack**: TypeScript, Next.js, Firebase, Cloud Functions

**Purpose**:
Go-to-market intelligence platform that identifies and qualifies leads from LinkedIn and Reddit, generates personalized outreach drafts.

**Key Capabilities**:
- **Lead Discovery**: Scrapes LinkedIn and Reddit for potential leads
- **ICP Scoring**: AI-powered ideal customer profile matching
- **Intent Analysis**: Analyzes user behavior for buying intent
- **Draft Generation**: Creates personalized outreach messages
- **Review Dashboard**: Next.js dashboard for lead review and approval
- **Workflow Automation**: Automated lead qualification pipeline

**Components**:
- **Dashboard**: Next.js app for lead management
- **Scout Functions**: Cloud Functions for web scraping and analysis
- **Firebase**: Real-time database for lead storage

**Deployment**:
- Dashboard: Cloud Run (Next.js)
- Functions: Cloud Functions
- Firebase Firestore for data storage

---

## 🏗️ Infrastructure Overview

### Common Technologies
- **Cloud Platform**: Google Cloud Platform (GCP)
- **Region**: europe-west2 (London) - GDPR compliant
- **Container Registry**: Artifact Registry
- **Secrets**: Secret Manager
- **Logging**: Cloud Logging with structured JSON
- **Monitoring**: Cloud Monitoring + OpenTelemetry
- **IaC**: Terraform for infrastructure management

### Deployment Pattern
Each agent follows a consistent deployment pattern:
1. **Containerization**: Docker images built and pushed to Artifact Registry
2. **Cloud Run**: Serverless container deployment
3. **Cloud Functions**: Event-driven serverless functions where needed
4. **Cloud Scheduler**: Automated task scheduling
5. **GitHub Actions**: CI/CD pipelines for automated deployments

### Security & Compliance
- **Region Lock**: All resources in europe-west2 (UK/EU)
- **Secret Management**: No hardcoded credentials
- **Least Privilege**: Dedicated service accounts per agent
- **Audit Logs**: 365-day retention
- **Public Access Prevention**: Enforced on all storage
- **Internal Ingress**: Cloud Run services restricted to internal traffic

---

## 🔄 Agent Interactions

### Integration Points
1. **Sentinel Growth** ↔ **Vesper GTM**: Market intelligence feeds into lead qualification
2. **Communication Agent** ↔ **Calendar Agent**: Email-based calendar event creation
3. **Travel Agent** ↔ **Calendar Agent**: Trip planning around calendar events
4. **Invoice Agent** ↔ **Delivery Agent**: Invoice triggers fulfillment
5. **Newsletter Engine** ↔ **Vesper GTM**: Lead nurturing campaigns

### Shared Services
- **Firebase/Firestore**: Shared database for cross-agent data
- **Secret Manager**: Centralized secret storage
- **Cloud Logging**: Unified logging across all agents
- **Artifact Registry**: Shared container images

---

## 📈 Current Status

| Agent | Status | Last Deploy | Health Check |
|-------|--------|-------------|--------------|
| Sentinel Growth | ✅ Active | 2026-01-07 | https://sentinel-growth-*.run.app/health |
| Communication Agent | ✅ Active | - | - |
| Calendar Agent | ✅ Active | - | - |
| Travel Agent | ✅ Active | - | /health |
| Invoice Agent | ✅ Active | - | - |
| Delivery Agent | ✅ Active | - | - |
| Newsletter Engine | ✅ Active | - | - |
| Vesper GTM | ✅ Active | - | - |

---

## 🚀 Quick Start

### Deploy All Agents
```bash
# From repo root
./deploy-all.sh
```

### Deploy Individual Agent
```bash
cd services/[agent-name]
gcloud builds submit --tag europe-west2-docker.pkg.dev/cofound-agents-os-788e/[repo]/[agent]:latest
gcloud run deploy [agent] --image europe-west2-docker.pkg.dev/cofound-agents-os-788e/[repo]/[agent]:latest --region europe-west2
```

### Monitor All Agents
```bash
gcloud logging read "resource.type=cloud_run_revision" --limit 100 --format json
```

---

## 📚 Documentation

Each agent has detailed documentation in its respective directory:
- `services/[agent-name]/README.md` - Agent-specific documentation
- `services/[agent-name]/DEPLOYMENT.md` - Deployment guide (where applicable)
- `services/[agent-name]/SECURITY.md` - Security documentation (where applicable)

---

## 🛠️ Development

### Local Development
Each agent can be run locally:
```bash
cd services/[agent-name]
pip install -r requirements.txt  # Python agents
npm install  # Node.js agents
# Follow agent-specific README for startup
```

### Testing
```bash
# Python agents
pytest

# Node.js agents
npm test
```

---

## 📞 Support & Maintenance

**Project**: Cofound Agents OS  
**Platform**: Google Cloud Platform  
**Region**: europe-west2 (London)  
**Compliance**: GDPR-compliant, EU data residency

For issues, refer to individual agent READMEs or check Cloud Logging for error traces.
