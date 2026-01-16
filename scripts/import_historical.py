import pandas as pd
import requests
import logging
import json
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

API_URL = "https://sentinel-growth-1005792944830.europe-west2.run.app/ingest/auction"

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
    
    success_count = 0
    
    for index, row in uk_deals.iterrows():
        try:
            company_name = str(row.get('Target', ''))
            if not company_name or company_name.lower() == 'nan':
                continue
            
            # Construct payload matching AuctionIngestRequest
            # We treat the row data as the "source_text" effectively 
            # But wait, the API expects unstructured text to extract from OR structured data?
            # Creating a "fake" source text containing the structured data is the easiest way 
            # to reuse the AI extraction pipeline without changing backend code.
            
            # Construct a rich text block for the AI to parse
            source_text = (
                f"Historical Record: {company_name}\n"
                f"Status: {row.get('Deal Status', 'Failed')}\n"
                f"EBITDA: {row.get('EBITDA', 'N/A')}\n"
                f"Sector: {row.get('Industry', 'N/A')}\n"
                f"Advisors: {row.get('Advisors', 'N/A')}\n"
                f"Date: {row.get('Date (estimated)', 'N/A')}\n"
                f"This deal was aborted or paused."
            )
            
            payload = {
                "source_text": source_text,
                "source_origin": "historical_import",
                "user_sector": "distressed_corporate" 
            }
            
            response = requests.post(API_URL, json=payload)
            
            if response.status_code == 200:
                logger.info(f"✅ Imported: {company_name}")
                success_count += 1
            else:
                logger.warning(f"❌ Failed {company_name}: {response.text}")
                
            # Rate limiting to avoid 504s
            time.sleep(0.5) 
            
        except Exception as e:
            logger.warning(f"Skipping row {index}: {e}")

    logger.info(f"Successfully imported {success_count} deals.")

if __name__ == "__main__":
    import_excel_data("data/Aborted and Paused deals.xlsx")
