import uuid
from sqlalchemy import Column, DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from database.db import Base


class RecruiterEmail(Base):
    __tablename__ = "recruiter_emails"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)  # the grid's row id
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    email = Column(String(320), nullable=False)
    position = Column(Integer, nullable=False, default=0)
    # draft = incomplete/invalid/duplicate, pending = valid and waiting, sending, sent, failed
    status = Column(String(16), nullable=False, default="draft")
    attempts = Column(Integer, nullable=False, default=0)
    last_error = Column(Text, nullable=True)
    gmail_message_id = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    edited_at = Column(DateTime(timezone=True), server_default=func.now())  # last time the USER changed the address
    sent_at = Column(DateTime(timezone=True), nullable=True)
    failed_at = Column(DateTime(timezone=True), nullable=True)
    __table_args__ = (Index("ix_recruiter_queue", "user_id", "status", "created_at"),)