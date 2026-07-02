"""Embedding generation (spec 5.6) — local sentence-transformers by default."""
from src.celery_app import celery_app
from src.database import session_scope
from src.models import Paper
from src.ai.embeddings import embed_texts
from sqlalchemy import select


@celery_app.task(name="workers.ai.embedding.generate", bind=True, max_retries=3)
def generate(self, paper_id: str):
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
            raise self.retry(exc=e, countdown=30)
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
