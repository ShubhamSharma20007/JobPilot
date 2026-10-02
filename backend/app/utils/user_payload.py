import uuid

from sqlalchemy.orm import Session

from models.oauth_token_model import OAuthToken
from models.user_model import User
from schemas.user_schema import UserResponse

GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send"


def is_gmail_connected(db: Session, user_id: uuid.UUID) -> bool:
    row = db.get(OAuthToken, user_id)
    return bool(row and row.refresh_token_enc and GMAIL_SEND_SCOPE in (row.scopes or "").split())


def user_out(db: Session, user: User) -> dict:
    data = UserResponse.model_validate(user).model_dump(mode="json")
    data["gmail_connected"] = is_gmail_connected(db, user.id)
    return data