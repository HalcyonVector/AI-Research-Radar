"""Embedding generation (spec 5.6) — local sentence-transformers by default."""
import logging
from src.celery_app import celery_app
from src.database import session_scope
from src.models import Paper
from src.ai.embeddings import embed_texts
from sqlalchemy import select

logger = logging.getLogger(__name__)


@celery_app.task(name="workers.ai.embedding.generate", bind=True, max_retries=3)
def generate(self, paper_id: str):
    """Called inline from arxiv ingestion for every new paper -- see
    workers.ai.summary.generate's docstring for why failures here just log
    and return instead of calling self.retry()."""
    db = session_scope()
    try:
        paper = db.get(Paper, paper_id)
        if not paper or paper.abstract_embedding is not None:
            return {"skipped": True}
        try:
            vec = embed_texts([f"{paper.title}\n\n{paper.abstract}"])[0]
            paper.abstract_embedding = vec
            db.commit()
            return {"ok": True, "dim": len(vec)}
        except Exception as e:
            logger.warning("embedding.generate: failed for paper %s, will retry next ingestion pass: %s",
                           paper_id, e)
            return {"failed": True, "error": str(e)}
    finally:
        db.close()


@celery_app.task(name="workers.ai.embedding.generate_batch")
def generate_batch(paper_ids: list[str]):
    db = session_scope()
    try:
        papers = db.execute(select(Paper).where(Paper.id.in_(paper_ids))).scalars().all()
        todo = [p for p in papers if p.abstract_embedding is None]
        if not todo:
            return {"skipped": True}
        vecs = embed_texts([f"{p.title}\n\n{p.abstract}" for p in todo])
        for p, v in zip(todo, vecs):
            p.abstract_embedding = v
        db.commit()
        return {"ok": True, "count": len(todo)}
    finally:
        db.close()
