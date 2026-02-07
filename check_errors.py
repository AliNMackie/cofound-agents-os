import json

with open('errors.json', 'r', encoding='utf-16') as f:
    logs = json.load(f)

print(f"Total error logs: {len(logs)}\n")

for i, log in enumerate(logs):
    print(f"\n=== Error {i+1} ===")
    print(f"Timestamp: {log.get('timestamp', 'N/A')}")
    
    # Try different error message locations
    if 'jsonPayload' in log:
        jp = log['jsonPayload']
        print(f"Message: {jp.get('message', 'N/A')}")
        print(f"Error: {jp.get('error', 'N/A')}")
        if 'exc_info' in jp:
            print(f"Exception: {jp['exc_info']}")
    
    if 'textPayload' in log:
        print(f"Text: {log['textPayload'][:500]}")
