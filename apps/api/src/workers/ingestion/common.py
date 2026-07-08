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


# Categories whose arxiv tags are a strict *subset* of a broader sibling's,
# where the shared tag is a genuinely specific/dedicated arXiv category for
# the narrow topic (cs.MA really does mean "Multiagent Systems" in arXiv's
# own taxonomy) — the sibling always matches everything the narrow one does
# plus more, so it always wins the raw tag-overlap scoring below, even for
# papers that are specifically about the narrower sub-topic. This is the
# opposite of the *compound* case (multimodal-ai={cs.CV,cs.CL} vs
# computer-vision={cs.CV}/llms={cs.CL}), where the category requiring *more*
# simultaneous tags is correctly the more specific one and should keep
# winning via raw match count. Both are literal subset/superset tag
# relationships, so no tag-count formula resolves them the same way — this
# override list encodes which one is which.
#
# Each entry also requires a keyword hit, not just the tag subset: an early
# version of this override fired on cs.MA alone, which turned out to route
# *every* cs.AI+cs.MA paper to Multi-Agent Systems - including single-agent
# papers where cs.MA was a secondary/incidental tag - leaving AI Agents with
# zero papers (confirmed against production data). Requiring the text to
# actually discuss multi-agent coordination keeps the override narrow: it
# only overrides when the paper is genuinely about the narrower sub-topic,
# not just tagged adjacent to it.
#
# NOT included here: reasoning-models -> reinforcement-learning. cs.LG
# ("Machine Learning") is arXiv's generic catch-all, not RL-specific — arXiv
# has no dedicated RL category at all — so treating reinforcement-learning's
# single cs.LG tag as "more specific" would make it swallow every
# reasoning-models paper that also happens to carry cs.LG (i.e. nearly all
# of them, since cs.LG is reasoning-models' own second tag). Unlike cs.MA,
# a shared generic tag isn't a real specificity signal; RL is keyword-gated
# below instead, same as the categories with no dedicated tag at all.
BROADER_SIBLING_OVERRIDE: dict[str, tuple[str, list[str]]] = {
    "ai-agents": ("multi-agent-systems", [
        "multi-agent", "multi agent", "multiagent", "multiple agents",
        "agent coordination", "cooperative agents", "competing agents",
        "swarm of agents", "decentralized agents", "collaborative agents",
    ]),
}

# Categories where arXiv tags alone can't reliably identify the topic, either
# because there's no dedicated arXiv category for it at all (MCP is a 2024+
# protocol; "evaluation" and "synthetic data" are cross-cutting techniques,
# not arXiv subfields) or because the only shared tag is too generic to be a
# real specificity signal (see reinforcement-learning's note above). Each of
# these also shares an *identical* arxiv_categories set with a sibling that
# would otherwise always win ties by display order (mcp-ecosystem ==
# coding-agents == {cs.SE, cs.AI}; synthetic-data == reinforcement-learning
# == {cs.LG}; evaluation-frameworks == reasoning-models == {cs.AI, cs.LG}).
# Detected via title/abstract keywords instead, gated on at least one of the
# category's own arxiv tags still being present (so an unrelated paper that
# happens to mention e.g. "synthetic data" in passing, but carries none of
# these tags, doesn't get miscategorized).
KEYWORD_CATEGORIES: dict[str, list[str]] = {
    "mcp-ecosystem": [
        "model context protocol", "mcp server", "mcp client", "mcp tool",
        " mcp ", "tool-calling protocol",
    ],
    "reinforcement-learning": [
        "reinforcement learning", "policy gradient", "reward model",
        "q-learning", "actor-critic", "rlhf", "proximal policy optimization",
        "markov decision process", "reward shaping",
    ],
    "synthetic-data": [
        "synthetic data", "synthetic dataset", "synthetic datasets",
        "data synthesis", "synthetically generated",
    ],
    "evaluation-frameworks": [
        "evaluation framework", "evaluation benchmark", "benchmark suite",
        "evaluation protocol", "evaluation methodology", "evaluation suite",
    ],
}


def category_for_arxiv(
    db: Session, arxiv_cats: list[str], title: str = "", abstract: str = ""
) -> ResearchCategory | None:
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
    then by the category's stable display order. BROADER_SIBLING_OVERRIDE
    then fixes the subset-of-a-sibling cases that formula still gets
    backwards (only when the text also corroborates it - see its docstring),
    and KEYWORD_CATEGORIES catches the categories tag scoring can never reach
    at all (see its docstring) via title/abstract text.
    """
    cats = db.execute(select(ResearchCategory).order_by(ResearchCategory.display_order)).scalars().all()
    if not cats:
        return None
    by_slug = {c.slug: c for c in cats}
    paper_tags = set(arxiv_cats)

    text = f"{title} {abstract}".lower()
    if text.strip():
        for slug, keywords in KEYWORD_CATEGORIES.items():
            cat = by_slug.get(slug)
            if not cat:
                continue
            cat_tags = set(cat.arxiv_categories or [])
            if cat_tags & paper_tags and any(kw in text for kw in keywords):
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
    if best is None:
        return cats[0]

    override = BROADER_SIBLING_OVERRIDE.get(best.slug)
    if override:
        narrow_slug, narrow_keywords = override
        narrow = by_slug.get(narrow_slug)
        if narrow:
            narrow_tags = set(narrow.arxiv_categories or [])
            tag_ok = narrow_tags and narrow_tags <= paper_tags
            keyword_ok = any(kw in text for kw in narrow_keywords)
            if tag_ok and keyword_ok:
                return narrow
    return best
