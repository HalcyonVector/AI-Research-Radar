from src.utils.pagination import encode_cursor, decode_cursor


def test_roundtrip():
    c = encode_cursor({"offset": 40})
    assert decode_cursor(c) == {"offset": 40}


def test_bad_cursor_returns_none():
    assert decode_cursor("not-valid") is None
    assert decode_cursor(None) is None
