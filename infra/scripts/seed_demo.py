"""Seed realistic demo data so every page renders without live ingestion.
Usage: python infra/scripts/seed_demo.py
Generates categories, orgs, authors, papers (+random embeddings), models, repos,
citations, trend snapshots, intelligence scores, DNA, narratives, frontier predictions.
"""
import sys, pathlib, random, uuid
from datetime import datetime, timedelta, timezone, date
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2] / "apps" / "api"))

from src.database import session_scope
from src.config import settings
from src.models import (Paper, Author, Organization, ResearchCategory, PaperAuthor, PaperCategory,
                        Model, Repository, Citation, TrendSnapshot, KnowledgeGraphEdge, WeeklyReport)
from src.models.intelligence.paper_concept_composition import PaperConceptComposition
from src.models.intelligence.paper_intelligence_scores import PaperIntelligenceScores
from src.models.intelligence.frontier_prediction import FrontierPrediction
from src.models.intelligence.research_narrative import ResearchNarrative
from src.ai.vocabulary import CONCEPT_VOCABULARY
from src.utils.text import normalize_name
from sqlalchemy import select

random.seed(42)
ORGS = ["Google DeepMind", "OpenAI", "Anthropic", "Meta AI", "Stanford", "MIT", "Berkeley",
        "Microsoft Research", "NVIDIA", "Alibaba", "Mistral AI", "Cohere"]
TITLE_BITS = [
    "Scaling {} with Mixture-of-Experts", "Efficient {} via Retrieval Augmentation",
    "{}: A Reasoning-First Approach", "Self-Improving {} Agents", "Verified Tool Use for {}",
    "Distilling {} into Small Models", "{} at Trillion-Token Scale", "Test-Time Compute for {}",
    "Open Foundations for {}", "Benchmarking {} in the Wild",
]
TOPICS = ["Language Models", "Diffusion", "Agents", "Robotics", "Multimodal Perception",
          "Speech Synthesis", "Code Generation", "RAG Pipelines", "World Models", "Alignment"]


def _emb():
    return [random.gauss(0, 1) for _ in range(settings.embedding_dim)]


def main(n_papers=60):
    db = session_scope()
    try:
        cats = db.execute(select(ResearchCategory)).scalars().all()
        if not cats:
            print("Run seed_categories.py first."); return
        if db.query(Paper).count() > 0:
            print("Demo data already present — skipping. To reseed from scratch, "
                  "run `docker compose down -v` then `up -d --build` and seed again.")
            return
        orgs = []
        for name in ORGS:
            o = db.execute(select(Organization).where(Organization.name_normalized == normalize_name(name))).scalar_one_or_none()
            if not o:
                o = Organization(name=name, name_normalized=normalize_name(name),
                                 org_type="company" if name not in ("Stanford", "MIT", "Berkeley") else "university",
                                 paper_count=random.randint(5, 50))
                db.add(o); db.flush()
            orgs.append(o)
        authors = []
        for i in range(40):
            nm = f"Researcher {i+1}"
            a = db.execute(select(Author).where(Author.name_normalized == normalize_name(nm))).scalar_one_or_none()
            if not a:
                a = Author(name=nm, name_normalized=normalize_name(nm), primary_org_id=random.choice(orgs).id,
                           paper_count=random.randint(1, 20))
                db.add(a); db.flush()
            authors.append(a)

        papers = []
        for i in range(n_papers):
            topic = random.choice(TOPICS)
            title = random.choice(TITLE_BITS).format(topic)
            cat = random.choice(cats)
            pub = datetime.now(timezone.utc) - timedelta(days=random.randint(1, 120))
            p = Paper(arxiv_id=f"25{random.randint(1,9):02d}.{random.randint(10000,99999)}",
                      title=title, abstract=f"We study {topic.lower()} and introduce a method that improves "
                      f"efficiency and generalization. {title}. Our approach combines retrieval, reasoning, and "
                      f"scalable training to advance the state of the art.",
                      abstract_embedding=_emb(), published_at=pub, source="arxiv",
                      primary_category_id=cat.id, citation_count=random.randint(0, 300),
                      github_impl_count=random.randint(0, 25), hf_model_count=random.randint(0, 8),
                      social_mentions=random.randint(0, 120))
            imp = min(p.citation_count / 3, 100); mom = random.uniform(20, 95); inn = random.uniform(30, 90)
            p.impact_score = round(imp, 1); p.momentum_score = round(mom, 1)
            p.innovation_score = round(inn, 1)
            p.composite_score = round(imp*0.4 + mom*0.35 + inn*0.25, 1)
            if random.random() < 0.7:
                p.ai_summary = {
                    "core_contribution": f"Introduces a scalable method for {topic.lower()}.",
                    "key_innovation": "Combines retrieval with reasoning at inference time.",
                    "problem_solved": f"High cost and brittleness in {topic.lower()}.",
                    "practical_applications": ["Production inference", "Research prototyping", "Fine-tuning"],
                    "limitations": ["Evaluated on limited benchmarks", "Compute-heavy training"],
                    "significance": random.choice(["medium", "high", "breakthrough"]),
                    "significance_rationale": "Demonstrates clear gains over strong baselines across tasks.",
                    "related_concepts": random.sample(CONCEPT_VOCABULARY, 3),
                }
                p.ai_summary_generated_at = datetime.now(timezone.utc); p.ai_summary_model = "demo"
            db.add(p); db.flush()
            for pos, a in enumerate(random.sample(authors, random.randint(2, 5))):
                db.add(PaperAuthor(paper_id=p.id, author_id=a.id, position=pos + 1))
            db.add(PaperCategory(paper_id=p.id, category_id=cat.id, is_primary=True))
            # DNA
            for concept, w in zip(random.sample(CONCEPT_VOCABULARY, 3), [50, 30, 20]):
                db.add(PaperConceptComposition(paper_id=p.id, concept=concept, weight=w,
                       rationale=f"Uses {concept.lower()} as a core mechanism.", model_used="demo"))
            papers.append(p)
        db.flush()

        # citations (forward links)
        for p in papers:
            for target in random.sample(papers, random.randint(0, 4)):
                if target.id != p.id and target.published_at < p.published_at:
                    ex = db.execute(select(Citation).where(Citation.citing_paper_id == p.id,
                                    Citation.cited_paper_id == target.id)).scalar_one_or_none()
                    if not ex:
                        db.add(Citation(citing_paper_id=p.id, cited_paper_id=target.id, source="demo"))

        # intelligence scores
        for p in papers:
            eb = round(random.uniform(0, 95), 1) if p.citation_count <= 150 else 0.0
            driver = random.choice(["implementations", "discussion", "citations", "hf_models"])
            db.add(PaperIntelligenceScores(paper_id=p.id, emerging_breakthrough_score=eb,
                   breakthrough_driver=driver if eb > 0 else None, influence_score=round(random.uniform(20, 90), 1),
                   influence_components={"citation_velocity": 0.6, "implementations": p.github_impl_count},
                   ai_rationale=(f"Low citations ({p.citation_count}) but {driver} +{random.randint(120,400)}% this month."
                                 if eb > 0 else None)))

        # models & repos
        for i in range(20):
            org = random.choice(orgs)
            m = Model(hf_model_id=f"{normalize_name(org.name).replace(' ','-')}/model-{i}", name=f"Model-{i}",
                      model_type=random.choice(["text-generation", "image-classification", "automatic-speech-recognition"]),
                      downloads_total=random.randint(1000, 5_000_000), downloads_7d=random.randint(100, 400000),
                      likes=random.randint(0, 3000), growth_score=round(random.uniform(10, 95), 1),
                      popularity_score=round(random.uniform(20, 99), 1),
                      linked_paper_id=random.choice(papers).id if random.random() < 0.5 else None)
            db.add(m)
        for i in range(20):
            p = random.choice(papers)
            db.add(Repository(github_full_name=f"org{i}/repo-{i}", name=f"repo-{i}", url=f"https://github.com/org{i}/repo-{i}",
                   stars=random.randint(30, 40000), forks=random.randint(1, 5000), primary_language="Python",
                   is_research_impl=True, linked_paper_id=p.id))

        # trend snapshots (8 weeks history per category)
        for c in cats:
            base = random.uniform(20, 60)
            for w in range(8):
                d = date.today() - timedelta(days=(7 - w) * 7)
                g = round(base + random.uniform(-15, 25) + w * 2, 1)
                db.add(TrendSnapshot(category_id=c.id, snapshot_date=d, period="weekly",
                       paper_count=random.randint(20, 400), model_count=random.randint(5, 60),
                       growth_score=g, momentum_score=round(g * 0.9, 1),
                       activity_score=round(random.uniform(40, 90), 1), adoption_score=round(random.uniform(30, 80), 1),
                       top_paper_ids=[pp.id for pp in random.sample(papers, 3)]))
            db.add(FrontierPrediction(category_id=c.id, explosion_probability=round(random.uniform(0.2, 0.9), 3),
                   horizon_weeks=24, model_version="demo",
                   top_contributing_signals=[{"signal": "submission_velocity", "weight": 0.4},
                                             {"signal": "momentum", "weight": 0.3},
                                             {"signal": "github_growth", "weight": 0.2}]))

        # narrative
        top = sorted(papers, key=lambda x: x.composite_score, reverse=True)[:3]
        db.add(ResearchNarrative(scope="global", scope_ref=None,
               period_start=date.today() - timedelta(days=180), period_end=date.today(),
               narrative_text=(f"The last six months have seen a shift toward agentic workflows, "
                               f"beginning with [[paper:{top[0].id}]] and accelerating as tool-use benchmarks "
                               f"favored multi-step agents. Today these approaches dominate new implementations."),
               referenced_entities=[top[0].id], model_used="demo"))

        # weekly report
        ws = date.today() - timedelta(days=date.today().weekday())
        if not db.execute(select(WeeklyReport).where(WeeklyReport.week_start == ws)).scalar_one_or_none():
            bj = {"this_week_in_numbers": f"{len(papers)} papers, 20 models tracked.",
                  "big_stories": [{"title": top[0].title, "body": "A notable release this week."}],
                  "emerging_signals": "AI Agents and Reasoning Models moved most.",
                  "papers_worth_your_time": [p.title for p in top],
                  "model_releases": ["Model-0 — fast open model"], "what_to_watch": "Agentic RAG accelerating."}
            db.add(WeeklyReport(week_start=ws, week_end=ws + timedelta(days=6), total_papers=len(papers),
                   total_models=20, briefing_json=bj, briefing_md="## This Week\n\n" + bj["this_week_in_numbers"],
                   generated_at=datetime.now(timezone.utc), model_used="demo", is_published=True,
                   published_at=datetime.now(timezone.utc)))

        db.commit()
        print(f"Demo seed complete: {len(papers)} papers, 20 models, 20 repos, {len(cats)} categories.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
