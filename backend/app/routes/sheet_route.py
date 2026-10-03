from typing import Literal

from fastapi import APIRouter, Depends, Request, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from controllers.sheet_controller import RowsBody, list_rows, save_rows, save_sync
from database.db import get_db

router = APIRouter()


class SyncBody(BaseModel):
    minutes: Literal[5, 10, 30, 60, 1440] | None = None # in minutes
    timezone: str = Field("UTC", max_length=64)


@router.get("", status_code=status.HTTP_200_OK)
def read_rows(request: Request, db: Session = Depends(get_db)):
    return list_rows(request, db)


@router.put("", status_code=status.HTTP_200_OK)
def write_rows(body: RowsBody, request: Request, db: Session = Depends(get_db)):
    return save_rows(request, db, body.rows)


@router.patch("/sync", status_code=status.HTTP_200_OK)
def set_sync(body: SyncBody, request: Request, db: Session = Depends(get_db)):
    return save_sync(request, db, body.minutes, body.timezone)