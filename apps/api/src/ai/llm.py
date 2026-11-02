"""Provider-agnostic LLM client with per-lane routing.

Two logical "lanes" let high-volume and quality work use different providers:

  - lane="light"  : model / repo cards (high volume, low difficulty)
  - lane="heavy"  : papers + Layer-3 intelligence (reasoning-dense, quality)

Each lane picks a provider via settings.light_provider / settings.heavy_provider.
When those are blank we fall back to the legacy global AI_MODE so existing
behavior is preserved. Provider values:

  - "ollama" : local Ollama (unlimited, free) — great for the light lane on a GPU.
               Falls back to the cloud provider automatically if Ollama is unreachable.
  - "openai" : any OpenAI-compatible chat API (Groq, Cerebras, OpenRouter, Mistral, ...).
               A second OpenAI-compatible provider (OPENAI_*_2) is used as failover.
  - "cloud"  : Google Gemini free tier.
"""
import json
import time
import requests
from src.config import settings


class LLMError(Exception):
    pass


class RateLimited(LLMError):
    """The provider wants us to back off longer than a batch job should wait.
    Callers stop their batch and leave the rest for the next run."""


MAX_WAIT_S = 60.0        # longest single back-off we'll sit through
RETRY_BUDGET_S = 120.0   # total back-off per call before giving up


def _post_with_retry(url, *, headers=None, json=None, timeout=120, max_retries=6):
    """POST that backs off on 429/5xx, honoring the Retry-After header when present.

    Gives up with RateLimited once the provider asks for more than MAX_WAIT_S or
    the call has waited RETRY_BUDGET_S in total. Previously every call slept up
    to 6 x 60s; with Groq's daily quota nearly spent, each summary took ~5 min,
    so jobs crawled into their 25-minute timeout instead of stopping."""
    delay = 2.0
    waited = 0.0
    for attempt in range(max_retries + 1):
        r = requests.post(url, headers=headers, json=json, timeout=timeout)
        if r.status_code == 429 or r.status_code >= 500:
            retry_after = r.headers.get("Retry-After")
            try:
                wait = float(retry_after) if retry_after else delay
            except ValueError:
                wait = delay
            if attempt == max_retries or wait > MAX_WAIT_S or waited + wait > RETRY_BUDGET_S:
                if r.status_code == 429:
                    raise RateLimited(f"rate limited (retry-after {retry_after or '?'}s, waited {waited:.0f}s)")
                r.raise_for_status()
            time.sleep(wait)
            waited += wait
            delay = min(delay * 2, MAX_WAIT_S)
            continue
        r.raise_for_status()
        return r
    raise LLMError("unreachable")


def _openai_compat(prompt, json_mode=True, model=None, *, base_url=None, api_key=None):
    """OpenAI-compatible /chat/completions (Groq, Cerebras, OpenRouter, Mistral, ...)."""
    api_key = api_key or settings.openai_api_key
    if not api_key:
        raise LLMError("OPENAI_API_KEY not set but an openai-compatible provider was requested")
    base = (base_url or settings.openai_base_url).rstrip("/")
    body = {
        "model": model or settings.openai_model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.3,
    }
    if json_mode:
        body["response_format"] = {"type": "json_object"}
    r = _post_with_retry(
        f"{base}/chat/completions",
        headers={"Authorization": f"Bearer {api_key}"},
        json=body,
        timeout=120,
    )
    return r.json()["choices"][0]["message"]["content"]


def _cloud_openai(prompt, json_mode, model):
    """Primary OpenAI-compatible provider, with an optional second provider as failover."""
    try:
        return _openai_compat(prompt, json_mode, model or settings.openai_model,
                              base_url=settings.openai_base_url,
                              api_key=settings.openai_api_key)
    except (LLMError, requests.exceptions.RequestException):
        if settings.openai_api_key_2 and settings.openai_base_url_2:
            return _openai_compat(prompt, json_mode,
                                  settings.openai_model_2 or model or settings.openai_model,
                                  base_url=settings.openai_base_url_2,
                                  api_key=settings.openai_api_key_2)
        raise


def _ollama(prompt, json_mode=True, model=None):
    payload = {"model": model or settings.ollama_model, "prompt": prompt, "stream": False}
    if json_mode:
        payload["format"] = "json"
    r = _post_with_retry(f"{settings.ollama_base_url}/api/generate", json=payload, timeout=300)
    return r.json()["response"]


def _gemini(prompt, json_mode=True):
    if not settings.gemini_api_key:
        raise LLMError("GEMINI_API_KEY not set but a Gemini provider was requested")
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{settings.gemini_model}:generateContent?key={settings.gemini_api_key}"
    )
    body = {"contents": [{"parts": [{"text": prompt}]}]}
    if json_mode:
        body["generationConfig"] = {"response_mime_type": "application/json"}
    r = _post_with_retry(url, json=body, timeout=120)
    data = r.json()
    return data["candidates"][0]["content"]["parts"][0]["text"]


_AI_MODE_TO_PROVIDER = {"local": "ollama", "cloud": "cloud", "openai": "openai"}


def _provider_for(lane):
    explicit = settings.light_provider if lane == "light" else settings.heavy_provider
    if explicit:
        return explicit
    # Legacy fallback: honor the single global AI_MODE.
    return _AI_MODE_TO_PROVIDER.get(settings.ai_mode, "ollama")


def _default_model_for(lane):
    return settings.openai_model_light if lane == "light" else settings.openai_model_heavy


def complete(prompt, json_mode=True, model=None, lane="heavy"):
    """Return raw text from the provider configured for the given lane.

    `model` is an optional per-call override for the OpenAI-compatible provider.
    It is ignored by the Ollama/Gemini providers, which have a single configured model.
    """
    provider = _provider_for(lane)
    if provider == "ollama":
        try:
            return _ollama(prompt, json_mode, settings.ollama_model)
        except (requests.exceptions.RequestException, LLMError):
            # Ollama down / unreachable — don't stall the queue, use the cloud provider.
            return _cloud_openai(prompt, json_mode, model or _default_model_for(lane))
    if provider == "cloud":
        return _gemini(prompt, json_mode)
    return _cloud_openai(prompt, json_mode, model or _default_model_for(lane))


def complete_json(prompt, model=None, lane="heavy"):
    """Return parsed JSON, tolerant of code fences."""
    raw = complete(prompt, json_mode=True, model=model, lane=lane).strip()
    if raw.startswith("```"):
        raw = raw.strip("`")
        raw = raw[raw.find("{"): raw.rfind("}") + 1]
    return json.loads(raw)


def model_name(model=None, lane="heavy"):
    """Human-readable id of the model that will actually serve this lane."""
    provider = _provider_for(lane)
    if provider == "ollama":
        return f"ollama:{settings.ollama_model}"
    if provider == "cloud":
        return settings.gemini_model
    return model or _default_model_for(lane)
