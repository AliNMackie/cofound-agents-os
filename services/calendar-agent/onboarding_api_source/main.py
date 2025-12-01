import os
from flask import Flask, redirect

app = Flask(__name__)

MICROSOFT_ADMIN_CONSENT_URL = "https://login.microsoftonline.com/{tenant_id}/adminconsent?client_id={client_id}"

@app.route("/")
def index():
    return """
    <h1>Onboarding API</h1>
    <a href="/admin/consent"><button>Admin Login</button></a>
    """

@app.route("/admin/consent")
def admin_consent():
    tenant_id = os.environ.get("OUTLOOK_TENANT_ID")
    client_id = os.environ.get("OUTLOOK_CLIENT_ID")
    if not tenant_id or not client_id:
        return "Missing required environment variables", 500
    url = MICROSOFT_ADMIN_CONSENT_URL.format(tenant_id=tenant_id, client_id=client_id)
    return redirect(url)

if __name__ == "__main__":
    app.run(port=int(os.environ.get("PORT", 8080)))
