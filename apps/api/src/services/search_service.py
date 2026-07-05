import time
from sqlalchemy import select, text, desc
from sqlalchemy.orm import Session
from src.models import Paper, Model, Repository
from src.ai.embeddings import embed_text


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


def _search_papers(db: Session, q: str, limit: int) -> list[dict]:
    # Hybrid: try vector search, blend with keyword. Fall back to FTS/ILIKE.
    vector_hits = {}
    try:
        emb = embed_text(q)
        stmt = text(
            "SELECT id, title, abstract, 1 - (abstract_embedding <=> CAST(:emb AS vector)) AS sim "
            "FROM papers WHERE abstract_embedding IS NOT NULL "
            "ORDER BY abstract_embedding <=> CAST(:emb AS vector) LIMIT :lim"
        )
        for r in db.execute(stmt, {"emb": str(emb), "lim": limit}):
            vector_hits[str(r[0])] = {"id": str(r[0]), "title": r[1],
                                      "highlight": (r[2] or "")[:200], "score": round(float(r[3]), 3), "type": "paper"}
    except Exception:
        pass
    if vector_hits:
        return sorted(vector_hits.values(), key=lambda x: x["score"], reverse=True)[:limit]
    rows = db.execute(select(Paper).where(Paper.title.ilike(f"%{q}%") | Paper.abstract.ilike(f"%{q}%"))
                      .order_by(desc(Paper.composite_score)).limit(limit)).scalars().all()
    return [{"id": str(p.id), "title": p.title, "highlight": (p.abstract or "")[:200],
             "score": round(p.composite_score / 100, 3), "type": "paper"} for p in rows]
