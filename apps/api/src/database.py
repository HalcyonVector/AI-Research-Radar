"""SQLAlchemy engine + session management."""
from collections.abc import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from src.config import settings

engine = create_engine(
    settings.sqlalchemy_url,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    future=True,
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


def is_up() -> bool:
    """A real round-trip to Postgres, not just a config/pool check.

    Supabase's free tier auto-pauses a project after 7 days with no API
    activity -- independent of whatever keeps the Render dyno itself awake.
    /health previously only checked Redis, so the keep-warm cron could ping
    it successfully forever while Supabase silently paused underneath it.
    This gives /health (and therefore the cron) a real DB touch each time.
    """
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def session_scope() -> Session:
    """For workers/scripts: caller is responsible for commit/close."""
    return SessionLocal()
