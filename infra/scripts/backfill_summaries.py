"""Enqueue AI summary + embedding tasks for papers that don't have them yet.

Run inside the api container:
    docker compose exec api python /repo/infra/scripts/backfill_summaries.py

Ingestion only enqueues summaries for *newly created* papers, so after a fresh
ingest (or a model/rate-limit failure) existing rows can be left without a
summary. This backfills them. Safe to run repeatedly — the summary task skips
papers that already have ai_summary.
"""
from sqlalchemy import select

from src.database import session_scope
from src.models import Paper, Model, Repository
from src.workers.ai.summary import generate as gen_sum
from src.workers.ai.embedding import generate as gen_emb
from src.workers.ai.model_summary import generate as gen_model_sum
from src.workers.ai.repo_summary import generate as gen_repo_sum


def _missing_ids(db, id_col, filter_col):
    return [str(x) for (x,) in db.execute(select(id_col).where(filter_col.is_(None))).all()]


def main() -> None:
    db = session_scope()
    try:
        missing_summary = _missing_ids(db, Paper.id, Paper.ai_summary)
        missing_embedding = _missing_ids(db, Paper.id, Paper.abstract_embedding)
        missing_model_summary = _missing_ids(db, Model.id, Model.ai_summary)
        missing_repo_summary = _missing_ids(db, Repository.id, Repository.ai_summary)
    finally:
        db.close()

    for pid in missing_embedding:
        gen_emb.delay(pid)
    for pid in missing_summary:
        gen_sum.delay(pid)
    # Interleave models and repos so the ~100 repos aren't starved behind ~1000+
    # models in the shared ai.summaries FIFO queue (repos would otherwise sit at 0
    # until every model finished).
    from itertools import zip_longest
    for mid, rid in zip_longest(missing_model_summary, missing_repo_summary):
        if rid is not None:
            gen_repo_sum.delay(rid)
        if mid is not None:
            gen_model_sum.delay(mid)

    print(f"enqueued paper embeddings: {len(missing_embedding)}")
    print(f"enqueued paper summaries:  {len(missing_summary)}")
    print(f"enqueued model summaries:  {len(missing_model_summary)}")
    print(f"enqueued repo summaries:   {len(missing_repo_summary)}")


if __name__ == "__main__":
    main()
