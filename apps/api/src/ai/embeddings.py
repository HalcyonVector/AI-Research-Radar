"""Embedding provider. Local sentence-transformers (default, free) or Gemini/OpenAI."""
from src.config import settings

_local_model = None


def _get_local():
    global _local_model
    if _local_model is None:
        from sentence_transformers import SentenceTransformer
        _local_model = SentenceTransformer(settings.embedding_model_local)
    return _local_model


def embed_texts(texts: list[str]) -> list[list[float]]:
    provider = settings.embedding_provider
    if provider == "gemini" and settings.gemini_api_key:
        return _embed_gemini(texts)
    model = _get_local()
    return [v.tolist() for v in model.encode(texts, batch_size=32, show_progress_bar=False)]


def embed_text(text: str) -> list[float]:
    return embed_texts([text])[0]


def _embed_gemini(texts: list[str]) -> list[list[float]]:
    import requests
    out = []
    for t in texts:
        url = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            f"text-embedding-004:embedContent?key={settings.gemini_api_key}"
        )
        r = requests.post(url, json={"content": {"parts": [{"text": t}]}}, timeout=60)
        r.raise_for_status()
        out.append(r.json()["embedding"]["values"])
    return out
