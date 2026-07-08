"""Hidden Collaboration clusters via community detection (spec 1.4.8.7)."""
from collections import defaultdict
from datetime import datetime, timezone
import networkx as nx
from sqlalchemy import select, func
from src.celery_app import celery_app
from src.database import session_scope
from src.models import Paper, PaperAuthor, Author
from src.models.intelligence.collaboration_cluster import CollaborationCluster
from src.models.intelligence.paper_concept_composition import PaperConceptComposition


def _dominant_concept(db, paper_ids: set) -> str | None:
    """Best-represented PaperConceptComposition.concept across a cluster's
    papers, weighted by each paper's concept weight."""
    if not paper_ids:
        return None
    row = db.execute(select(PaperConceptComposition.concept, func.sum(PaperConceptComposition.weight))
                     .where(PaperConceptComposition.paper_id.in_(paper_ids))
                     .group_by(PaperConceptComposition.concept)
                     .order_by(func.sum(PaperConceptComposition.weight).desc())
                     .limit(1)).first()
    return row[0] if row else None


@celery_app.task(name="workers.intelligence.collaboration.detect_collaboration_clusters")
def detect_collaboration_clusters():
    db = session_scope()
    try:
        paper_ids = db.execute(select(Paper.id).limit(3000)).scalars().all()
        # batch-fetch paper->author and author->org instead of a db.get() per
        # author inside a per-paper loop (was thousands of sequential queries)
        pa_rows = db.execute(select(PaperAuthor.paper_id, PaperAuthor.author_id)
                             .where(PaperAuthor.paper_id.in_(paper_ids))).all()
        author_ids = {row.author_id for row in pa_rows}
        org_by_author = dict(db.execute(select(Author.id, Author.primary_org_id)
                                        .where(Author.id.in_(author_ids),
                                               Author.primary_org_id.isnot(None))).all())
        paper_orgs: dict = defaultdict(set)
        for row in pa_rows:
            org_id = org_by_author.get(row.author_id)
            if org_id:
                paper_orgs[row.paper_id].add(org_id)

        G = nx.Graph()
        org_papers: dict = defaultdict(set)
        for pid, orgs in paper_orgs.items():
            for org_id in orgs:
                org_papers[org_id].add(pid)
            orgs = list(orgs)
            for i in range(len(orgs)):
                for j in range(i + 1, len(orgs)):
                    if G.has_edge(orgs[i], orgs[j]):
                        G[orgs[i]][orgs[j]]["weight"] += 1
                    else:
                        G.add_edge(orgs[i], orgs[j], weight=1)
        if G.number_of_edges() == 0:
            return {"clusters": 0, "note": "no org co-authorship edges yet"}
        try:
            import community as community_louvain
            partition = community_louvain.best_partition(G, weight="weight")
        except Exception:
            partition = {n: i for i, comp in enumerate(nx.connected_components(G)) for n in comp}
        clusters: dict = {}
        for node, cid in partition.items():
            clusters.setdefault(cid, []).append(node)
        db.execute(CollaborationCluster.__table__.delete())
        made = 0
        for cid, members in clusters.items():
            if len(members) < 2:
                continue
            sub = G.subgraph(members)
            density = nx.density(sub)
            cluster_papers = set().union(*(org_papers[m] for m in members))
            db.add(CollaborationCluster(member_org_ids=list(members), cohesion_score=round(density, 3),
                   formed_around_concept=_dominant_concept(db, cluster_papers),
                   is_active=True, last_updated_at=datetime.now(timezone.utc)))
            made += 1
        db.commit()
        return {"clusters": made}
    finally:
        db.close()
