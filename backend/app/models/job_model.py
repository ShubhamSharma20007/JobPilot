import uuid

from sqlalchemy import Column, DateTime, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from database.db import Base


class Job(Base):
    """Shared job pool. Filled by the scheduler (added_by is NULL) or by one user (manual add)."""

    __tablename__ = "jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source = Column(String(32), nullable=False)  # hn | remotive | greenhouse | lever | manual
    external_id = Column(String(200), nullable=True)
    title = Column(String(300), nullable=False)
    company = Column(String(200), nullable=False)
    location = Column(String(200), nullable=True)
    url = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    contact_email = Column(String(320), nullable=True)
    posted_at = Column(DateTime(timezone=True), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    dedupe_hash = Column(String(40), nullable=False, unique=True)
    added_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)


class UserJob(Base):
    """What one user did with one job."""

    __tablename__ = "user_jobs"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"), primary_key=True)
    status = Column(String(16), nullable=False, default="saved")  # queued | skipped
    applied_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (Index("ix_user_jobs_applied", "user_id", "applied_at"),)