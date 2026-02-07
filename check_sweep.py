import json

with open('latest_sweep_logs.json', 'r', encoding='utf-16') as f:
    logs = json.load(f)

print(f"Total logs: {len(logs)}\n")
print("Latest sweep activity:\n")

for log in logs:
    jp = log.get('jsonPayload', {})
    message = jp.get('message', log.get('textPayload', ''))
    
    if message and any(kw in str(message) for kw in ['RSS', 'Processing', 'Fetching', 'Skipping', 'saved', 'Watchlist', 'Duplicate', 'sweep', 'Sweep']):
        timestamp = log.get('timestamp', 'N/A')[:19]
        print(f"{timestamp} | {message}")
        
        # Show additional context
        for key in ['total_entries', 'count', 'title', 'company', 'url']:
            if key in jp and jp[key]:
                val = str(jp[key])[:80]
                print(f"  {key}: {val}")
