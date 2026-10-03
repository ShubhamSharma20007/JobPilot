from fastapi import HTTPException, Request, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from models.user_perference import UserPreference
from schemas.settings_schema import SettingsPayload
from utils.preferences import kick_sync
from utils.request_user import get_user_id


_FIELDS = (
    "paused",
    "daily_limit",
    "min_delay_sec",
    "max_delay_sec",
    "window_start",
    "window_end",
    "cooldown_days",
    "subject",
    "body",
    "notify_on_failure",
    "notify_daily_summary",
)


def _out(payload: SettingsPayload) -> dict:
    return payload.model_dump(by_alias=True, mode="json")


def _from_row(row: UserPreference) -> SettingsPayload:
    return SettingsPayload(**{f: getattr(row, f) for f in _FIELDS})


def get_settings(req: Request, db: Session) -> dict:
    user_id = get_user_id(req)

    try:
        row = db.query(UserPreference).filter(UserPreference.user_id == user_id).first()
    except SQLAlchemyError as e:
        print("DB error:", e)
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Database error")

    # Nothing saved yet: return the defaults without writing anything
    return _out(_from_row(row) if row else SettingsPayload())


def save_settings(req: Request, db: Session, body: SettingsPayload) -> dict:
    """Create the user's settings row on first save, update it afterwards."""
    user_id = get_user_id(req)

    try:
        row = db.query(UserPreference).filter(UserPreference.user_id == user_id).first()
        was_paused = bool(row.paused) if row else False

        if row is None:
            row = UserPreference(user_id=user_id)
            db.add(row)

        for field in _FIELDS:
            setattr(row, field, getattr(body, field))

        db.commit()
        db.refresh(row)
    except SQLAlchemyError as e:
        db.rollback()
        print("DB error:", e)  # replace with real logging
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Database error")

    if was_paused and not body.paused:
        kick_sync(db, user_id)

    return _out(_from_row(row))