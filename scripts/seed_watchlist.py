import pandas as pd
import firebase_admin
from firebase_admin import credentials, firestore
import os
import datetime

# Initialize Firestore
if not firebase_admin._apps:
    try:
        cred = credentials.ApplicationDefault()
        firebase_admin.initialize_app(cred, {
            'projectId': 'cofound-agents-os-788e',
        })
    except Exception as e:
        print(f"Warning: Could not init firestore: {e}")

db = firestore.client()

# Using the XLSX file found in the directory
EXCEL_PATH = "data/Aborted and Paused deals.xlsx"
COLLECTION_PATH = "watchlists" 

def seed_watchlist():
    if not os.path.exists(EXCEL_PATH):
        print(f"Error: File not found at {EXCEL_PATH}")
        return

    print(f"Reading watchlist from {EXCEL_PATH}...")
    
    try:
        # Read Excel
        df = pd.read_excel(EXCEL_PATH)
        
        # Normalize headers
        df.columns = df.columns.astype(str).str.strip()
        print(f"Columns found: {df.columns.tolist()}")
        
        batch = db.batch()
        count = 0
        skipped = 0
        
        for index, row in df.iterrows():
            company_name = str(row.get("Target", "")).strip()
            
            if not company_name or company_name.lower() in ["nan", "none", ""]:
                continue
                
            deal_status = str(row.get("Deal Status", "")).strip().lower()
            
            # Filter: Only paused or aborted (allow variations like 'deal paused')
            if "paused" not in deal_status and "aborted" not in deal_status:
                skipped += 1
                continue

            # Create document ID
            doc_id = company_name.lower().replace(" ", "-").replace(".", "").replace("/", "-")
            doc_id = "".join(c for c in doc_id if c.isalnum() or c in "-_")
            
            doc_ref = db.collection(COLLECTION_PATH).document(doc_id)
            
            sector = str(row.get("Sector", "General"))
            # specific column mentioned by user "EBITDA (EUR m)" or "EBITDA"
            ebitda = str(row.get("EBITDA (EUR m)", row.get("EBITDA", "")))
            
            data = {
                "company_name": company_name,
                "original_status": row.get("Deal Status", "unknown"),
                "sector": sector,
                "valuation_ebitda": ebitda,
                "ingested_at": firestore.SERVER_TIMESTAMP,
                "watchlist_id": "neish_capital_q1",
                "triggers": ["acquisition", "restructuring", "refinancing", "management change"],
                "monitoring_active": True
            }
            
            batch.set(doc_ref, data, merge=True)
            count += 1
            
            if count % 400 == 0:
                batch.commit()
                batch = db.batch()
                print(f"Committed {count} records...")

        if count > 0:
            batch.commit()
            print(f"Successfully seeded {count} targets to {COLLECTION_PATH}.")
            print(f"Skipped {skipped} records not matching filter.")
        else:
            print("No valid records found to seed.")
            
    except Exception as e:
        print(f"Failed to process Excel file: {e}")

if __name__ == "__main__":
    seed_watchlist()
