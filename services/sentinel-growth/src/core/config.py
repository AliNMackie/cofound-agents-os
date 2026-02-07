from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_NAME: str = "Sentinel-Growth"
    ENV: str = "dev"
    LOG_LEVEL: str = "INFO"
    GOOGLE_API_KEY: str = ""
    GCS_BUCKET_NAME: str = "sentinel-growth-artifacts"
    FIRESTORE_DB_NAME: str = "(default)"
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "https://icorigin.netlify.app",
        "https://vesper-gtm-1005792944830.europe-west2.run.app"
    ]
    SLACK_WEBHOOK_URL: str = ""
    
    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()
