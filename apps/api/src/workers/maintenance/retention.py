"""Weekly retention: keep the database inside Supabase's 500MB free tier.

At 261MB and ~90MB/month of growth (Nov 2026) the database would fill in
about three months. Most of that was data nothing reads:

- model_card_raw on summarized models (~69MB): the card is only used to
  write the model's AI summary, and model_summary now clears it afterwards.
- Models nobody will look at: no summary, under MIN_DOWNLOADS downloads and
  MIN_LIKES likes, and not refreshed by ingest for STALE_AFTER. Anything a
  visitor or another table points at (bookmarks, linked papers or repos,
  social mentions, graph edges) is kept.
- Daily history older than DAILY_WINDOW: scoring reads at most the last 31
  daily snapshots, so older points are thinned to one per week, which is
  enough for the history charts.

Deleted rows free space for reuse; only VACUUM FULL (full=True, run by hand
once) shrinks the size Supabase reports.
"""
from sqlalchemy import text

from src.celery_app import celery_app
from src.database import engine, session_scope

MIN_DOWNLOADS = 100
MIN_LIKES = 5
STALE_AFTER = "30 days"
DAILY_WINDOW = "35 days"

_CLEAR_CARDS = "UPDATE models SET model_card_raw = NULL WHERE ai_summary IS NOT NULL AND model_card_raw IS NOT NULL"

_DEAD_MODELS = f"""
    SELECT m.id FROM models m
    WHERE m.ai_summary IS NULL
      AND coalesce(m.downloads_total, 0) < {MIN_DOWNLOADS}
      AND coalesce(m.likes, 0) < {MIN_LIKES}
      AND m.updated_at < now() - interval '{STALE_AFTER}'
      AND m.linked_paper_id IS NULL
      AND NOT EXISTS (SELECT 1 FROM bookmarks b WHERE b.entity_type = 'model' AND b.entity_id = m.id)
      AND NOT EXISTS (SELECT 1 FROM repositories r WHERE r.linked_model_id = m.id)
      AND NOT EXISTS (SELECT 1 FROM social_mentions s WHERE s.model_id = m.id)
      AND NOT EXISTS (SELECT 1 FROM knowledge_graph_edges e
                      WHERE (e.source_type = 'model' AND e.source_id = m.id)
                         OR (e.target_type = 'model' AND e.target_id = m.id))
"""


def _thin(table: str, key: str) -> str:
    """Delete rows older than DAILY_WINDOW except the newest per key per week."""
    return f"DELETE FROM {table} WHERE id IN ({_thin_ids(table, key)})"


def _thin_ids(table: str, key: str) -> str:
    return f"""
        SELECT id FROM (
            SELECT id, row_number() OVER (
                PARTITION BY {key}, date_trunc('week', recorded_at)
                ORDER BY recorded_at DESC) AS rn
            FROM {table} WHERE recorded_at < now() - interval '{DAILY_WINDOW}'
        ) old WHERE rn > 1
    """


_DB_SIZE = "SELECT pg_size_pretty(pg_database_size(current_database()))"


def _count(db, sql: str) -> int:
    return db.execute(text(f"SELECT count(*) FROM ({sql}) q")).scalar() or 0


@celery_app.task(name="workers.maintenance.retention.run")
def run(dry_run: bool = False, full: bool = False):
    db = session_scope()
    try:
        before = db.execute(text(_DB_SIZE)).scalar()
        if dry_run:
            return {"dry_run": True, "db_size": before,
                    "cards_to_clear": _count(db, "SELECT id FROM models WHERE ai_summary IS NOT NULL "
                                                 "AND model_card_raw IS NOT NULL"),
                    "models_to_delete": _count(db, _DEAD_MODELS),
                    "model_history_to_thin": _count(db, _thin_ids("model_download_history", "model_id")),
                    "paper_history_to_thin": _count(db, _thin_ids("paper_metrics_history", "paper_id"))}

        cards = db.execute(text(_CLEAR_CARDS)).rowcount
        db.commit()
        dead = f"SELECT id FROM ({_DEAD_MODELS}) d"
        db.execute(text(f"DELETE FROM model_download_history WHERE model_id IN ({dead})"))
        models = db.execute(text(f"DELETE FROM models WHERE id IN ({dead})")).rowcount
        db.commit()
        model_hist = db.execute(text(_thin("model_download_history", "model_id"))).rowcount
        paper_hist = db.execute(text(_thin("paper_metrics_history", "paper_id"))).rowcount
        db.commit()
    finally:
        db.close()

    # VACUUM can't run inside a transaction. Plain VACUUM makes the freed space
    # reusable; FULL rewrites the tables (briefly locking them) to shrink them.
    tables = ("models", "model_download_history", "paper_metrics_history")
    with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
        for t in tables:
            conn.execute(text(f"VACUUM {'FULL ' if full else ''}ANALYZE {t}"))
        after = conn.execute(text(_DB_SIZE)).scalar()
    return {"db_size_before": before, "db_size_after": after, "cards_cleared": cards,
            "models_deleted": models, "model_history_thinned": model_hist,
            "paper_history_thinned": paper_hist}
