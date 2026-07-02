from datetime import datetime
from pydantic import BaseModel
from src.schemas.common import Pagination, CategoryRef


class AuthorRef(BaseModel):
    id: str
    name: str


class Scores(BaseModel):
    composite: float = 0
    impact: float = 0
    momentum: float = 0
    innovation: float = 0


class Metrics(BaseModel):
    citations: int = 0
    github_impls: int = 0
    hf_models: int = 0
    social_mentions: int = 0


class PaperListItem(BaseModel):
    id: str
    arxiv_id: str | None
    title: str
    abstract_snippet: str
    published_at: datetime
    primary_category: CategoryRef | None
    authors: list[AuthorRef]
    scores: Scores
    metrics: Metrics
    has_ai_summary: bool


class PaperList(BaseModel):
    data: list[PaperListItem]
    pagination: Pagination


class AISummary(BaseModel):
    core_contribution: str | None = None
    key_innovation: str | None = None
    problem_solved: str | None = None
    practical_applications: list[str] = []
    limitations: list[str] = []
    significance: str | None = None
    significance_rationale: str | None = None
    related_concepts: list[str] = []


class PaperDetail(PaperListItem):
    abstract: str
    pdf_url: str | None = None
    html_url: str | None = None
    ai_summary: AISummary | None = None
