from fastapi import APIRouter, Depends, File, Form, Request, UploadFile, status
from sqlalchemy.orm import Session

from controllers.user_controller import update_profile
from database.db import get_db

router = APIRouter()


@router.patch("/profile", status_code=status.HTTP_200_OK)
def update_user_profile(
    request: Request,
    name: str | None = Form(None),
    resume: UploadFile | None = File(None),
    make_default: bool = Form(False),
    db: Session = Depends(get_db),
):
    """Multipart form: optional `name`, optional `resume` (PDF), optional `make_default`."""
    return update_profile(request, db, name, resume, make_default)