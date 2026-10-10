"""Thin provider-agnostic LLM client. The user's own key is passed in on every call."""
import json
import re

import requests

PROVIDERS = {
    # default model is only a suggestion; the user can type any model id in Settings
    "gemini": {"label": "Google Gemini (free tier)", "default_model": "gemini-2.5-flash"},
    "openai": {"label": "OpenAI", "default_model": "gpt-4o-mini"},
    "anthropic": {"label": "Anthropic Claude", "default_model": "claude-haiku-4-5"},
}


class LLMError(Exception):
    """Safe to show to the user."""


class LLMAuthError(LLMError):
    """Key rejected or no permission."""


def _post(url: str, headers: dict, body: dict) -> dict:
    try:
        res = requests.post(url, headers=headers, json=body, timeout=60)
    except requests.RequestException:
        raise LLMError("Couldn't reach the AI provider. Please try again.")
    if res.status_code in (401, 403):
        raise LLMAuthError("The AI provider rejected your API key.")
    if res.status_code == 429:
        raise LLMError("The AI provider is rate limiting your key. Try again later.")
    if res.status_code >= 400:
        try:
            msg = res.json().get("error", {})
            msg = msg.get("message") if isinstance(msg, dict) else str(msg)
        except ValueError:
            msg = None
        print("LLM error:", res.status_code, msg)  # never log the key or the prompt
        raise LLMError(f"AI provider error ({res.status_code}). Check the model name.")
    try:
        return res.json()
    except ValueError:
        raise LLMError("The AI provider sent an unreadable reply.")


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
            raise LLMError("The AI provider returned no answer.")

    if provider == "openai":
        body = {
            "model": model,
            "temperature": 0.4,
            "messages": [{"role": "system", "content": system}, {"role": "user", "content": prompt}],
            **({"response_format": {"type": "json_object"}} if json_mode else {}),
        }
        data = _post("https://api.openai.com/v1/chat/completions", {"Authorization": f"Bearer {key}"}, body)
        try:
            return data["choices"][0]["message"]["content"] or ""
        except (KeyError, IndexError):
            raise LLMError("The AI provider returned no answer.")

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
            raise LLMError("The AI provider returned no answer.")

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
        raise LLMError("The AI answer wasn't in the expected format. Please try again.")
    return out


# ---------- model lists for the Settings dropdown ----------
FALLBACK_MODELS = {
    "gemini": ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.5-pro", "gemini-2.0-flash"],
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
            raise LLMError("Couldn't reach the AI provider.")
        if res.status_code in (401, 403):
            raise LLMAuthError("The AI provider rejected your API key.")
        if res.status_code != 200:
            raise LLMError("Couldn't load the model list.")
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