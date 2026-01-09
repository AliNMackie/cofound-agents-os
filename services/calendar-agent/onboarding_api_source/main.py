import os
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse

app = FastAPI()

MICROSOFT_ADMIN_CONSENT_URL = "https://login.microsoftonline.com/{tenant_id}/adminconsent?client_id={client_id}"

@app.get("/", response_class=HTMLResponse)
async def index():
    return """
    <h1>Onboarding API</h1>
    <a href="/admin/consent"><button>Admin Login</button></a>
    """

@app.get("/admin/consent")
async def admin_consent():
    tenant_id = os.environ.get("OUTLOOK_TENANT_ID")
    client_id = os.environ.get("OUTLOOK_CLIENT_ID")
    if not tenant_id or not client_id:
        raise HTTPException(status_code=500, detail="Missing required environment variables")
    
    url = MICROSOFT_ADMIN_CONSENT_URL.format(tenant_id=tenant_id, client_id=client_id)
    return RedirectResponse(url)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
