import pandas as pd
import requests
import logging
import json
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Use the batch endpoint
API_URL = "https://sentinel-growth-hc7um252na-nw.a.run.app/ingest/historical-batch"

def import_excel_data(file_path):
    logger.info(f"Reading file: {file_path}")
    
    try:
        df = pd.read_excel(file_path)
    except Exception as e:
        logger.error(f"Failed to read Excel: {e}")
        return

    # Normalize columns
    df.columns = df.columns.str.strip()
    
    # Filter for UK deals
    uk_codes = ['GB', 'UK', 'United Kingdom', 'Great Britain']
    mask = df['HQ'].fillna('').astype(str).str.upper().isin(uk_codes)
    uk_deals = df[mask]
    
    logger.info(f"Found {len(uk_deals)} UK deals out of {len(df)} total rows.")
    
    batch_payload = []
    
    for index, row in uk_deals.iterrows():
        try:
            company_name = str(row.get('Target', ''))
            if not company_name or company_name.lower() == 'nan':
                continue
            
            # Construct AuctionData object
            deal_obj = {
                "company_name": company_name,
                "process_status": str(row.get('Deal Status', 'Failed')),
                "ebitda": str(row.get('EBITDA', 'N/A')),
                "advisor": str(row.get('Advisors', 'N/A')),
                "company_description": str(row.get('Industry', 'N/A')), # Mapping Industry to desc
                # Extra fields allowed by extra="allow"
                "source": "historical_import",
                "deal_date_text": str(row.get('Date (estimated)', 'N/A'))
            }
            
            # Clean up 'nan' strings
            cleaned_obj = {k: v for k, v in deal_obj.items() if v and v.lower() != 'nan'}
            
            batch_payload.append(cleaned_obj)
            
        except Exception as e:
            logger.warning(f"Skipping row {index}: {e}")

    # Send in chunks of 200 (Firestore batch limit is 500, keeping it safe)
    chunk_size = 200
    total_sent = 0
    
    for i in range(0, len(batch_payload), chunk_size):
        chunk = batch_payload[i:i + chunk_size]
        logger.info(f"Sending batch {i} to {i+len(chunk)}...")
        
        try:
            response = requests.post(API_URL, json=chunk, timeout=60)
            if response.status_code == 200:
                logger.info(f"✅ Batch success: {len(chunk)} items")
                total_sent += len(chunk)
            else:
                logger.error(f"❌ Batch failed: {response.text}")
                
        except Exception as e:
            logger.error(f"Request failed: {e}")
            
        # Small delay to be nice
        time.sleep(1)

    logger.info(f"Successfully sent {total_sent} deals.")

if __name__ == "__main__":
    import_excel_data("data/Aborted and Paused deals.xlsx")
