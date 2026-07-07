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
    """Map an arXiv category (e.g. cs.CL) to our primary research category."""
    cats = db.execute(select(ResearchCategory)).scalars().all()
    for ac in arxiv_cats:
        for c in cats:
            if ac in (c.arxiv_categories or []):
                return c
    return cats[0] if cats else None
