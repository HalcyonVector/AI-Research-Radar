"""Kick off a deep GitHub repo crawl (expand the tracked set past its ~120-repo plateau).

Run inside the api container:
    docker compose exec -e PYTHONPATH=/app api python /repo/infra/scripts/expand_repos.py 500

Args: [target_per_query=500]

The recurring `workers.ingestion.github.run` task only ever looks at page 1
(top ~40 by stars) of 3 narrow search queries, so it plateaus fast — that's
why the repo count stalls regardless of uptime. This enqueues `crawl()`,
which paginates every query (light-run queries + several broader ones) up to
GitHub Search API's 1000-result-per-query ceiling, respecting its stricter
rate limit (30 req/min authenticated, 10/min unauthenticated — set
GITHUB_TOKEN in .env to get the faster limit). Idempotent — safe to re-run.

On a CELERY_EAGER deployment (no separate worker, e.g. Render free tier), this
runs synchronously in whatever process invokes it — run it as a one-off
shell/job against the API container, not as part of a web request.
"""
import sys
from src.workers.ingestion.github import crawl


def main() -> None:
    target = int(sys.argv[1]) if len(sys.argv) > 1 else 500
    r = crawl.delay(target)
    print(f"enqueued GitHub crawl: target_per_query={target} task_id={r.id}")
    print("Runs on worker-ingestion. Each query paginates until it hits the target")
    print("or GitHub's 1000-result-per-query cap, whichever comes first.")
    print("Watch: docker compose logs -f worker-ingestion")


if __name__ == "__main__":
    main()
