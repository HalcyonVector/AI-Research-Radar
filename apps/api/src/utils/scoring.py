"""Scoring formulas (spec 3.3 + Layer 3 1.4.8.3/1.4.8.8). Pure functions, unit-tested."""
import math


def _norm(value: float, ceiling: float) -> float:
    if ceiling <= 0:
        return 0.0
    return min(math.log1p(max(value, 0)) / math.log1p(ceiling), 1.0)


def impact_score(citations: int, github_impls: int, social: int, hf_models: int) -> float:
    c = _norm(citations, 1000) * 40
    i = _norm(github_impls, 50) * 30
    d = _norm(social, 200) * 20
    h = _norm(hf_models, 20) * 10
    return round(min(c + i + d + h, 100.0), 2)


def momentum_score(citation_history: list[int], age_days: int) -> float:
    """citation_history: daily cumulative citation counts, oldest→newest."""
    if len(citation_history) < 7:
        return 0.0
    velocities = [citation_history[i] - citation_history[max(i - 7, 0)] for i in range(len(citation_history))]
    # EWMA span=4
    alpha = 2 / (4 + 1)  # EWMA span=4
    ewma = velocities[0]
    for v in velocities[1:]:
        ewma = alpha * v + (1 - alpha) * ewma
    age_penalty = 1.0 / math.log1p(max(age_days, 1))
    return round(min(math.log1p(max(ewma, 0)) * age_penalty * 50, 100.0), 2)


def innovation_score(novelty_cosine_distance: float, cross_category_reach: int, first_mover: bool) -> float:
    novelty = max(0.0, min(novelty_cosine_distance, 1.0)) * 40
    cross = min(cross_category_reach / 5, 1.0) * 30
    fm = 30 if first_mover else 0
    return round(min(novelty + cross + fm, 100.0), 2)


def composite_score(impact: float, momentum: float, innovation: float) -> float:
    return round(impact * 0.40 + momentum * 0.35 + innovation * 0.25, 2)


def emerging_breakthrough_score(citation_count: int, impl_growth: float, discussion_growth: float,
                                related_work_growth: float, hf_growth: float) -> float:
    """Spec 1.4.8.3. Growth inputs are already normalized 0-1."""
    if citation_count > 150:
        return 0.0
    low_citation_bonus = 1.0 - min(citation_count / 150, 1.0)
    raw = (impl_growth * 30 + discussion_growth * 25 + related_work_growth * 25 + hf_growth * 20)
    raw *= (0.5 + 0.5 * low_citation_bonus)
    return round(min(raw, 100.0), 2)


def influence_score(citation_velocity: float, impl_count: float, hf_model_count: float,
                    discussion: float, derivative_papers: float, cross_domain: float) -> float:
    """Spec 1.4.8.8. All inputs already normalized 0-1."""
    return round(min(
        citation_velocity * 25 + impl_count * 20 + hf_model_count * 15
        + discussion * 15 + derivative_papers * 15 + cross_domain * 10, 100.0), 2)


def growth_score(papers_this_week: int, papers_last_week: int) -> float:
    """Spec 1.4.3: log(this/last) * 100, clamped to a readable range."""
    last = max(papers_last_week, 1)
    this = max(papers_this_week, 0)
    raw = math.log((this + 1) / (last + 1)) * 100
    return round(max(-100.0, min(raw, 100.0)), 2)


def ewma(values: list[float], span: int = 4) -> float:
    if not values:
        return 0.0
    alpha = 2 / (span + 1)
    acc = values[0]
    for v in values[1:]:
        acc = alpha * v + (1 - alpha) * acc
    return round(acc, 2)
