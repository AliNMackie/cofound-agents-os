import requests

signals = requests.get('https://sentinel-growth-hc7um252na-nw.a.run.app/signals').json()
print(f'Total signals: {len(signals)}\n')

print("Top 15 signals:")
for s in signals[:15]:
    ts = s.get("timestamp", "N/A")[:19]
    source = s.get("query_source", "N/A")
    headline = s.get("headline", "N/A")[:60]
    print(f"{ts} | {source:20} | {headline}")
