import re  # for email validation (Regex)
import uuid 

from fastapi import HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy import func
from zoneinfo import ZoneInfo

from models.recruiter_email_model import RecruiterEmail
from models.user_perference import UserPreference
from schemas.settings_schema import DEFAULT_BODY, DEFAULT_SUBJECT
from utils.request_user import get_user_id


EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]{2,}$")
LOCKED =('sending','sent')


class RowIn(BaseModel):
    id: uuid.UUID
    email: str = Field(max_length=500)


class RowsBody(BaseModel):
    rows: list[RowIn] = Field(max_length=500)



def _out(r: RecruiterEmail) -> dict:
    return {
        "id": str(r.id),
        "email": r.email,
        "status": r.status,
        "sentAt": r.sent_at.isoformat() if r.sent_at else None,
        "lastError": r.last_error,
    }

def list_rows(req: Request, db: Session) -> dict:
    user_id = get_user_id(req)
    rows = (
        db.query(RecruiterEmail)
        .filter(RecruiterEmail.user_id == user_id)
        .order_by(RecruiterEmail.position, RecruiterEmail.created_at)
        .all()
    )
    prefs = db.query(UserPreference).filter(UserPreference.user_id == user_id).first()
    return {"rows": [_out(r) for r in rows], "syncMinutes": prefs.sync_minutes if prefs else 30}


def save_rows(req: Request, db: Session, rows: list[RowIn]) -> dict:
    user_id = get_user_id(req)
    ids = [r.id for r in rows]

    # Lock the rows we're about to touch, so a cron claim can't interleave with this save
    existing = {}
    if ids:
        found = db.query(RecruiterEmail).filter(RecruiterEmail.id.in_(ids)).with_for_update().all()
        existing = {r.id: r for r in found}

    seen: set[str] = set()
    for pos, item in enumerate(rows):
        email = item.email.strip()
        key = email.lower()
        valid = bool(EMAIL_RE.match(email)) and key not in seen  # a second copy stays a draft
        if valid:
            seen.add(key)

        row = existing.get(item.id)
        if row is not None and row.user_id != user_id:
            continue  # someone else's id, ignore
        if row is None:
            if not email:
                continue
            row = RecruiterEmail(id=item.id, user_id=user_id)
            db.add(row)
        elif row.status in LOCKED:
            row.position = pos  # sending or sent: the address can't change any more
            continue

        row.position = pos
        changed = row.email != email
        if changed:  # only a real edit restarts the settle timer
            row.email = email
            row.edited_at = func.now()
            row.attempts = 0
        if changed or row.status in ("draft", "pending"):
            row.status = "pending" if valid else "draft"

    # Rows deleted in the grid disappear, except ones already being sent or sent
    db.query(RecruiterEmail).filter(
        RecruiterEmail.user_id == user_id,
        RecruiterEmail.status.in_(("draft", "pending", "failed")),
        ~RecruiterEmail.id.in_(ids),
    ).delete(synchronize_session=False)

    db.commit()
    return list_rows(req, db)


def save_sync(req: Request, db: Session, minutes: int | None, tz: str) -> dict:
    try:
        ZoneInfo(tz)
    except Exception:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Unknown timezone")
    user_id = get_user_id(req)
    row = db.query(UserPreference).filter(UserPreference.user_id == user_id).first()
    if row is None:
        # Created paused: nothing is sent with the default template until the user has reviewed Settings
        row = UserPreference(user_id=user_id, subject=DEFAULT_SUBJECT, body=DEFAULT_BODY, paused=True)
        db.add(row)
    if minutes is not None:
        row.sync_minutes = minutes
    row.timezone = tz
    db.commit()
    return {"syncMinutes": row.sync_minutes}