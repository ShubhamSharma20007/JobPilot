import uuid

from fastapi import HTTPException, Request, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from models.file_model import File as FileModel
from schemas.resume_schema import resume_out
from utils.upload_file import deleteFile


def _user_id(req: Request) -> uuid.UUID:
    try:
        return uuid.UUID(req.state.user_id)
    except (ValueError, AttributeError, TypeError):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or missing user")


def _owned_file(db: Session, user_id: uuid.UUID, file_id: uuid.UUID) -> FileModel:
   
    file = db.query(FileModel).filter(FileModel.id == file_id, FileModel.user_id == user_id).first()
    if not file:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "File not found")
    return file


def make_default(file_id: uuid.UUID, req: Request, db: Session) -> dict:
    user_id = _user_id(req)
    file = _owned_file(db, user_id, file_id)

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


def delete_file(file_id: uuid.UUID, req: Request, db: Session) -> dict:
    user_id = _user_id(req)
    file = _owned_file(db, user_id, file_id)

    deleted_id = file.id
    storage_id = file.storage_file_id  # ImageKit id; older rows may not have one
    was_default = file.is_default
    new_default_id = None

    try:
        db.delete(file)
        db.flush()

        if was_default:
            # Promote the newest remaining resume so the user always has a default
            newest = (
                db.query(FileModel)
                .filter(FileModel.user_id == user_id, FileModel.id != deleted_id)
                .order_by(FileModel.created_at.desc())
                .first()
            )
            if newest:
                newest.is_default = True
                new_default_id = str(newest.id)

        db.commit()
    except SQLAlchemyError as e:
        db.rollback()
        print("DB error:", e)
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Database error")

    # After the commit, so a failure here never loses the user's data.
    # deleteFile already swallows and logs its own errors.
    if storage_id:
        deleteFile(storage_id)

    return {"id": str(deleted_id), "newDefaultId": new_default_id}