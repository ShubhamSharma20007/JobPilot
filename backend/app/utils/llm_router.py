"""Tries each configured AI provider in order and logs every failure to llm_logs.

Order comes from LLM_PROVIDER_ORDER (default: gemini,openai,xai). A provider whose key
returned 429 / auth / bad model is skipped for a while (cool-down), so a dead key isn't
hit on every request. If every key is cold we try them all anyway.
"""
import os
import re
import time
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from config.config import config
from database.db import SessionLocal
from models.llm_log_model import LLMLog
from utils.cache import cache_get, cache_set
from utils.llm import LLMError, LLMUnavailableError, complete_json

LOG_KEEP_DAYS = 30
_cold: dict[str, float] = {}   # fallback when Redis isn't configured


@dataclass(frozen=True)
class Candidate:
    provider: str   # gemini | openai | xai
    label: str      # env var name, safe to log
    key: str
    model: str


def _cfg(name: str, default: str | None = None) -> str | None:
    """config.py first, then the environment, then a default. A missing setting never crashes the app."""
    return config.get(name) or os.getenv(name) or default


def candidates() -> list[Candidate]:
    gemini_model = _cfg("AI_MODEL", "gemini-2.5-flash")
    openai_model = _cfg("OPENAI_MODEL", "gpt-4o-mini")
    xai_model = _cfg("XAI_MODEL", "grok-3-mini")
    pools = {
        "gemini": [("GEMINI_API_KEY", _cfg("GEMINI_API_KEY"), gemini_model)],
        "openai": [("OPENAI_API_KEY", _cfg("OPENAI_API_KEY"), openai_model)],
        "xai": [("XAI_API_KEY", _cfg("XAI_API_KEY"), xai_model),
                ("GROK_API_KEY", _cfg("GROK_API_KEY"), xai_model)],
    }
    order = [p.strip() for p in _cfg("LLM_PROVIDER_ORDER", "gemini,openai,xai").split(",") if p.strip() in pools]
    out, seen = [], set()
    for provider in order:
        for label, key, model in pools[provider]:
            if key and key not in seen:        # XAI_API_KEY and GROK_API_KEY may be the same key
                seen.add(key)
                out.append(Candidate(provider, label, key, model))
    return out


def has_provider() -> bool:
    return bool(candidates())


# ---------- cool-down ----------
def _ckey(c: Candidate) -> str:
    return f"llmcold:{c.label}"


def _is_cold(c: Candidate) -> bool:
    return cache_get(_ckey(c)) is not None or _cold.get(_ckey(c), 0) > time.time()


def _cool(c: Candidate, e: LLMError) -> None:
    if e.kind == "rate_limited":
        secs = min(max(e.retry_after or 60, 30), 900)
    else:
        secs = {"quota_exceeded": 1800, "auth": 3600, "model_not_found": 3600}.get(e.kind, 0)
    if secs:
        cache_set(_ckey(c), 1, secs)
        _cold[_ckey(c)] = time.time() + secs


# ---------- logging ----------
_TOKEN = re.compile(r"(sk-[A-Za-z0-9_\-]{8,}|xai-[A-Za-z0-9_\-]{8,}|AIza[0-9A-Za-z_\-]{10,})")


def _redact(text: str | None) -> str | None:
    if not text:
        return None
    text = _TOKEN.sub("***", text)
    for c in candidates():
        text = text.replace(c.key, "***")
    return text[:1000]


def _log_failure(c: Candidate, e: LLMError, purpose: str, user_id, latency_ms: int) -> None:
    """Own session, so the log survives even if the request's transaction rolls back."""
    try:
        db = SessionLocal()
        try:
            db.add(LLMLog(
                user_id=user_id, purpose=purpose, provider=c.provider, key_label=c.label, model=c.model,
                error_type=e.kind, http_status=e.status, error_message=_redact(e.detail or str(e)),
                retry_after_sec=e.retry_after, latency_ms=latency_ms,
            ))
            db.commit()
        finally:
            db.close()
    except Exception as ex:   # logging must never break the request
        print("llm_logs write failed:", type(ex).__name__)


# ---------- public API ----------
def complete_json_with_fallback(system: str, prompt: str, *, purpose: str, user_id=None) -> dict:
    cands = candidates()
    if not cands:
        print(f"llm [{purpose}]: no AI key configured (set GEMINI_API_KEY, OPENAI_API_KEY or XAI_API_KEY)")
        raise LLMUnavailableError("AI is not available right now.", kind="other")

    ready = [c for c in cands if not _is_cold(c)] or cands
    print(f"llm [{purpose}]: trying " + " -> ".join(f"{c.provider}/{c.model}" for c in ready))
    for i, c in enumerate(ready):
        started = time.monotonic()
        try:
            result = complete_json(c.provider, c.key, c.model, system, prompt)
            print(f"llm [{purpose}]: OK {c.provider}/{c.model} ({c.label}) in {int((time.monotonic() - started) * 1000)} ms")
            return result
        except LLMError as e:
            ms = int((time.monotonic() - started) * 1000)
            _log_failure(c, e, purpose, user_id, ms)
            _cool(c, e)
            nxt = ready[i + 1] if i + 1 < len(ready) else None
            print(f"llm [{purpose}]: FAILED {c.provider}/{c.model} ({c.label}) after {ms} ms: {e.kind}, http {e.status}"
                  f" | next: {f'{nxt.provider}/{nxt.model}' if nxt else 'none left'}")

    raise LLMUnavailableError("The AI is busy right now. Please try again in a few minutes.", kind="other")


def purge_old_llm_logs() -> None:
    db = SessionLocal()
    try:
        cutoff = datetime.now(timezone.utc) - timedelta(days=LOG_KEEP_DAYS)
        db.query(LLMLog).filter(LLMLog.created_at < cutoff).delete(synchronize_session=False)
        db.commit()
    except Exception as e:
        db.rollback()
        print("purge_old_llm_logs error:", type(e).__name__)
    finally:
        db.close()