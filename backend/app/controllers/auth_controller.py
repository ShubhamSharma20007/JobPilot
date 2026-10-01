from fastapi import HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from config.cookiOptions import COOKIE_OPTIONS
from config.config import config
from models.user_model import User
from schemas.user_schema import UserResponse
from utils.jwt import create_access_token


def _verify_google_token(token: str) -> dict:
    try:
        return id_token.verify_oauth2_token(
            token,
            google_requests.Request(),
            config["GOOGLE_CLIENT_ID"],
            clock_skew_in_seconds=10,
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token",
        )


def _find_or_create_user(db: Session, info: dict) -> User:
    google_id = info["sub"]
    email = info.get("email")

    try:
        # 1. Returning user: match by the stable Google ID
        user = db.query(User).filter(User.google_id == google_id).first()

        # 2. Existing account with the same email: link it
        if not user:
            user = db.query(User).filter(User.email == email).first()
            if user:
                user.google_id = google_id

        # 3. Brand-new user
        if not user:
            user = User(
                email=email,
                name=info.get("name"),
                picture=info.get("picture"),
                google_id=google_id,
            )
            db.add(user)

        db.commit()
        db.refresh(user)
        return user

    except SQLAlchemyError as e:
        db.rollback()
        print("DB error:", e)  # replace with real logging
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error",
        )


def google_verify(token: str, db: Session) -> JSONResponse:
    info = _verify_google_token(token)
    user = _find_or_create_user(db, info)

    access_token = create_access_token({
        "sub": str(user.id),
        "email": user.email,
        "name": user.name,
    })

    response = JSONResponse(
        content=jsonable_encoder(UserResponse.model_validate(user))
    )
    response.set_cookie(**COOKIE_OPTIONS, value=access_token)
    return response