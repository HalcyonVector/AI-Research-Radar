"""QA the AI-generated model/repo summary cards.

Run inside the api container:
    docker compose exec -e PYTHONPATH=/app api python /repo/infra/scripts/qa_summaries.py
    docker compose exec -e PYTHONPATH=/app api python /repo/infra/scripts/qa_summaries.py --fix

Checks every summarized model + repo for:
  - missing required fields
  - thin fields (empty lists, or string values shorter than MIN_LEN chars)
Prints a report and a few example offenders. With --fix it clears the flagged
rows' ai_summary and re-enqueues them so the worker regenerates a fresh card.
"""
import sys
from sqlalchemy import select
from src.database import session_scope
from src.models import Model, Repository

MIN_LEN = 15
MODEL_REQUIRED = {"what_it_is", "capabilities", "use_cases", "notable"}
REPO_REQUIRED = {"what_it_does", "key_features", "use_cases", "notable"}


def _is_thin(summary: dict, required: set) -> str | None:
    # A card is only useless if it lacks a real description or has no use cases.
    # 'notable' is allowed to be empty by the prompt; capabilities/features are
    # secondary, so we don't fail a card on those.
    if not isinstance(summary, dict):
        return "not-an-object"
    missing = required - set(summary.keys())
    if missing:
        return f"missing:{','.join(sorted(missing))}"
    what_key = "what_it_is" if "what_it_is" in required else "what_it_does"
    what = summary.get(what_key)
    if not isinstance(what, str) or len(what.strip()) < MIN_LEN:
        return f"thin:{what_key}"
    uc = summary.get("use_cases")
    if not isinstance(uc, (list, tuple)) or len(uc) == 0:
        return "empty:use_cases"
    return None


def _audit(db, Entity, id_attr, required, label, fix):
    rows = db.execute(select(Entity).where(Entity.ai_summary.isnot(None))).scalars().all()
    total = len(rows)
    flagged = []
    for r in rows:
        reason = _is_thin(r.ai_summary, required)
        if reason:
            flagged.append((r, reason))
    print(f"\n{label}: {total} summarized, {len(flagged)} flagged "
          f"({round(100*len(flagged)/max(total,1),1)}%)")
    for r, reason in flagged[:8]:
        print(f"   - {getattr(r, id_attr)}  [{reason}]")
    if fix and flagged:
        from src.workers.ai.model_summary import generate as gen_model
        from src.workers.ai.repo_summary import generate as gen_repo
        gen = gen_model if Entity is Model else gen_repo
        for r, _ in flagged:
            r.ai_summary = None
            db.commit()
            gen.delay(str(r.id))
        print(f"   -> re-queued {len(flagged)} {label.lower()} for regeneration")
    return total, len(flagged)


def main():
    fix = "--fix" in sys.argv
    db = session_scope()
    try:
        mt, mf = _audit(db, Model, "hf_model_id", MODEL_REQUIRED, "Models", fix)
        rt, rf = _audit(db, Repository, "github_full_name", REPO_REQUIRED, "Repos", fix)
    finally:
        db.close()
    print(f"\nTOTAL flagged: {mf + rf} / {mt + rt}")
    if not fix and (mf + rf):
        print("Re-run with --fix to regenerate the flagged cards.")


if __name__ == "__main__":
    main()
