"""Batched AI backfill: paper embeddings + paper/model/repo summaries.

Replaces the per-row .delay() calls ingestion used to make inline.
Runs once per ingest cycle with hard per-run caps so it stays inside the
free tiers no matter how big the backlog is; anything left over is picked
up by the next run (every 6h).

Budget per 30-day month at the defaults below (4 runs/day):
  embeddings (Gemini): <= 4 * EMBED_PER_RUN = 800 texts/day in batches of
              EMBED_BATCH. The free tier counts every text in a batch against
              its ~1K/day cap (400/run hit 429 on the third run of a day), and
              the API's search-query embeddings share the same key.
  heavy lane (Groq gpt-oss-120b, ~1K req/day free): 4 * 15 = 60 paper
              summaries/day, leaving the rest for briefings / Layer-3
  light lane (Groq gpt-oss-20b, ~1K req/day free): 4 * (25 + 15) = 160
              model/repo cards/day
SUMMARY_SPACING_S keeps each lane under the free ~8K tokens/minute cap.
"""
import logging
import time

from sqlalchemy import or_, select

from src.ai.embeddings import embed_texts
from src.celery_app import celery_app
from src.database import session_scope
from src.models import Model, Paper, Repository

logger = logging.getLogger(__name__)

EMBED_PER_RUN = 200
EMBED_BATCH = 50
EMBED_SPACING_S = 20     # keeps a 50-abstract batch well under the free tokens-per-minute cap
PAPER_SUMMARIES_PER_RUN = 15
MODEL_SUMMARIES_PER_RUN = 25
REPO_SUMMARIES_PER_RUN = 15
SUMMARY_SPACING_S = 15   # ~4 calls/min x ~1.5K tokens, under the free ~8K TPM cap
# The workflow kills a job at 25 min; stop starting new summaries well before
# that so a slow provider ends the run cleanly instead of failing it.
RUN_DEADLINE_S = 18 * 60
_started = time.monotonic()


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
            print(f"::warning::backfill: embedding batch failed, stopping for this run: {e}", flush=True)
            break
        for p, v in zip(batch, vecs):
            p.abstract_embedding = v
        db.commit()
        done += len(batch)
    return done


def _summarize(label, generate, ids) -> int:
    done = failed_in_a_row = 0
    for i, rid in enumerate(ids):
        if time.monotonic() - _started > RUN_DEADLINE_S:
            print(f"::warning::backfill: out of time, leaving the remaining {label} summaries "
                  f"for the next run ({done} done)", flush=True)
            break
        if i:
            time.sleep(SUMMARY_SPACING_S)
        if generate.run(str(rid)).get("ok"):
            done += 1
            failed_in_a_row = 0
        else:
            failed_in_a_row += 1
            if failed_in_a_row >= 2:  # quota/model/key problem, not a bad row: don't burn the run on it
                # print, not logger: these must show in the Actions log, where a
                # rate-limited run used to look like 25 silent minutes.
                print(f"::warning::backfill: 2 {label} summaries failed in a row, "
                      f"stopping them for this run ({done} done)", flush=True)
                break
    return done


def _summarize_papers(db) -> int:
    from src.workers.ai.summary import generate
    ids = db.execute(
        select(Paper.id).where(Paper.ai_summary.is_(None))
        .order_by(Paper.composite_score.desc(), Paper.published_at.desc()).limit(PAPER_SUMMARIES_PER_RUN)
    ).scalars().all()
    return _summarize("paper", generate, ids)


def _summarize_models(db) -> int:
    from src.workers.ai.model_summary import generate
    from src.workers.ingestion.huggingface import SUMMARY_MIN_DOWNLOADS, SUMMARY_MIN_LIKES
    ids = db.execute(
        select(Model.id).where(
            Model.ai_summary.is_(None),
            or_(Model.downloads_total >= SUMMARY_MIN_DOWNLOADS, Model.likes >= SUMMARY_MIN_LIKES))
        .order_by(Model.downloads_total.desc()).limit(MODEL_SUMMARIES_PER_RUN)
    ).scalars().all()
    return _summarize("model", generate, ids)


def _summarize_repos(db) -> int:
    from src.workers.ai.repo_summary import generate
    ids = db.execute(
        select(Repository.id).where(Repository.ai_summary.is_(None))
        .order_by(Repository.stars.desc()).limit(REPO_SUMMARIES_PER_RUN)
    ).scalars().all()
    return _summarize("repo", generate, ids)


@celery_app.task(name="workers.ai.backfill.run")
def run():
    global _started
    _started = time.monotonic()
    db = session_scope()
    try:
        out = {"embedded": _embed_missing(db),
               "papers_summarized": _summarize_papers(db),
               "models_summarized": _summarize_models(db),
               "repos_summarized": _summarize_repos(db)}
        logger.info("backfill: %s", out)
        return out
    finally:
        db.close()
