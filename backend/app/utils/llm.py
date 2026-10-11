"""Thin provider-agnostic LLM client. Providers: gemini, openai, xai (Grok), anthropic."""
import json
import re

import requests


class LLMError(Exception):
    """Safe to show to the user. Extra fields are for logging and fallback decisions."""

    def __init__(self, message: str = "", *, status: int | None = None, kind: str = "other",
                 detail: str | None = None, retry_after: int | None = None):
        super().__init__(message)
        self.status = status            # HTTP status from the provider, if any
        self.kind = kind                # rate_limited | quota_exceeded | auth | model_not_found | server | network | bad_response | other
        self.detail = detail            # provider's own error text (redact before storing)
        self.retry_after = retry_after  # seconds, from the Retry-After header


class LLMAuthError(LLMError):
    """Key rejected, expired or no permission."""


class LLMRateLimitError(LLMError):
    """429: per-minute limit hit or quota / credits used up."""


class LLMUnavailableError(LLMError):
    """Every configured provider failed. Raised by llm_router."""


def _error_detail(res: requests.Response) -> str | None:
    try:
        body = res.json()
        err = body.get("error", body) if isinstance(body, dict) else body
        if isinstance(err, dict):
            return str(err.get("message") or err)[:500]
        return str(err)[:500]
    except ValueError:
        return (res.text or "")[:300] or None


def _retry_after(res: requests.Response) -> int | None:
    try:
        v = res.headers.get("retry-after")
        return int(float(v)) if v else None
    except (ValueError, TypeError):
        return None


def _post(url: str, headers: dict, body: dict) -> dict:
    try:
        res = requests.post(url, headers=headers, json=body, timeout=30)
    except requests.RequestException:
        raise LLMError("Couldn't reach the AI provider. Please try again.", kind="network")

    if res.ok:
        try:
            return res.json()
        except ValueError:
            raise LLMError("The AI provider sent an unreadable reply.", kind="bad_response")

    status = res.status_code
    detail = _error_detail(res)
    low = (detail or "").lower()
    retry_after = _retry_after(res)
    print("LLM error:", status)  # never print the key, the prompt or the provider text here

    # Google reports an expired key as 400 "API key expired", not 401
    key_bad = status in (401, 403) or (
        status == 400 and "api key" in low and any(w in low for w in ("expired", "invalid", "not valid"))
    )
    if key_bad:
        raise LLMAuthError("The AI provider rejected the API key.", status=status, kind="auth",
                           detail=detail, retry_after=retry_after)
    if status == 429:
        kind = "quota_exceeded" if any(w in low for w in ("quota", "billing", "credit", "exceeded your current")) else "rate_limited"
        raise LLMRateLimitError("The AI provider is rate limiting this key.", status=status, kind=kind,
                                detail=detail, retry_after=retry_after)
    kind = "model_not_found" if status == 404 else "server" if status >= 500 else "other"
    raise LLMError(f"AI provider error ({status}). Check the model name.", status=status, kind=kind,
                   detail=detail, retry_after=retry_after)


OPENAI_COMPATIBLE = {
    "openai": "https://api.openai.com/v1/chat/completions",
    "xai": "https://api.x.ai/v1/chat/completions",   # Grok speaks the OpenAI format
}


def complete(provider: str, key: str, model: str, system: str, prompt: str, json_mode: bool = False) -> str:
    if provider == "gemini":
        body = {
            "systemInstruction": {"parts": [{"text": system}]},
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.4, **({"responseMimeType": "application/json"} if json_mode else {})},
        }
        data = _post(
            f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
            {"x-goog-api-key": key},
            body,
        )
        try:
            return "".join(p.get("text", "") for p in data["candidates"][0]["content"]["parts"])
        except (KeyError, IndexError):
            raise LLMError("The AI provider returned no answer.", kind="bad_response")

    if provider in OPENAI_COMPATIBLE:
        body = {
            "model": model,
            "temperature": 0.4,
            "messages": [{"role": "system", "content": system}, {"role": "user", "content": prompt}],
            **({"response_format": {"type": "json_object"}} if json_mode else {}),
        }
        data = _post(OPENAI_COMPATIBLE[provider], {"Authorization": f"Bearer {key}"}, body)
        try:
            return data["choices"][0]["message"]["content"] or ""
        except (KeyError, IndexError):
            raise LLMError("The AI provider returned no answer.", kind="bad_response")

    if provider == "anthropic":
        body = {"model": model, "max_tokens": 1500, "system": system, "messages": [{"role": "user", "content": prompt}]}
        data = _post(
            "https://api.anthropic.com/v1/messages",
            {"x-api-key": key, "anthropic-version": "2023-06-01"},
            body,
        )
        try:
            return "".join(b.get("text", "") for b in data["content"] if b.get("type") == "text")
        except (KeyError, TypeError):
            raise LLMError("The AI provider returned no answer.", kind="bad_response")

    raise LLMError("Unknown AI provider.")


def complete_json(provider: str, key: str, model: str, system: str, prompt: str) -> dict:
    raw = complete(provider, key, model, system, prompt, json_mode=True).strip()
    raw = re.sub(r"^```(?:json)?|```$", "", raw, flags=re.MULTILINE).strip()
    try:
        out = json.loads(raw)
    except ValueError:
        m = re.search(r"\{.*\}", raw, re.DOTALL)  # model wrapped the JSON in text
        try:
            out = json.loads(m.group(0)) if m else None
        except ValueError:
            out = None
    if not isinstance(out, dict):
        raise LLMError("The AI answer wasn't in the expected format. Please try again.", kind="bad_response")
    return out


# ---------- model lists for the Settings dropdown ----------
FALLBACK_MODELS = {
    "gemini": ["gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-2.5-flash", "gemini-2.5-pro"],
    "openai": ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini", "gpt-4.1", "gpt-5-mini", "gpt-5"],
    "anthropic": ["claude-haiku-5-5", "claude-sonnet-5-5", "claude-opus-5-5", "claude-haiku-4-5", "claude-sonnet-4-5"],
}
_SKIP = ("embedding", "embed", "tts", "audio", "realtime", "transcribe", "image", "moderation", "whisper",
         "dall-e", "search", "vision", "aqa", "imagen", "veo", "live", "robotics", "computer-use")


def _fetch_models(provider: str, key: str) -> list[str]:
    def get(url, headers, params=None):
        try:
            res = requests.get(url, headers=headers, params=params, timeout=15)
        except requests.RequestException:
            raise LLMError("Couldn't reach the AI provider.", kind="network")
        if res.status_code in (401, 403):
            raise LLMAuthError("The AI provider rejected your API key.", status=res.status_code, kind="auth")
        if res.status_code != 200:
            raise LLMError("Couldn't load the model list.", status=res.status_code)
        return res.json()

    if provider == "gemini":
        data = get("https://generativelanguage.googleapis.com/v1beta/models", {"x-goog-api-key": key}, {"pageSize": 200})
        ids = [m["name"].split("/", 1)[-1] for m in data.get("models", [])
               if "generateContent" in m.get("supportedGenerationMethods", [])]
        ids = [i for i in ids if i.startswith("gemini") and not any(x in i for x in _SKIP)]
    elif provider == "openai":
        data = get("https://api.openai.com/v1/models", {"Authorization": f"Bearer {key}"})
        ids = [m["id"] for m in data.get("data", [])]
        ids = [i for i in ids if i.startswith(("gpt-", "o1", "o3", "o4", "chatgpt")) and not any(x in i for x in _SKIP)]
    else:
        data = get("https://api.anthropic.com/v1/models", {"x-api-key": key, "anthropic-version": "2023-06-01"}, {"limit": 100})
        ids = [m["id"] for m in data.get("data", [])]
    return sorted(set(ids), reverse=True)


def list_models(provider: str, key: str | None) -> dict:
    """{"models": [...], "live": bool}. Falls back to a built-in list when there is no key or the call fails."""
    if key:
        try:
            ids = _fetch_models(provider, key)
            if ids:
                return {"models": ids, "live": True}
        except LLMError as e:
            print("list_models fallback:", e)
    return {"models": FALLBACK_MODELS.get(provider, []), "live": False}