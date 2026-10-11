import traceback
from datetime import datetime, timedelta, timezone

import requests
from fastapi import BackgroundTasks
from utils.categories import CATEGORIES
from database.db import SessionLocal
from models.file_model import File as FileModel
from models.user_profile_model import UserProfile
from utils.job_sources import fetch_for_titles
from utils.llm import LLMError
from utils.profile_logic import effective_profile
from utils.resume_parser import parse_resume_server

STALE = timedelta(seconds=90)   # a "parsing" row older than this is treated as dead (e.g. server restarted)


def default_file(db, user_id):
    return (
        db.query(FileModel).filter(FileModel.user_id == user_id)
        .order_by(FileModel.is_default.desc(), FileModel.created_at.desc()).first()
    )


def kick_parse(db, user_id, background: BackgroundTasks) -> None:
    """Parse the default resume in the background if it hasn't been parsed yet.
    A new default resume wipes the old position, so the position always follows the current resume."""
    f = default_file(db, user_id)
    prof = db.get(UserProfile, user_id)

    if not f:  # last resume deleted: clear everything
        if prof and (prof.parsed or prof.parsed_file_id or prof.manual_position):
            prof.parsed = None
            prof.parsed_file_id = None
            prof.manual_position = None
            prof.parse_status = "none"
            db.commit()
        return

    if prof and prof.parsed_file_id == f.id:
        if prof.parse_status != "parsing":
            return                                   # already done (or failed once: no loop)
        if prof.updated_at and prof.updated_at > datetime.now(timezone.utc) - STALE:
            return                                   # a parse is running right now
        prof.parse_status = "failed"                 # parse never finished (restart/crash)
        db.commit()
        return

    if prof is None:
        prof = UserProfile(user_id=user_id)
        db.add(prof)
    prof.parsed_file_id, prof.parse_status = f.id, "parsing"
    prof.parsed = None            # old resume's data must not leak into the new one
    prof.manual_position = None   # a typed role only belongs to the resume it was typed for
    db.commit()
    background.add_task(run_parse, user_id, f.id)
def _mark_failed(user_id, file_id) -> None:
    """Always leave a terminal state, so the page never spins on "Reading your resume" forever."""
    db = SessionLocal()
    try:
        prof = db.get(UserProfile, user_id)
        if prof and prof.parsed_file_id == file_id and prof.parse_status == "parsing":
            prof.parse_status = "failed"
            db.commit()
    except Exception as e:
        db.rollback()
        print("run_parse: couldn't mark failed:", e)
    finally:
        db.close()


def run_parse(user_id, file_id) -> None:
    db = SessionLocal()
    titles, domain = [], None
    try:
        f, prof = db.get(FileModel, file_id), db.get(UserProfile, user_id)
        if not f or not prof:
            return
        try:
            res = requests.get(f.file_path, timeout=20)
            res.raise_for_status()
            parsed = parse_resume_server(res.content, user_id)
        except (requests.RequestException, LLMError) as e:
            print("run_parse failed:", e)
            prof.parse_status = "failed"
            db.commit()
            return
        if prof.parsed_file_id != file_id:           # default resume changed meanwhile
            return
        prof.parsed, prof.parse_status = parsed, "ready"
        db.commit()
        eff = effective_profile(prof)
        if eff:
            titles, domain = eff["titles"], eff["domain"]
    except Exception:
        db.rollback()
        print("run_parse error:\n" + traceback.format_exc())
        _mark_failed(user_id, file_id)
    finally:
        db.close()
    if titles:                                       # pull jobs for this position
        try:
            fetch_for_titles(titles, False, domain)
        except Exception as e:
            print("run_parse: fetching jobs failed:", e)


def profile_out(db, user_id) -> dict:
    prof = db.get(UserProfile, user_id)
    eff = effective_profile(prof)
    parsed = (prof.parsed or {}) if prof else {}
    titles = parsed.get("titles") or []
    domain = eff["domain"] if eff else None
    return {
        "position": eff["position"] if eff else None,
        "source": eff["source"] if eff else None,
        "exact": bool(eff and eff.get("exact")),
        "field": CATEGORIES[domain][0] if domain in CATEGORIES else None,
        "manualPosition": prof.manual_position if prof else None,
        "resumePosition": titles[0] if titles else (parsed.get("headline") or None),
        "domain": domain,
        "status": prof.parse_status if prof else "none",
        "hasResume": default_file(db, user_id) is not None,
    }

def set_position(db, user_id, position: str | None) -> None:
    prof = db.get(UserProfile, user_id)
    if prof is None:
        prof = UserProfile(user_id=user_id)
        db.add(prof)
    prof.manual_position = (position or "").strip() or None
    db.commit()