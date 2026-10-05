import uuid

from fastapi import HTTPException, Request, UploadFile, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from utils.user_payload import user_out
from models.file_model import File as FileModel  # aliased so it doesn't clash with fastapi.File
from models.user_model import User
from schemas.resume_schema import resume_out
from schemas.user_schema import UserResponse
from utils.upload_file import deleteFile, uploadFile
from utils.preferences import kick_sync
from utils.cache import invalidate_profile
MAX_RESUME_BYTES = 5 * 1024 * 1024  # matches the 5 MB limit shown in the UI
MAX_RESUMES = 5  


def _get_user(req: Request, db: Session) -> User:
    try:
        user_id = uuid.UUID(req.state.user_id)
    except (ValueError, AttributeError, TypeError):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or missing user")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    return user


def _read_pdf(resume: UploadFile) -> bytes:
    data = resume.file.read(MAX_RESUME_BYTES + 1)
    if len(data) > MAX_RESUME_BYTES:
        raise HTTPException(413, "Resume must be 5 MB or smaller")
    if not data.startswith(b"%PDF"):  # check the real content, not just the extension
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Resume must be a PDF file")
    return data


def update_profile(
    req: Request,
    db: Session,
    name: str | None,
    resume: UploadFile | None,
    make_default: bool,
) -> dict:
    user = _get_user(req, db)

    # 1. Validate everything first so nothing is uploaded for a bad request
    if name is None and resume is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Nothing to update")

    if name is not None:
        name = name.strip()
        if not name:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Name can't be empty")
        if len(name) > 100:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Name is too long")
        user.name = name

    record = None
    uploaded = None

    if resume is not None:
        #  allow only MAX_RESUME_COUNT
        count = db.query(FileModel).filter(FileModel.user_id == user.id).count()
        if count >= MAX_RESUMES:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"You can keep up to {MAX_RESUMES} resumes. Delete one to upload another.",
            )
        data = _read_pdf(resume)
        original_name = resume.filename or "resume.pdf"

        # 2. Upload to ImageKit
        try:
            uploaded = uploadFile(data, original_name, folder="/attachments", tags=["user-resume"])
        except Exception as e:
            print("ImageKit upload error:", e)  # replace with real logging
            raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Resume upload failed. Please try again.")

        # 3. First resume is the default automatically; later ones only if asked
        has_default = (
            db.query(FileModel)
            .filter(FileModel.user_id == user.id, FileModel.is_default.is_(True))
            .first()
            is not None
        )
        is_default = make_default or not has_default
        if is_default:
            db.query(FileModel).filter(
                FileModel.user_id == user.id, FileModel.is_default.is_(True)
            ).update({"is_default": False})

        record = FileModel(
            user_id=user.id,
            original_name=original_name,
            file_path=uploaded.url,
            storage_file_id=uploaded.file_id,
            content_type="application/pdf",
            size_bytes=len(data),
            is_default=is_default,
        )
        db.add(record)

    # 4. Save; if the DB fails, don't leave an orphan file in ImageKit
    try:
        db.commit()
        db.refresh(user)
        if record:
            db.refresh(record)
    except SQLAlchemyError as e:
        db.rollback()
        print("DB error:", e)
        if uploaded:
            deleteFile(uploaded.file_id)
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Database error")
    invalidate_profile(user.id)
    if record:
        kick_sync(db, user.id)
    return {
        "user": user_out(db, user),
        "resume": resume_out(record) if record else None,
    }