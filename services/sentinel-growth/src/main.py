import structlog
from fastapi import FastAPI, BackgroundTasks
from contextlib import asynccontextmanager
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from src.core.config import settings
from src.core.logging import configure_logging
from src.api.routes import router as content_router
from src.api.ingest import router as ingest_router
from src.api.sources import router as sources_router
from src.api.industries import router as industries_router
from src.api.signals import router as signals_router

from src.services.market_sweep import sweep_service

from fastapi.middleware.cors import CORSMiddleware

# Ensure logging is configured before app startup
configure_logging()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    scheduler = AsyncIOScheduler()
    # Schedule Market Sweep for 8:00 AM Daily
    scheduler.add_job(
        sweep_service.run_market_sweep,
        CronTrigger(hour=8, minute=0),
        id="daily_market_sweep",
        replace_existing=True
    )
    scheduler.start()
    structlog.get_logger().info("Sentinel Scheduler Started", job="daily_market_sweep", time="08:00")
    
    yield
    
    # Shutdown
    scheduler.shutdown()

app = FastAPI(title=settings.APP_NAME, lifespan=lifespan)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(content_router)
app.include_router(ingest_router)
app.include_router(sources_router)
app.include_router(industries_router)
app.include_router(signals_router)

@app.post("/tasks/sweep")
async def trigger_market_sweep(background_tasks: BackgroundTasks):
    """
    Triggers a market sweep in the background.
    Returns immediately so UI doesn't hang.
    """
    background_tasks.add_task(sweep_service.run_market_sweep)
    return {"status": "sweep_started", "message": "Market sweep started in background"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return {}, 204

@app.get("/version")
def version_check():
    return {"version": "1.1.4-extraction-fix"}
