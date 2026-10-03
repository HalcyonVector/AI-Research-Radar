"""Entry point for running ONE Celery task in its own throwaway OS process.

    python -m src.workers.run_job <celery task name> '<json kwargs>'

Why this exists: under CELERY_EAGER=true every /internal/* job used to run
inside the same long-lived 512MB web process that serves HTTP. Python (and
glibc malloc) rarely hand freed memory back to the OS, so each heavy job
ratcheted the web process's RSS up a little more, and Render restarts the
instance ("exceeded its memory limit") the first time a request pushes it over.
gc.collect() between jobs cannot fix that -- it frees objects, not RSS.

A child process gets a clean heap and returns *all* of it to the OS when it
exits, so the web process never carries job memory at all. A self-imposed RSS
ceiling (below) makes a runaway job kill only itself, with a clear log line,
instead of taking the whole instance (and the API with it) down.
"""
import gc
import importlib
import json
import os
import sys
import threading
import time

# Leave headroom for the web process (~150-200MB) inside Render's 512MB.
RSS_LIMIT_MB = int(os.environ.get("JOB_RSS_LIMIT_MB", "260"))


def _rss_mb() -> float:
    try:
        with open("/proc/self/statm") as f:
            return int(f.read().split()[1]) * os.sysconf("SC_PAGE_SIZE") / 1024 / 1024
    except Exception:
        return 0.0  # non-Linux (local dev): watchdog is a no-op


def _watchdog() -> None:
    while True:
        time.sleep(1.0)
        rss = _rss_mb()
        if rss > RSS_LIMIT_MB:
            print(f"[run_job] ABORT: RSS {rss:.0f}MB exceeded {RSS_LIMIT_MB}MB ceiling "
                  "-- killing this job only so the web process survives", flush=True)
            os._exit(137)


def main() -> int:
    name = sys.argv[1]
    kwargs = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}
    threading.Thread(target=_watchdog, daemon=True).start()

    from src.celery_app import celery_app, TASK_MODULES
    for m in TASK_MODULES:
        importlib.import_module(m)
    task = celery_app.tasks[name]
    print(f"[run_job] start {name} {kwargs} rss={_rss_mb():.0f}MB", flush=True)
    result = task.run(**kwargs)  # call the function directly so errors propagate
    gc.collect()
    print(f"[run_job] done {name} -> {result!r} peak-ish rss={_rss_mb():.0f}MB", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
