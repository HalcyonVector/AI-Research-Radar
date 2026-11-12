"""ORM -> dict serializers matching the API contract (spec 4.2)."""
from sqlalchemy import select
from src.models import Paper, PaperAuthor, Author, Organization


def category_ref(cat) -> dict | None:
    if not cat:
        return None
    return {"slug": cat.slug, "name": cat.name, "color": cat.color_hex}


def paper_list_item(p: Paper) -> dict:
    return {
        "id": str(p.id),
        "arxiv_id": p.arxiv_id,
        "title": p.title,
        "abstract_snippet": (p.abstract or "")[:280],
        "published_at": p.published_at,
        "primary_category": category_ref(p.primary_category),
        "authors": [
            {"id": str(pa.author.id), "name": pa.author.name}
            for pa in sorted(p.authors, key=lambda x: x.position)[:8]
        ],
        "scores": {
            "composite": p.composite_score, "impact": p.impact_score,
            "momentum": p.momentum_score, "innovation": p.innovation_score,
        },
        "metrics": {
            "citations": p.citation_count, "github_impls": p.github_impl_count,
            "hf_models": p.hf_model_count, "social_mentions": p.social_mentions,
        },
        "has_ai_summary": p.ai_summary is not None,
    }


def _first_author_org_name(db, p: Paper) -> str | None:
    # same "first author's primary org" convention as
    # workers.intelligence.propagation._org_name
    first = db.execute(select(PaperAuthor).where(PaperAuthor.paper_id == p.id)
                       .order_by(PaperAuthor.position)).scalars().first()
    if not first:
        return None
    a = db.get(Author, first.author_id)
    if not a or not a.primary_org_id:
        return None
    o = db.get(Organization, a.primary_org_id)
    return o.name if o else None


def paper_detail(db, p: Paper) -> dict:
    d = paper_list_item(p)
    d.update({
        "abstract": p.abstract,
        "pdf_url": p.pdf_url,
        "html_url": p.html_url,
        "ai_summary": p.ai_summary,
        "org_name": _first_author_org_name(db, p),
        "implementations": _implementations(db, p),
    })
    return d


def _implementations(db, p: Paper) -> list[dict]:
    """GitHub repos linked to this paper (workers.ingestion.github), most-starred first."""
    from src.models import KnowledgeGraphEdge, Repository
    repos = db.execute(
        select(Repository).join(KnowledgeGraphEdge, KnowledgeGraphEdge.source_id == Repository.id)
        .where(KnowledgeGraphEdge.source_type == "repo", KnowledgeGraphEdge.relation == "implements",
               KnowledgeGraphEdge.target_type == "paper", KnowledgeGraphEdge.target_id == p.id)
        .order_by(Repository.stars.desc()).limit(10)
    ).scalars().all()
    return [{"full_name": r.github_full_name, "url": r.url, "description": r.description,
             "stars": r.stars, "language": r.primary_language} for r in repos]


def model_item(m) -> dict:
    return {
        "id": str(m.id), "hf_model_id": m.hf_model_id, "name": m.name,
        "model_type": m.model_type, "downloads_7d": m.downloads_7d,
        "downloads_30d": m.downloads_30d,
        "downloads_total": m.downloads_total, "likes": m.likes,
        "growth_score": m.growth_score, "popularity_score": m.popularity_score,
        "linked_paper_id": str(m.linked_paper_id) if m.linked_paper_id else None,
        "has_ai_summary": m.ai_summary is not None,
    }
