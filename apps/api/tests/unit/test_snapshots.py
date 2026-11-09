from src.workers.snapshots import snapshot_key


def test_key_without_params():
    assert snapshot_key("/dashboard") == "radar:snap:/dashboard"


def test_key_sorts_params():
    # Must match snapshotKey() in apps/web/src/lib/snapshots.ts, which sorts
    # the incoming query the same way.
    assert snapshot_key("/intelligence/sleeping-giants", {"offset": 0, "limit": 3}) == \
        "radar:snap:/intelligence/sleeping-giants?limit=3&offset=0"
