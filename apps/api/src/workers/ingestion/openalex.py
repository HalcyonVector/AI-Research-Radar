"""OpenAlex author-affiliation enrichment (feature: talent flow tracker).

arXiv's own metadata API doesn't reliably carry author institutional
affiliations, so `Author.primary_org_id` and the org-linked queries in
org_service were always empty — nothing in the pipeline ever populated them.

OpenAlex (https://openalex.org, free, no API key) resolves a work's author
list with each author's institution *as of that paper*, which is exactly what
a "did this person move between orgs" feature needs — a single "current org"
field on Author can't represent history, only a per-paper snapshot can.

Since ~Dec 2022 arXiv auto-assigns every paper a DOI of the form
10.48550/arXiv.<id>, which OpenAlex indexes directly. Older papers usually
lack that DOI in OpenAlex, so we fall back to a title search.
"""
import time
from datetime import datetime, timezone

import requests
from sqlalchemy import select, func

from src.celery_app import celery_app
from src.database import session_scope
from src.config import settings
from src.models import Paper, PaperAuthor, Author, Organization
from src.utils.text import normalize_name, normalize_whitespace

OPENALEX_BASE = "https://api.openalex.org/works"
LIMIT = 100
SLEEP = 0.15  # OpenAlex free tier is generous; be polite anyway


def _params() -> dict:
    p = {}
    if settings.openalex_mailto:
        p["mailto"] = settings.openalex_mailto
    return p


def _fetch_by_doi(arxiv_id: str) -> dict | None:
    doi = f"10.48550/arxiv.{arxiv_id}"
    r = requests.get(f"{OPENALEX_BASE}/doi:{doi}", params=_params(), timeout=30)
    if r.status_code == 404:
        return None
    if r.status_code == 429:
        raise RuntimeError("rate limited")
    r.raise_for_status()
    return r.json()


def _fetch_by_title(title: str) -> dict | None:
    r = requests.get(
        OPENALEX_BASE,
        params={**_params(), "search": title, "per-page": 1},
        timeout=30,
    )
    if r.status_code == 429:
        raise RuntimeError("rate limited")
    r.raise_for_status()
    results = r.json().get("results") or []
    return results[0] if results else None


def fetch_work(arxiv_id: str, title: str) -> dict | None:
    work = _fetch_by_doi(arxiv_id)
    if work:
        return work
    return _fetch_by_title(title)


def extract_authorships(work: dict) -> list[dict]:
    """Return [{name, institutions: [{display_name, country_code}]}] from an
    OpenAlex work payload."""
    out = []
    for a in work.get("authorships", []) or []:
        author = a.get("author") or {}
        name = author.get("display_name")
        if not name:
            continue
        insts = [
            {"display_name": i.get("display_name"), "country_code": i.get("country_code")}
            for i in (a.get("institutions") or [])
            if i.get("display_name")
        ]
        out.append({"name": name, "institutions": insts})
    return out


def get_or_create_org(db, display_name: str, country_code: str | None) -> Organization:
    norm = normalize_name(display_name)
    org = db.execute(
        select(Organization).where(Organization.name_normalized == norm)
    ).scalar_one_or_none()
    if org:
        return org
    org = Organization(
        name=normalize_whitespace(display_name),
        name_normalized=norm,
        org_type=None,
        country=country_code,
    )
    db.add(org)
    db.flush()
    return org


def _match_author_row(pa_rows: list[PaperAuthor], authors_by_id: dict, openalex_name: str) -> PaperAuthor | None:
    target = normalize_name(openalex_name)
    if not target:
        return None
    # exact normalized-name match first
    for pa in pa_rows:
        if authors_by_id[pa.author_id].name_normalized == target:
            return pa
    # fall back: last-name containment (handles initials / middle-name drift)
    target_last = target.split()[-1] if target.split() else target
    for pa in pa_rows:
        our_norm = authors_by_id[pa.author_id].name_normalized
        if our_norm and target_last and our_norm.split()[-1] == target_last:
            return pa
    return None


def enrich_paper(db, paper: Paper) -> int:
    """Resolve + store affiliations for one paper's authors. Returns count set."""
    try:
        work = fetch_work(paper.arxiv_id, paper.title) if paper.arxiv_id else _fetch_by_title(paper.title)
    except Exception:
        return 0
    paper.affiliations_enriched_at = datetime.now(timezone.utc)
    if not work:
        return 0

    pa_rows = db.execute(
        select(PaperAuthor).where(PaperAuthor.paper_id == paper.id)
    ).scalars().all()
    if not pa_rows:
        return 0
    authors_by_id = {
        a.id: a for a in db.execute(
            select(Author).where(Author.id.in_([pa.author_id for pa in pa_rows]))
        ).scalars().all()
    }

    matched = 0
    for entry in extract_authorships(work):
        if not entry["institutions"]:
            continue
        pa = _match_author_row(pa_rows, authors_by_id, entry["name"])
        if not pa:
            continue
        inst = entry["institutions"][0]  # primary/first-listed institution
        org = get_or_create_org(db, inst["display_name"], inst.get("country_code"))
        pa.org_id = org.id
        pa.org_raw = inst["display_name"]
        matched += 1
    return matched


def _refresh_denormalized_counts(db, org_ids: set, author_ids: set) -> None:
    """Author.primary_org_id = org of that author's most recent affiliated
    paper; Organization.paper_count = distinct papers with an author there."""
    for author_id in author_ids:
        latest = db.execute(
            select(PaperAuthor.org_id)
            .join(Paper, Paper.id == PaperAuthor.paper_id)
            .where(PaperAuthor.author_id == author_id, PaperAuthor.org_id.isnot(None))
            .order_by(Paper.published_at.desc())
            .limit(1)
        ).scalar_one_or_none()
        if latest:
            db.execute(
                Author.__table__.update().where(Author.id == author_id).values(primary_org_id=latest)
            )
    for org_id in org_ids:
        count = db.scalar(
            select(func.count(func.distinct(PaperAuthor.paper_id))).where(PaperAuthor.org_id == org_id)
        ) or 0
        db.execute(
            Organization.__table__.update().where(Organization.id == org_id).values(paper_count=count)
        )


@celery_app.task(name="workers.ingestion.openalex.run", bind=True, max_retries=3)
def run(self, limit: int = LIMIT):
    """Enrich author affiliations for papers not yet processed."""
    db = session_scope()
    processed, matched_total = 0, 0
    touched_orgs, touched_authors = set(), set()
    try:
        papers = db.execute(
            select(Paper)
            .where(Paper.affiliations_enriched_at.is_(None))
            .order_by(Paper.published_at.desc())
            .limit(limit)
        ).scalars().all()

        for paper in papers:
            matched = enrich_paper(db, paper)
            matched_total += matched
            processed += 1
            if matched:
                rows = db.execute(
                    select(PaperAuthor.org_id, PaperAuthor.author_id)
                    .where(PaperAuthor.paper_id == paper.id, PaperAuthor.org_id.isnot(None))
                ).all()
                for org_id, author_id in rows:
                    touched_orgs.add(org_id)
                    touched_authors.add(author_id)
            db.flush()
            if processed % 20 == 0:
                db.commit()
            time.sleep(SLEEP)

        _refresh_denormalized_counts(db, touched_orgs, touched_authors)
        db.commit()
        return {"processed": processed, "authors_matched": matched_total, "orgs_touched": len(touched_orgs)}
    finally:
        db.close()
