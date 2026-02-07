import datetime
from google.cloud import firestore

def backfill_signals(project_id='cofound-agents-os-788e'):
    db = firestore.Client(project=project_id)
    collection_ref = db.collection('auctions')
    
    print(f"Starting backfill for collection 'auctions' in project '{project_id}'...")
    
    docs = collection_ref.stream()
    count = 0
    
    for doc in docs:
        data = doc.to_dict()
        updates = {}
        
        # Backfill signal_type if missing
        if 'signal_type' not in data:
            updates['signal_type'] = 'RESCUE'
            
        # Backfill source_family if missing
        if 'source_family' not in data:
            updates['source_family'] = 'RSS_NEWS'
            
        # Backfill conviction_score if missing
        if 'conviction_score' not in data:
            # Default to 75 as seen in existing models
            updates['conviction_score'] = 75
            
        if updates:
            doc.reference.update(updates)
            count += 1
            if count % 10 == 0:
                print(f"Updated {count} documents...")
                
    print(f"Backfill complete. Updated {count} documents.")

if __name__ == "__main__":
    backfill_signals()
