"""Explicit cleanup after a heavy in-process job.

CELERY_EAGER=true runs /internal/* jobs synchronously inside the same 512MB
process that serves HTTP traffic (see joblock.py). Task-local objects (query
results, DataFrames, networkx graphs) go out of scope when a task returns,
but SQLAlchemy ORM instances have circular references via relationship()
back-refs, which refcounting alone can't free - they sit as uncollected
garbage until the next generational GC pass. When several heavy jobs used to
run back-to-back in one request (see workers.intelligence.orchestrate), that
garbage accumulated across the whole chain instead of being reclaimed between
jobs. Call this after each job so the next one starts from a clean heap.
"""
import gc


def release_job_memory() -> None:
    gc.collect()
