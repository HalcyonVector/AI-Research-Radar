"""Structured LLM prompt templates (spec 1.4.2, 1.4.5, 1.4.8.5, 1.4.8.10)."""
from src.ai.vocabulary import CONCEPT_VOCABULARY

SUMMARY_PROMPT = """You are a research analyst. Analyze this AI paper and return ONLY valid JSON.

Title: {title}
Abstract: {abstract}

Return exactly this JSON shape:
{{
  "core_contribution": "1-2 sentences on the main technical contribution",
  "key_innovation": "what is genuinely new vs prior work",
  "problem_solved": "the specific problem addressed",
  "practical_applications": ["app1", "app2", "app3"],
  "limitations": ["limit1", "limit2"],
  "significance": "low|medium|high|breakthrough",
  "significance_rationale": "why this level (>50 chars)",
  "related_concepts": ["concept1", "concept2", "concept3"]
}}

Rules: Be specific and write in third person. Do not invent metrics. Justify significance."""

MODEL_SUMMARY_PROMPT = """You are an AI analyst. Summarize this Hugging Face model.
Return ONLY valid JSON.

Model name: {name}
Pipeline / task type: {model_type}
Tags: {tags}

Model card (README, may be partial or empty):
\"\"\"
{card}
\"\"\"

Return exactly this JSON shape:
{{
  "what_it_is": "1-2 sentences: what this model is and what it does",
  "capabilities": ["capability1", "capability2", "capability3"],
  "use_cases": ["use case1", "use case2"],
  "notable": "one sentence on anything distinctive (size, domain, license signal), or empty string"
}}

Rules: Prefer the model card when present; fall back to metadata when it is thin or empty.
ALWAYS return 2-4 concrete use_cases. If the card is empty, infer them from the task type
and tags (e.g. a text-to-image model -> "generating images from text prompts"; a sentence
embedding model -> "semantic search", "clustering"). Never return an empty use_cases list.
Do not invent benchmarks or numbers not stated in the card. Write in third person."""

REPO_SUMMARY_PROMPT = """You are an AI analyst. Summarize this GitHub repository.
Return ONLY valid JSON.

Repository: {full_name}
Description: {description}
Primary language: {language}
Topics: {topics}

README (may be partial or empty):
\"\"\"
{readme}
\"\"\"

Return exactly this JSON shape:
{{
  "what_it_does": "1-2 sentences on what this project is for",
  "key_features": ["feature1", "feature2", "feature3"],
  "use_cases": ["use case1", "use case2"],
  "notable": "one sentence on anything distinctive, or empty string"
}}

Rules: Prefer the README when present; fall back to metadata when it is thin or empty.
ALWAYS return 2-4 concrete use_cases, inferring from the description, topics and language
when the README is thin. Never return an empty use_cases list.
Do not invent stars, benchmarks, or numbers not stated in the README. Write in third person."""

DNA_PROMPT = """Decompose this AI paper into a weighted concept fingerprint.

Title: {title}
Abstract: {abstract}

Choose 2-6 concepts ONLY from this controlled vocabulary:
{vocabulary}

Return ONLY valid JSON. Weights are integers summing to 100.
{{
  "concepts": [
    {{"concept": "<exact vocabulary term>", "weight": 65, "rationale": "one clause"}},
    {{"concept": "<exact vocabulary term>", "weight": 35, "rationale": "one clause"}}
  ]
}}"""

BRIEFING_PROMPT = """You are the editor of a weekly AI research briefing. Using the data below,
write a briefing. Return ONLY valid JSON.

Week: {week_start} to {week_end}
Numbers: {numbers}
Top papers: {top_papers}
Model releases: {models}
Category movements: {category_deltas}

{{
  "this_week_in_numbers": "one paragraph",
  "big_stories": [{{"title": "...", "body": "one paragraph"}}],
  "emerging_signals": "one paragraph on categories that moved",
  "papers_worth_your_time": ["title — one line", "..."],
  "model_releases": ["name — one line", "..."],
  "what_to_watch": "forward-looking paragraph"
}}"""

NARRATIVE_PROMPT = """Write a narrative (max 400 words) explaining the research shift in this period.
Every named paper/event must reference a provided entity id using [[paper:UUID]] or [[category:slug]].
No unattributed causal claims.

Scope: {scope} {scope_ref}
Period: {period_start} to {period_end}
Concept-shift papers: {shift_papers}
Category deltas: {category_deltas}
Evolution stage transitions: {transitions}

Return ONLY valid JSON: {{"narrative_text": "...", "referenced_ids": ["UUID", ...]}}"""


def vocabulary_block() -> str:
    return ", ".join(CONCEPT_VOCABULARY)
