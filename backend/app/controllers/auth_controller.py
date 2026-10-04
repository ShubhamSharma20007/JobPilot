from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from utils.user_payload import user_out
from config.cookiOptions import COOKIE_OPTIONS
from config.config import config
from models.file_model import File as FileModel
from models.user_model import User
from schemas.resume_schema import resume_out
from schemas.user_schema import UserResponse
from utils.jwt import create_access_token
import uuid
from utils.preferences import ensure_preferences
from jose import JWTError
from utils.jwt import create_access_token, decode_access_token
from utils.cache import cache_get, cache_set, cache_delete, profile_key, session_ttl, invalidate_profile

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
        ensure_preferences(db, user.id)  # setting created on first login
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
    invalidate_profile(user.id) # if user is already logged in and changed his profile then invalidate the profile
    access_token = create_access_token({
        "sub": str(user.id),
        "email": user.email,
        "name": user.name,
    })

    response = JSONResponse(content=jsonable_encoder(user_out(db, user)))
    response.set_cookie(**COOKIE_OPTIONS, value=access_token)
    return response

def currentUser(req: Request, db: Session):
    try:
        user_id = uuid.UUID(req.state.user_id)
        
        # check in redis
        cached = cache_get(profile_key(user_id))
        if cached is not None:
            return cached

    except (ValueError, AttributeError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing user",
        )

    try:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            # default resume first, then newest first
            files = (
                db.query(FileModel)
                .filter(FileModel.user_id == user.id)
                .order_by(FileModel.is_default.desc(), FileModel.created_at.desc())
                .all()
            )
    except Exception as e:
        print(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    ensure_preferences(db, user.id)  # setting created on first login
    data = user_out(db, user)
    data["resumes"] = [resume_out(f) for f in files]
    cache_set(profile_key(user_id), data, session_ttl(req))
    return data

def logout(req: Request):
    token = req.cookies.get(COOKIE_OPTIONS["key"])
    if token:
        try:
            uid = decode_access_token(token).get("sub")
            if uid:
                cache_delete(profile_key(uid))
        except JWTError:
            pass  

    response = JSONResponse(content={"message": "Logged out successfully"})
    response.delete_cookie(
        key=COOKIE_OPTIONS["key"],
        path=COOKIE_OPTIONS["path"],
        httponly=COOKIE_OPTIONS["httponly"],
        secure=COOKIE_OPTIONS["secure"],
        samesite=COOKIE_OPTIONS["samesite"],
    )
    return response