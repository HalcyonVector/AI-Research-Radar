"""Celery application + beat schedule (spec 5.1 / 5.8)."""
from celery import Celery
from celery.schedules import crontab

from src.config import settings

celery_app = Celery("radar", broker=settings.redis_url, backend=settings.redis_url)
celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_always_eager=settings.celery_eager,
    task_default_queue="ingestion.normal",
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_routes={
        "workers.ingestion.arxiv.*": {"queue": "ingestion.high"},
        "workers.ingestion.*": {"queue": "ingestion.normal"},
        "workers.ai.summary.*": {"queue": "ai.summaries"},
        "workers.ai.embedding.*": {"queue": "ai.embeddings"},
        "workers.ai.briefing.*": {"queue": "ai.summaries"},
        "workers.scoring.*": {"queue": "scoring"},
        "workers.graph.*": {"queue": "graph"},
        "workers.intelligence.*": {"queue": "intelligence"},
        "workers.maintenance.*": {"queue": "scoring"},
    },
)

# Auto-discover task modules
celery_app.autodiscover_tasks(
    [
        "src.workers.ingestion",
        "src.workers.ai",
        "src.workers.scoring",
        "src.workers.graph",
        "src.workers.intelligence",
        "src.workers.maintenance",
    ]
)

celery_app.conf.beat_schedule = {
    "arxiv-fetch-2h": {"task": "workers.ingestion.arxiv.run", "schedule": crontab(minute=0, hour="*/2")},
    "hf-fetch-6h": {"task": "workers.ingestion.huggingface.run", "schedule": crontab(minute=15, hour="*/6")},
    "github-fetch-12h": {"task": "workers.ingestion.github.run", "schedule": crontab(minute=30, hour="*/12")},
    "refresh-views-1h": {"task": "workers.maintenance.refresh_views.run", "schedule": crontab(minute=5)},
    "score-papers-nightly": {"task": "workers.scoring.paper_scores.run_all", "schedule": crontab(minute=0, hour=4)},
    "trend-scores-daily": {"task": "workers.scoring.trend_scores.run", "schedule": crontab(minute=30, hour=4)},
    "weekly-briefing": {"task": "workers.ai.briefing.generate", "schedule": crontab(minute=0, hour=6, day_of_week=1)},
    # Layer 3 (spec 5.8)
    "intel-dna-daily": {"task": "workers.intelligence.dna.compute_research_dna", "schedule": crontab(minute=0, hour=3)},
    "intel-scores-daily": {"task": "workers.intelligence.breakthrough.compute_breakthrough_scores", "schedule": crontab(minute=0, hour=5)},
    "intel-weekly": {"task": "workers.intelligence.orchestrate.run_weekly", "schedule": crontab(minute=0, hour=2, day_of_week=0)},
    "intel-narratives": {"task": "workers.intelligence.narrative.generate_all", "schedule": crontab(minute=30, hour=5, day_of_week=1)},
}
