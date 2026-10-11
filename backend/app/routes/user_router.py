from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, Request, UploadFile, status
from sqlalchemy.orm import Session
from controllers.user_controller import update_profile,delete_profile
from database.db import get_db
from utils.profile_service import kick_parse
from utils.request_user import get_user_id
from utils.cache import rate_limit
router = APIRouter()


@router.patch("/profile", dependencies=[Depends(rate_limit("resume_upload", 10, 3600))], status_code=status.HTTP_200_OK)
def update_user_profile(
    request: Request,
    background: BackgroundTasks,
    name: str | None = Form(None),
    resume: UploadFile | None = File(None),
    make_default: bool = Form(False),
    db: Session = Depends(get_db),
):
    out = update_profile(request, db, name, resume, make_default)
    if resume is not None:
        kick_parse(db, get_user_id(request), background)
    return out

@router.delete('/profile',status_code=status.HTTP_204_NO_CONTENT)
def delete_user_profile(
    request: Request,
    db: Session = Depends(get_db),
):
    """Delete user profile."""
    return delete_profile(request, db)