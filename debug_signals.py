import requests
import json
from datetime import datetime

url = "https://sentinel-growth-hc7um252na-nw.a.run.app/signals"
try:
    print(f"Fetching from {url}...")
    response = requests.get(url)
    response.raise_for_status()
    data = response.json()
    
    print(f"Total signals found: {len(data)}")
    
    if not data:
        print("No signals returned.")
        exit()
        
    print("\nTop 10 Signals (Ingested Descending):")
    for s in data[:10]:
        ts = s.get("timestamp") or "No TS"
        src = s.get("source") or "No Src"
        headline = s.get("headline", "No Headline")[:30]
        print(f"Time: {ts} | Src: {src} | {headline}")

except Exception as e:
    print(f"Error: {e}")
