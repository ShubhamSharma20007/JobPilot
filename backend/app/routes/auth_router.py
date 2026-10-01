from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database.db import get_db
from controllers.auth_controller import google_verify

router = APIRouter()


class TokenVerification(BaseModel):
    token: str


@router.post("/google/verify", status_code=status.HTTP_200_OK)
def verify_google_token(body: TokenVerification, db: Session = Depends(get_db)):
    return google_verify(body.token, db)