from utils.categories import CATEGORIES, classify

# Used only when we know the user's FIELD but not their exact job title
# (no AI key on the server, or the resume had no clear title).
# It is a search query, never shown to the user as "their position".
DEFAULT_QUERY = {
    "software": "software developer",
    "data_ai": "data analyst",
    "design": "graphic designer",
    "product": "project manager",
    "marketing": "digital marketing executive",
    "content": "content writer",
    "sales": "sales executive",
    "finance": "accountant",
    "hr": "hr executive",
    "operations": "operations executive",
    "support": "customer support executive",
    "healthcare": "healthcare professional",
    "education": "teacher",
    "engineering": "engineer",
    "legal": "legal associate",
}


def effective_profile(prof) -> dict | None:
    """Manual position wins. Otherwise the parsed resume. None = nothing to match jobs with yet.

    `exact` is True when `position` is a real job title (typed by the user, or found in the resume).
    It is False when we only know the field, so the UI can ask for the exact role.
    """
    if not prof:
        return None
    parsed = prof.parsed or {}
    manual = (prof.manual_position or "").strip()

    if manual:
        return {**parsed, "position": manual, "headline": manual, "titles": [manual],
                "domain": classify(manual), "source": "manual", "exact": True}

    if not parsed:
        return None

    titles = parsed.get("titles") or []
    headline = (parsed.get("headline") or "").strip()
    domain = parsed.get("domain")
    if domain not in CATEGORIES:
        domain = "other"

    if titles or headline:
        position = titles[0] if titles else headline
        return {**parsed, "position": position, "titles": titles or [position],
                "domain": domain, "source": "resume", "exact": True}

    if domain == "other":
        return None   # we know nothing useful, ask the user to type a position

    # field only: search with a sensible default query, but don't pretend it is their title
    return {**parsed, "position": CATEGORIES[domain][0],
            "titles": [DEFAULT_QUERY.get(domain, CATEGORIES[domain][0].lower())],
            "domain": domain, "source": "resume", "exact": False}