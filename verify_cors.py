import requests

url = "https://newsletter-engine-193875309190.europe-west2.run.app/draft"
headers = {
    "Origin": "https://icorigin.netlify.app",
    "Access-Control-Request-Method": "POST"
}

try:
    response = requests.options(url, headers=headers)
    print(f"Status Code: {response.status_code}")
    print("Access-Control-Allow-Origin:", response.headers.get("Access-Control-Allow-Origin"))
    print("Access-Control-Allow-Methods:", response.headers.get("Access-Control-Allow-Methods"))
except Exception as e:
    print(e)
