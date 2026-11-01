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
    if provider == "gemini":
        if not settings.gemini_api_key:
            # Never fall through to the local model here: importing PyTorch costs
            # 300MB+ and OOM-kills the free-tier instance. Callers catch this and
            # just skip the embedding for now.
            raise RuntimeError("EMBEDDING_PROVIDER=gemini but GEMINI_API_KEY is not set")
        return _embed_gemini(texts)
    model = _get_local()
    return [v.tolist() for v in model.encode(texts, batch_size=32, show_progress_bar=False)]


def embed_text(text: str) -> list[float]:
    return embed_texts([text])[0]


GEMINI_EMBED_MODEL = "gemini-embedding-001"
GEMINI_BATCH = 100  # batchEmbedContents' per-request cap


def _embed_gemini(texts: list[str]) -> list[list[float]]:
    """gemini-embedding-001 via batchEmbedContents (text-embedding-004 was
    retired, which is why every paper since the switch to gemini had a NULL
    embedding). outputDimensionality (MRL truncation) keeps vectors at
    settings.embedding_dim (384) so they fit the existing pgvector column;
    truncated vectors aren't unit-length, so they're re-normalized here."""
    import math
    from src.ai.llm import _post_with_retry
    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{GEMINI_EMBED_MODEL}:batchEmbedContents?key={settings.gemini_api_key}"
    )
    out = []
    for i in range(0, len(texts), GEMINI_BATCH):
        reqs = [{
            "model": f"models/{GEMINI_EMBED_MODEL}",
            "content": {"parts": [{"text": t[:8000]}]},
            "outputDimensionality": settings.embedding_dim,
        } for t in texts[i:i + GEMINI_BATCH]]
        r = _post_with_retry(url, json={"requests": reqs}, timeout=120, max_retries=3)
        for e in r.json()["embeddings"]:
            v = e["values"]
            norm = math.sqrt(sum(x * x for x in v)) or 1.0
            out.append([x / norm for x in v])
    return out
