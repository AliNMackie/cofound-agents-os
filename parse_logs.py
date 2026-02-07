import json

with open('recent_logs.json', 'r') as f:
    logs = json.load(f)

print(f"Total logs: {len(logs)}\n")

for log in logs[:40]:
    timestamp = log.get('timestamp', 'N/A')
    message = log.get('jsonPayload', {}).get('message', '')
    if not message:
        message = log.get('textPayload', '')[:100]
    
    # Extract relevant fields
    total_entries = log.get('jsonPayload', {}).get('total_entries', '')
    count = log.get('jsonPayload', {}).get('count', '')
    title = log.get('jsonPayload', {}).get('title', '')
    company = log.get('jsonPayload', {}).get('company', '')
    url = log.get('jsonPayload', {}).get('url', '')
    
    if 'RSS' in message or 'Processing' in message or 'Fetching' in message or 'Skipping' in message or 'saved' in message:
        print(f"{timestamp} | {message}")
        if total_entries:
            print(f"  -> Total Entries: {total_entries}")
        if count:
            print(f"  -> Count: {count}")
        if title:
            print(f"  -> Title: {title[:60]}")
        if company:
            print(f"  -> Company: {company}")
        if url:
            print(f"  -> URL: {url[:80]}")
        print()
