from datetime import date, timedelta
from sqlalchemy import select, desc, func
from sqlalchemy.orm import Session, selectinload
from src.models import Paper, Model, PaperCategory, ResearchCategory
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

    latest = db.execute(select(WeeklyReport).where(WeeklyReport.is_published == True)
                        .order_by(desc(WeeklyReport.week_start)).limit(1)).scalar_one_or_none()

    # heatmap: papers per category over last 8 weeks
    heatmap = []
    cats = db.execute(select(ResearchCategory).order_by(ResearchCategory.display_order).limit(8)).scalars().all()
    for c in cats:
        for w in range(8):
            start = date.today() - timedelta(days=(w + 1) * 7)
            end = date.today() - timedelta(days=w * 7)
            cnt = db.scalar(select(func.count(func.distinct(PaperCategory.paper_id)))
                            .join(Paper, Paper.id == PaperCategory.paper_id)
                            .where(PaperCategory.category_id == c.id,
                                   Paper.published_at >= start, Paper.published_at < end)) or 0
            heatmap.append({"category": c.slug, "week": w, "count": cnt})

    return {
        "trending_papers": [S.paper_list_item(p) for p in trending],
        "emerging_categories": emerging,
        "breakout_models": [S.model_item(m) for m in breakout],
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
