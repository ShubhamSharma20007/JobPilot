COOKIE_OPTIONS={
    "key":"session",
    "httponly":True,       # not accessible via JS
    "secure":False,        # set True in production (HTTPS)
    "samesite":"lax",
    "max_age":7 * 24 * 60 * 60,  # 7 days in seconds
    "path":"/"
}