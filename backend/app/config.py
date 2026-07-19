"""
Application configuration loaded from environment variables.
Uses pydantic-settings for type-safe configuration management.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings with defaults for local development."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    project_id: str = "vanguard-copilot"
    app_name: str = "Vanguard Co-Pilot"
    debug: bool = False
    log_level: str = "INFO"

    gemini_api_key: str = ""
    gemini_model: str = "gemini-1.5-flash"

    firestore_emulator_host: str = ""
    firestore_collection: str = "entries"
    use_firestore: bool = False

    rate_limit_requests: int = 30
    rate_limit_window: str = "1 minute"

    sqlite_db_path: str = "/app/data/vanguard.db"

    max_payload_bytes: int = 65536  # 64 KB

    allowed_origins: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://vanguard-copilot.run.place",
    ]


settings = Settings()
