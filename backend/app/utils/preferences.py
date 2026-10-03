import uuid

from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from models.user_perference import UserPreference
from schemas.settings_schema import DEFAULT_BODY, DEFAULT_SUBJECT

START_PAUSED = False


def kick_sync(db: Session, user_id: uuid.UUID) -> None:
    """Make the next scheduler tick (within about a minute) process this user's queue."""
    db.query(UserPreference).filter(UserPreference.user_id == user_id).update({"last_sync_at": None})
    db.commit()

def ensure_preferences(db: Session, user_id: uuid.UUID) -> UserPreference:
    """Return the user's settings row, creating it with defaults if it doesn't exist yet.

    Safe to call on every login / page load, and safe if two requests race:
    ON CONFLICT DO NOTHING means the second insert is simply ignored.
    """
    row = db.query(UserPreference).filter(UserPreference.user_id == user_id).first()
    if row:
        return row

    db.execute(
        insert(UserPreference)
        .values(user_id=user_id, subject=DEFAULT_SUBJECT, body=DEFAULT_BODY, paused=START_PAUSED)
        .on_conflict_do_nothing(index_elements=["user_id"])
    )
    db.commit()
    return db.query(UserPreference).filter(UserPreference.user_id == user_id).one()