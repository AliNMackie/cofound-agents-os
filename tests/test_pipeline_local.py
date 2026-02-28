import json
from mock_bq import MockBigQuery

def run_pipeline():
    print("🚀 [PIPELINE] Starting mock crawl...")
    with open("tests/mock_signals.json", "r") as f:
        data = json.load(f)
    
    bq = MockBigQuery()
    
    # 1. Ingest Filings
    print(f"Ingesting {len(data['filings'])} Companies House filings...")
    bq.insert_rows("raw_signals", data['filings'])
    
    # 2. Ingest RSS
    print(f"Ingesting {len(data['rss'])} RSS items...")
    bq.insert_rows("raw_signals", data['rss'])
    
    count = bq.get_table_count("raw_signals")
    print(f"✅ PIPELINE: PASSED - {count} rows in mock BigQuery")
    return count

if __name__ == "__main__":
    run_pipeline()
