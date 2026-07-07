"""Hidden Collaboration clusters via community detection (spec 1.4.8.7)."""
from datetime import datetime, timezone
import networkx as nx
from sqlalchemy import select
from src.celery_app import celery_app
from src.database import session_scope
from src.models import Paper, PaperAuthor, Author
from src.models.intelligence.collaboration_cluster import CollaborationCluster


@celery_app.task(name="workers.intelligence.collaboration.detect_collaboration_clusters")
def detect_collaboration_clusters():
    db = session_scope()
    try:
        G = nx.Graph()
        papers = db.execute(select(Paper).limit(3000)).scalars().all()
        for p in papers:
            orgs = set()
            for pa in db.execute(select(PaperAuthor).where(PaperAuthor.paper_id == p.id)).scalars().all():
                a = db.get(Author, pa.author_id)
                if a and a.primary_org_id:
                    orgs.add(a.primary_org_id)
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
            db.add(CollaborationCluster(member_org_ids=list(members), cohesion_score=round(density, 3),
                   is_active=True, last_updated_at=datetime.now(timezone.utc)))
            made += 1
        db.commit()
        return {"clusters": made}
    finally:
        db.close()
