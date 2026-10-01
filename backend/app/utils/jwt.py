from jose import jwt
from datetime import datetime, timedelta, timezone
from config.config import config


def create_access_token(data: dict) -> str:
    payload = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=config["JWT_EXPIRE_DAYS"])
    payload.update({"exp": expire})
    return jwt.encode(payload, config["JWT_SECRET"], algorithm=config["JWT_ALGORITHM"])


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, config["JWT_SECRET"], algorithms=[config["JWT_ALGORITHM"]])
