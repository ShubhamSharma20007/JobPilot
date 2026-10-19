"""Auto follow-up: one polite nudge for sent emails that got no reply.

Runs hourly. For every user who turned follow-ups on, it looks at emails sent
`followup_days` ago, asks Gmail whether anyone but the user wrote in that thread,
and, if nobody did, queues ONE follow-up row. The normal sender then delivers it,
so the daily limit, send window and random gaps all apply as usual.

Needs the same read-only Gmail permission as the bounce check. Only the message
labels / headers of the thread are read, never the text of anyone's reply.
"""
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import func

from database.db import SessionLocal
from models.oauth_token_model import OAuthToken
from models.recruiter_email_model import RecruiterEmail
from models.user_model import User
from models.user_perference import UserPreference
from utils.check_bounces import API, READ_SCOPE, _get
from utils.gmail_client import GmailAuthError, GmailSendError

THREAD_API = "https://gmail.googleapis.com/gmail/v1/users/me/threads"
MAX_AGE_DAYS = 30   # don't chase emails older than this (e.g. right after the user turns the toggle on)
PER_USER_PER_RUN = 20

#  Followup body
BODY = """Hi,

I wanted to quickly follow up on my earlier email, in case it got buried in your inbox.

I'm still very interested in the opportunity, and my resume is attached to the first message in this thread. If it would help, I'm happy to share more details about my work or jump on a short call whenever it suits you.

If this role has already been filled, no worries at all. I'd be glad to be considered for future openings.

Thank you for your time,
{name}"""

def message_meta(db, token: OAuthToken, gmail_id: str) -> dict | None:
    """Thread id, RFC Message-ID and subject of one of our sent messages (None if it's gone)."""
    res = _get(db, token, f"{API}/{gmail_id}",
               [("format", "metadata"), ("metadataHeaders", "Message-ID"), ("metadataHeaders", "Subject")])
    if res.status_code == 404:
        return None
    if res.status_code != 200:
        raise GmailSendError("Couldn't read the original email.")
    data = res.json()
    headers = {h["name"].lower(): h["value"] for h in data.get("payload", {}).get("headers", [])}
    return {"thread_id": data.get("threadId"), "message_id": headers.get("message-id"),
            "subject": headers.get("subject", "")}


def has_reply(db, token: OAuthToken, thread_id: str) -> bool:
    """True if the thread contains a message the user did not send (a reply or an auto-responder)."""
    res = _get(db, token, f"{THREAD_API}/{thread_id}", [("format", "minimal")])
    if res.status_code == 404:
        return False
    if res.status_code != 200:
        raise GmailSendError("Couldn't read the email thread.")
    return any("SENT" not in m.get("labelIds", []) for m in res.json().get("messages", []))


def _queue_for_user(db, prefs: UserPreference, token: OAuthToken) -> int:
    now = datetime.now(timezone.utc)
    rows = (
        db.query(RecruiterEmail)
        .filter(
            RecruiterEmail.user_id == prefs.user_id,
            RecruiterEmail.status == "sent",
            RecruiterEmail.reply_to_gmail_id.is_(None),   # a follow-up never gets a follow-up
            RecruiterEmail.followup_checked_at.is_(None),
            RecruiterEmail.gmail_message_id.isnot(None),
            RecruiterEmail.gmail_message_id != "",
            RecruiterEmail.sent_at <= now - timedelta(days=prefs.followup_days),
            RecruiterEmail.sent_at >= now - timedelta(days=MAX_AGE_DAYS),
        )
        .order_by(RecruiterEmail.sent_at.asc())
        .limit(PER_USER_PER_RUN)
        .all()
    )
    if not rows:
        return 0

    user = db.get(User, prefs.user_id)
    name = (user.name if user and user.name else "").strip() or "Best regards"
    queued = 0
    for r in rows:
        meta = message_meta(db, token, r.gmail_message_id)
        r.followup_checked_at = func.now()  # look at each email once
        if not meta or not meta["thread_id"] or already_replied(db, token, r.user_id, r.gmail_message_id, r.email):
            db.commit()
            continue
        subject = meta["subject"] or "Following up"
        if not subject.lower().startswith("re:"):
            subject = "Re: " + subject
        db.add(RecruiterEmail(
            id=uuid.uuid4(), user_id=r.user_id, email=r.email, position=0, status="pending",
            custom_subject=subject[:200], custom_body=BODY.format(name=name),
            reply_to_gmail_id=r.gmail_message_id,
        ))
        db.commit()
        queued += 1
    return queued


def queue_followups() -> None:
    db = SessionLocal()
    try:
        users = (
            db.query(UserPreference, OAuthToken)
            .join(OAuthToken, OAuthToken.user_id == UserPreference.user_id)
            .filter(UserPreference.followup_enabled.is_(True), OAuthToken.scopes.contains(READ_SCOPE))
            .all()
        )
        for prefs, token in users:
            try:
                n = _queue_for_user(db, prefs, token)
                if n:
                    print(f"followups: queued {n} for user {prefs.user_id}")
            except (GmailAuthError, GmailSendError) as e:
                db.rollback()
                print("followups skipped:", prefs.user_id, e)
    except Exception as e:
        db.rollback()
        print("followups error:", e)
    finally:
        db.close()
        
        
        
def replied_from_address(db,token:OAuthToken,email:str,since:datetime)->bool:
    """True if this recruiter address wrote to the user after `since`, in ANY thread."""
    q =f"from:{email} after:{int(since.timestamp())}"
    res = _get(db, token, API, [("q", q), ("maxResults", "1")])
    if res.status_code != 200:
        raise GmailSendError("Couldn't check for replies.")
    return bool(res.json().get("messages"))


def already_replied(db, token: OAuthToken, user_id, first_gmail_id: str, email: str) -> bool:
    """Did the recruiter answer the first email, in its thread or from the same address elsewhere?"""
    first = (
        db.query(RecruiterEmail.sent_at)
        .filter(RecruiterEmail.user_id == user_id, RecruiterEmail.gmail_message_id == first_gmail_id)
        .first()
    )
    since = first[0] if first and first[0] else datetime.now(timezone.utc) - timedelta(days=MAX_AGE_DAYS)

    meta = message_meta(db, token, first_gmail_id)
    if meta and meta["thread_id"] and has_reply(db, token, meta["thread_id"]):
        return True
    return replied_from_address(db, token, email, since)