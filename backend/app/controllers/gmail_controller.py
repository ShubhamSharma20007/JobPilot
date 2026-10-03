import re
from email.message import EmailMessage
from email.utils import formataddr

from models.file_model import File as FileModel
from utils.gmail_client import GmailAuthError, GmailSendError, send_message

from datetime import datetime, timedelta, timezone

import requests
from fastapi import HTTPException, Request, status,BackgroundTasks
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from database.db import SessionLocal
from config.config import config
from models.oauth_token_model import OAuthToken
from models.user_model import User
from utils.crypto import encrypt
from utils.request_user import get_user_id
from utils.user_payload import GMAIL_SEND_SCOPE
TOKEN_URL = "https://oauth2.googleapis.com/token"
MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024


def _exchange_code(code: str) -> dict:
    """Swap the one-time code from the browser pop-up for tokens."""
    try:
        res = requests.post(
            TOKEN_URL,
            data={
                "code": code,
                "client_id": config["GOOGLE_CLIENT_ID"],
                "client_secret": config["GOOGLE_CLIENT_SECRET"],
                "redirect_uri": "postmessage",  # required for the pop-up flow
                "grant_type": "authorization_code",
            },
            timeout=10,
        )
    except requests.RequestException:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Couldn't reach Google. Please try again.")

    if res.status_code != 200:
        try:
            reason = res.json().get("error", "unknown")
        except ValueError:
            reason = "unknown"
        print("Google token exchange failed:", reason)  # never log the response body or code
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Google rejected this request. Please try connecting again.")
    return res.json()


def _check_same_account(tokens: dict, user: User) -> None:
    """The Gmail being connected must belong to the Google account the user signed in with."""
    raw = tokens.get("id_token")
    if not raw:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Google didn't confirm which account this is. Please try again.")
    try:
        info = id_token.verify_oauth2_token(
            raw, google_requests.Request(), config["GOOGLE_CLIENT_ID"], clock_skew_in_seconds=10
        )
    except ValueError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Couldn't verify your Google account.")
    if info.get("sub") != user.google_id:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            f"Please connect the same Google account you signed in with ({user.email}).",
        )


def connect_gmail(req: Request, db: Session, code: str) -> dict:
    user = db.get(User, get_user_id(req))
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

    tokens = _exchange_code(code)

    # Google lets people untick individual permissions, so check what was really granted
    granted = set(tokens.get("scope", "").split())
    if GMAIL_SEND_SCOPE not in granted:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Permission to send email wasn't granted.")

    _check_same_account(tokens, user)

    access_token = tokens.get("access_token")
    if not access_token:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Google didn't return an access token.")

    row = db.get(OAuthToken, user.id)
    new_refresh = tokens.get("refresh_token")  # Google only sends this on first consent
    if not new_refresh and not (row and row.refresh_token_enc):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Google didn't give JobPilot lasting access. Remove JobPilot at "
            "https://myaccount.google.com/permissions and connect again.",
        )

    try:
        access_enc = encrypt(access_token)
        refresh_enc = encrypt(new_refresh) if new_refresh else None
    except (RuntimeError, ValueError) as e:
        print("Encryption error:", e)
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "The server isn't set up to store Gmail access.")

    try:
        if row is None:
            row = OAuthToken(user_id=user.id)
            db.add(row)
        row.access_token_enc = access_enc
        if refresh_enc:  # otherwise keep the one we already have
            row.refresh_token_enc = refresh_enc
        row.scopes = " ".join(sorted(granted))
        row.expires_at = datetime.now(timezone.utc) + timedelta(seconds=int(tokens.get("expires_in", 3600)))
        db.commit()
        was_paused = bool(row.paused) if row else False 
        if was_paused and not body.paused:
            kick_sync(db, user_id)
       
    except SQLAlchemyError as e:
        db.rollback()
        print("DB error:", e)
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Database error")
        

    return {"gmail_connected": True, "gmail_bounce_check": "https://www.googleapis.com/auth/gmail.readonly" in granted}



def _deliver_test_email(user_id, subject: str, body: str) -> None:
    """Runs after the response. Opens its own DB session, since the request's is closed."""
    db = SessionLocal()
    try:
        user = db.get(User, user_id)
        row = db.get(OAuthToken, user_id)
        if not user or not row:
            return

        display_name = user.name or user.email
        msg = EmailMessage()
        msg["From"] = formataddr((display_name.replace("\n", " ").replace("\r", " "), user.email))
        msg["To"] = user.email
        msg["Subject"] = "[Test] " + _fill(subject, display_name).replace("\r", " ").replace("\n", " ")
        msg.set_content(_fill(body, display_name))

        resume = _default_resume(db, user)
        if resume:
            data, filename = resume
            msg.add_attachment(data, maintype="application", subtype="pdf", filename=filename)

        try:
            send_message(db, row, msg)
        except GmailAuthError:
            # Tokens unusable: clear them so the UI offers "Connect Gmail" again
            db.delete(row)
            db.commit()
            print("Test email: Gmail access expired for user", user_id)
        except GmailSendError as e:
            print("Test email failed:", e)
    except Exception as e:  # never let a background task crash silently
        db.rollback()
        print("Test email error:", e)
    finally:
        db.close()

def _fill(text: str, name: str) -> str:
    """Same sample data the Preview tab uses."""
    sample = {
        "company": "Master's Union",
        "role": "Full Stack Developer",
        "recruiter_name": "Priya",
        "name": name,
    }
    return re.sub(r"\{\{\s*(\w+)\s*\}\}", lambda m: sample.get(m.group(1), m.group(0)), text)


def _default_resume(db: Session, user: User) -> tuple[bytes, str] | None:
    """Download the default resume. Returns None if there isn't one or it can't be fetched."""
    f = (
        db.query(FileModel)
        .filter(FileModel.user_id == user.id)
        .order_by(FileModel.is_default.desc(), FileModel.created_at.desc())
        .first()
    )
    if not f:
        return None
    try:
        res = requests.get(f.file_path, timeout=15)
        res.raise_for_status()
    except requests.RequestException as e:
        print("Resume download failed:", e)
        return None
    if len(res.content) > MAX_ATTACHMENT_BYTES:
        return None
    return res.content, f.original_name


def send_test_email(req: Request, db: Session,background_tasks: BackgroundTasks, subject: str, body: str) -> dict:
    user = db.get(User, get_user_id(req))
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

    row = db.get(OAuthToken, user.id)
    if not row or not row.refresh_token_enc or GMAIL_SEND_SCOPE not in (row.scopes or "").split():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Connect your Gmail first.")

    background_tasks.add_task(_deliver_test_email, user.id, subject, body)

    return {"sent_to": user.email, "queued": True}