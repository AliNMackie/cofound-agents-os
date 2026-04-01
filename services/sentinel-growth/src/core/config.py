from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "Sentinel-Growth"
    ENV: str = "dev"
    LOG_LEVEL: str = "INFO"

    # ── Google Cloud ──────────────────────────────────────────────────
    GOOGLE_API_KEY: str = ""
    GEMINI_API_KEY: str = ""          # Gemini 1.5 Pro — memo generation
    GCP_PROJECT_ID: str = "cofound-agents-os-788e"
    GCS_BUCKET_NAME: str = "sentinel-growth-artifacts-788e"
    FIRESTORE_DB_NAME: str = "(default)"

    # ── BigQuery ──────────────────────────────────────────────────────
    BQ_DATASET: str = "ic_origin_themav2"   # Production dataset
    BQ_PRIMARY_TABLE: str = "auctions_enhanced"

    # ── CORS ──────────────────────────────────────────────────────────
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "https://icorigin.netlify.app",
        "https://vesper-gtm-1005792944830.europe-west2.run.app",
    ]

    # ── Notifications ─────────────────────────────────────────────────
    SLACK_WEBHOOK_URL: str = ""
    RESEND_API_KEY: str = ""
    ALERT_SENDER_EMAIL: str = "alerts@icorigin.ai"
    TELEGRAM_BOT_TOKEN: str = ""     # Scoring dispatcher alert channel
    TELEGRAM_CHAT_ID: str = ""       # Target chat / channel ID

    # ── Pub/Sub ───────────────────────────────────────────────────────
    PUBSUB_TOPIC_ID: str = "ic-origin-signals"

    # ── Neo4j (deprecated — replaced by Lean Graph SQL in BigQuery) ───
    NEO4J_URI: str = ""              # No longer used in production
    NEO4J_USER: str = "neo4j"
    NEO4J_PASSWORD: str = ""

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()
