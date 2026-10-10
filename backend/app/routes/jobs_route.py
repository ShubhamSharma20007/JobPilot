import uuid

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.orm import Session

from controllers.jobs_controller import (
    AISettingsBody, apply_job, delete_ai_key, get_ai_settings, get_models,
    list_jobs, refresh_profile, save_ai_settings, skip_job, test_ai_key,
)
from database.db import get_db
from utils.cache import rate_limit

router = APIRouter()


@router.get("", status_code=status.HTTP_200_OK)
def read_jobs(
    request: Request,
    q: str | None = Query(None, max_length=80),
    only_email: bool = False,
    page: int = Query(0, ge=0, le=50),
    location: str | None = Query(None, max_length=60),
    remote: bool = False,
    max_age_days: int = Query(0, ge=0, le=365),
    sources: str | None = Query(None, max_length=120),  # comma separated: hn,remotive,greenhouse,lever
    sort: str = Query("match", pattern="^(match|new)$"),
    db: Session = Depends(get_db),
):
    return list_jobs(request, db, q, only_email, page, location, remote, max_age_days, sources, sort)


@router.post("/{job_id}/apply", dependencies=[Depends(rate_limit("job_apply", 60, 3600))], status_code=status.HTTP_200_OK)
def apply(job_id: uuid.UUID, request: Request, db: Session = Depends(get_db)):
    return apply_job(request, db, job_id)


@router.post("/{job_id}/skip", status_code=status.HTTP_200_OK)
def skip(job_id: uuid.UUID, request: Request, db: Session = Depends(get_db)):
    return skip_job(request, db, job_id)


# ----- AI key + resume profile (kept here so the key never travels with the normal settings payload) -----
@router.get("/ai/settings", status_code=status.HTTP_200_OK)
def ai_get(request: Request, db: Session = Depends(get_db)):
    return get_ai_settings(request, db)


@router.put("/ai/settings", status_code=status.HTTP_200_OK)
def ai_put(body: AISettingsBody, request: Request, db: Session = Depends(get_db)):
    return save_ai_settings(request, db, body)


@router.get("/ai/models", status_code=status.HTTP_200_OK)
def ai_models(request: Request, provider: str = Query(max_length=16), db: Session = Depends(get_db)):
    return get_models(request, db, provider)


@router.delete("/ai/key", status_code=status.HTTP_200_OK)
def ai_delete_key(request: Request, db: Session = Depends(get_db)):
    return delete_ai_key(request, db)


@router.post("/ai/test", dependencies=[Depends(rate_limit("ai_test", 10, 3600))], status_code=status.HTTP_200_OK)
def ai_test(request: Request, db: Session = Depends(get_db)):
    return test_ai_key(request, db)


@router.post("/ai/profile", dependencies=[Depends(rate_limit("ai_profile", 10, 3600))], status_code=status.HTTP_200_OK)
def ai_profile(request: Request, db: Session = Depends(get_db)):
    return refresh_profile(request, db)