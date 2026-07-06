"""Report semantic-search embedding coverage for papers, and optionally backfill.

Run inside the api container:
    docker compose exec -e PYTHONPATH=/app api python /repo/infra/scripts/check_embeddings.py
    docker compose exec -e PYTHONPATH=/app api python /repo/infra/scripts/check_embeddings.py --fix

Semantic (pgvector) search only works for papers that have an abstract_embedding.
This reports how many are missing; with --fix it enqueues embedding tasks for them
(local sentence-transformers, runs on ai.embeddings queue).
"""
import sys
from sqlalchemy import select, func
from src.database import session_scope
from src.models import Paper


def main():
    fix = "--fix" in sys.argv
    db = session_scope()
    try:
        total = db.scalar(select(func.count()).select_from(Paper)) or 0
        have = db.scalar(select(func.count()).select_from(Paper)
                         .where(Paper.abstract_embedding.isnot(None))) or 0
        missing_ids = [str(x) for (x,) in db.execute(
            select(Paper.id).where(Paper.abstract_embedding.is_(None))).all()]
    finally:
        db.close()

    print(f"Papers total:            {total}")
    print(f"With embedding:          {have}  ({round(100*have/max(total,1),1)}%)")
    print(f"Missing embedding:       {len(missing_ids)}")

    if fix and missing_ids:
        from src.workers.ai.embedding import generate as gen_emb
        for pid in missing_ids:
            gen_emb.delay(pid)
        print(f"-> enqueued {len(missing_ids)} embedding tasks (ai.embeddings queue)")
    elif missing_ids:
        print("Re-run with --fix to backfill the missing embeddings.")


if __name__ == "__main__":
    main()
