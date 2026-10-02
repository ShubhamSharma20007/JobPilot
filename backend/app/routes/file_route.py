import uuid

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from controllers.file_controller import delete_file, make_default
from database.db import get_db

router = APIRouter()


@router.patch("/mark-default/{file_id}", status_code=status.HTTP_200_OK)
def mark_default_file(file_id: uuid.UUID, req: Request, db: Session = Depends(get_db)):
    return make_default(file_id, req, db)


@router.delete("/{file_id}", status_code=status.HTTP_200_OK)
def delete_file_route(file_id: uuid.UUID, req: Request, db: Session = Depends(get_db)):
    return delete_file(file_id, req, db)