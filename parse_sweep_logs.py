import json

with open('sweep_logs.json', 'r', encoding='utf-16') as f:
    logs = json.load(f)

print(f"Total logs: {len(logs)}\n")

sweep_logs = []
for log in logs:
    message = log.get('jsonPayload', {}).get('message', '')
    if not message:
        message = log.get('textPayload', '')
    
    if any(keyword in str(message) for keyword in ['RSS', 'Processing', 'Fetching', 'Skipping', 'saved', 'Watchlist', 'Duplicate']):
        sweep_logs.append(log)

print(f"Sweep-related logs: {len(sweep_logs)}\n")

for log in sweep_logs[:50]:
    timestamp = log.get('timestamp', 'N/A')
    message = log.get('jsonPayload', {}).get('message', log.get('textPayload', ''))[:100]
    
    # Extract relevant fields
    jp = log.get('jsonPayload', {})
    total_entries = jp.get('total_entries', '')
    count = jp.get('count', '')
    title = jp.get('title', '')
    company = jp.get('company', '')
    url = jp.get('url', '')
    
    print(f"{timestamp} | {message}")
    if total_entries != '':
        print(f"  -> Total Entries: {total_entries}")
    if count != '':
        print(f"  -> Count: {count}")
    if title:
        print(f"  -> Title: {title[:60]}")
    if company:
        print(f"  -> Company: {company}")
    if url:
        print(f"  -> URL: {url[:80]}")
