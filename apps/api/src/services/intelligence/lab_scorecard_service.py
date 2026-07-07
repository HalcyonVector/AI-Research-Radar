"""Lab Scorecard — rank organizations by research output, impact, and momentum.

Built on the same per-paper affiliation snapshot as talent_service.py
(paper_authors.org_id, migration 0005 + workers.ingestion.openalex). At
current data volume this is computed on the fly from a single query rather
than materialized — revisit with a nightly worker + table if that stops
being true.
"""
from datetime import datetime, timedelta, timezone
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload
from src.models import Paper, PaperAuthor


def _normalize(value: float, lo: float, hi: float) -> float:
    if hi <= lo:
        return 0.0
    return max(0.0, min(100.0, (value - lo) / (hi - lo) * 100))


def scorecard(db: Session, limit: int = 20, org_type: str | None = None) -> dict:
    now = datetime.now(timezone.utc)
    cutoff_30d = now - timedelta(days=30)

    rows = db.execute(
        select(PaperAuthor)
        .options(selectinload(PaperAuthor.paper), selectinload(PaperAuthor.org))
        .join(Paper, Paper.id == PaperAuthor.paper_id)
        .where(PaperAuthor.org_id.isnot(None))
    ).scalars().all()

    by_org: dict = {}
    for pa in rows:
        if not pa.org or not pa.paper:
            continue
        if org_type and pa.org.org_type != org_type:
            continue
        bucket = by_org.setdefault(pa.org.id, {
            "org": pa.org, "paper_ids": set(), "author_ids": set(),
            "papers_30d": set(), "papers": {},
        })
        bucket["paper_ids"].add(pa.paper.id)
        bucket["author_ids"].add(pa.author_id)
        bucket["papers"][pa.paper.id] = pa.paper
        if pa.paper.published_at and pa.paper.published_at >= cutoff_30d:
            bucket["papers_30d"].add(pa.paper.id)

    entries = []
    for org_id, b in by_org.items():
        papers = list(b["papers"].values())
        paper_count = len(b["paper_ids"])
        if paper_count == 0:
            continue
        avg_impact = sum(p.composite_score or 0 for p in papers) / paper_count
        total_citations = sum(p.citation_count or 0 for p in papers)
        top_papers = sorted(papers, key=lambda p: p.composite_score or 0, reverse=True)[:3]
        entries.append({
            "org": b["org"], "paper_count": paper_count, "author_count": len(b["author_ids"]),
            "avg_impact_score": round(avg_impact, 2), "total_citations": total_citations,
            "papers_30d": len(b["papers_30d"]), "top_papers": top_papers,
        })

    if not entries:
        return {"data": [], "generated_at": now.isoformat()}

    max_papers = max(e["paper_count"] for e in entries)
    max_impact = max(e["avg_impact_score"] for e in entries)
    max_momentum = max(e["papers_30d"] for e in entries) or 1

    out = []
    for e in entries:
        output_norm = _normalize(e["paper_count"], 0, max_papers)
        impact_norm = _normalize(e["avg_impact_score"], 0, max_impact)
        momentum_norm = _normalize(e["papers_30d"], 0, max_momentum)
        composite = round(output_norm * 0.4 + impact_norm * 0.4 + momentum_norm * 0.2, 2)
        org = e["org"]
        out.append({
            "org": {"id": str(org.id), "name": org.name, "org_type": org.org_type, "country": org.country},
            "paper_count": e["paper_count"],
            "author_count": e["author_count"],
            "avg_impact_score": e["avg_impact_score"],
            "total_citations": e["total_citations"],
            "papers_30d": e["papers_30d"],
            "output_score": round(output_norm, 1),
            "impact_score": round(impact_norm, 1),
            "momentum_score": round(momentum_norm, 1),
            "composite_score": composite,
            "top_papers": [{"id": str(p.id), "arxiv_id": p.arxiv_id, "title": p.title} for p in e["top_papers"]],
        })

    out.sort(key=lambda x: x["composite_score"], reverse=True)
    return {"data": out[:limit], "generated_at": now.isoformat()}
