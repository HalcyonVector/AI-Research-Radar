"""Weekly briefing generation (spec 5.5 / 1.4.5)."""
from datetime import date, timedelta, datetime, timezone
from sqlalchemy import select, desc, func
from src.celery_app import celery_app
from src.database import session_scope
from src.models import Paper, Model, Repository, WeeklyReport
from src.ai.llm import complete_json, model_name
from src.ai.prompts import BRIEFING_PROMPT
from src.config import settings


def _render_md(bj: dict) -> str:
    parts = ["## This Week in Numbers", bj.get("this_week_in_numbers", ""), "\n## The Big Stories"]
    for s in bj.get("big_stories", []):
        parts.append(f"### {s.get('title','')}\n{s.get('body','')}")
    parts += ["\n## Emerging Signals", bj.get("emerging_signals", ""),
              "\n## Papers Worth Your Time"] + [f"- {x}" for x in bj.get("papers_worth_your_time", [])]
    parts += ["\n## Model Releases"] + [f"- {x}" for x in bj.get("model_releases", [])]
    parts += ["\n## What to Watch", bj.get("what_to_watch", "")]
    return "\n\n".join(p for p in parts if p)


@celery_app.task(name="workers.ai.briefing.generate", bind=True, max_retries=2)
def generate(self):
    db = session_scope()
    try:
        today = date.today()
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)
        if db.execute(select(WeeklyReport).where(WeeklyReport.week_start == week_start)).scalar_one_or_none():
            return {"skipped": "exists"}
        since = datetime.now(timezone.utc) - timedelta(days=7)
        n_papers = db.scalar(select(func.count(Paper.id)).where(Paper.published_at >= since)) or 0
        n_models = db.scalar(select(func.count(Model.id))) or 0
        n_repos = db.scalar(select(func.count(Repository.id))) or 0
        top = db.execute(select(Paper).order_by(desc(Paper.composite_score)).limit(5)).scalars().all()
        models = db.execute(select(Model).order_by(desc(Model.growth_score)).limit(5)).scalars().all()
        ctx = dict(
            week_start=str(week_start), week_end=str(week_end),
            numbers=f"{n_papers} papers, {n_models} models",
            top_papers="; ".join(p.title for p in top),
            models="; ".join(m.name for m in models),
            category_deltas="see trend radar",
        )
        try:
            bj = complete_json(BRIEFING_PROMPT.format(**ctx), model=settings.openai_model_heavy)
        except Exception:
            bj = {"this_week_in_numbers": ctx["numbers"], "big_stories": [],
                  "emerging_signals": "", "papers_worth_your_time": [p.title for p in top],
                  "model_releases": [m.name for m in models], "what_to_watch": ""}
        report = WeeklyReport(week_start=week_start, week_end=week_end, total_papers=n_papers,
                              total_models=n_models, total_repos=n_repos, briefing_json=bj, briefing_md=_render_md(bj),
                              generated_at=datetime.now(timezone.utc), model_used=model_name(settings.openai_model_heavy),
                              prompt_version="1", is_published=True,
                              published_at=datetime.now(timezone.utc))
        db.add(report)
        db.commit()
        return {"ok": True, "week_start": str(week_start)}
    finally:
        db.close()
