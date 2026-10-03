import uuid
from datetime import time

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text, Time,Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from database.db import Base


class UserPreference(Base):
    """One row of settings per user."""

    __tablename__ = "user_preferences"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,  # one settings row per user
        index=True,
    )

    # Sending
    paused = Column(Boolean, nullable=False, default=False)
    daily_limit = Column(Integer, nullable=False, default=40)
    min_delay_sec = Column(Integer, nullable=False, default=30)
    max_delay_sec = Column(Integer, nullable=False, default=120)
    window_start = Column(Time, nullable=False, default=time(9, 0))
    window_end = Column(Time, nullable=False, default=time(18, 0))
    cooldown_days = Column(Integer, nullable=False, default=90)

    # Email template
    subject = Column(String(200), nullable=False)
    body = Column(Text, nullable=False)

    # Notifications
    notify_on_failure = Column(Boolean, nullable=False, default=True)
    notify_daily_summary = Column(Boolean, nullable=False, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    sync_minutes = Column(Integer, nullable=False, default=30)
    last_sync_at = Column(DateTime(timezone=True), nullable=True)
    timezone = Column(String(64), nullable=False, default="UTC")
    last_summary_on = Column(Date, nullable=True)