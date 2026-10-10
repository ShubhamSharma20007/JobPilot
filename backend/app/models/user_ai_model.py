from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.sql import func

from database.db import Base


class UserAI(Base):
    """Bring-your-own-key settings plus the profile parsed from the user's resume.

    A separate table (not new columns on user_preferences) so Base.metadata.create_all()
    creates it for you. create_all never alters an existing table.
    """

    __tablename__ = "user_ai"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    provider = Column(String(16), nullable=False, default="gemini")  # gemini | openai | anthropic
    model = Column(String(80), nullable=False)
    key_enc = Column(Text, nullable=True)  # Fernet-encrypted, never returned to the browser
    key_hint = Column(String(8), nullable=True)  # last 4 characters, safe to show
    daily_limit = Column(Integer, nullable=False, default=10)

    profile = Column(JSONB, nullable=True)  # parsed from the default resume
    profile_file_id = Column(UUID(as_uuid=True), nullable=True)  # which resume it came from

    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())