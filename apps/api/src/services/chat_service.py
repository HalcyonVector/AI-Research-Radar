"""Grounded per-paper chat service (feature: paper chat)."""
from sqlalchemy.orm import Session

from src.models import Paper
from src.services import paper_service
from src.ai import llm


def _truncate(text: str | None, n: int = 1200) -> str:
    return (text or "")[:n]


def answer(db: Session, paper_id: str, question: str, history: list[dict] | None = None) -> dict | None:
    """Answer a question grounded only in the paper + related papers context."""
    paper = db.get(Paper, paper_id)
    if not paper:
        return None

    related = paper_service.related_papers(db, paper_id, limit=5)

    # Build grounded context: the paper itself + related papers.
    context_parts = [
        f"[PAPER] {paper.title}\n{_truncate(paper.abstract)}",
    ]
    sources = [
        {"id": str(paper.id), "title": paper.title, "arxiv_id": paper.arxiv_id},
    ]
    for r in related:
        context_parts.append(f"[RELATED] {r['title']}\n{_truncate(r.get('abstract_snippet'))}")
        sources.append({"id": r["id"], "title": r["title"], "arxiv_id": r.get("arxiv_id")})

    context = "\n\n".join(context_parts)

    history_str = ""
    if history:
        history_str = "\n".join(
            f"{h.get('role', 'user')}: {h.get('content', '')}" for h in history[-6:]
        )

    prompt = (
        "You are a research assistant. Answer ONLY from the provided paper context below. "
        "Cite paper titles you rely on. If the answer is not in the context, say you don't know.\n\n"
        f"=== PAPER CONTEXT ===\n{context}\n=== END CONTEXT ===\n\n"
        + (f"Conversation so far:\n{history_str}\n\n" if history_str else "")
        + f"Question: {question}\n\nAnswer:"
    )

    try:
        text = llm.complete(prompt, json_mode=False).strip()
    except Exception as exc:  # fail gracefully
        text = f"Unable to generate an answer right now ({exc})."

    return {"answer": text, "sources": sources}
