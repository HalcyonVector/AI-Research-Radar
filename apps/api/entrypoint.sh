#!/usr/bin/env bash
# Entrypoint for the API (and any container that needs a ready DB).
# 1. Wait for Postgres to accept connections.
# 2. Run Alembic migrations (idempotent: alembic upgrade head).
# 3. Seed the research categories (idempotent).
# 4. exec the passed command (defaults to uvicorn via Dockerfile CMD).
set -euo pipefail

log() { echo "[entrypoint] $*"; }

# ---- 1. Wait for Postgres -------------------------------------------------
# Parse host:port out of DATABASE_URL (postgresql+psycopg://user:pass@host:port/db).
if [ -n "${DATABASE_URL:-}" ]; then
  # Strip scheme, credentials, and path to isolate host:port.
  hostport="$(echo "$DATABASE_URL" | sed -E 's#^[^@]+@##; s#/.*$##')"
  DB_HOST="${hostport%%:*}"
  DB_PORT="${hostport##*:}"
  [ "$DB_PORT" = "$DB_HOST" ] && DB_PORT=5432
else
  DB_HOST="${DB_HOST:-postgres}"
  DB_PORT="${DB_PORT:-5432}"
fi

log "waiting for postgres at ${DB_HOST}:${DB_PORT} ..."
for i in $(seq 1 60); do
  if python -c "import socket,sys; s=socket.socket(); s.settimeout(2); \
sys.exit(0) if s.connect_ex(('${DB_HOST}', ${DB_PORT}))==0 else sys.exit(1)" 2>/dev/null; then
    log "postgres is up"
    break
  fi
  sleep 2
  if [ "$i" -eq 60 ]; then
    log "ERROR: postgres not reachable after 120s"
    exit 1
  fi
done

# ---- 2. Migrations --------------------------------------------------------
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  log "running alembic migrations ..."
  alembic upgrade head
else
  log "RUN_MIGRATIONS=false -> skipping migrations"
fi

# ---- 3. Seed categories ---------------------------------------------------
# The canonical seeder lives at infra/scripts/seed_categories.py. When that
# path is mounted (docker compose) we run it; otherwise fall back to an inline
# import so the container is self-contained. Both are idempotent (upsert).
if [ "${RUN_SEED:-true}" = "true" ]; then
  log "seeding research categories ..."
  if [ -f /repo/infra/scripts/seed_categories.py ]; then
    python /repo/infra/scripts/seed_categories.py || log "seed step reported an error (continuing)"
  else
    python - <<'PYSEED' || log "inline seed failed (continuing)"
import importlib
try:
    seed = importlib.import_module("src.scripts.seed_categories")
    getattr(seed, "main", lambda: None)()
    print("[entrypoint] seeded via src.scripts.seed_categories")
except Exception as exc:  # noqa: BLE001
    print(f"[entrypoint] no in-image seeder found ({exc}); "
          "run infra/scripts/seed_categories.py manually if needed")
PYSEED
  fi
else
  log "RUN_SEED=false -> skipping seed"
fi

# ---- 4. Hand off ----------------------------------------------------------
log "starting: $*"
exec "$@"
