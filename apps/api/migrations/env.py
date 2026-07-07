from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context

from src.config import settings
from src.database import Base
import src.models  # noqa: F401 — register all tables

config = context.config
# configparser treats "%" as interpolation syntax, so a percent-encoded password
# (e.g. from a URL-escaped special character) must have its "%" doubled to "%%"
# before being handed to set_main_option, or configparser raises
# "invalid interpolation syntax". Doubling round-trips correctly on read.
config.set_main_option("sqlalchemy.url", settings.sqlalchemy_url.replace("%", "%%"))
if config.config_file_name:
    fileConfig(config.config_file_name)
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    context.configure(url=settings.sqlalchemy_url, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    cfg = config.get_section(config.config_ini_section) or {}
    cfg["sqlalchemy.url"] = settings.sqlalchemy_url
    connectable = engine_from_config(cfg, prefix="sqlalchemy.", poolclass=pool.NullPool)
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
