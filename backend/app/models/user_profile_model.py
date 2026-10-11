from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.sql import func

from database.db import Base


class UserProfile(Base):
    """Position + parsed resume. Server-side, no user API key."""

    __tablename__ = "user_profiles"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    manual_position = Column(String(120), nullable=True)      # user typed this; wins over the resume
    parsed = Column(JSONB, nullable=True)                     # from the default resume
    parsed_file_id = Column(UUID(as_uuid=True), nullable=True)
    parse_status = Column(String(12), nullable=False, default="none")  # none | parsing | ready | failed
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())