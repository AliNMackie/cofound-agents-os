import structlog
from fastapi import FastAPI
from src.core.config import settings
from src.core.logging import configure_logging
from src.api.routes import router as content_router
from src.api.ingest import router as ingest_router

from src.services.market_sweep import sweep_service

# Ensure logging is configured before app startup
configure_logging()

app = FastAPI(title=settings.APP_NAME)

app.include_router(content_router)
app.include_router(ingest_router)

@app.post("/tasks/sweep")
async def trigger_market_sweep():
    """
    Triggers a market sweep from RSS feeds.
    Ideally secured by internal auth or OIDC token.
    """
    result = await sweep_service.run_market_sweep()
    return result

@app.get("/health")
def health_check():
    return {"status": "ok"}
