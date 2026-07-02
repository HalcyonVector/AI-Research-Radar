"""Nightly orphan cleanup (spec 5.7)."""
from sqlalchemy import text
from src.celery_app import celery_app
from src.database import session_scope


@celery_app.task(name="workers.maintenance.cleanup.run")
def run():
    db = session_scope()
    try:
        db.execute(text("DELETE FROM paper_metrics_history WHERE paper_id NOT IN (SELECT id FROM papers)"))
        db.commit()
        return {"ok": True}
    finally:
        db.close()
