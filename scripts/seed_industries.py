
import os
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def seed_industries():
    project_id = os.getenv("GCP_PROJECT_ID", "cofound-agents-os-788e")
    logger.info(f"Seeding Industry Contexts for Project: {project_id}")

    # Initialize Firestore
    # Note: This assumes ADC (Application Default Credentials) are set up via 'gcloud auth application-default login'
    # If using 'gcloud auth login', we might need to rely on google-cloud-firestore directly or set PROJECT_ID.
    if not firebase_admin._apps:
        app = firebase_admin.initialize_app(options={'projectId': project_id})
    
    db = firestore.client()
    
    # Define Contexts
    contexts = [
        {
            "id": "cre-distress",
            "name": "UK CRE Distress",
            "macroContext": """You are a Special Situations Analyst for UK Commercial Real Estate.
CORE THESIS: The 2025-2027 Refinancing Wall is the primary driver.
SIGNAL PRIORITY:
1. **Financial Pressure:** Flag deteriorating interest cover, net debt/EBITDA breaches, or LTV > 60%.
2. **Refinancing Events:** Prioritize loans maturing within 12-24 months or extension requests.
3. **Operational Distress:** High weighting on CVA announcements, tenant insolvencies, or 'asset marketing whispers'.
OUTPUT STYLE: Rank opportunities by 'Distress Probability (1-100)'. Focus on Asset Class performance vs MSCI Index.""",
            "defaultPlaybooks": ["playbook-cre-refi", "playbook-distress-screen"]
        },
        {
            "id": "levfin-credit",
            "name": "LevFin & Private Credit",
            "macroContext": """You are a Private Credit Portfolio Manager.
CORE THESIS: 2026 Maturity Wall & Unitranche defaults.
SIGNAL PRIORITY:
1. **Covenant Stress:** Flag 'EBITDA add-backs >20%', 'Cash Pay' to 'PIK' toggles, or Headroom <15%.
2. **Sponsor Activity:** Monitor for 'Sponsor Rotation', 'Dividend Recaps', or appointment of restructuring advisors.
3. **Market Sentiment:** Track earnings call sentiment for 'Softness', 'Headwinds', or 'Cost Savings Programs'.
OUTPUT STYLE: Structure as a 'Credit Memo Draft'. Focus on Downside Protection and Recovery Value.""",
            "defaultPlaybooks": ["playbook-credit-monitor", "playbook-cov-lite"]
        },
        {
            "id": "saas-origination",
            "name": "UK Vertical SaaS",
            "macroContext": """You are a Tech M&A Originator.
CORE THESIS: Competitive Deal Sourcing (Buy & Build).
SIGNAL PRIORITY:
1. **Exit Readiness:** Flag 'Founder Fatigue', 'CFO Hiring', or 'Strategic Review'.
2. **Growth Metrics:** Prioritize 'Rule of 40', ARR >£5m, or 'Contract Concentration'.
3. **Consolidation:** Identify 'Buy-and-Build' platforms making acquisitions.
OUTPUT STYLE: Structure as an 'Investment Teaser'. Highlight Synergies and Integration Risks.""",
            "defaultPlaybooks": ["playbook-saas-metrics", "playbook-founders"]
        }
    ]

    # Batch Write
    batch = db.batch()
    collection_ref = db.collection("settings").document("global").collection("industry_contexts")

    for context in contexts:
        doc_ref = collection_ref.document(context["id"])
        batch.set(doc_ref, context, merge=True)
        # Also update 'availableIndustries' array in a global config if we were doing that, 
        # but for now we rely on fetching the collection.

    batch.commit()
    logger.info(f"Successfully seeded {len(contexts)} Industry Contexts.")

if __name__ == "__main__":
    seed_industries()
