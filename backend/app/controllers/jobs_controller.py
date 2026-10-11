import re
import uuid
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
from fastapi import HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy import func, or_
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from config.config import config
from controllers.gmail_controller import _default_resume
from models.file_model import File as FileModel
from models.job_model import Job, UserJob
from models.oauth_token_model import OAuthToken
from models.recruiter_email_model import RecruiterEmail
from models.user_model import User
from utils.llm import  LLMAuthError, LLMError, complete_json
from utils.preferences import ensure_preferences, kick_sync
from utils.request_user import get_user_id
from utils.user_payload import GMAIL_SEND_SCOPE
from utils.categories import CATEGORY_KEYS, CATEGORY_OPTIONS, classify
from utils.profile_logic import effective_profile
from models.user_profile_model import UserProfile
MAX_AI_DAILY = 50
PAGE_SIZE = 60
AI_DAILY_LIMIT = config["AI_DAILY_LIMIT"]


# ---------- helpers ----------
def _user(req: Request, db: Session) -> User:
    user = db.get(User, get_user_id(req))
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    return user




def _llm_http(e: LLMError) -> HTTPException:
    code = status.HTTP_400_BAD_REQUEST if isinstance(e, LLMAuthError) else status.HTTP_502_BAD_GATEWAY
    return HTTPException(code, str(e))


def _default_file_id(db: Session, user_id):
    f = (
        db.query(FileModel.id)
        .filter(FileModel.user_id == user_id)
        .order_by(FileModel.is_default.desc(), FileModel.created_at.desc())
        .first()
    )
    return f[0] if f else None



def _applied_today(db: Session, user_id, tz_name: str) -> int:
    try:
        tz = ZoneInfo(tz_name or "UTC")
    except Exception:
        tz = ZoneInfo("UTC")
    midnight = datetime.now(tz).replace(hour=0, minute=0, second=0, microsecond=0)
    return (
        db.query(UserJob)
        .filter(UserJob.user_id == user_id, UserJob.status == "queued", UserJob.applied_at >= midnight)
        .count()
    )






# ---------- listing ----------
def _score(profile: dict | None, job: Job) -> int | None:
    """Cheap keyword match, no LLM call. 0-100."""
    if not profile:
        return None
    skills = (profile.get("skills") or [])[:40]
    titles = [t.lower() for t in (profile.get("titles") or [])]
    hay = f"{job.title} {(job.description or '')[:4000]}".lower()
    hits = sum(1 for s in skills if re.search(r"(?<![a-z0-9])" + re.escape(s) + r"(?![a-z0-9])", hay))
    base = 75 * hits / max(6, min(len(skills), 12))
    words = {w for t in titles for w in re.findall(r"[a-z]{4,}", t)}
    title_bonus = 25 if any(w in job.title.lower() for w in words) else 0
    return min(100, round(base + title_bonus))


def _job_out(j: Job, uj: UserJob | None, score) -> dict:
    return {
        "id": str(j.id),
        "title": j.title,
        "company": j.company,
        "location": j.location,
        "url": j.url,
        "source": j.source,
        "postedAt": j.posted_at.isoformat() if j.posted_at else None,
        "contactEmail": j.contact_email,
        "snippet": re.sub(r"\s+", " ", j.description or "")[:280],
        "score": score,
        "status": uj.status if uj else "new",
        "mine": j.added_by is not None,
        "category": j.category,
    }



def list_jobs(
    req: Request, db: Session, q: str | None, only_email: bool, page: int,
    location: str | None, remote: bool, max_age_days: int, sources: str | None, sort: str,
    category: str | None = None,
) -> dict:
    user_id = get_user_id(req)
    prof = db.get(UserProfile, user_id)
    eff = effective_profile(prof)
    prefs = ensure_preferences(db, user_id)

    if eff:
        stage = "ready"
    elif prof and prof.parse_status == "parsing":
        stage = "parsing"
    else:
        stage = "needs_position"  

    out = {
        "jobs": [], "total": 0, "pageSize": PAGE_SIZE, "stage": stage,
        "appliedToday": _applied_today(db, user_id, prefs.timezone),
        "aiDailyLimit": AI_DAILY_LIMIT,
        "domain": None, "category": None, "categories": CATEGORY_OPTIONS, "profile": None,
    }
    if stage != "ready":
        return out
    profile = eff
    domain = eff["domain"]
    
    if domain not in CATEGORY_KEYS:
        domain = classify(" ".join(profile.get("titles") or []), " ".join(profile.get("skills") or []))

    if category in (*CATEGORY_KEYS, "all"):
        effective = category                      # the user picked a chip
    else:
        effective = domain if domain != "other" else "all"   # default: their own field

    query = db.query(Job).filter(or_(Job.added_by.is_(None), Job.added_by == user_id))
    if effective != "all":
        query = query.filter(Job.category == effective)
    if q:
        like = f"%{q.strip()[:80]}%"
        query = query.filter(or_(Job.title.ilike(like), Job.company.ilike(like), Job.description.ilike(like)))
    if only_email:
        query = query.filter(Job.contact_email.isnot(None))
    if location and location.strip():
        query = query.filter(Job.location.ilike(f"%{location.strip()[:60]}%"))
    if remote:
        query = query.filter(or_(Job.source == "remotive", Job.location.ilike("%remote%"), Job.title.ilike("%remote%")))
    if max_age_days > 0:
        since = datetime.now(timezone.utc) - timedelta(days=max_age_days)
        query = query.filter(func.coalesce(Job.posted_at, Job.created_at) >= since)
    wanted = [s for s in (sources or "").split(",") if s in ("hn", "remotive", "greenhouse", "lever", "adzuna", "jsearch")]
    if wanted:
        query = query.filter(Job.source.in_(wanted))

    jobs = query.order_by(func.coalesce(Job.posted_at, Job.created_at).desc()).limit(600).all()

    states = {
        uj.job_id: uj
        for uj in db.query(UserJob).filter(UserJob.user_id == user_id, UserJob.job_id.in_([j.id for j in jobs])).all()
    }
    items = [(j, states.get(j.id), _score(profile, j)) for j in jobs]
    items = [t for t in items if not (t[1] and t[1].status == "skipped")]
    if sort == "match":
        items.sort(key=lambda t: (t[2] or 0), reverse=True)

    start = max(0, page) * PAGE_SIZE
    out.update({
        "jobs": [_job_out(*t) for t in items[start:start + PAGE_SIZE]],
        "total": len(items),
        "domain": domain,
        "category": effective,
        "profile": {"headline": eff["position"], "titles": eff["titles"][:3], "source": eff["source"]},
    })
    return out

# ---------- skip ----------
def skip_job(req: Request, db: Session, job_id: uuid.UUID) -> dict:
    user_id = get_user_id(req)
    if not db.get(Job, job_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Job not found")
    uj = db.get(UserJob, (user_id, job_id)) or UserJob(user_id=user_id, job_id=job_id)
    if uj.status != "queued":
        uj.status = "skipped"
    db.add(uj)
    db.commit()
    return {"id": str(job_id), "status": uj.status}


# ---------- apply ----------
EMAIL_SYSTEM = (
    "You write short, honest job application emails for a candidate. "
    "Use ONLY facts from the candidate profile. Never invent experience, numbers or employers. "
    "Plain text, 90-140 words, no placeholders, no markdown. Mention that the resume is attached. "
    "Sign off with the candidate's name. Reply with JSON: {\"subject\": str, \"body\": str}."
)


def _write_email(provider: str, key: str, model: str, profile: dict, sender: str, job: Job):
    prompt = (
        f"CANDIDATE NAME: {sender}\nPROFILE: {profile}\n\n"
        f"JOB TITLE: {job.title}\nCOMPANY: {job.company}\nLOCATION: {job.location or 'not stated'}\n"
        f"JOB DESCRIPTION:\n{(job.description or '')[:3000]}"
    )

    data = complete_json(provider, key, model, EMAIL_SYSTEM, prompt)
    subject = re.sub(r"\s+", " ", str(data.get("subject") or "")).strip()[:200]
    body = str(data.get("body") or "").strip()[:6000]
    if not subject or len(body) < 60:
        raise LLMError("The AI wrote an empty email. Please try again.")
    return subject, body


def apply_job(req: Request, db: Session, job_id: uuid.UUID) -> dict:
    user = _user(req, db)
    job = db.get(Job, job_id)
    if not job or (job.added_by and job.added_by != user.id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Job not found")

    if not job.contact_email:  # honest fallback: no email, so send them to the site
        return {"status": "no_contact", "applyUrl": job.url}

    ai_key = config.get("GEMINI_API_KEY")
    if not ai_key:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "AI apply is not available right now.")

    token = db.get(OAuthToken, user.id)
    if not token or not token.refresh_token_enc or GMAIL_SEND_SCOPE not in (token.scopes or "").split():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Connect your Gmail first.")
    if not _default_file_id(db, user.id):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Upload a resume on your Profile page first.")

    eff = effective_profile(db.get(UserProfile, user.id))
    if not eff:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Set your position on your Profile page first.")


    existing = db.get(UserJob, (user.id, job.id))
    if existing and existing.status == "queued":
        return {"status": "queued", "already": True}

    prefs = ensure_preferences(db, user.id)
    if _applied_today(db, user.id, prefs.timezone) >= AI_DAILY_LIMIT:
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            f"You've reached the limit of {AI_DAILY_LIMIT} AI applications today.",
        )
    # if _applied_today(db, user.id, prefs.timezone) >= row.daily_limit:
    #     raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, f"You've reached your AI limit of {row.daily_limit} applications today.")

#  Limit check
    if _applied_today(db, user.id, prefs.timezone) >= AI_DAILY_LIMIT:
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS,
                            f"You've reached the limit of {AI_DAILY_LIMIT} AI applications today.")

    # if not _profile_ready(db, user.id, row):
    #     db.refresh(row)

    try:
         subject, body = _write_email("gemini", ai_key, config["AI_MODEL"], eff, user.name or user.email, job)
    except LLMError as e:
        print('LLM ERROR: ',e)
        raise _llm_http(e)

    try:
        email = job.contact_email.lower()
        dup = (
            db.query(RecruiterEmail.id)
            .filter(RecruiterEmail.user_id == user.id, func.lower(RecruiterEmail.email) == email,
                    RecruiterEmail.status.in_(("pending", "sending")))
            .first()
        )
        if dup:
            raise HTTPException(status.HTTP_409_CONFLICT, "That address is already waiting in your sheet.")
        pos = (db.query(func.max(RecruiterEmail.position)).filter(RecruiterEmail.user_id == user.id).scalar() or 0) + 1
        db.add(RecruiterEmail(
            id=uuid.uuid4(), user_id=user.id, email=email, position=pos, status="pending",
            custom_subject=subject, custom_body=body,
        ))
        uj = existing or UserJob(user_id=user.id, job_id=job.id)
        uj.status, uj.applied_at = "queued", datetime.now(timezone.utc)
        db.add(uj)
        db.commit()
    except SQLAlchemyError as e:
        db.rollback()
        print("DB error:", e)
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Database error")

    kick_sync(db, user.id)  # the existing scheduler sends it with your daily limit, gaps and cool-down
    return {"status": "queued", "subject": subject, "body": body, "to": email}