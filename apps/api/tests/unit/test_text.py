from src.utils.text import normalize_whitespace, normalize_name, extract_arxiv_ids


def test_normalize_whitespace():
    assert normalize_whitespace("a\n b\t c") == "a b c"


def test_normalize_name():
    assert normalize_name("Y. LeCun!") == "y lecun"


def test_extract_arxiv_from_url():
    assert extract_arxiv_ids("see arxiv.org/abs/2401.12345 here") == ["2401.12345"]


def test_extract_arxiv_bare():
    assert extract_arxiv_ids("id 2401.12345") == ["2401.12345"]


def test_extract_none():
    assert extract_arxiv_ids("no ids here") == []
