"""Provider-agnostic LLM client.

Supported AI_MODE values:
  - "local"  : Ollama (local, unlimited, free)
  - "cloud"  : Google Gemini free tier
  - "openai" : any OpenAI-compatible chat API (Groq, Cerebras, OpenRouter, Mistral, Together, ...)
               set OPENAI_BASE_URL, OPENAI_API_KEY, OPENAI_MODEL
"""
import json
import requests
from src.config import settings


class LLMError(Exception):
    pass


def _openai_compat(prompt: str, json_mode: bool = True) -> str:
    """OpenAI-compatible /chat/completions (Groq, Cerebras, OpenRouter, Mistral, ...)."""
    if not settings.openai_api_key:
        raise LLMError("OPENAI_API_KEY not set but AI_MODE=openai")
    base = settings.openai_base_url.rstrip("/")
    body: dict = {
        "model": settings.openai_model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.3,
    }
    if json_mode:
        body["response_format"] = {"type": "json_object"}
    r = requests.post(
        f"{base}/chat/completions",
        headers={"Authorization": f"Bearer {settings.openai_api_key}"},
        json=body,
        timeout=120,
    )
    r.raise_for_status()
    return r.json()["choices"][0]["message"]["content"]


def _ollama(prompt: str, json_mode: bool = True) -> str:
    payload = {"model": settings.ollama_model, "prompt": prompt, "stream": False}
    if json_mode:
        payload["format"] = "json"
    r = requests.post(f"{settings.ollama_base_url}/api/generate", json=payload, timeout=180)
    r.raise_for_status()
    return r.json()["response"]


def _gemini(prompt: str, json_mode: bool = True) -> str:
    if not settings.gemini_api_key:
        raise LLMError("GEMINI_API_KEY not set but AI_MODE=cloud")
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{settings.gemini_model}:generateContent?key={settings.gemini_api_key}"
    )
    body = {"contents": [{"parts": [{"text": prompt}]}]}
    if json_mode:
        body["generationConfig"] = {"response_mime_type": "application/json"}
    r = requests.post(url, json=body, timeout=120)
    r.raise_for_status()
    data = r.json()
    return data["candidates"][0]["content"]["parts"][0]["text"]


def complete(prompt: str, json_mode: bool = True) -> str:
    """Return raw text from the configured provider."""
    if settings.ai_mode == "openai":
        return _openai_compat(prompt, json_mode)
    if settings.ai_mode == "cloud":
        return _gemini(prompt, json_mode)
    return _ollama(prompt, json_mode)


def complete_json(prompt: str) -> dict:
    """Return parsed JSON, tolerant of code fences."""
    raw = complete(prompt, json_mode=True).strip()
    if raw.startswith("```"):
        raw = raw.strip("`")
        raw = raw[raw.find("{"): raw.rfind("}") + 1]
    return json.loads(raw)


def model_name() -> str:
    if settings.ai_mode == "openai":
        return settings.openai_model
    if settings.ai_mode == "cloud":
        return settings.gemini_model
    return settings.ollama_model
