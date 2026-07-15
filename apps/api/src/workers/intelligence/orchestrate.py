"""Intelligence pipeline orchestrator (spec 5.8).

run_weekly() below is NOT called by the free-tier path anymore. Under
CELERY_EAGER=true, chaining its 6 jobs in one process caused the recurring
"exceeded its memory limit" OOM restarts on the 512MB API dyno (see
routers.internal.intelligence_weekly_job, which the ingest-cron workflow now
calls once per job instead). run_weekly() is kept only for a future non-eager
setup with a real, separately-provisioned Celery worker (paid plan), where
.delay() would actually enqueue to Redis instead of running inline - do not
wire it back into the free-tier /internal/* router.
"""
from src.celery_app import celery_app


@celery_app.task(name="workers.intelligence.orchestrate.run_daily")
def run_daily():
    from src.workers.intelligence import dna, breakthrough
    dna.compute_research_dna.delay()
    breakthrough.compute_breakthrough_scores.delay()
    return {"queued": ["dna", "breakthrough"]}


@celery_app.task(name="workers.intelligence.orchestrate.run_weekly")
def run_weekly():
    from src.workers.intelligence import (propagation, genealogy, cross_pollination,
                                          evolution, collaboration, frontier)
    propagation.build_idea_propagation_chains.delay()
    genealogy.build_research_genealogy.delay()
    cross_pollination.detect_cross_pollination.delay()
    evolution.update_evolution_timelines.delay()
    collaboration.detect_collaboration_clusters.delay()
    frontier.train_and_score_frontier_predictor.delay()
    return {"queued": ["propagation", "genealogy", "cross_pollination", "evolution", "collaboration", "frontier"]}
