"""Free, legal job sources, fetched once for everybody on a schedule.

Sources: Hacker News "Who is hiring" (Algolia API), Remotive, and optional
Greenhouse / Lever boards listed in the JOB_BOARDS env var, e.g.
    JOB_BOARDS="greenhouse:stripe,greenhouse:razorpay,lever:cred"
"""
import hashlib
import html
import os
import re
from datetime import datetime, timedelta, timezone

import requests

from database.db import SessionLocal
from models.job_model import Job
from config.config import config
HEADERS = {"User-Agent": "JobPilot/1.0 (job aggregator)"}
EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+")
TAG_RE = re.compile(r"<[^>]+>")
KEEP_DAYS = 15


def clean(text: str | None) -> str:
    if not text:
        return ""
    text = re.sub(r"(?i)<\s*(br|/p|/li|/div)\s*/?>|<p>", "\n", text)
    return html.unescape(TAG_RE.sub("", text)).strip()


def find_email(text: str) -> str | None:
    for m in EMAIL_RE.findall(text or ""):
        if not m.lower().endswith((".png", ".jpg", ".gif")):
            return m.lower()
    return None


def dedupe_hash(company: str, title: str, location: str | None) -> str:
    key = "|".join(re.sub(r"\s+", " ", (s or "").lower()).strip() for s in (company, title, location))
    return hashlib.sha1(key.encode()).hexdigest()

def _get(url: str, headers: dict | None = None, **kw):
    res = requests.get(url, headers={**HEADERS, **(headers or {})}, timeout=25, **kw)
    if not res.ok:
        print("HTTP", res.status_code, url.split("?")[0], res.text[:200])
    res.raise_for_status()
    return res.json()


def _row(source, external_id, title, company, location, url, description, posted_at) -> dict:
    description = clean(description)
    return {
        "source": source,
        "external_id": str(external_id)[:200] if external_id else None,
        "title": (title or "Open role")[:300],
        "company": (company or "Unknown")[:200],
        "location": (location or "")[:200] or None,
        "url": url,
        "description": description[:8000],
        "contact_email": find_email(description),
        "posted_at": posted_at,
    }


# ---------- Hacker News: "Ask HN: Who is hiring?" ----------
def fetch_hn() -> list[dict]:
    hits = _get(
        "https://hn.algolia.com/api/v1/search_by_date",
        params={"tags": "story,author_whoishiring", "query": "Who is hiring", "hitsPerPage": 5},
    )["hits"]
    story = next((h for h in hits if "who is hiring" in (h.get("title") or "").lower()), None)
    if not story:
        return []
    tree = _get(f"https://hn.algolia.com/api/v1/items/{story['objectID']}")
    out = []
    for c in (tree.get("children") or [])[:600]:
        text = clean(c.get("text"))
        first = text.split("\n", 1)[0]
        if not text or "|" not in first or len(first) > 300:  # top-level job posts use "Company | Role | Place"
            continue
        parts = [p.strip() for p in first.split("|")]
        posted = datetime.fromtimestamp(c["created_at_i"], tz=timezone.utc) if c.get("created_at_i") else None
        out.append(
            _row("hn", c["id"], parts[1] if len(parts) > 1 else parts[0], parts[0],
                 parts[2] if len(parts) > 2 else "", f"https://news.ycombinator.com/item?id={c['id']}", text, posted)
        )
    return out


# ---------- Remotive ----------
def fetch_remotive() -> list[dict]:
    jobs = _get("https://remotive.com/api/remote-jobs", params={"category": "software-dev", "limit": 200})["jobs"]
    out = []
    for j in jobs:
        try:
            posted = datetime.fromisoformat(j["publication_date"].replace("Z", "+00:00"))
            if posted.tzinfo is None:
                posted = posted.replace(tzinfo=timezone.utc)
        except (KeyError, ValueError):
            posted = None
        out.append(_row("remotive", j["id"], j.get("title"), j.get("company_name"),
                        j.get("candidate_required_location"), j.get("url"), j.get("description"), posted))
    return out


# ---------- Greenhouse / Lever (public board JSON per company) ----------
def fetch_greenhouse(slug: str) -> list[dict]:
    data = _get(f"https://boards-api.greenhouse.io/v1/boards/{slug}/jobs", params={"content": "true"})
    out = []
    for j in data.get("jobs", []):
        try:
            posted = datetime.fromisoformat(j["updated_at"].replace("Z", "+00:00"))
        except (KeyError, ValueError):
            posted = None
        out.append(_row("greenhouse", j["id"], j.get("title"), slug.replace("-", " ").title(),
                        (j.get("location") or {}).get("name"), j.get("absolute_url"), j.get("content"), posted))
    return out


def fetch_lever(slug: str) -> list[dict]:
    out = []
    for j in _get(f"https://api.lever.co/v0/postings/{slug}", params={"mode": "json"}):
        posted = datetime.fromtimestamp(j["createdAt"] / 1000, tz=timezone.utc) if j.get("createdAt") else None
        out.append(_row("lever", j["id"], j.get("text"), slug.replace("-", " ").title(),
                        (j.get("categories") or {}).get("location"), j.get("hostedUrl"),
                        j.get("descriptionPlain") or j.get("description"), posted))
    return out


def _board_fetchers():
    fetchers = [("hn", fetch_hn), ("remotive", fetch_remotive),
            ("adzuna", fetch_adzuna), ("jsearch", fetch_jsearch)]
    for item in filter(None, (s.strip() for s in os.getenv("JOB_BOARDS", "").split(","))):
        kind, _, slug = item.partition(":")
        if kind == "greenhouse" and slug:
            fetchers.append((item, lambda s=slug: fetch_greenhouse(s)))
        elif kind == "lever" and slug:
            fetchers.append((item, lambda s=slug: fetch_lever(s)))
    return fetchers


def refresh_jobs() -> None:
    """Scheduler entry point. One source failing never stops the others."""
    db = SessionLocal()
    try:
        added = 0
        for name, fetch in _board_fetchers():
            try:
                rows = fetch()
            except Exception as e:
                print(f"refresh_jobs: {name} failed:", e)
                continue

            by_hash = {}
            for r in rows:
                by_hash.setdefault(dedupe_hash(r["company"], r["title"], r["location"]), r)
            if not by_hash:
                continue
            known = {h for (h,) in db.query(Job.dedupe_hash).filter(Job.dedupe_hash.in_(list(by_hash))).all()}
            for h, r in by_hash.items():
                if h not in known:
                    db.add(Job(dedupe_hash=h, **r))
                    added += 1
            db.commit()

        cutoff = datetime.now(timezone.utc) - timedelta(days=KEEP_DAYS)
        db.query(Job).filter(Job.added_by.is_(None), Job.created_at < cutoff).delete(synchronize_session=False)
        db.commit()
        print(f"refresh_jobs: {added} new jobs")
    except Exception as e:
        db.rollback()
        print("refresh_jobs error:", e)
    finally:
        db.close()

def fetch_adzuna() -> list[dict]:
    app_id, app_key = config["ADZUNA_APP_ID"], config["ADZUNA_APP_KEY"]
    if not (app_id and app_key):
        print("fetch_adzuna: skipped, ADZUNA_APP_ID / ADZUNA_APP_KEY not set")
        return []
    out = []
    for page in (1, 2, 3):
        try:
            data = _get(
                f"https://api.adzuna.com/v1/api/jobs/in/search/{page}",
                params={"app_id": app_id, "app_key": app_key, "results_per_page": 50,
                        "what": "developer", "content-type": "application/json"},
            )
        except requests.RequestException as e:
            print(f"fetch_adzuna: page {page} failed ({type(e).__name__}), keeping {len(out)} jobs so far")
            break
        results = data.get("results", [])
        print(f"fetch_adzuna: page {page} returned {len(results)} jobs")
        for j in results:
            try:
                posted = datetime.fromisoformat(j["created"].replace("Z", "+00:00"))
            except (KeyError, ValueError):
                posted = None
            out.append(_row("adzuna", j["id"], j.get("title"),
                            (j.get("company") or {}).get("display_name"),
                            (j.get("location") or {}).get("display_name"),
                            j.get("redirect_url"), j.get("description"), posted))
    return out

def _dt(value):
    if not value:
        return None
    try:
        d = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return d if d.tzinfo else d.replace(tzinfo=timezone.utc)
    except ValueError:
        return None

# ---------- JSearch via OpenWebNinja ----------
def fetch_jsearch() -> list[dict]:
    key = config.get("OPENWEBNINJA_API_KEY")
    if not key:
        return []
    out = []
    for query in ("software developer in India", "full stack developer in India"):
        data = _get(
            "https://api.openwebninja.com/jsearch/search-v2",
            params={"query": query, "page": "1", "num_pages": "1",
                    "date_posted": "week", "country": "in"},
            headers={"x-api-key": key},
        )
        inner = data.get("data")
        print("fetch_jsearch: data is", type(inner).__name__,
              list(inner.keys()) if isinstance(inner, dict) else "")
        jobs = _find_jobs(inner)
        print(f"fetch_jsearch: '{query}' returned {len(jobs)} jobs")
        for j in jobs:
            place = ", ".join(x for x in (j.get("job_city"), j.get("job_state"), j.get("job_country")) if x)
            out.append(_row("jsearch", j.get("job_id"), j.get("job_title"), j.get("employer_name"),
                            place or ("Remote" if j.get("job_is_remote") else None),
                            j.get("job_apply_link"), j.get("job_description"),
                            _dt(j.get("job_posted_at_datetime_utc"))))
    return out
def _find_jobs(payload) -> list[dict]:
    """Return the first list of dicts found in the response, however it's nested."""
    if isinstance(payload, list):
        return [x for x in payload if isinstance(x, dict)]
    if isinstance(payload, dict):
        for v in payload.values():
            found = _find_jobs(v)
            if found:
                return found
    return []
