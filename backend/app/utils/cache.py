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