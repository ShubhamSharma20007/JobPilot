from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from controllers.settings_controller import get_settings, save_settings
from database.db import get_db
from schemas.settings_schema import SettingsPayload

router = APIRouter()


@router.get("", status_code=status.HTTP_200_OK)
def read_settings(request: Request, db: Session = Depends(get_db)):
    return get_settings(request, db)


@router.post("", status_code=status.HTTP_200_OK)
def write_settings(body: SettingsPayload, request: Request, db: Session = Depends(get_db)):
    return save_settings(request, db, body)