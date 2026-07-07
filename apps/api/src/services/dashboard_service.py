from datetime import date, datetime, timedelta, timezone
from sqlalchemy import select, desc, func
from sqlalchemy.orm import Session, selectinload
from src.models import Paper, Model, ResearchCategory, Repository
from src.models.intelligence.paper_intelligence_scores import PaperIntelligenceScores
from src.models import WeeklyReport
from src.services import serializers as S
from src.services.trend_service import list_trends


def dashboard(db: Session) -> dict:
    trending = db.execute(select(Paper).options(selectinload(Paper.authors), selectinload(Paper.primary_category))
                          .order_by(desc(Paper.composite_score)).limit(10)).scalars().all()
    breakout = db.execute(select(Model).order_by(desc(Model.growth_score)).limit(6)).scalars().all()
    emerging = list_trends(db)["data"][:5]

    giants = db.execute(
        select(PaperIntelligenceScores, Paper).join(Paper, Paper.id == PaperIntelligenceScores.paper_id)
        .where(PaperIntelligenceScores.emerging_breakthrough_score > 0)
        .order_by(desc(PaperIntelligenceScores.emerging_breakthrough_score)).limit(5)
    ).all()

    latest = db.execute(select(WeeklyReport).where(WeeklyReport.is_published.is_(True))
                        .order_by(desc(WeeklyReport.week_start)).limit(1)).scalar_one_or_none()

    # heatmap: papers per category over last 8 weeks
    heatmap = []
    cats = db.execute(select(ResearchCategory).order_by(ResearchCategory.display_order).limit(8)).scalars().all()
    for c in cats:
        for w in range(8):
            start = date.today() - timedelta(days=(w + 1) * 7)
            end = date.today() - timedelta(days=w * 7)
            cnt = db.scalar(select(func.count()).select_from(Paper)
                            .where(Paper.primary_category_id == c.id,
                                   Paper.published_at >= start, Paper.published_at < end)) or 0
            heatmap.append({"category_slug": c.slug, "date": start.isoformat(), "count": cnt})

    # This-week counters + newest additions (both were missing, so those cards read 0).
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    stats = {
        "papers": db.scalar(select(func.count()).select_from(Paper).where(Paper.created_at >= week_ago)) or 0,
        "models": db.scalar(select(func.count()).select_from(Model).where(Model.ingested_at >= week_ago)) or 0,
        "repos": db.scalar(select(func.count()).select_from(Repository).where(Repository.ingested_at >= week_ago)) or 0,
        "breakthroughs": db.scalar(select(func.count()).select_from(PaperIntelligenceScores)
                                   .where(PaperIntelligenceScores.emerging_breakthrough_score > 0)) or 0,
    }
    recent_models = db.execute(
        select(Model).where(Model.ai_summary.isnot(None))
        .order_by(desc(Model.ingested_at)).limit(5)
    ).scalars().all()

    return {
        "trending_papers": [S.paper_list_item(p) for p in trending],
        "emerging_categories": emerging,
        "breakout_models": [S.model_item(m) for m in breakout],
        "stats": stats,
        "recently_added_models": [S.model_item(m) for m in recent_models],
        "sleeping_giants": [{
            "paper": {"id": str(p.id), "arxiv_id": p.arxiv_id, "title": p.title, "citation_count": p.citation_count},
            "emerging_breakthrough_score": s.emerging_breakthrough_score,
            "breakthrough_driver": s.breakthrough_driver, "ai_rationale": s.ai_rationale,
        } for s, p in giants],
        "latest_briefing_preview": (
            {"week_start": latest.week_start.isoformat(), "excerpt": (latest.briefing_md or "")[:400]}
            if latest else None
        ),
        "heatmap_data": heatmap,
    }


def whats_new(db: Session, days: int = 1) -> dict:
    """Everything added in the last `days` days: counts + the newest items across
    papers, models, and repos. Powers a 'what's new since your last visit' view."""
    since = datetime.now(timezone.utc) - timedelta(days=days)

    papers = db.execute(
        select(Paper).options(selectinload(Paper.authors), selectinload(Paper.primary_category))
        .where(Paper.created_at >= since).order_by(desc(Paper.created_at)).limit(20)
    ).scalars().all()
    models = db.execute(
        select(Model).where(Model.ingested_at >= since)
        .order_by(desc(Model.ingested_at)).limit(20)
    ).scalars().all()
    repos = db.execute(
        select(Repository).where(Repository.ingested_at >= since)
        .order_by(desc(Repository.ingested_at)).limit(20)
    ).scalars().all()

    def _count(model, col):
        return db.scalar(select(func.count()).select_from(model).where(col >= since)) or 0

    return {
        "window_days": days,
        "since": since.isoformat(),
        "counts": {
            "papers": _count(Paper, Paper.created_at),
            "models": _count(Model, Model.ingested_at),
            "repos": _count(Repository, Repository.ingested_at),
        },
        "papers": [S.paper_list_item(p) for p in papers],
        "models": [S.model_item(m) for m in models],
        "repos": [{
            "id": str(r.id), "github_full_name": r.github_full_name, "name": r.name,
            "stars": r.stars, "primary_language": r.primary_language,
            "has_ai_summary": r.ai_summary is not None,
        } for r in repos],
    }
