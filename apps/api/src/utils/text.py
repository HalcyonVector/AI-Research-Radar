"""Text normalization helpers."""
import re
import unicodedata

_ARXIV_RE = re.compile(r"arxiv\.org/abs/(\d{4}\.\d{4,5})", re.I)
_ARXIV_BARE_RE = re.compile(r"\b(\d{4}\.\d{4,5})\b")


def normalize_whitespace(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "").strip())


def normalize_name(name: str) -> str:
    s = unicodedata.normalize("NFKD", name or "").encode("ascii", "ignore").decode()
    s = re.sub(r"[^\w\s]", "", s).lower().strip()
    return re.sub(r"\s+", " ", s)


def extract_arxiv_ids(text: str) -> list[str]:
    if not text:
        return []
    ids = _ARXIV_RE.findall(text)
    if not ids:
        ids = _ARXIV_BARE_RE.findall(text)
    seen, out = set(), []
    for i in ids:
        if i not in seen:
            seen.add(i)
            out.append(i)
    return out
