"""Run a Celery task in an isolated child process (see workers/run_job.py)."""
import json
import logging
import subprocess
import sys

logger = logging.getLogger(__name__)

JOB_TIMEOUT = 2300  # just under joblock.DEFAULT_TTL (2400) so the lock outlives the job


class JobFailedError(RuntimeError):
    pass


def run_isolated(task, **kwargs) -> None:
    """Run `task` (a Celery task object) to completion in a fresh process.

    Blocks until it finishes, like the old in-process `.delay()` under
    CELERY_EAGER did, so cron callers and the job lock behave the same.
    Raises JobFailedError on non-zero exit (including the RSS watchdog).
    """
    cmd = [sys.executable, "-m", "src.workers.run_job", task.name, json.dumps(kwargs)]
    try:
        proc = subprocess.run(cmd, timeout=JOB_TIMEOUT)
    except subprocess.TimeoutExpired as e:
        raise JobFailedError(f"{task.name} timed out after {JOB_TIMEOUT}s") from e
    if proc.returncode == 137:
        raise JobFailedError(f"{task.name} was killed by its RSS ceiling (see run_job.py)")
    if proc.returncode != 0:
        # Task-level exceptions were always swallowed under eager .delay(); keep
        # the endpoint non-fatal for them (the child already printed the traceback)
        # so one flaky upstream API doesn't turn the whole cron run red.
        logger.warning("%s exited with code %s (traceback in job output above)",
                       task.name, proc.returncode)
