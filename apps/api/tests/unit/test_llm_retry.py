import pytest

from src.ai import llm


class FakeResponse:
    def __init__(self, status, retry_after=None):
        self.status_code = status
        self.headers = {"Retry-After": retry_after} if retry_after else {}

    def raise_for_status(self):
        if self.status_code >= 400:
            raise RuntimeError(f"HTTP {self.status_code}")


def _patch(monkeypatch, responses):
    calls, slept = [], []

    def post(*args, **kwargs):
        calls.append(1)
        return responses.pop(0)

    monkeypatch.setattr(llm.requests, "post", post)
    monkeypatch.setattr(llm.time, "sleep", slept.append)
    return calls, slept


def test_long_retry_after_gives_up_without_waiting(monkeypatch):
    calls, slept = _patch(monkeypatch, [FakeResponse(429, "600")])
    with pytest.raises(llm.RateLimited):
        llm._post_with_retry("https://x")
    assert calls == [1] and slept == []


def test_short_retry_after_is_honored(monkeypatch):
    calls, slept = _patch(monkeypatch, [FakeResponse(429, "3"), FakeResponse(200)])
    assert llm._post_with_retry("https://x").status_code == 200
    assert slept == [3.0]


def test_total_wait_is_capped(monkeypatch):
    calls, slept = _patch(monkeypatch, [FakeResponse(429, "50") for _ in range(7)])
    with pytest.raises(llm.RateLimited):
        llm._post_with_retry("https://x")
    assert sum(slept) <= llm.RETRY_BUDGET_S
    assert len(calls) == 3  # waited 50 + 50, a third 50 would exceed the budget
