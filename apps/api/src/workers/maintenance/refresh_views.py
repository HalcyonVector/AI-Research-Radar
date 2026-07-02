"""Refresh materialized views (spec 5.7)."""
from sqlalchemy import text
from src.celery_app import celery_app
from src.database import session_scope


@celery_app.task(name="workers.maintenance.refresh_views.run")
def run():
    db = session_scope()
    try:
        for view in ("top_papers_mv", "category_stats_mv"):
            try:
                db.execute(text(f"REFRESH MATERIALIZED VIEW CONCURRENTLY {view}"))
            except Exception:
                db.rollback()
                db.execute(text(f"REFRESH MATERIALIZED VIEW {view}"))
        db.commit()
        return {"refreshed": ["top_papers_mv", "category_stats_mv"]}
    finally:
        db.close()
