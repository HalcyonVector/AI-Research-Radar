"""ORM -> dict serializers matching the API contract (spec 4.2)."""
from src.models import Paper


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


def paper_detail(p: Paper) -> dict:
    d = paper_list_item(p)
    d.update({
        "abstract": p.abstract,
        "pdf_url": p.pdf_url,
        "html_url": p.html_url,
        "ai_summary": p.ai_summary,
    })
    return d


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
