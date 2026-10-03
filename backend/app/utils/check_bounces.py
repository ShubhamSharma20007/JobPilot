"""Finds Gmail bounce notices ("Address not found") and marks those rows as failed.

Gmail accepts a message for a non-existent address and only reports the problem
later, as a bounce email in the sender's inbox. This job looks ONLY for those
notices (sent by mailer-daemon / postmaster) and reads just their headers and
short snippet, never the body of any other mail.
"""
import re
from datetime import datetime, timedelta, timezone

import requests
from sqlalchemy import func

from database.db import SessionLocal
from models.oauth_token_model import OAuthToken
from models.recruiter_email_model import RecruiterEmail
from utils.gmail_client import GmailAuthError, GmailSendError, _access_token, _refresh

READ_SCOPE = "https://www.googleapis.com/auth/gmail.readonly"
API = "https://gmail.googleapis.com/gmail/v1/users/me/messages"
QUERY = "from:(mailer-daemon OR postmaster) newer_than:3d"
LOOKBACK = timedelta(days=3)
EMAIL_RE = re.compile(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+")


def _get(db, row: OAuthToken, url: str, params: list) -> requests.Response:
    def call(token: str) -> requests.Response:
        try:
            return requests.get(url, headers={"Authorization": f"Bearer {token}"}, params=params, timeout=20)
        except requests.RequestException:
            raise GmailSendError("Couldn't reach Gmail.")

    res = call(_access_token(db, row))
    if res.status_code == 401:
        res = call(_refresh(db, row))
    return res


def _reason(snippet: str) -> str:
    # Gmail's notice starts with a short title, e.g. "Address not found Your message wasn't delivered to..."
    head = snippet.split("Your message")[0].strip()
    return (head or "Delivery failed")[:120]


def fetch_bounces(db, row: OAuthToken) -> list[tuple[str, datetime, str]]:
    """Returns (failed address, when the bounce arrived, reason) for recent bounce notices."""
    res = _get(db, row, API, [("q", QUERY), ("maxResults", "50")])
    if res.status_code in (401, 403):
        raise GmailAuthError("No permission to read bounce notices.")
    if res.status_code != 200:
        raise GmailSendError("Couldn't list bounce notices.")

    out = []
    for m in res.json().get("messages", []):
        r = _get(db, row, f"{API}/{m['id']}", [("format", "metadata"), ("metadataHeaders", "X-Failed-Recipients")])
        if r.status_code != 200:
            continue
        data = r.json()
        headers = {h["name"].lower(): h["value"] for h in data.get("payload", {}).get("headers", [])}
        snippet = data.get("snippet", "")
        # Gmail puts the failed address in this header; fall back to the snippet text
        addrs = EMAIL_RE.findall(headers.get("x-failed-recipients", "")) or EMAIL_RE.findall(snippet)
        when = datetime.fromtimestamp(int(data["internalDate"]) / 1000, tz=timezone.utc)
        reason = _reason(snippet)
        out.extend((a.lower(), when, reason) for a in addrs)
    return out


def mark_bounced(db, user_id, bounces) -> int:
    """Flip rows we marked 'sent' to 'failed'. Safe to run repeatedly."""
    cutoff = datetime.now(timezone.utc) - LOOKBACK
    changed = 0
    for email, when, reason in bounces:
        rows = (
            db.query(RecruiterEmail)
            .filter(
                RecruiterEmail.user_id == user_id,
                RecruiterEmail.status == "sent",
                func.lower(RecruiterEmail.email) == email,
                RecruiterEmail.sent_at >= cutoff,
                RecruiterEmail.sent_at <= when,  # the bounce must come after the send
            )
            .all()
        )
        for r in rows:
            r.status = "failed"
            r.last_error = f"Bounced: {reason}"
            r.failed_at = func.now()
            changed += 1
    db.commit()
    return changed


def check_bounces() -> None:
    db = SessionLocal()
    try:
        cutoff = datetime.now(timezone.utc) - LOOKBACK
        tokens = db.query(OAuthToken).filter(OAuthToken.scopes.contains(READ_SCOPE)).all()
        for t in tokens:
            recent = (
                db.query(RecruiterEmail.id)
                .filter(RecruiterEmail.user_id == t.user_id, RecruiterEmail.status == "sent",
                        RecruiterEmail.sent_at >= cutoff)
                .first()
            )
            if not recent:
                continue  # nothing that could still bounce
            try:
                n = mark_bounced(db, t.user_id, fetch_bounces(db, t))
                if n:
                    print(f"check_bounces: {n} bounced for user {t.user_id}")
            except (GmailAuthError, GmailSendError) as e:
                db.rollback()
                print("check_bounces skipped:", t.user_id, e)
    except Exception as e:
        db.rollback()
        print("check_bounces error:", e)
    finally:
        db.close()