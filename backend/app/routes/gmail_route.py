from fastapi import APIRouter, Depends, Request, status,BackgroundTasks
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from controllers.gmail_controller import connect_gmail, send_test_email
from database.db import get_db

router = APIRouter()


class ConnectBody(BaseModel):
    code: str = Field(min_length=1, max_length=2048)


class TestEmailBody(BaseModel):
    subject: str = Field(min_length=1, max_length=200)
    body: str = Field(min_length=1, max_length=10_000)


@router.post("/connect", status_code=status.HTTP_200_OK)
def connect(body: ConnectBody, request: Request, db: Session = Depends(get_db)):
    return connect_gmail(request, db, body.code)


@router.post("/test", status_code=status.HTTP_200_OK)
def test_email(body: TestEmailBody, request: Request, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    return send_test_email(request, db,background_tasks, body.subject.strip(), body.body.strip())