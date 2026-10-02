from sqlalchemy.orm import Session
from fastapi import Request
from models.file_model import File as FileModel
from schemas.resume_schema import resume_out
import uuid
import uuid

from fastapi import HTTPException, Request, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from models.file_model import File as FileModel
from schemas.resume_schema import resume_out


def make_default(file_id: uuid.UUID, req: Request, db: Session) -> dict:
    try:
        user_id = uuid.UUID(req.state.user_id)
    except (ValueError, AttributeError, TypeError):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or missing user")

    # Filtering by user_id means you can only change your own files
    file = (
        db.query(FileModel)
        .filter(FileModel.id == file_id, FileModel.user_id == user_id)
        .first()
    )
    if not file:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "File not found")

    if file.is_default:
        return resume_out(file)

    try:
        db.query(FileModel).filter(
            FileModel.user_id == user_id,
            FileModel.id != file.id,
            FileModel.is_default.is_(True),
        ).update({"is_default": False}, synchronize_session=False)
        file.is_default = True
        db.commit()
        db.refresh(file)
    except SQLAlchemyError as e:
        db.rollback()
        print("DB error:", e)
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Database error")

    return resume_out(file)