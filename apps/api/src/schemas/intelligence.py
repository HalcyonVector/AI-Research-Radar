from datetime import datetime, date
from pydantic import BaseModel


class ConceptWeight(BaseModel):
    concept: str
    weight: float
    rationale: str | None = None


class DNAResponse(BaseModel):
    paper_id: str
    composition: list[ConceptWeight]


class SleepingGiant(BaseModel):
    paper: dict
    emerging_breakthrough_score: float
    breakthrough_driver: str | None
    driver_detail: str | None
    ai_rationale: str | None
    computed_at: datetime | None


class PropagationStep(BaseModel):
    step: int
    entity_type: str
    org_name: str | None
    label: str
    date: date | None


class FrontierItem(BaseModel):
    category: dict
    explosion_probability: float
    horizon_weeks: int
    top_contributing_signals: list


class NarrativeItem(BaseModel):
    id: str
    scope: str
    scope_ref: str | None
    period_start: date
    period_end: date
    narrative_text: str
    referenced_entities: list
    generated_at: datetime | None
