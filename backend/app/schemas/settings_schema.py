from datetime import time

from pydantic import BaseModel, ConfigDict, Field, field_serializer, field_validator, model_validator
from pydantic.alias_generators import to_camel

DEFAULT_SUBJECT = "Application for {{role}} at {{company}}"
DEFAULT_BODY = """Hi {{recruiter_name}},

I came across the {{role}} opening at {{company}} and would love to be considered. My resume is attached.

I'd be glad to share more about my work whenever it suits you.

Thanks for your time,
{{name}}"""


class SettingsPayload(BaseModel):
    """Request and response body. The API speaks camelCase to match the client's AppSettings type."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    # Sending
    paused: bool = False
    daily_limit: int = Field(40, ge=1, le=100)
    min_delay_sec: int = Field(30, ge=10, le=3600)
    max_delay_sec: int = Field(120, ge=10, le=3600)
    window_start: time = time(9, 0)  # accepts "HH:MM"
    window_end: time = time(18, 0)
    cooldown_days: int = Field(90, ge=1, le=365)

    # Email template
    subject: str = Field(DEFAULT_SUBJECT, min_length=1, max_length=200)
    body: str = Field(DEFAULT_BODY, min_length=1, max_length=10_000)

    # Notifications
    notify_on_failure: bool = True
    notify_daily_summary: bool = False

    @field_validator("subject")
    @classmethod
    def _subject_ok(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Subject can't be empty")
        if "\r" in v or "\n" in v:  # subject goes into an email header
            raise ValueError("Subject must be a single line")
        return v

    @field_validator("body")
    @classmethod
    def _body_ok(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Message can't be empty")
        return v

    @model_validator(mode="after")
    def _ranges_ok(self):
        if self.min_delay_sec > self.max_delay_sec:
            raise ValueError("The minimum gap can't be higher than the maximum gap")
        if self.window_start >= self.window_end:
            raise ValueError("The send window must end after it starts")
        return self

    @field_serializer("window_start", "window_end")
    def _hhmm(self, v: time) -> str:
        return v.strftime("%H:%M")