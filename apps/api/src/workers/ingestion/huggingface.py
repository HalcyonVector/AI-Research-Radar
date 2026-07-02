"""Hugging Face model ingestion (spec 5.3)."""
from datetime import datetime, timezone, date
import requests
from sqlalchemy import select
from src.celery_app import celery_app
from src.database import session_scope
from src.models import Model, ModelDownloadHistory, Paper
from src.config import settings
from src.utils.text import extract_arxiv_ids

HF_API = "https://huggingface.co/api/models"
SORT_BY = ["downloads", "likes", "lastModified"]
LIMIT = 200


def _headers():
    return {"Authorization": f"Bearer {settings.hf_api_token}"} if settings.hf_api_token else {}


def fetch_models(sort: str, limit: int = LIMIT) -> list[dict]:
    r = requests.get(HF_API, params={"sort": sort, "direction": -1, "limit": limit, "full": "true"},
                     headers=_headers(), timeout=60)
    r.raise_for_status()
    return r.json()


@celery_app.task(name="workers.ingestion.huggingface.run", bind=True, max_retries=3)
def run(self, limit: int = LIMIT):
    seen, upserted = set(), 0
    db = session_scope()
    try:
        for sort in SORT_BY:
            try:
                models = fetch_models(sort, limit)
            except Exception as exc:
                raise self.retry(exc=exc, countdown=min(2 ** self.request.retries * 2, 64))
            for md in models:
                mid = md.get("id") or md.get("modelId")
                if not mid or mid in seen:
                    continue
                seen.add(mid)
                m = db.execute(select(Model).where(Model.hf_model_id == mid)).scalar_one_or_none()
                downloads = md.get("downloads", 0) or 0
                likes = md.get("likes", 0) or 0
                if not m:
                    m = Model(hf_model_id=mid, name=mid.split("/")[-1], hf_org_name=mid.split("/")[0] if "/" in mid else None)
                    db.add(m)
                m.model_type = md.get("pipeline_tag")
                m.downloads_total = downloads
                m.downloads_30d = downloads
                m.likes = likes
                m.tags = md.get("tags", [])[:40]
                db.flush()
                # link to paper via arxiv tags
                for tag in md.get("tags", []):
                    ids = extract_arxiv_ids(str(tag))
                    if ids:
                        p = db.execute(select(Paper).where(Paper.arxiv_id == ids[0])).scalar_one_or_none()
                        if p:
                            m.linked_paper_id = p.id
                            p.hf_model_count = (p.hf_model_count or 0) + 1
                        break
                # download snapshot
                today = date.today()
                snap = db.execute(select(ModelDownloadHistory).where(
                    ModelDownloadHistory.model_id == m.id, ModelDownloadHistory.recorded_at == today)).scalar_one_or_none()
                if not snap:
                    db.add(ModelDownloadHistory(model_id=m.id, recorded_at=today,
                           downloads_total=downloads, downloads_30d=downloads, likes=likes))
                db.commit()
                upserted += 1
        return {"upserted": upserted}
    finally:
        db.close()
