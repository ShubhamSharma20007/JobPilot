from fastapi import Request, status
from fastapi.responses import JSONResponse
from jose import JWTError

from config.cookiOptions import COOKIE_OPTIONS
from utils.jwt import decode_access_token

PUBLIC_PATHS = {"/", "/docs", "/openapi.json", "/redoc", "/db-check", "/auth/logout"}
PUBLIC_PREFIXES = ("/auth/google",)


def _unauthorized(detail: str) -> JSONResponse:
    return JSONResponse(status_code=status.HTTP_401_UNAUTHORIZED, content={"detail": detail})


async def auth_middleware(request: Request, call_next):
    path = request.url.path

    # Let CORS preflight and public routes through
    if request.method == "OPTIONS" or path in PUBLIC_PATHS or path.startswith(PUBLIC_PREFIXES):
        return await call_next(request)

    token = request.cookies.get(COOKIE_OPTIONS["key"])
    if not token:
        return _unauthorized("Missing authentication token")

    try:
        payload = decode_access_token(token)

    except JWTError:
        return _unauthorized("Invalid or expired token")

    user_id = payload.get("sub")
    if not user_id:
        return _unauthorized("Invalid authentication token")

    request.state.user_id = user_id
    request.state.token_exp = payload.get("exp")
    return await call_next(request)