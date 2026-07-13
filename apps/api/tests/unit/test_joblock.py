import pytest
from src.utils import joblock


class FakeRedis:
    """Minimal SET NX EX / GET / DELETE stand-in - enough to exercise job_lock
    without a real Redis instance."""

    def __init__(self):
        self.store = {}

    def set(self, key, value, nx=False, ex=None):
        if nx and key in self.store:
            return False
        self.store[key] = value
        return True

    def get(self, key):
        return self.store.get(key)

    def delete(self, key):
        self.store.pop(key, None)


@pytest.fixture(autouse=True)
def fake_redis(monkeypatch):
    fake = FakeRedis()
    monkeypatch.setattr(joblock, "redis_client", fake)
    return fake


def test_lock_acquire_and_release(fake_redis):
    with joblock.job_lock("job_a"):
        assert joblock.LOCK_KEY in fake_redis.store
    assert joblock.LOCK_KEY not in fake_redis.store


def test_second_trigger_while_locked_raises(fake_redis):
    with joblock.job_lock("job_a"):
        with pytest.raises(joblock.JobLockedError):
            with joblock.job_lock("job_b"):
                pass


def test_lock_released_even_if_body_raises(fake_redis):
    with pytest.raises(ValueError):
        with joblock.job_lock("job_a"):
            raise ValueError("boom")
    assert joblock.LOCK_KEY not in fake_redis.store


def test_does_not_release_a_lock_it_no_longer_holds(fake_redis):
    """If our TTL already expired and someone else grabbed the lock, our
    `finally` must not delete their lock."""
    with joblock.job_lock("job_a"):
        fake_redis.store[joblock.LOCK_KEY] = "someone_else:token"
    assert fake_redis.store[joblock.LOCK_KEY] == "someone_else:token"


def test_fails_open_when_redis_raises(monkeypatch):
    class BrokenRedis:
        def set(self, *a, **k):
            raise ConnectionError("redis is down")

    monkeypatch.setattr(joblock, "redis_client", BrokenRedis())
    with joblock.job_lock("job_a"):
        pass  # should not raise - fail open
