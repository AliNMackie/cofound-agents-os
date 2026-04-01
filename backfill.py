import os
import csv
import time
import json
import requests
from google.cloud import bigquery

# --- CONFIGURATION ---
CSV_FILE = "resolved_portfolio.csv"
TABLE_ID = "cofound-agents-os-788e.ic_origin_themav2.auctions_enhanced"
CH_API_KEY = os.environ.get("CH_API_KEY")

if not CH_API_KEY:
    print("CRITICAL ERROR: CH_API_KEY environment variable is not set.")
    exit(1)

# Initialize BigQuery Client using ambient gcloud credentials
client = bigquery.Client(project="cofound-agents-os-788e")

def get_ch_data(company_number):
    """Fetches Live Company Profile from Companies House."""
    url = f"https://api.company-information.service.gov.uk/company/{company_number}"
    try:
        response = requests.get(url, auth=(CH_API_KEY, ''), timeout=10)
        if response.status_code == 200:
            return response.json()
        else:
            print(f"  [ERROR] API returned {response.status_code} for {company_number}: {response.text}")
            return None
    except Exception as e:
        print(f"  [ERROR] Connection failed: {e}")
        return None

def run_backfill():
    print(f"--- Starting Live Backfill ---")
    print(f"--- Target Table: {TABLE_ID} ---\n")

    # 1. Read the CSV
    try:
        with open(CSV_FILE, mode='r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            targets = list(reader)
    except FileNotFoundError:
        print(f"CRITICAL ERROR: Could not find {CSV_FILE} in {os.getcwd()}")
        return

    print(f"[*] Read {len(targets)} companies from {CSV_FILE}\n")
    rows_to_insert = []

    # 2. Process each company
    for i, target in enumerate(targets):
        crn = target['company_number'].strip()
        name = target['company_name'].strip()
        print(f"[{i+1}/{len(targets)}] Processing: {name} ({crn})...")

        api_data = get_ch_data(crn)

        if api_data:
            # Map to the actual auctions_enhanced schema:
            # entity_id (REQUIRED), canonical_name (REQUIRED),
            # psc_details (JSON, NULLABLE), last_updated (TIMESTAMP, REQUIRED),
            # resolution_metadata (JSON, NULLABLE)
            row = {
                "entity_id": crn,
                "canonical_name": api_data.get("company_name", name),
                "psc_details": json.dumps([]),  # PSC skipped to reduce API calls; can be enriched later
                "last_updated": time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
                "resolution_metadata": json.dumps({
                    "company_status": api_data.get("company_status"),
                    "date_of_creation": api_data.get("date_of_creation"),
                    "registered_office_address": api_data.get("registered_office_address", {}),
                    "company_type": api_data.get("type"),
                    "jurisdiction": api_data.get("jurisdiction"),
                    "sic_codes": api_data.get("sic_codes", []),
                    "backfilled_at": time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
                    "source": "live_ch_api_backfill_v2"
                })
            }
            rows_to_insert.append(row)
            status = api_data.get("company_status", "unknown")
            print(f"  [SUCCESS] {name} | Status: {status}")
        else:
            print(f"  [SKIPPED] {name} - No data returned from API")

        time.sleep(0.5)

    # 3. Stream all rows to BigQuery in one batch
    print(f"\n--- Sending {len(rows_to_insert)} rows to BigQuery ---")
    errors = client.insert_rows_json(TABLE_ID, rows_to_insert)
    if errors == []:
        print(f"\n✅ DONE! {len(rows_to_insert)} rows inserted into {TABLE_ID} successfully.")
    else:
        print(f"\n❌ BIGQUERY ERRORS: {errors}")

if __name__ == "__main__":
    run_backfill()
