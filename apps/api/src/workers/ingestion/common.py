"""Shared ingestion helpers."""
from sqlalchemy import select
from sqlalchemy.orm import Session
from src.models import Author, Organization, ResearchCategory
from src.utils.text import normalize_name


def get_or_create_author(db: Session, name: str) -> Author:
    norm = normalize_name(name)
    a = db.execute(select(Author).where(Author.name_normalized == norm)).scalar_one_or_none()
    if not a:
        a = Author(name=name.strip(), name_normalized=norm)
        db.add(a)
        db.flush()
    return a


def get_or_create_org(db: Session, name: str) -> Organization:
    norm = normalize_name(name)
    o = db.execute(select(Organization).where(Organization.name_normalized == norm)).scalar_one_or_none()
    if not o:
        o = Organization(name=name.strip(), name_normalized=norm)
        db.add(o)
        db.flush()
    return o


def category_for_arxiv(db: Session, arxiv_cats: list[str]) -> ResearchCategory | None:
    """Map a paper's arXiv categories to the best-matching research category.

    Several of our categories deliberately share an arXiv tag with a broader
    sibling (e.g. multi-agent-systems and ai-agents both claim cs.MA;
    multimodal-ai and computer-vision/llms both claim cs.CV/cs.CL). The naive
    "first category found, in table order" approach meant the broader sibling
    always won — multi-agent-systems and multimodal-ai could never be assigned
    as anyone's primary category, no matter how many matching papers existed.
    Instead, pick the category whose arxiv_categories overlaps the *paper's*
    tags the most (so a paper tagged both cs.CV and cs.CL lands in
    Multimodal AI, not whichever single-domain category happens to be listed
    first), tie-broken toward the more specific (fewer total tags) category,
    then by the category's stable display order.
    """
    cats = db.execute(select(ResearchCategory).order_by(ResearchCategory.display_order)).scalars().all()
    if not cats:
        return None
    paper_tags = set(arxiv_cats)
    best, best_key = None, None
    for c in cats:
        cat_tags = set(c.arxiv_categories or [])
        match_count = len(paper_tags & cat_tags)
        if match_count == 0:
            continue
        key = (match_count, -len(cat_tags))
        if best_key is None or key > best_key:
            best, best_key = c, key
    return best or cats[0]
