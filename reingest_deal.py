import requests
import json
import time

# Configuration
API_URL = "https://sentinel-growth-hc7um252na-nw.a.run.app"
ENDPOINT = f"{API_URL}/ingest/historical-batch"

def reingest_deal():
    print(f"Targeting API: {ENDPOINT}")
    
    # Construct a complete object as if it came from the extractor
    payload = [
        {
            "company_name": "Project Phoenix",
            "company_description": "Leading Industrial Manufacturer seeking investment",
            "ebitda": "$12m",
            "ownership": "Founder Led",
            "advisor": "Goldman Sachs",
            "process_status": "Indicative Bids Due",
            "source": "manual_reingest_verification",
            "ingested_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "deal_date": "2026-01-22" # Force it to be newest
        }
    ]
    
    try:
        print("Sending BATCH ingestion request (Persistence)...")
        response = requests.post(ENDPOINT, json=payload)
        
        if response.status_code == 200:
            data = response.json()
            print("\n✅ Batch Ingestion Successful!")
            print(json.dumps(data, indent=2))
        else:
            print(f"\n❌ Ingestion Failed: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"\n❌ Script Error: {e}")

if __name__ == "__main__":
    reingest_deal()
