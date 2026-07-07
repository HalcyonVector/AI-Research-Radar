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

    # Google Gemini (free cloud tier). Note: gemini-2.0-flash is deprecated; default to 2.5-flash.
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"

    # OpenAI-compatible provider (AI_MODE=openai): Groq, Cerebras, OpenRouter, Mistral, Together, ...
    # Groq default below; get a free key at https://console.groq.com
    openai_base_url: str = "https://api.groq.com/openai/v1"
    openai_api_key: str = ""
    openai_model: str = "llama-3.3-70b-versatile"  # default / fallback tier
    # Per-task routing: heavy for reasoning-dense work (papers, Layer-3 intelligence),
    # light for high-volume/low-difficulty work (model + repo cards). Both are Groq
    # models here. During big backfills you can set both to the light model to stay
    # under the heavy model's daily cap.
    openai_model_heavy: str = "llama-3.3-70b-versatile"
    openai_model_light: str = "llama-3.1-8b-instant"

    # Per-lane provider routing. Blank => fall back to the legacy global AI_MODE.
    #   light lane = model/repo cards  -> set "ollama" to run locally (no rate limit)
    #   heavy lane = papers + Layer-3  -> "openai" (Groq) with optional 2nd-provider failover
    light_provider: str = ""   # "ollama" | "openai" | "cloud"
    heavy_provider: str = ""   # "ollama" | "openai" | "cloud"

    # Optional 2nd OpenAI-compatible provider, used as failover for the cloud lanes
    # (e.g. Cerebras or OpenRouter free tier so a Groq daily cap doesn't stall papers).
    openai_base_url_2: str = ""
    openai_api_key_2: str = ""
    openai_model_2: str = ""

    # Optional paid provider (unused in free mode)
    anthropic_api_key: str = ""

    # Embeddings: "local" (sentence-transformers, 384d) or "gemini" (768d) or "openai" (1536d)
    embedding_provider: str = "local"
    embedding_model_local: str = "all-MiniLM-L6-v2"
    embedding_dim: int = 384  # keep in sync with migration + provider

    # Free data-source tokens (optional)
    hf_api_token: str = ""
    github_token: str = ""

    # OpenAlex (free, no key) — author institutional affiliations per paper.
    # Setting a contact email moves requests into OpenAlex's faster "polite pool".
    openalex_mailto: str = ""

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
