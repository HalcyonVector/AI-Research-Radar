"""search indexes: HNSW for paper vectors, trigram for model/repo names

idx_papers_embedding was IVFFlat (lists=100), built when the table had almost
no embeddings. IVFFlat centroids are fixed at build time and the default
ivfflat.probes=1 scans one list out of 100, so vector search silently missed
most papers. HNSW needs no training data and stays accurate as rows are added.

Model and repo search use name ILIKE '%q%', a sequential scan over ~54K models
on every keystroke; pg_trgm GIN indexes serve those patterns directly.

Revision ID: 0007
Revises: 0006
Create Date: 2026-11-02
"""
from alembic import op

revision = "0007"
down_revision = "0006"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")
    op.execute("DROP INDEX IF EXISTS idx_papers_embedding")
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_papers_embedding_hnsw ON papers "
        "USING hnsw (abstract_embedding vector_cosine_ops)"
    )
    op.execute("CREATE INDEX IF NOT EXISTS idx_models_name_trgm ON models USING gin (name gin_trgm_ops)")
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_repositories_name_trgm ON repositories USING gin (name gin_trgm_ops)"
    )


def downgrade():
    op.execute("DROP INDEX IF EXISTS idx_repositories_name_trgm")
    op.execute("DROP INDEX IF EXISTS idx_models_name_trgm")
    op.execute("DROP INDEX IF EXISTS idx_papers_embedding_hnsw")
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_papers_embedding ON papers "
        "USING ivfflat (abstract_embedding vector_cosine_ops) WITH (lists = 100)"
    )
