from src.utils.scoring import (impact_score, momentum_score, composite_score,
                               emerging_breakthrough_score, influence_score, growth_score)


class TestImpactScore:
    def test_zero_returns_low(self):
        assert impact_score(0, 0, 0, 0) < 10

    def test_log_normalization_prevents_outlier_domination(self):
        s1 = impact_score(100, 0, 0, 0)
        s2 = impact_score(10000, 0, 0, 0)
        assert s2 < s1 * 5

    def test_bounded_at_100(self):
        assert impact_score(100000, 1000, 10000, 500) <= 100.0

    def test_all_components_contribute(self):
        base = impact_score(50, 0, 0, 0)
        assert impact_score(50, 10, 0, 0) > base


class TestMomentum:
    def test_needs_history(self):
        assert momentum_score([1, 2, 3], 10) == 0.0

    def test_growing_paper_scores(self):
        hist = list(range(0, 30))  # steady growth
        assert momentum_score(hist, 20) > 0


class TestComposite:
    def test_weighting(self):
        assert composite_score(100, 0, 0) == 40.0
        assert composite_score(0, 100, 0) == 35.0
        assert composite_score(0, 0, 100) == 25.0


class TestBreakthrough:
    def test_famous_paper_excluded(self):
        assert emerging_breakthrough_score(200, 1, 1, 1, 1) == 0.0

    def test_low_citation_growth_scores(self):
        assert emerging_breakthrough_score(8, 1.0, 1.0, 1.0, 1.0) > 0


class TestInfluence:
    def test_bounded(self):
        assert influence_score(1, 1, 1, 1, 1, 1) <= 100.0


class TestGrowth:
    def test_flat_is_zero(self):
        assert growth_score(100, 100) == 0.0

    def test_doubling_positive(self):
        assert growth_score(200, 100) > 0
