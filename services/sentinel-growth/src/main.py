import structlog
from fastapi import FastAPI, BackgroundTasks
from contextlib import asynccontextmanager
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from src.core.config import settings
from src.core.logging import configure_logging
from src.core.auth import initialize_firebase
from src.api.routes import router as content_router
from src.api.ingest import router as ingest_router
from src.api.sources import router as sources_router
from src.api.industries import router as industries_router
from src.api.signals import router as signals_router
from src.api.api_keys import router as api_keys_router

from src.services.market_sweep import sweep_service
import uuid
import datetime
from google.cloud import firestore

from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi import Request

# Ensure logging is configured before app startup
configure_logging()

# Initialize Scheduler
scheduler = AsyncIOScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize Firebase Admin
    initialize_firebase()
    
    # ... scheduler logic ...
    from src.services.pulse_engine import pulse_engine
    
    
    if pulse_engine:
        # Schedule Morning Pulse for 07:30 AM Daily
        scheduler.add_job(
            pulse_engine.generate_morning_pulse,
            CronTrigger(hour=7, minute=30),
            id="morning_pulse",
            replace_existing=True
        )
    else:
        structlog.get_logger().error("PulseEngine not initialized, skipping schedule.")
    
    # Schedule Market Sweep for 8:00 AM Daily
    scheduler.add_job(
        sweep_service.run_market_sweep,
        CronTrigger(hour=8, minute=0),
        id="daily_market_sweep",
        replace_existing=True
    )
    scheduler.start()
    structlog.get_logger().info("Sentinel Scheduler Started", jobs=["morning_pulse", "daily_market_sweep"], times=["07:30", "08:00"])
    
    yield
    
    # Shutdown
    scheduler.shutdown()

app = FastAPI(title=settings.APP_NAME, lifespan=lifespan)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger = structlog.get_logger()
    logger.error("Global crash intercepted", path=request.url.path, error=str(exc))
    return JSONResponse(
        status_code=500,
        content={"detail": "Critical service failure. Engineering team notified.", "error": str(exc)},
    )

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"]
)

app.include_router(content_router)
app.include_router(ingest_router)
app.include_router(sources_router)
app.include_router(industries_router)
app.include_router(signals_router)
app.include_router(api_keys_router)

@app.post("/tasks/sweep")
async def trigger_market_sweep(background_tasks: BackgroundTasks):
    """
    Triggers a market sweep asynchronously.
    Returns a task_id to poll for status.
    """
    task_id = str(uuid.uuid4())
    
    # Initialize status in Firestore
    try:
        db = firestore.Client(database=settings.FIRESTORE_DB_NAME)
        db.collection("tasks").document(task_id).set({
            "status": "starting",
            "progress": 0,
            "created_at": datetime.datetime.now(datetime.timezone.utc),
            "type": "market_sweep"
        })
    except Exception as e:
        structlog.get_logger().error("Failed to init task status", error=str(e))
        # Proceed anyway, run_market_sweep handles its own DB connection
        
    background_tasks.add_task(sweep_service.run_market_sweep, task_id)
    return {"status": "sweep_started", "task_id": task_id}

@app.get("/tasks/{task_id}")
async def get_task_status(task_id: str):
    """
    Get status of a background task.
    """
    try:
        db = firestore.Client(database=settings.FIRESTORE_DB_NAME)
        doc = db.collection("tasks").document(task_id).get()
        if doc.exists:
            return doc.to_dict()
        else:
            return {"status": "not_found"}
    except Exception as e:
        return {"status": "error", "error": str(e)}

@app.post("/tasks/pulse")
async def trigger_morning_pulse():
    """
    Triggers the Morning Pulse generation synchronously.
    """
    from src.services.pulse_engine import pulse_engine
    pulse_id = await pulse_engine.generate_morning_pulse()
    return {"status": "pulse_completed", "pulse_id": pulse_id}

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return {}, 204

@app.get("/version")
def version_check():
    return {"version": "1.2.2-date-filter"}
