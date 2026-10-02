import base64
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage

import requests
from cryptography.fernet import InvalidToken
from sqlalchemy.orm import Session

from config.config import config
from models.oauth_token_model import OAuthToken
from utils.crypto import decrypt, encrypt

TOKEN_URL = "https://oauth2.googleapis.com/token"
SEND_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send"


class GmailAuthError(Exception):
    """The user must reconnect Gmail (token revoked, expired or missing permission)."""


class GmailSendError(Exception):
    """Google or the network failed. Safe to show the message to the user."""


def _refresh(db: Session, row: OAuthToken) -> str:
    if not row.refresh_token_enc:
        raise GmailAuthError("No refresh token stored.")
    try:
        refresh_token = decrypt(row.refresh_token_enc)
    except (InvalidToken, RuntimeError):
        raise GmailAuthError("Stored Gmail credentials can't be read.")

    try:
        res = requests.post(
            TOKEN_URL,
            data={
                "client_id": config["GOOGLE_CLIENT_ID"],
                "client_secret": config["GOOGLE_CLIENT_SECRET"],
                "refresh_token": refresh_token,
                "grant_type": "refresh_token",
            },
            timeout=10,
        )
    except requests.RequestException:
        raise GmailSendError("Couldn't reach Google. Please try again.")

    if res.status_code != 200:
        try:
            reason = res.json().get("error", "unknown")
        except ValueError:
            reason = "unknown"
        print("Gmail token refresh failed:", reason)
        if reason == "invalid_grant":  # revoked or expired refresh token
            raise GmailAuthError("Gmail access was revoked or expired.")
        raise GmailSendError("Couldn't refresh Gmail access. Please try again.")

    data = res.json()
    access = data["access_token"]
    row.access_token_enc = encrypt(access)
    row.expires_at = datetime.now(timezone.utc) + timedelta(seconds=int(data.get("expires_in", 3600)))
    db.commit()
    return access


def _access_token(db: Session, row: OAuthToken) -> str:
    soon = datetime.now(timezone.utc) + timedelta(seconds=60)
    if row.expires_at and row.expires_at > soon:
        try:
            return decrypt(row.access_token_enc)
        except (InvalidToken, RuntimeError):
            pass  # fall through and get a fresh one
    return _refresh(db, row)


def send_message(db: Session, row: OAuthToken, msg: EmailMessage) -> str:
    """Send through the Gmail API as the connected user. Returns the Gmail message id."""
    raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()

    def _post(token: str) -> requests.Response:
        try:
            return requests.post(
                SEND_URL,
                headers={"Authorization": f"Bearer {token}"},
                json={"raw": raw},
                timeout=20,
            )
        except requests.RequestException:
            raise GmailSendError("Couldn't reach Gmail. Please try again.")

    res = _post(_access_token(db, row))
    if res.status_code == 401:  # token rejected early, refresh once and retry
        res = _post(_refresh(db, row))

    if res.status_code == 200:
        return res.json().get("id", "")

    try:
        err = res.json().get("error", {})
    except ValueError:
        err = {}
    print("Gmail send failed:", res.status_code, err.get("status"), err.get("message"))

    if res.status_code in (401, 403) and err.get("status") in ("UNAUTHENTICATED", "PERMISSION_DENIED"):
        reasons = {d.get("reason") for d in err.get("details", []) if isinstance(d, dict)}
        if "SERVICE_DISABLED" in reasons or "accessNotConfigured" in str(err):
            raise GmailSendError("The Gmail API isn't enabled for this Google Cloud project.")
        raise GmailAuthError("Gmail rejected the request.")
    if res.status_code == 429:
        raise GmailSendError("Gmail is rate limiting this account. Try again later.")
    raise GmailSendError("Gmail couldn't send the email.")