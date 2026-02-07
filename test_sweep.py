import requests
import time

print('Testing sweep with 5min timeout...')
start = time.time()

try:
    r = requests.post('https://sentinel-growth-hc7um252na-nw.a.run.app/tasks/sweep', timeout=300)
    elapsed = time.time() - start
    
    print(f'\nCompleted in {elapsed:.1f}s')
    result = r.json()
    print(f"Status: {result.get('status')}")
    print(f"Result: {result.get('result')}")
    
    # Check new signals
    print("\nChecking for new signals...")
    signals = requests.get('https://sentinel-growth-hc7um252na-nw.a.run.app/signals').json()
    print(f"Total signals: {len(signals)}")
    
    # Show top 5
    print("\nTop 5 most recent:")
    for s in signals[:5]:
        print(f"  - {s.get('timestamp', 'N/A')[:19]} | {s.get('source', 'N/A')} | {s.get('headline', 'N/A')[:50]}")
        
except requests.exceptions.Timeout:
    print(f"\nTimeout after {time.time() - start:.1f}s - sweep is still running")
except Exception as e:
    print(f"\nError: {e}")
