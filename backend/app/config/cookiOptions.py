import os

PROD = os.getenv("RENDER") is not None

COOKIE_OPTIONS = {
    "key": "session",
    "httponly": True,
    "secure": PROD,                        # HTTPS only in production
    "samesite": "none" if PROD else "lax", # cross-site on Render + Firebase
    "max_age": 7 * 24 * 60 * 60,          # 7 days in seconds
    "path": "/",
}
