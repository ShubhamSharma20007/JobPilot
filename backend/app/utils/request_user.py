import uuid

from fastapi import HTTPException, Request, status


def get_user_id(req: Request) -> uuid.UUID:
    """The id the auth middleware stored on the request from the session cookie."""
    try:
        return uuid.UUID(req.state.user_id)
    except (ValueError, AttributeError, TypeError):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or missing user")