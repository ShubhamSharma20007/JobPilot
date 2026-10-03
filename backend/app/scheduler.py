import random
import re
import time
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from email.utils import formataddr
from zoneinfo import ZoneInfo

from apscheduler.jobstores.base import ConflictingIdError
from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy import func, text

from controllers.gmail_controller import _default_resume
from database.db import SessionLocal
from models.oauth_token_model import OAuthToken
from models.recruiter_email_model import RecruiterEmail
from models.user_model import User
from models.user_perference import UserPreference
from utils.gmail_client import GmailAuthError, GmailSendError, send_message
from utils.check_bounces import check_bounces


SETTLE_SECONDS = 10  # an address must be untouched this long before it can be sent
MAX_ATTEMPTS = 3
PLACEHOLDER = re.compile(r"\{\{\s*(\w+)\s*\}\}")
FREE_MAIL = {"gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com",
             "proton.me", "protonmail.com", "live.com", "rediffmail.com"}

scheduler = BackgroundScheduler(timezone="UTC")


# ---------- time helpers (all based on the user's timezone) ----------
def _tz(prefs: UserPreference) -> ZoneInfo:
    try:
        return ZoneInfo(prefs.timezone or "UTC")
    except Exception:
        return ZoneInfo("UTC")


def _in_window(prefs: UserPreference) -> bool:
    return prefs.window_start <= datetime.now(_tz(prefs)).time() < prefs.window_end


def _local_midnight(prefs: UserPreference) -> datetime:
    return datetime.now(_tz(prefs)).replace(hour=0, minute=0, second=0, microsecond=0)


def _sent_today(db, prefs: UserPreference) -> int:
    return (
        db.query(RecruiterEmail)
        .filter(RecruiterEmail.user_id == prefs.user_id, RecruiterEmail.status == "sent",
                RecruiterEmail.sent_at >= _local_midnight(prefs))
        .count()
    )


# ---------- template ----------
def _vars_for(email: str, sender_name: str) -> dict:
    """The sheet only has an email column, so fill the other placeholders with sensible fallbacks."""
    domain = email.split("@")[-1].lower()
    company = "your company" if domain in FREE_MAIL else domain.split(".")[0].replace("-", " ").title()
    return {"name": sender_name, "recruiter_name": "there", "company": company, "role": "the open position"}


def _render(template: str, values: dict) -> tuple[str, set]:
    missing: set = set()

    def sub(m):
        key = m.group(1)
        if key in values:
            return values[key]
        missing.add(key)
        return m.group(0)

    return PLACEHOLDER.sub(sub, template), missing


# ---------- queue helpers ----------
def _claim(db, user_id, limit: int, exclude: set) -> list[tuple]:
    """Oldest settled rows first. pending -> sending in one transaction."""
    cutoff = datetime.now(timezone.utc) - timedelta(seconds=SETTLE_SECONDS)
    q = db.query(RecruiterEmail).filter(
        RecruiterEmail.user_id == user_id,
        RecruiterEmail.status == "pending",
        RecruiterEmail.edited_at <= cutoff,
    )
    if exclude:
        q = q.filter(~RecruiterEmail.id.in_(list(exclude)))
    rows = (
        q.order_by(RecruiterEmail.created_at.asc(), RecruiterEmail.position.asc())
        .limit(limit)
        .with_for_update(skip_locked=True)
        .all()
    )
    claimed = [(r.id, r.email) for r in rows]
    for r in rows:
        r.status = "sending"
        r.attempts += 1
    db.commit()
    return claimed


def _has_pending(db, user_id, exclude: set) -> bool:
    q = db.query(RecruiterEmail.id).filter(RecruiterEmail.user_id == user_id, RecruiterEmail.status == "pending")
    if exclude:
        q = q.filter(~RecruiterEmail.id.in_(list(exclude)))
    found = q.first() is not None
    db.commit()
    return found

def _mark(db, row_id, **values) -> None:
    db.query(RecruiterEmail).filter(RecruiterEmail.id == row_id).update(values)
    db.commit()


def _release(db, row_ids: list) -> None:
    """Put unsent rows back in the queue (paused, window closed, limit hit, Gmail expired)."""
    db.query(RecruiterEmail).filter(RecruiterEmail.id.in_(row_ids)).update(
        {"status": "pending", "attempts": RecruiterEmail.attempts - 1}, synchronize_session=False
    )
    db.commit()


def _retry_soon(db, user_id) -> None:
    """Outside the send window: make the next tick re-check instead of waiting a whole sync interval."""
    db.query(UserPreference).filter(UserPreference.user_id == user_id).update({"last_sync_at": None})
    db.commit()


def _recently_sent(db, user_id, email: str, days: int):
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    return (
        db.query(func.max(RecruiterEmail.sent_at))
        .filter(RecruiterEmail.user_id == user_id, func.lower(RecruiterEmail.email) == email.lower(),
                RecruiterEmail.status == "sent", RecruiterEmail.sent_at >= cutoff)
        .scalar()
    )


def _wait(db, user_id, seconds: float) -> bool:
    """Sleep in 5s steps so 'Pause sending' takes effect right away. False means paused."""
    end = time.monotonic() + seconds
    while time.monotonic() < end:
        time.sleep(min(5, max(0.0, end - time.monotonic())))
        paused = db.query(UserPreference.paused).filter(UserPreference.user_id == user_id).scalar()
        db.commit()  # don't sit idle inside a transaction while sleeping
        if paused:
            return False
    return True


# ---------- notifications (mail to the user themselves) ----------
def _system_mail(db, user_email: str, token, subject: str, body: str) -> None:
    msg = EmailMessage()
    msg["From"] = formataddr(("JobPilot", user_email))
    msg["To"] = user_email
    msg["Subject"] = subject
    msg.set_content(body)
    try:
        send_message(db, token, msg)
    except (GmailAuthError, GmailSendError) as e:
        print("Notification not sent:", e)  # if Gmail itself is the problem, there's no way to email them


def _fail(db, prefs, user_email: str, token, row_id, recipient: str, reason: str) -> None:
    _mark(db, row_id, status="failed", last_error=reason, failed_at=func.now())
    if prefs.notify_on_failure:
        _system_mail(
            db, user_email, token,
            f"[JobPilot] Couldn't send to {recipient}",
            f"JobPilot couldn't send your application to {recipient}.\n\n"
            f"Reason: {reason}\n\n"
            "Fix the address in your sheet, or check your Gmail connection in Settings.",
        )


# ---------- per-user run ----------
def sync_user(user_id) -> None:
    db = SessionLocal()
    try:
        prefs = db.query(UserPreference).filter(UserPreference.user_id == user_id).first()
        user = db.get(User, user_id)
        token = db.get(OAuthToken, user_id)
        if not (prefs and user and token):
            return

        sender_email = user.email
        sender_name = user.name or user.email
        resume = None
        done: set = set()   # rows handled in this run, so a retry isn't picked up again straight away
        need_gap = False

        while True:  # keep going until nothing is left, so rows added during the run are sent too
            db.refresh(prefs)
            if prefs.paused:
                print("sync_user: paused", user_id); return
            if not _has_pending(db, user_id, done):
                print("sync_user: nothing pending", user_id); return
            if not _in_window(prefs):
                print("sync_user: outside window", prefs.timezone, prefs.window_start, prefs.window_end)
                _retry_soon(db, user_id); return
            quota = prefs.daily_limit - _sent_today(db, prefs)
            if quota <= 0:
                print("sync_user: daily limit reached", user_id); return

            batch = _claim(db, user_id, quota, done)
            if not batch:
                return

            if resume is None:  # download the resume once per run
                resume = _default_resume(db, user)
                if resume is None:  # the template says "my resume is attached"
                    print("sync_user: no resume available for", user_id)
                    _release(db, [r for r, _ in batch])
                    return
            data, filename = resume

            for i, (row_id, email) in enumerate(batch):
                done.add(row_id)
                rest = [r for r, _ in batch[i:]]

                # Repeat cool-down
                last = _recently_sent(db, user_id, email, prefs.cooldown_days)
                if last:
                    days = max(1, (datetime.now(timezone.utc) - last).days)
                    _mark(db, row_id, status="skipped",
                          last_error=f"Already emailed {days} day(s) ago (cool-down is {prefs.cooldown_days} days)")
                    continue

                # Gap between emails
                if need_gap and not _wait(db, user_id, random.uniform(prefs.min_delay_sec, prefs.max_delay_sec)):
                    _release(db, rest)
                    return

                # Re-read settings: pause, window and daily limit can change while we pace ourselves
                db.refresh(prefs)
                if prefs.paused:
                    _release(db, rest)
                    return
                if not _in_window(prefs):
                    _release(db, rest)
                    _retry_soon(db, user_id)
                    return
                if prefs.daily_limit - _sent_today(db, prefs) <= 0:
                    _release(db, rest)
                    return

                # Template
                values = _vars_for(email, sender_name)
                subject, miss_a = _render(prefs.subject, values)
                body, miss_b = _render(prefs.body, values)
                missing = miss_a | miss_b
                if missing:
                    names = ", ".join("{{" + m + "}}" for m in sorted(missing))
                    _fail(db, prefs, sender_email, token, row_id, email, f"Template uses unknown placeholder(s): {names}")
                    continue

                msg = EmailMessage()
                msg["From"] = formataddr((sender_name.replace("\n", " ").replace("\r", " "), sender_email))
                msg["To"] = email
                msg["Subject"] = subject.replace("\r", " ").replace("\n", " ")
                msg.set_content(body)
                msg.add_attachment(data, maintype="application", subtype="pdf", filename=filename)

                try:
                    message_id = send_message(db, token, msg)
                except GmailAuthError:
                    _release(db, rest)
                    db.delete(token)  # UI shows "Connect Gmail" again
                    db.commit()
                    return
                except GmailSendError as e:
                    attempts = db.get(RecruiterEmail, row_id).attempts
                    if attempts < MAX_ATTEMPTS:
                        _mark(db, row_id, status="pending", last_error=str(e))  # retried next sync
                    else:
                        _fail(db, prefs, sender_email, token, row_id, email, str(e))
                    need_gap = True
                    continue

                _mark(db, row_id, status="sent", sent_at=func.now(), gmail_message_id=message_id, last_error=None)
                need_gap = True
    except Exception as e:
        db.rollback()
        print("sync_user error:", user_id, e)
    finally:
        db.close()

# ---------- daily summary ----------
def send_summaries() -> None:
    db = SessionLocal()
    try:
        users = db.query(UserPreference.user_id).filter(UserPreference.notify_daily_summary.is_(True)).all()
        for (uid,) in users:
            prefs = db.query(UserPreference).filter(UserPreference.user_id == uid).first()
            now = datetime.now(_tz(prefs))
            if now.time() < prefs.window_end:  # "evening" = once the send window has closed
                continue
            today = now.date()
            claimed = db.execute(text("""
                UPDATE user_preferences SET last_summary_on = :d
                 WHERE user_id = :u AND (last_summary_on IS NULL OR last_summary_on <> :d)
                RETURNING user_id"""), {"d": today, "u": uid}).first()
            db.commit()
            if not claimed:
                continue

            user, token = db.get(User, uid), db.get(OAuthToken, uid)
            if not (user and token):
                continue
            midnight = _local_midnight(prefs)
            count = lambda *f: db.query(RecruiterEmail).filter(RecruiterEmail.user_id == uid, *f).count()
            sent = count(RecruiterEmail.status == "sent", RecruiterEmail.sent_at >= midnight)
            failed = count(RecruiterEmail.status == "failed", RecruiterEmail.failed_at >= midnight)
            queued = count(RecruiterEmail.status == "pending")
            if not (sent or failed):
                continue  # nothing happened today, no email

            _system_mail(
                db, user.email, token, f"[JobPilot] Today: {sent} sent, {failed} failed",
                f"Your JobPilot summary for {today:%d %b %Y}\n\n"
                f"Sent: {sent}\nFailed: {failed}\nStill queued: {queued}\n\n"
                "Failure reasons are shown in your sheet.",
            )
    except Exception as e:
        db.rollback()
        print("send_summaries error:", e)
    finally:
        db.close()


# ---------- the tick ----------

def tick() -> None:
    db = SessionLocal()

    try:
        # Atomic "is this user due?". Only users with settled pending rows and a Gmail connection.
        due = db.execute(
            text("""
                UPDATE user_preferences p
                SET last_sync_at = now()
                WHERE p.paused = false
                  AND (
                      p.last_sync_at IS NULL
                      OR p.last_sync_at <= now() - make_interval(mins => p.sync_minutes)
                  )
                  AND EXISTS (
                      SELECT 1
                      FROM oauth_tokens t
                      WHERE t.user_id = p.user_id
                  )
                RETURNING p.user_id
            """)
        ).scalars().all()

        db.commit()

    finally:
        db.close()

    for uid in due:
        try:
            scheduler.add_job(
                sync_user,
                args=[uid],
                id=f"sync:{uid}",
                max_instances=1
            )
        except ConflictingIdError:
            pass  # that user's previous run is still pacing its emails


def recover_interrupted() -> None:
    db = SessionLocal()
    try:
        db.query(RecruiterEmail).filter(RecruiterEmail.status == "sending").update(
            {"status": "failed", "failed_at": func.now(),
             "last_error": "Interrupted by a restart. Check your Sent folder before retrying."}
        )
        db.commit()
    finally:
        db.close()


def start_scheduler() -> None:
    recover_interrupted()
    scheduler.add_job(tick, "interval", seconds=60, id="tick", max_instances=1, coalesce=True)
    scheduler.add_job(send_summaries, "interval", minutes=5, id="summaries", max_instances=1, coalesce=True)
    scheduler.add_job(check_bounces, "interval", minutes=10, id="bounces", max_instances=1, coalesce=True)
    scheduler.start()