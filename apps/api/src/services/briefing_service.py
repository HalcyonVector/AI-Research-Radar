from sqlalchemy import select, desc
from sqlalchemy.orm import Session
from src.models import WeeklyReport


def _ser(r: WeeklyReport) -> dict:
    return {"id": str(r.id), "week_start": r.week_start.isoformat(), "week_end": r.week_end.isoformat(),
            "total_papers": r.total_papers, "total_models": r.total_models,
            "briefing_json": r.briefing_json, "briefing_md": r.briefing_md,
            "generated_at": r.generated_at.isoformat() if r.generated_at else None,
            "is_published": r.is_published}


def list_briefings(db: Session, limit=10) -> dict:
    rows = db.execute(select(WeeklyReport).order_by(desc(WeeklyReport.week_start)).limit(limit)).scalars().all()
    return {"data": [_ser(r) for r in rows]}


def latest(db: Session) -> dict | None:
    r = db.execute(select(WeeklyReport).order_by(desc(WeeklyReport.week_start)).limit(1)).scalar_one_or_none()
    return _ser(r) if r else None


def by_week(db: Session, week_start: str) -> dict | None:
    r = db.execute(select(WeeklyReport).where(WeeklyReport.week_start == week_start)).scalar_one_or_none()
    return _ser(r) if r else None
