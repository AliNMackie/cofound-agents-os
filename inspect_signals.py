import requests
import json

signals = requests.get('https://sentinel-growth-hc7um252na-nw.a.run.app/signals').json()

print(f'Total signals: {len(signals)}\n')

# Check first 10 for their actual source values
print("First 10 signals with all source fields:")
for i, s in enumerate(signals[:10]):
    print(f"\n{i+1}. {s.get('headline', 'N/A')[:50]}")
    print(f"   timestamp: {s.get('timestamp', 'N/A')[:19]}")
    print(f"   source: {s.get('source', 'N/A')}")
    print(f"   category: {s.get('category', 'N/A')}")

# Look for any with "Google" or "RSS" or "NEWS" category
print("\n\nSearching for Google/RSS/NEWS signals:")
for s in signals:
    src = str(s.get('source', ''))
    cat = str(s.get('category', ''))
    if 'Google' in src or 'RSS' in src or 'NEWS' in cat:
        print(f"FOUND: {s.get('headline', 'N/A')[:60]}")
        print(f"  source: {s.get('source')}, category: {s.get('category')}")
        print(f"  timestamp: {s.get('timestamp', 'N/A')[:19]}")
        break
else:
    print("None found in first 1000 results")
