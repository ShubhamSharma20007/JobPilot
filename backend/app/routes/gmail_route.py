from fastapi import APIRouter, Depends, Request, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from controllers.gmail_controller import connect_gmail
from database.db import get_db

router = APIRouter()


class ConnectBody(BaseModel):
    code: str = Field(min_length=1, max_length=2048)


@router.post("/connect", status_code=status.HTTP_200_OK)
def connect(body: ConnectBody, request: Request, db: Session = Depends(get_db)):
    return connect_gmail(request, db, body.code)