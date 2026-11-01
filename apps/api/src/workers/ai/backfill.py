"""Batched AI backfill for papers: embeddings + summaries.

Replaces the per-paper .delay() calls arXiv ingestion used to make inline.
Runs once per ingest cycle with hard per-run caps so it stays inside the
Gemini free tier no matter how big the backlog is; anything left over is
picked up by the next run (every 6h).

Budget per 30-day month at the defaults below (4 runs/day):
  embeddings: <= 4 * EMBED_PER_RUN = 1600 texts/day in batches of EMBED_BATCH,
              i.e. ~32 batch requests/day
  summaries:  <= 4 * SUMMARIES_PER_RUN = 60 LLM calls/day, leaving most of the
              free daily request quota for briefings / Layer-3 / model cards
"""
import logging
import time
from sqlalchemy import select
from src.celery_app import celery_app
from src.database import session_scope
from src.models import Paper
from src.ai.embeddings import embed_texts

logger = logging.getLogger(__name__)

EMBED_PER_RUN = 400
EMBED_BATCH = 50
EMBED_SPACING_S = 20     # keeps a 50-abstract batch well under the free tokens-per-minute cap
SUMMARIES_PER_RUN = 15
SUMMARY_SPACING_S = 7    # ~8 RPM, under the free requests-per-minute cap


def _embed_missing(db) -> int:
    papers = db.execute(
        select(Paper).where(Paper.abstract_embedding.is_(None))
        .order_by(Paper.published_at.desc()).limit(EMBED_PER_RUN)
    ).scalars().all()
    done = 0
    for i in range(0, len(papers), EMBED_BATCH):
        batch = papers[i:i + EMBED_BATCH]
        if i:
            time.sleep(EMBED_SPACING_S)
        try:
            vecs = embed_texts([f"{p.title}\n\n{p.abstract}" for p in batch])
        except Exception as e:
            logger.warning("backfill: embedding batch failed, stopping for this run: %s", e)
            break
        for p, v in zip(batch, vecs):
            p.abstract_embedding = v
        db.commit()
        done += len(batch)
    return done


def _summarize_missing(db) -> int:
    from src.workers.ai.summary import generate
    ids = db.execute(
        select(Paper.id).where(Paper.ai_summary.is_(None))
        .order_by(Paper.composite_score.desc(), Paper.published_at.desc()).limit(SUMMARIES_PER_RUN)
    ).scalars().all()
    done = failed_in_a_row = 0
    for i, pid in enumerate(ids):
        if i:
            time.sleep(SUMMARY_SPACING_S)
        if generate.run(str(pid)).get("ok"):
            done += 1
            failed_in_a_row = 0
        else:
            failed_in_a_row += 1
            if failed_in_a_row >= 2:  # quota/model/key problem, not a bad paper: don't burn the run on it
                logger.warning("backfill: 2 summaries failed in a row, stopping for this run")
                break
    return done


@celery_app.task(name="workers.ai.backfill.run")
def run():
    db = session_scope()
    try:
        embedded = _embed_missing(db)
        summarized = _summarize_missing(db)
        logger.info("backfill: embedded=%d summarized=%d", embedded, summarized)
        return {"embedded": embedded, "summarized": summarized}
    finally:
        db.close()
