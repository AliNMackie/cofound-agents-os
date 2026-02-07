import requests

signals = requests.get('https://sentinel-growth-hc7um252na-nw.a.run.app/signals').json()

# Find RSS signals
rss = [s for s in signals if 'Google News' in str(s.get('source', ''))]

print(f'Total signals: {len(signals)}')
print(f'RSS signals found: {len(rss)}\n')

if rss:
    print("Top 10 RSS signals:")
    for s in rss[:10]:
        ts = s.get('timestamp', 'N/A')[:19]
        headline = s.get('headline', 'N/A')[:60]
        print(f"{ts} | {headline}")
else:
    print("No RSS signals found!")
    print("\nChecking all sources:")
    sources = set(s.get('source', 'Unknown') for s in signals[:20])
    for src in sources:
        print(f"  - {src}")
