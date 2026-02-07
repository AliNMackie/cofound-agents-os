import requests
import time
import json

BASE_URL = "https://sentinel-growth-hc7um252na-nw.a.run.app"

def check_version():
    try:
        r = requests.get(f"{BASE_URL}/version")
        print(f"Version: {r.json()}")
        return r.json().get("version")
    except Exception as e:
        print(f"Version check failed: {e}")
        return None

def trigger_sweep():
    print("Triggering sweep...")
    r = requests.post(f"{BASE_URL}/tasks/sweep")
    print(f"Sweep Trigger: {r.status_code}")
    print(r.text)

def check_recent_signals():
    print("Fetching signals...")
    r = requests.get(f"{BASE_URL}/signals")
    data = r.json()
    print(f"Total signals: {len(data)}")
    
    recent_count = 0
    # Look for "Google News" source or datestamps
    for s in data[:20]: # Check top 20
        # Check source
        source = s.get("source", "Unknown")
        ts = s.get("timestamp", "")
        dd = s.get("deal_date", "")
        print(f" - {ts} | {dd} | {source}")

if __name__ == "__main__":
    v = check_version()
    if v == "1.1.6-sweep-fix":
        print("Deploy confirmed.")
        trigger_sweep()
        print("Waiting 45 seconds for sweep...")
        time.sleep(45)
        check_recent_signals()
    else:
        print("Deploy not ready yet or version mismatch.")
