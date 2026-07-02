"""Application configuration via Pydantic settings."""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Core infra
    database_url: str = "postgresql+psycopg://radar:radar@localhost:5432/radar_dev"
    redis_url: str = "redis://localhost:6379/0"
    secret_key: str = "dev-secret-change-me"
    environment: str = "development"

    # AI mode: "local" (Ollama + sentence-transformers) or "cloud" (Gemini)
    ai_mode: str = "local"

    # Ollama (local, free)
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "qwen2.5:7b"

    # Google Gemini (free cloud tier)
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"

    # Optional paid providers (unused in free mode)
    anthropic_api_key: str = ""
    openai_api_key: str = ""

    # Embeddings: "local" (sentence-transformers, 384d) or "gemini" (768d) or "openai" (1536d)
    embedding_provider: str = "local"
    embedding_model_local: str = "all-MiniLM-L6-v2"
    embedding_dim: int = 384  # keep in sync with migration + provider

    # Free data-source tokens (optional)
    hf_api_token: str = ""
    github_token: str = ""

    # Behaviour
    celery_eager: bool = False  # run tasks synchronously (dev/solo hosting)
    cache_enabled: bool = True

    @property
    def sqlalchemy_url(self) -> str:
        url = self.database_url
        if url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+psycopg://", 1)
        return url


@lru_cache
def get_settings() -> "Settings":
    return Settings()


settings = get_settings()
