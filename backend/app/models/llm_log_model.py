import uuid

from sqlalchemy import Column, DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from database.db import Base


class LLMLog(Base):
    """One row per FAILED AI call (429, expired key, bad model, 5xx...).

    Never stores the API key or the prompt. `key_label` is the env var name
    (e.g. GEMINI_API_KEY), so you can see which key died without exposing it.
    A new table, so Base.metadata.create_all() creates it on the next start.
    """

    __tablename__ = "llm_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    purpose = Column(String(32), nullable=False)       # resume_parse | job_email
    provider = Column(String(16), nullable=False)      # gemini | openai | xai
    key_label = Column(String(32), nullable=False)     # GEMINI_API_KEY | OPENAI_API_KEY | XAI_API_KEY | GROK_API_KEY
    model = Column(String(80), nullable=False)
    error_type = Column(String(24), nullable=False)    # rate_limited | quota_exceeded | auth | model_not_found | server | network | bad_response | other
    http_status = Column(Integer, nullable=True)
    error_message = Column(Text, nullable=True)        # provider's message, redacted + truncated
    retry_after_sec = Column(Integer, nullable=True)
    latency_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    __table_args__ = (Index("ix_llm_logs_provider_time", "provider", "created_at"),)