import time
import json

import redis

from config.config import config
from fastapi import Request, HTTPException
_client = None

def _r():
    global _client
    if _client is None and config.get("REDIS_URL"):
        _client = redis.Redis.from_url(
            config["REDIS_URL"], decode_responses=True,
            socket_timeout=2, socket_connect_timeout=2, protocol=2,
        )
    return _client



#  this is profile access key
def profile_key(user_id) -> str:
    return f"profile:{user_id}"



def session_ttl(req) -> int:
    """Seconds left in the login session, so the cache dies with the session."""
    exp = getattr(req.state, "token_exp", None)
    if exp:
        return max(1, int(exp - time.time()))
    return config["JWT_EXPIRE_DAYS"] * 86400 # 1 day in seconds


# Redis down ho to app chalta rehta hai, bas DB se read hoga.

def cache_get(key:str):
    r = _r()
    if not r:
        return None
    try:
        raw = r.get(key)
        return json.loads(raw) if raw else None
    except Exception as e:
        print('Cache get failed',e)
        return None

def cache_set(key: str, value, ttl: int) -> None:
    r = _r()
    if not r:
        return
    try:
        r.set(key, json.dumps(value), ex=max(1, int(ttl)))
    except Exception as e:
        print("Cache set failed:", e)



def cache_delete(key:str)->None:
    r = _r()
    if r is None:
        return None
    try:
        r.delete(key)
    except Exception as e:
        print('Cache delete failed',e)
        return None


def invalidate_profile(user_id) -> None:
    cache_delete(profile_key(user_id))


# ---------- atomic claim + counter (used to protect paid / limited APIs) ----------
# Redis is the source of truth. If Redis is missing or down we fall back to process memory,
# which still works but resets on restart and isn't shared between workers.
_mem_claims: dict[str, float] = {}
_mem_counts: dict[str, tuple[float, int]] = {}


def cache_claim(key: str, ttl: int) -> bool:
    """Atomically take `key` for `ttl` seconds. True = you are the first caller, go ahead.
    False = someone already took it, so skip the work."""
    ttl = max(1, int(ttl))
    r = _r()
    if r is not None:
        try:
            return bool(r.set(key, 1, nx=True, ex=ttl))   # SET NX is atomic, no race between workers
        except Exception as e:
            print("Cache claim failed, using memory:", e)
    now = time.time()
    if _mem_claims.get(key, 0) > now:
        return False
    _mem_claims[key] = now + ttl
    return True


def cache_release(key: str) -> None:
    """Give a claim back, e.g. when the call failed before it used any quota."""
    _mem_claims.pop(key, None)
    cache_delete(key)


def cache_incr(key: str, ttl: int) -> int:
    """Increment a counter that expires after `ttl` seconds. Returns the new value."""
    ttl = max(1, int(ttl))
    r = _r()
    if r is not None:
        try:
            pipe = r.pipeline()
            pipe.set(key, 0, ex=ttl, nx=True)
            pipe.incr(key)
            return int(pipe.execute()[-1])
        except Exception as e:
            print("Cache incr failed, using memory:", e)
    now = time.time()
    expires, n = _mem_counts.get(key, (0.0, 0))
    if expires <= now:
        expires, n = now + ttl, 0
    n += 1
    _mem_counts[key] = (expires, n)
    return n


#  rate limting

def rate_limit(name: str, limit: int, window: int):
    def dep(request: Request):
        r = _r()
        if r is None:
            return  # Redis down ho to request allow karo
        who = getattr(request.state, "user_id", None) or request.client.host
        key = f"rate:{name}:{who}"
        try:
            pipe = r.pipeline()
            pipe.set(key, 0, ex=window, nx=True)
            pipe.incr(key)
            _, count = pipe.execute()
            if count > limit:
                raise HTTPException(
                    429, "Too many requests. Please try again later.",
                    headers={"Retry-After": str(max(1, r.ttl(key)))},
                )
        except HTTPException:
            raise
        except Exception as e:
            print("Rate limit check failed:", e)
    return dep
        
def settings_key(user_id) -> str:
    return f"settings:{user_id}"