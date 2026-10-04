from fastapi import APIRouter, Depends, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database.db import get_db
from controllers.auth_controller import google_verify, currentUser, logout

router = APIRouter()


class TokenVerification(BaseModel):
    token: str


@router.post("/google/verify", status_code=status.HTTP_200_OK)
def verify_google_token(body: TokenVerification, db: Session = Depends(get_db)):
    return google_verify(body.token, db)


@router.get("/me", status_code=status.HTTP_200_OK)
def get_me(request: Request, db: Session = Depends(get_db)):
    return currentUser(request, db)


@router.post("/logout", status_code=status.HTTP_200_OK)
def logout_user(request:Request):
    return logout(request)