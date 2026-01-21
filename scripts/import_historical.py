import pandas as pd
import requests
import logging
import time
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Use the batch endpoint
API_URL = "https://sentinel-growth-hc7um252na-nw.a.run.app/ingest/historical-batch"

# Advisor URL mappings for clickable sources
ADVISOR_URLS = {
    "kpmg": "https://kpmg.com",
    "deloitte": "https://www2.deloitte.com",
    "pwc": "https://pwc.com",
    "ey": "https://ey.com",
    "rothschild": "https://rothschildandco.com",
    "lazard": "https://lazard.com",
    "houlihan lokey": "https://hl.com",
    "grant thornton": "https://grantthornton.co.uk",
    "fti": "https://fticonsulting.com",
    "alvarez": "https://alvarezandmarsal.com",
    "interpath": "https://interpath.com",
    "teneo": "https://teneo.com",
    "greenhill": "https://greenhill.com",
    "morgan stanley": "https://morganstanley.com",
    "goldman sachs": "https://goldmansachs.com",
    "jp morgan": "https://jpmorgan.com",
    "barclays": "https://barclays.com",
    "hsbc": "https://hsbc.com",
    "jefferies": "https://jefferies.com",
    "numis": "https://numis.com",
    "peel hunt": "https://peelhunt.com",
}

def get_advisor_url(advisor_text: str) -> str:
    """Match advisor name to URL, returning first match or None."""
    if not advisor_text or advisor_text.lower() == "nan":
        return None
    advisor_lower = advisor_text.lower()
    for name, url in ADVISOR_URLS.items():
        if name in advisor_lower:
            return url
    return None

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
    uk_codes = ['GB', 'UK', 'UNITED KINGDOM', 'GREAT BRITAIN']
    mask = df['HQ'].fillna('').astype(str).str.upper().isin(uk_codes)
    uk_deals = df[mask]
    
    logger.info(f"Found {len(uk_deals)} UK deals out of {len(df)} total rows.")
    
    batch_payload = []
    
    for index, row in uk_deals.iterrows():
        try:
            company_name = str(row.get('Target', ''))
            if not company_name or company_name.lower() == 'nan':
                continue
            
            # Parse deal date for proper sorting
            deal_date = row.get('Date (estimated)')
            deal_date_iso = None
            if pd.notna(deal_date):
                if isinstance(deal_date, datetime):
                    deal_date_iso = deal_date.isoformat()
                else:
                    try:
                        deal_date_iso = pd.to_datetime(deal_date).isoformat()
                    except:
                        deal_date_iso = str(deal_date)
            
            # Get advisor URL if available
            advisor_text = str(row.get('Advisors', ''))
            advisor_url = get_advisor_url(advisor_text)
            
            # Construct rich deal object with ALL available fields
            deal_obj = {
                "company_name": company_name,
                "process_status": str(row.get('Deal Status', 'Unknown')),
                "deal_date": deal_date_iso,  # Proper ISO timestamp for sorting
                "deal_date_text": str(row.get('Date (estimated)', 'N/A')),
                "hq_country": str(row.get('HQ', 'UK')),
                "sector": str(row.get('Sector', '')),
                "company_description": str(row.get('Sector', 'UK Deal')),  # Fallback to sector
                "sellers": str(row.get('Sellers', '')),
                "bidders": str(row.get('Suitors/Bidders', '')),
                "advisor": advisor_text,
                "advisor_url": advisor_url,  # Clickable source URL
                "revenue_eur_m": row.get('Revenue (EUR m)') if pd.notna(row.get('Revenue (EUR m)')) else None,
                "ebitda": str(row.get('EBITDA (EUR m)', '')) if pd.notna(row.get('EBITDA (EUR m)')) else None,
                "ev": row.get('EV') if pd.notna(row.get('EV')) else None,
                "ev_ebitda_multiple": row.get('EV/EBITDA Multiple') if pd.notna(row.get('EV/EBITDA Multiple')) else None,
                "ev_revenue_multiple": row.get('EV/Revenue Multiple') if pd.notna(row.get('EV/Revenue Multiple')) else None,
                "source": "historical_import",
                "ingested_at": datetime.utcnow().isoformat(),  # For fallback sorting
            }
            
            # Clean up None and 'nan' strings
            cleaned_obj = {}
            for k, v in deal_obj.items():
                if v is None:
                    continue
                if isinstance(v, str) and v.lower() in ('nan', 'none', ''):
                    continue
                cleaned_obj[k] = v
            
            batch_payload.append(cleaned_obj)
            
        except Exception as e:
            logger.warning(f"Skipping row {index}: {e}")

    # Send in chunks of 200
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
            
        time.sleep(1)

    logger.info(f"Successfully sent {total_sent} deals.")

if __name__ == "__main__":
    import_excel_data("data/Aborted and Paused deals.xlsx")
