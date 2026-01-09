import requests

url = "https://newsletter-engine-193875309190.europe-west2.run.app/favicon.ico"

try:
    response = requests.get(url)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 204:
        print("PASS: Favicon route returns 204 No Content")
    else:
        print(f"FAIL: Favicon route returned {response.status_code}")
except Exception as e:
    print(e)
