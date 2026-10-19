"""Free, legal job sources, fetched on a schedule and on demand for each resume's titles.

Boards: Hacker News "Who is hiring", Remotive, optional Greenhouse / Lever via
    JOB_BOARDS="greenhouse:stripe,lever:cred"
Per-title: Adzuna and JSearch, queried with the job titles found in users' resumes.

Quota protection (Adzuna + JSearch have small free limits):
  * each (source, job title) is called at most ONCE per UTC day, tracked in Redis
  * each source also has a hard daily budget: ADZUNA_DAILY_LIMIT / JSEARCH_DAILY_LIMIT
Results are saved in the jobs table, so every user shares them for the rest of the day.
"""
import hashlib
import html
import os
import re
from collections import Counter
from datetime import datetime, timedelta, timezone

import requests
from sqlalchemy.exc import IntegrityError

from config.config import config
from database.db import SessionLocal
from models.job_model import Job
from utils.cache import cache_claim, cache_incr, cache_release
from utils.categories import classify
from models.user_profile_model import UserProfile
from utils.profile_logic import effective_profile

HEADERS = {"User-Agent": "JobPilot/1.0 (job aggregator)"}
EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+")
TAG_RE = re.compile(r"<[^>]+>")
KEEP_DAYS = 10
PLACE = "India"                   # change this, or read it from profile["location"] later

# Hard cap of API calls per source per UTC day, whatever the titles are. Override in .env.
DAILY_LIMITS = {
    "adzuna": int(os.getenv("ADZUNA_DAILY_LIMIT", "50")),
    "jsearch": int(os.getenv("JSEARCH_DAILY_LIMIT", "10")),
}


# ---------- helpers ----------
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


def _dt(value):
    if not value:
        return None
    try:
        d = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return d if d.tzinfo else d.replace(tzinfo=timezone.utc)
    except ValueError:
        return None


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
        "category": classify(title, description),
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
        if not text or "|" not in first or len(first) > 300:
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


# ---------- Greenhouse / Lever ----------
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


# ---------- Adzuna (per title) ----------
def fetch_adzuna(what: str = "developer", pages: tuple = (1,)) -> list[dict]:
    app_id, app_key = config["ADZUNA_APP_ID"], config["ADZUNA_APP_KEY"]
    if not (app_id and app_key):
        print("fetch_adzuna: skipped, ADZUNA_APP_ID / ADZUNA_APP_KEY not set")
        return []
    out = []
    for page in pages:
        # errors propagate to fetch_for_titles, which decides whether the day's claim is kept
        data = _get(
        f"https://api.adzuna.com/v1/api/jobs/in/search/{page}",
        params={"app_id": app_id, "app_key": app_key, "results_per_page": 50,
            "what": what, "sort_by": "date", "max_days_old": 14,
            "content-type": "application/json"},
        )
        for j in data.get("results", []):
            try:
                posted = datetime.fromisoformat(j["created"].replace("Z", "+00:00"))
            except (KeyError, ValueError):
                posted = None
            out.append(_row("adzuna", j["id"], j.get("title"),
                            (j.get("company") or {}).get("display_name"),
                            (j.get("location") or {}).get("display_name"),
                            j.get("redirect_url"), j.get("description"), posted))
    return out


# ---------- JSearch via OpenWebNinja (per title) ----------
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


def fetch_jsearch(queries: list[str] | None = None) -> list[dict]:
    key = config.get("OPENWEBNINJA_API_KEY")
    if not key:
        return []
    out = []
    for query in (queries or []):
        data = _get(
            "https://api.openwebninja.com/jsearch/search-v2",
            params={"query": query, "page": "1", "num_pages": "1",
                    "date_posted": "week", "country": "in"},
            headers={"x-api-key": key},
        )
        jobs = _find_jobs(data.get("data"))
        print(f"fetch_jsearch: '{query}' returned {len(jobs)} jobs")
        for j in jobs:
            place = ", ".join(x for x in (j.get("job_city"), j.get("job_state"), j.get("job_country")) if x)
            out.append(_row("jsearch", j.get("job_id"), j.get("job_title"), j.get("employer_name"),
                            place or ("Remote" if j.get("job_is_remote") else None),
                            j.get("job_apply_link"), j.get("job_description"),
                            _dt(j.get("job_posted_at_datetime_utc"))))
    return out


# ---------- storing ----------
def _store(db, rows: list[dict]) -> int:
    by_hash = {}
    for r in rows:
        by_hash.setdefault(dedupe_hash(r["company"], r["title"], r["location"]), r)
    if not by_hash:
        return 0
    known = {h for (h,) in db.query(Job.dedupe_hash).filter(Job.dedupe_hash.in_(list(by_hash))).all()}
    added = 0
    for h, r in by_hash.items():
        if h not in known:
            db.add(Job(dedupe_hash=h, **r))
            added += 1
    try:
        db.commit()
    except IntegrityError:   # two runs inserted the same job at once
        db.rollback()
        return 0
    return added


# ---------- once-a-day guard for the limited APIs ----------
# source name -> (is it configured?, how to call it for one title)
SOURCES = {
    "adzuna": (
        lambda: bool(config.get("ADZUNA_APP_ID") and config.get("ADZUNA_APP_KEY")),
        lambda title: fetch_adzuna(title, pages=(1, 2)),
    ),
    "jsearch": (
        lambda: bool(config.get("OPENWEBNINJA_API_KEY")),
        lambda title: fetch_jsearch([f"{title} in {PLACE}"]),
    ),
}


def _seconds_left_today() -> int:
    """Seconds until the next UTC midnight (+1 min), so a claim dies when the day rolls over."""
    now = datetime.now(timezone.utc)
    midnight = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    return int((midnight - now).total_seconds()) + 60


def _norm(title: str) -> str:
    return re.sub(r"\s+", " ", title.lower()).strip()


def _claim_call(source: str, title: str) -> str | None:
    """Ask permission to call `source` for `title` today.
    Returns the claim key if allowed, or None if it was already called today or the daily budget is used up."""
    ttl = _seconds_left_today()
    day = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    key = f"jobapi:{source}:{day}:{_norm(title)}"
    if not cache_claim(key, ttl):                       # same title already fetched today
        return None
    if cache_incr(f"jobapi:budget:{source}:{day}", ttl) > DAILY_LIMITS[source]:
        cache_release(key)                              # budget gone: stop calling this source until tomorrow
        print(f"job_sources: {source} daily budget ({DAILY_LIMITS[source]}) used up")
        return None
    return key


def fetch_for_titles(titles: list[str], force: bool = False, domain: str | None = None) -> int:
    """Fetch jobs for the titles of a parsed resume (any profession).

    Adzuna and JSearch run at most once per (source, title) per UTC day, and never more than their
    daily budget. `force=True` skips that guard, so only use it for a manual one-off run.

    `domain` is the user's field. Jobs the keyword classifier can't place ("other")
    take it, so a search for "Staff Nurse" is never hidden from the nurse who asked for it.
    """
    db = SessionLocal()
    added = 0
    try:
        for title in [t.strip() for t in titles if t and t.strip()][:3]:
            rows: list[dict] = []
            for source, (configured, call) in SOURCES.items():
                if not configured():
                    continue
                key = None
                if not force:
                    key = _claim_call(source, title)
                    if key is None:
                        print(f"job_sources: skip {source} '{title}' (already fetched today or budget used)")
                        continue
                try:
                    rows += call(title)
                except requests.HTTPError as e:
                    # 429 / 4xx / 5xx: keep the claim, so a rate-limited key isn't hammered all day
                    print(f"job_sources: {source} '{title}' failed with HTTP error, retry tomorrow:", e)
                except requests.RequestException as e:
                    # network problem: the provider never counted it, so give the claim back
                    if key:
                        cache_release(key)
                    print(f"job_sources: {source} '{title}' network error, will retry later:", e)
                except Exception as e:
                    print(f"job_sources: {source} '{title}' failed:", e)
            if domain and domain != "other":
                for r in rows:
                    if r["category"] == "other":
                        r["category"] = domain
            added += _store(db, rows)
        print(f"fetch_for_titles: {added} new jobs for {titles[:3]}")
    except Exception as e:
        db.rollback()
        print("fetch_for_titles error:", e)
    finally:
        db.close()
    return added


def _demand_titles(db, limit: int = 12) -> list[tuple[str, str | None]]:
    """The most common (title, domain) pairs across all users' positions."""
    counts: Counter = Counter()
    for prof in db.query(UserProfile).all():
        eff = effective_profile(prof)
        if eff:
            for t in eff["titles"][:2]:
                counts[(t.lower().strip(), eff["domain"])] += 1
    return [pair for pair, _ in counts.most_common(limit)]


def _board_fetchers():
    # tech-heavy sources. Jobs are tagged by category, so non-tech users never see them.
    fetchers = [("hn", fetch_hn), ("remotive", fetch_remotive)]
    for item in filter(None, (s.strip() for s in os.getenv("JOB_BOARDS", "").split(","))):
        kind, _, slug = item.partition(":")
        if kind == "greenhouse" and slug:
            fetchers.append((item, lambda s=slug: fetch_greenhouse(s)))
        elif kind == "lever" and slug:
            fetchers.append((item, lambda s=slug: fetch_lever(s)))
    return fetchers


def refresh_jobs() -> None:
    """Daily. Shared boards + the titles our users' resumes actually need."""
    titles: list[tuple[str, str | None]] = []
    db = SessionLocal()
    try:
        added = 0
        for name, fetch in _board_fetchers():
            try:
                added += _store(db, fetch())
            except Exception as e:
                print(f"refresh_jobs: {name} failed:", e)

        titles = _demand_titles(db)
        cutoff = datetime.now(timezone.utc) - timedelta(days=KEEP_DAYS)
        db.query(Job).filter(Job.added_by.is_(None), Job.created_at < cutoff).delete(synchronize_session=False)
        db.commit()
        print(f"refresh_jobs: {added} new jobs from boards")
    except Exception as e:
        db.rollback()
        print("refresh_jobs error:", e)
    finally:
        db.close()

    # outside the session above, because fetch_for_titles opens its own.
    # force=False on purpose: a title a user already triggered today must not be fetched again.
    for title, domain in titles:
        fetch_for_titles([title], force=False, domain=domain)