import hashlib
import logging
import time
from sqlalchemy import select, text, desc
from sqlalchemy.orm import Session
from src.models import Model, Repository
from src.ai.embeddings import embed_text
from src.utils.cache import cache_get, cache_set

logger = logging.getLogger(__name__)

# Query embeddings never change for a given model, so repeat searches (and the
# search-as-you-type prefixes people retype) don't spend Gemini quota again.
EMBED_CACHE_TTL = 7 * 86400
RRF_K = 60  # reciprocal-rank-fusion constant; 60 is the usual default


def search(db: Session, q: str, types="papers,models,repos", limit=10) -> dict:
    start = time.time()
    wanted = set(t.strip() for t in types.split(","))
    results = {"papers": [], "models": [], "repos": []}

    if "papers" in wanted:
        results["papers"] = _search_papers(db, q, limit)
    if "models" in wanted:
        rows = db.execute(select(Model).where(Model.name.ilike(f"%{q}%")).order_by(desc(Model.downloads_7d)).limit(limit)).scalars().all()
        results["models"] = [{"id": str(m.id), "title": m.name, "highlight": m.hf_model_id, "score": 0.7, "type": "model"} for m in rows]
    if "repos" in wanted:
        rows = db.execute(select(Repository).where(Repository.name.ilike(f"%{q}%")).order_by(desc(Repository.stars)).limit(limit)).scalars().all()
        results["repos"] = [{"id": str(r.id), "title": r.github_full_name, "highlight": r.description or "", "score": 0.6, "type": "repo", "ai_summary": r.ai_summary} for r in rows]

    return {"query": q, "results": results, "latency_ms": int((time.time() - start) * 1000)}


def _query_embedding(q: str) -> list[float]:
    key = "qemb:" + hashlib.sha1(q.strip().lower().encode()).hexdigest()
    hit = cache_get(key)
    if hit is not None:
        return hit
    emb = embed_text(q)
    cache_set(key, emb, EMBED_CACHE_TTL)
    return emb


def _vector_hits(db: Session, q: str, limit: int) -> list[dict]:
    try:
        emb = _query_embedding(q)
    except Exception as e:
        logger.warning("search: query embedding failed, keyword results only: %s", e)
        return []
    stmt = text(
        "SELECT id, title, abstract, 1 - (abstract_embedding <=> CAST(:emb AS vector)) AS sim "
        "FROM papers WHERE abstract_embedding IS NOT NULL "
        "ORDER BY abstract_embedding <=> CAST(:emb AS vector) LIMIT :lim"
    )
    return [{"id": str(r[0]), "title": r[1], "highlight": (r[2] or "")[:200], "score": round(float(r[3]), 3),
             "type": "paper"} for r in db.execute(stmt, {"emb": str(emb), "lim": limit})]


def _keyword_hits(db: Session, q: str, limit: int) -> list[dict]:
    # Same expression as idx_papers_fts, so the GIN index serves it.
    stmt = text(
        "SELECT id, title, abstract, ts_rank(to_tsvector('english', title || ' ' || abstract), query) AS rank "
        "FROM papers, websearch_to_tsquery('english', :q) query "
        "WHERE to_tsvector('english', title || ' ' || abstract) @@ query "
        "ORDER BY rank DESC, composite_score DESC LIMIT :lim"
    )
    return [{"id": str(r[0]), "title": r[1], "highlight": (r[2] or "")[:200], "score": round(float(r[3]), 3),
             "type": "paper"} for r in db.execute(stmt, {"q": q, "lim": limit})]


def _search_papers(db: Session, q: str, limit: int) -> list[dict]:
    """Hybrid search: semantic (embedding) and full-text results merged by
    reciprocal rank fusion, so exact title/keyword matches and conceptually
    related papers both surface. Either side can be empty."""
    vec = _vector_hits(db, q, limit)
    kw = _keyword_hits(db, q, limit)
    fused: dict[str, dict] = {}
    for hits in (vec, kw):
        for rank, h in enumerate(hits):
            entry = fused.setdefault(h["id"], {**h, "score": 0.0})
            entry["score"] += 1.0 / (RRF_K + rank + 1)
    out = sorted(fused.values(), key=lambda x: x["score"], reverse=True)[:limit]
    top = out[0]["score"] if out else 1.0
    for h in out:
        h["score"] = round(h["score"] / top, 3)  # 0-1 relative relevance, like before
    return out
