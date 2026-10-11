import uuid
from fastapi import APIRouter, BackgroundTasks, Depends, Query, Request, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from controllers.jobs_controller import apply_job, list_jobs, skip_job
from database.db import get_db
from utils.cache import rate_limit
from utils.job_sources import fetch_for_titles
from utils.profile_logic import effective_profile
from utils.profile_service import kick_parse, profile_out, set_position
from utils.request_user import get_user_id
from models.user_profile_model import UserProfile

router = APIRouter()


class PositionBody(BaseModel):
    position: str | None = Field(None, max_length=120)


@router.get("", status_code=status.HTTP_200_OK)
def read_jobs(
    request: Request, background: BackgroundTasks,
    q: str | None = Query(None, max_length=80),
    only_email: bool = False,
    page: int = Query(0, ge=0, le=50),
    location: str | None = Query(None, max_length=60),
    remote: bool = False,
    max_age_days: int = Query(0, ge=0, le=365),
    sources: str | None = Query(None, max_length=120),
    sort: str = Query("match", pattern="^(match|new)$"),
    category: str | None = Query(None, max_length=20),
    db: Session = Depends(get_db),
):
    kick_parse(db, get_user_id(request), background)   # safety net for old users
    return list_jobs(request, db, q, only_email, page, location, remote, max_age_days, sources, sort, category)


@router.get("/profile", status_code=status.HTTP_200_OK)
def profile_get(request: Request, background: BackgroundTasks, db: Session = Depends(get_db)):
    uid = get_user_id(request)
    kick_parse(db, uid, background)
    return profile_out(db, uid)


@router.put("/profile/position", status_code=status.HTTP_200_OK)
def profile_position(body: PositionBody, request: Request, background: BackgroundTasks, db: Session = Depends(get_db)):
    uid = get_user_id(request)
    set_position(db, uid, body.position)
    eff = effective_profile(db.get(UserProfile, uid))
    if eff:
        background.add_task(fetch_for_titles, eff["titles"], False, eff["domain"])
    return profile_out(db, uid)


@router.post("/profile/reparse", dependencies=[Depends(rate_limit("reparse", 5, 3600))], status_code=status.HTTP_200_OK)
def profile_reparse(request: Request, background: BackgroundTasks, db: Session = Depends(get_db)):
    uid = get_user_id(request)
    prof = db.get(UserProfile, uid)
    if prof:
        prof.parsed_file_id = None          # forces kick_parse to run again
        db.commit()
    kick_parse(db, uid, background)
    return profile_out(db, uid)

@router.post("/{job_id}/apply", dependencies=[Depends(rate_limit("job_apply", 60, 3600))], status_code=status.HTTP_200_OK)
def apply(job_id: uuid.UUID, request: Request, db: Session = Depends(get_db)):
    return apply_job(request, db, job_id)


@router.post("/{job_id}/skip", status_code=status.HTTP_200_OK)
def skip(job_id: uuid.UUID, request: Request, db: Session = Depends(get_db)):
    return skip_job(request, db, job_id)
