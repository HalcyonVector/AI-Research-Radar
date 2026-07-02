"""initial schema — all tables, extensions, vector + FTS indexes, materialized views

Revision ID: 0001
Revises:
Create Date: 2026-07-03
"""
from alembic import op
from src.database import Base
from src.config import settings
import src.models  # noqa: F401

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")
    op.execute('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')

    # Create all ORM tables
    Base.metadata.create_all(bind=bind)

    dim = settings.embedding_dim
    # Vector ANN index (IVFFlat, cosine)
    op.execute(
        f"CREATE INDEX IF NOT EXISTS idx_papers_embedding ON papers "
        f"USING ivfflat (abstract_embedding vector_cosine_ops) WITH (lists = 100)"
    )
    # Full-text search index
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_papers_fts ON papers "
        "USING gin(to_tsvector('english', title || ' ' || abstract))"
    )
    op.execute("CREATE INDEX IF NOT EXISTS idx_papers_published_at ON papers(published_at DESC)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_papers_composite_score ON papers(composite_score DESC)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_citations_cited ON citations(cited_paper_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_kge_source ON knowledge_graph_edges(source_type, source_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_kge_target ON knowledge_graph_edges(target_type, target_id)")

    # Materialized views (spec 3.1)
    op.execute(
        """
        CREATE MATERIALIZED VIEW IF NOT EXISTS top_papers_mv AS
        SELECT p.id, p.arxiv_id, p.title, p.published_at,
               p.composite_score, p.impact_score, p.momentum_score, p.ai_summary,
               rc.name AS primary_category, rc.slug AS category_slug, rc.color_hex,
               COUNT(DISTINCT pa.author_id) AS author_count,
               COUNT(DISTINCT c.citing_paper_id) AS citation_count,
               COUNT(DISTINCT r.id) AS impl_count
        FROM papers p
        LEFT JOIN research_categories rc ON rc.id = p.primary_category_id
        LEFT JOIN paper_authors pa ON pa.paper_id = p.id
        LEFT JOIN citations c ON c.cited_paper_id = p.id
        LEFT JOIN repositories r ON r.linked_paper_id = p.id
        WHERE p.published_at > NOW() - INTERVAL '90 days'
        GROUP BY p.id, rc.name, rc.slug, rc.color_hex
        ORDER BY p.composite_score DESC
        """
    )
    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS top_papers_mv_id ON top_papers_mv(id)")

    op.execute(
        """
        CREATE MATERIALIZED VIEW IF NOT EXISTS category_stats_mv AS
        SELECT rc.id, rc.slug, rc.name, rc.color_hex,
               COUNT(DISTINCT pc.paper_id) FILTER (WHERE p.published_at > NOW() - INTERVAL '7 days') AS papers_7d,
               COUNT(DISTINCT pc.paper_id) FILTER (WHERE p.published_at > NOW() - INTERVAL '30 days') AS papers_30d,
               ts.growth_score, ts.momentum_score, ts.activity_score
        FROM research_categories rc
        LEFT JOIN paper_categories pc ON pc.category_id = rc.id
        LEFT JOIN papers p ON p.id = pc.paper_id
        LEFT JOIN LATERAL (
            SELECT growth_score, momentum_score, activity_score
            FROM trend_snapshots ts2
            WHERE ts2.category_id = rc.id AND ts2.period = 'weekly'
            ORDER BY ts2.snapshot_date DESC LIMIT 1
        ) ts ON true
        GROUP BY rc.id, rc.slug, rc.name, rc.color_hex, ts.growth_score, ts.momentum_score, ts.activity_score
        """
    )
    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS category_stats_mv_id ON category_stats_mv(id)")


def downgrade() -> None:
    op.execute("DROP MATERIALIZED VIEW IF EXISTS category_stats_mv")
    op.execute("DROP MATERIALIZED VIEW IF EXISTS top_papers_mv")
    Base.metadata.drop_all(bind=op.get_bind())
