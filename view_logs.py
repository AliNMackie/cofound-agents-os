import json

with open('sweep_logs.json', 'r', encoding='utf-16') as f:
    logs = json.load(f)

print(f"Total logs: {len(logs)}\n")
print("Recent 30 log messages:\n")

for log in logs[:30]:
    timestamp = log.get('timestamp', 'N/A')[:19]
    message = str(log.get('jsonPayload', {}).get('message', log.get('textPayload', '')))[:120]
    print(f"{timestamp} | {message}")
