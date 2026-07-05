"""Fetch long-form source content (HF model cards, GitHub READMEs) for summarization.

These are best-effort helpers: on any failure (missing file, rate limit, network
error) they return None and the caller falls back to metadata-only summarization.
"""
import requests
from src.config import settings

MAX_CHARS = 6000


def _truncate(text: str | None) -> str | None:
    if not text:
        return None
    text = text.strip()
    if not text:
        return None
    return text[:MAX_CHARS]


def fetch_hf_card(hf_model_id: str) -> str | None:
    """Fetch the raw README.md (model card) for a Hugging Face model."""
    headers = {"Authorization": f"Bearer {settings.hf_api_token}"} if settings.hf_api_token else {}
    url = f"https://huggingface.co/{hf_model_id}/raw/main/README.md"
    try:
        r = requests.get(url, headers=headers, timeout=30)
        if r.status_code == 200:
            return _truncate(r.text)
    except requests.exceptions.RequestException:
        return None
    return None


def fetch_github_readme(full_name: str) -> str | None:
    """Fetch the raw README for a GitHub repo via the readme endpoint."""
    headers = {"Accept": "application/vnd.github.raw+json"}
    if settings.github_token:
        headers["Authorization"] = f"Bearer {settings.github_token}"
    url = f"https://api.github.com/repos/{full_name}/readme"
    try:
        r = requests.get(url, headers=headers, timeout=30)
        if r.status_code == 200:
            return _truncate(r.text)
    except requests.exceptions.RequestException:
        return None
    return None
