import firebase_admin
from firebase_admin import credentials, firestore
import urllib.parse

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

# The 22 "Mock" Sources to be made Real
MOCK_SOURCES = [
    # Auction Nodes
    {"name": "Euro Auctions", "category": "AUCTION"},
    {"name": "Ritchie Bros", "category": "AUCTION"},
    {"name": "BidSpotter", "category": "AUCTION"},
    {"name": "Allsop", "category": "AUCTION"},
    {"name": "Acuitus", "category": "AUCTION"},
    {"name": "SDL Auctions", "category": "AUCTION"},

    # Advisor Nodes
    {"name": "Rothschild & Co", "category": "ADVISOR"},
    {"name": "KPMG Restructuring", "category": "ADVISOR"},
    {"name": "Deloitte Financial Advisory", "category": "ADVISOR"},
    {"name": "Houlihan Lokey", "category": "ADVISOR"},
    {"name": "Grant Thornton", "category": "ADVISOR"},
    {"name": "FTI Consulting", "category": "ADVISOR"},

    # Institutional Nodes
    {"name": "Exponent PE", "category": "INSTITUTION"},
    {"name": "LDC", "category": "INSTITUTION"},
    {"name": "Synova Capital", "category": "INSTITUTION"},
    {"name": "Inflexion", "category": "INSTITUTION"},
    {"name": "Livingbridge", "category": "INSTITUTION"},
    {"name": "August Equity", "category": "INSTITUTION"},

    # Regulator Nodes (High Value)
    {"name": "The Gazette", "category": "REGULATOR"}, 
    {"name": "Companies House", "category": "REGULATOR"},
    {"name": "FCA Register", "category": "REGULATOR"},
    {"name": "Insolvency Service", "category": "REGULATOR"},
]

def generate_rss_url(source):
    """
    Constructs a high-value RSS Query URL for Google News.
    """
    name = source["name"]
    category = source["category"]
    
    # Base Query: Always look for the entity name
    query_parts = [f'"{name}"']
    
    # Contextual Keywords based on category
    if category == "AUCTION":
        query_parts.append("(auction OR liquidation OR sale)")
    elif category == "ADVISOR":
        query_parts.append("(restructuring OR insolvency OR appointment OR administration)")
    elif category == "INSTITUTION":
        query_parts.append("(acquisition OR buyout OR exit OR investment)")
    elif category == "REGULATOR":
         if "Gazette" in name:
             # Special case for The Gazette - we want Insolvency notices
             query_parts = ["Insolvency", "site:thegazette.co.uk"]
         elif "Companies House" in name:
             query_parts.append("(filing OR dissolution OR liquidation)")
         else:
             query_parts.append("news")
             
    query_string = " AND ".join(query_parts)
    
    # URL Encode
    encoded_query = urllib.parse.quote(query_string)
    
    # UK focused RSS URL
    return f"https://news.google.com/rss/search?q={encoded_query}&hl=en-GB&gl=GB&ceid=GB:en"

def seed_sources():
    print(f"Seeding {len(MOCK_SOURCES)} sources to 'cofound-agents-os-788e'...")
    
    doc_ref = db.collection("user_settings").document("default_tenant")
    
    # 1. Get existing to avoid overwriting or duplicates
    doc = doc_ref.get()
    if doc.exists:
        current_data = doc.to_dict()
        existing_sources = current_data.get("data_sources", [])
    else:
        existing_sources = []
        
    existing_urls = {s.get("url") for s in existing_sources}
    
    new_sources = []
    added_count = 0
    
    for source_def in MOCK_SOURCES:
        rss_url = generate_rss_url(source_def)
        
        # Check dupe
        if rss_url in existing_urls:
            print(f"Skipping duplicate: {source_def['name']}")
            continue
            
        new_source = {
            "name": source_def["name"],
            "url": rss_url,
            "type": "RSS",
            "active": True,
            "category": source_def["category"] # Useful for UI later
        }
        
        new_sources.append(new_source)
        added_count += 1
        print(f"Prepared: {source_def['name']}")
        
    if added_count > 0:
        # Merge with existing
        final_list = existing_sources + new_sources
        doc_ref.set({"data_sources": final_list}, merge=True)
        print(f"✅ Successfully added {added_count} new sources to Firestore.")
    else:
        print("No new sources to add.")

if __name__ == "__main__":
    seed_sources()
