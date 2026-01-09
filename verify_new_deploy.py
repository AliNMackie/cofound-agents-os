import requests

# NEW URL
url_base = "https://newsletter-engine-1005792944830.europe-west2.run.app"

# 1. Verify CORS
try:
    cors_resp = requests.options(
        f"{url_base}/draft",
        headers={
            "Origin": "https://icorigin.netlify.app",
            "Access-Control-Request-Method": "POST"
        }
    )
    print(f"CORS Status: {cors_resp.status_code}")
    print(f"ACAO: {cors_resp.headers.get('Access-Control-Allow-Origin')}")
except Exception as e:
    print(f"CORS Error: {e}")

# 2. Verify Favicon
try:
    fav_resp = requests.get(f"{url_base}/favicon.ico")
    print(f"Favicon Status: {fav_resp.status_code}")
except Exception as e:
    print(f"Favicon Error: {e}")
