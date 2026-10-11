import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, Request, status
from sqlalchemy.orm import Session

from controllers.file_controller import delete_file, make_default
from database.db import get_db
from utils.profile_service import kick_parse
from utils.request_user import get_user_id

router = APIRouter()


@router.patch("/mark-default/{file_id}", status_code=status.HTTP_200_OK)
def mark_default_file(
    file_id: uuid.UUID, req: Request, background: BackgroundTasks, db: Session = Depends(get_db)
):
    out = make_default(file_id, req, db)
    kick_parse(db, get_user_id(req), background)  # no-op if the default didn't change
    return out


@router.delete("/{file_id}", status_code=status.HTTP_200_OK)
def delete_file_route(
    file_id: uuid.UUID, req: Request, background: BackgroundTasks, db: Session = Depends(get_db)
):
    out = delete_file(file_id, req, db)
    kick_parse(db, get_user_id(req), background)  # new default gets parsed, or profile is cleared
    return out