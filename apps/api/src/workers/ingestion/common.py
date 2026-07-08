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


# Ordered keyword-based overrides, evaluated before raw tag-overlap scoring.
# Each entry is (category_slug, required_tags, keywords): the category only
# fires if at least one required tag is present in the paper AND at least
# one keyword matches the title+abstract text.
#
# Two things forced these onto keywords instead of tag arithmetic:
#
# 1. No dedicated arXiv category exists at all (MCP is a 2024+ protocol;
#    "evaluation" and "synthetic data" are cross-cutting techniques, not
#    arXiv subfields) — each of these shares an *identical* arxiv_categories
#    set with a sibling that would otherwise always win ties by display
#    order (mcp-ecosystem == coding-agents == {cs.SE, cs.AI}; synthetic-data
#    == reinforcement-learning == {cs.LG}; evaluation-frameworks ==
#    reasoning-models == {cs.AI, cs.LG}).
#
# 2. AI Agents vs. Multi-Agent Systems: cs.MA is a real, specific arXiv tag,
#    but tag-count scoring alone can't split this pair correctly either
#    direction. An early attempt let Multi-Agent Systems win via a plain
#    tag-subset override whenever cs.MA was present - checked against
#    production data, papers tagged cs.MA (with or without cs.AI) turn out
#    to *overwhelmingly* discuss multi-agent themes in their abstract even
#    when their title doesn't - authors choose cs.MA deliberately, so
#    "cs.MA present but no multi-agent keyword" is rare, not the common
#    case that override was designed around. That left AI Agents with
#    ~zero papers: there's no meaningful "spillover" from the Multi-Agent
#    Systems pool to reclaim. AI Agents needs its own positive signal
#    instead - general agent/tool-use language - and has to compete for the
#    cs.AI-tagged pool the same way, since cs.AI alone is arXiv's generic
#    catch-all and previously always resolved to whichever category came
#    first in the tie-break (Reasoning Models), starving AI Agents from
#    that path too.
#
# Order matters: multi-agent-systems and the no-tag categories are checked
# before ai-agents, so a paper that also uses agent language (nearly all
# multi-agent papers do) isn't stolen by the broader, generic-cs.AI bucket.
KEYWORD_OVERRIDES: list[tuple[str, list[str], list[str]]] = [
    ("multi-agent-systems", ["cs.MA"], [
        "multi-agent", "multi agent", "multiagent", "multiple agents",
        "agent coordination", "cooperative agents", "competing agents",
        "swarm of agents", "decentralized agents", "collaborative agents",
    ]),
    ("mcp-ecosystem", ["cs.AI", "cs.SE"], [
        # no bare "mcp" - too fragile as a standalone token (false-positives
        # on any incidental appearance of the substring); every phrase here
        # is specific enough that a false match would be very unlikely.
        "model context protocol", "mcp server", "mcp client", "mcp tool",
        "mcp-based", "tool-calling protocol",
    ]),
    ("reinforcement-learning", ["cs.LG"], [
        "reinforcement learning", "policy gradient", "reward model",
        "q-learning", "actor-critic", "rlhf", "proximal policy optimization",
        "markov decision process", "reward shaping",
    ]),
    ("synthetic-data", ["cs.LG"], [
        "synthetic data", "synthetic dataset", "synthetic datasets",
        "data synthesis", "synthetically generated",
    ]),
    ("evaluation-frameworks", ["cs.AI", "cs.LG"], [
        "evaluation framework", "evaluation benchmark", "benchmark suite",
        "evaluation protocol", "evaluation methodology", "evaluation suite",
    ]),
    ("ai-agents", ["cs.AI"], [
        "llm agent", "autonomous agent", "ai agent", "agentic workflow",
        "agentic system", "tool-use agent", "tool-calling agent",
        "function-calling agent", "react agent", "planning agent",
        "conversational agent", "agent framework", "tool-augmented agent",
    ]),
]


def category_for_arxiv(
    db: Session, arxiv_cats: list[str], title: str = "", abstract: str = ""
) -> ResearchCategory | None:
    """Map a paper's arXiv categories to the best-matching research category.

    Checks KEYWORD_OVERRIDES first, in order (see its docstring for why six
    of our fifteen categories need title/abstract text rather than tags
    alone to be reachable at all). Falls back to pure tag-overlap scoring
    for everything else: pick the category whose arxiv_categories overlaps
    the *paper's* tags the most (so a paper tagged both cs.CV and cs.CL
    lands in Multimodal AI, not whichever single-domain category happens to
    be listed first), tie-broken toward the more specific (fewer total
    tags) category, then by the category's stable display order.
    """
    cats = db.execute(select(ResearchCategory).order_by(ResearchCategory.display_order)).scalars().all()
    if not cats:
        return None
    by_slug = {c.slug: c for c in cats}
    paper_tags = set(arxiv_cats)

    text = f"{title} {abstract}".lower()
    if text.strip():
        for slug, required_tags, keywords in KEYWORD_OVERRIDES:
            cat = by_slug.get(slug)
            if not cat:
                continue
            if not (paper_tags & set(required_tags)):
                continue
            if any(kw in text for kw in keywords):
                return cat

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
