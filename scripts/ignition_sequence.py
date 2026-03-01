import os
import json
import httpx
import uuid
from datetime import datetime
from google.cloud import firestore
import google.auth
from google.auth.transport.requests import Request

# ──────────────── CONFIGURATION ────────────────
SENTINEL_URL = "https://sentinel-growth-hc7um252na-nw.a.run.app"
ORCHESTRATOR_URL = "https://ic-origin-orchestrator-hc7um252na-nw.a.run.app"
DASHBOARD_URL = "https://icorigin.netlify.app"
PROJECT_ID = "cofound-agents-os-788e"
TENANT_ID = "iapetus" # Default demo tenant

# Get Firebase Token from env (Use: $env:FIREBASE_TOKEN = $(gcloud auth print-identity-token))
FIREBASE_TOKEN = os.environ.get("FIREBASE_TOKEN")

async def run_ignition():
    print(f"🚀 [IGNITION] Starting Sequence for Project: {PROJECT_ID}")
    
    headers = {}
    if FIREBASE_TOKEN:
        headers["Authorization"] = f"Bearer {FIREBASE_TOKEN}"
        print("🔑 Auth Token Loaded.")
    else:
        print("⚠️ No FIREBASE_TOKEN found. Task 2 & 3 may fail with 401.")

    async with httpx.AsyncClient() as client:
        # --- TASK 1: Wake Up the Telemetry (Sweep) ---
        print("\n📡 [TASK 1] Triggering Market Sweep...")
        try:
            # Task 1 uses BackgroundTasks, usually doesn't block
            resp = await client.post(f"{SENTINEL_URL}/tasks/sweep", timeout=30.0)
            if resp.status_code == 200:
                print(f"✅ Sweep Triggered: {resp.json()}")
            else:
                print(f"❌ Sweep Trigger Failed: {resp.status_code} - {resp.text}")
        except Exception as e:
            print(f"❌ Sweep Connection Error: {str(e)}")

        # --- TASK 2: Validate the Contagion Map API (Neo4j) ---
        print("\n🗺️ [TASK 2] Validating Neo4j Contagion API...")
        target_ch = "01234567" 
        try:
            resp = await client.get(f"{SENTINEL_URL}/api/v1/graph/contagion/{target_ch}", headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                print(f"✅ Neo4j Connectivity Verified for {target_ch}")
                print(f"   Nodes: {len(data.get('nodes', []))}, Links: {len(data.get('links', []))}")
            elif resp.status_code in [401, 403]:
                print(f"❌ Neo4j Auth Failure ({resp.status_code}). Please refresh FIREBASE_TOKEN.")
            else:
                print(f"⚠️ Neo4j API returned {resp.status_code}: {resp.text}")
        except Exception as e:
            print(f"❌ Neo4j API Connection Error: {str(e)}")

        # --- TASK 3: Validate the AI Synthesis Pipeline ---
        print("\n🧠 [TASK 3] Validating AI Synthesis (Orchestrator)...")
        payload = {
            "entity_id": "ALPHA-001",
            "context": {
                "company_name": "Cobalt Ventures",
                "signals": ["Talent Freeze", "Debt Whiplash"],
                "risk_score": 88
            }
        }
        try:
            # Orchestrator might be open or protected
            resp = await client.post(f"{ORCHESTRATOR_URL}/strategize", json=payload, headers=headers, timeout=60.0)
            if resp.status_code == 200:
                print("✅ AI Synthesis Successful (Gemini 1.5 Pro)")
                print(f"   Snippet: {resp.json().get('memo_snippet')[:100]}...")
            else:
                print(f"❌ AI Synthesis Failed: {resp.status_code} - {resp.text}")
        except Exception as e:
            print(f"❌ Orchestrator Connection Error: {str(e)}")

    # --- Verification: Firestore Counters ---
    print("\n📊 [VERIFICATION] Checking Firestore Telemetry Counters...")
    try:
        db = firestore.Client(project=PROJECT_ID)
        now = datetime.now()
        # Note: The dashboard route looks in /monitored_entities and /strategic_alerts
        # The mission asks for /tenants/{tenant_id}/telemetry/{YYYY-MM}
        telemetry_path = f"tenants/{TENANT_ID}/telemetry/{now.year}-{now.month:02d}"
        doc = db.document(telemetry_path).get()
        if doc.exists:
            print(f"✅ Telemetry Counters Found: {doc.to_dict()}")
        else:
            print(f"ℹ️ No telemetry counters for {TENANT_ID} this month yet. (Sweep in progress)")
    except Exception as e:
        print(f"❌ Firestore Access Error: {str(e)}")

    print("\n🏁 [IGNITION COMPLETE]")

    # --- Verification: Firestore Counters ---
    print("\n📊 [VERIFICATION] Checking Firestore Telemetry Counters...")
    try:
        db = firestore.Client(project=PROJECT_ID)
        now = datetime.now()
        telemetry_path = f"tenants/{TENANT_ID}/telemetry/{now.year}-{now.month:02d}"
        doc = db.document(telemetry_path).get()
        if doc.exists:
            print(f"✅ Telemetry Counters Found: {doc.to_dict()}")
        else:
            print(f"ℹ️ No telemetry counters for {TENANT_ID} this month yet. (First sweep might still be in progress)")
    except Exception as e:
        print(f"❌ Firestore Access Error: {str(e)}")

    print("\n🏁 [IGNITION COMPLETE]")

if __name__ == "__main__":
    import asyncio
    asyncio.run(run_ignition())
