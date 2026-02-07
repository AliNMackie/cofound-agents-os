import requests
import json

URL = "https://sentinel-growth-hc7um252na-nw.a.run.app/signals"

try:
    print(f"Fetching signals from {URL}...")
    response = requests.get(URL)
    
    if response.status_code == 200:
        data = response.json()
        print(f"Fetched {len(data)} signals.")
        
        phoenix = next((s for s in data if "Phoenix" in s.get("headline", "")), None)
        
        if phoenix:
            print("\n✅ FOUND Project Phoenix!")
            print(f"ID: {phoenix.get('id')}")
            print(f"Headline: {phoenix.get('headline')}")
            print(f"EBITDA: {phoenix.get('ebitda')}")
        else:
            print("\n❌ Project Phoenix NOT FOUND in signals list.")
            # Print first 5 to see what's there
            print("First 5 signals:")
            for s in data[:5]:
                print(f"- {s.get('headline')}")
    else:
        print(f"Failed to fetch: {response.status_code}")

except Exception as e:
    print(f"Error: {e}")
