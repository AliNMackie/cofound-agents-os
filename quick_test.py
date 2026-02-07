import requests
import json

print('Testing sweep...')
r = requests.post('https://sentinel-growth-hc7um252na-nw.a.run.app/tasks/sweep', timeout=60)
print(f"Status Code: {r.status_code}")
print(f"Response: {json.dumps(r.json(), indent=2)}")
