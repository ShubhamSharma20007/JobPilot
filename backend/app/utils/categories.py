"""Fixed job taxonomy + a free keyword classifier (no LLM call)."""
import re

CATEGORIES = {
    "software": ("Software & IT", [
        "software", "developer", "programmer", "full stack", "fullstack", "frontend", "front-end",
        "backend", "back-end", "devops", "sre", "qa engineer", "sdet", "android", "ios", "react",
        "node.js", "java", "javascript", "typescript", "python", "golang", ".net", "web developer",
        "cloud engineer", "embedded", "cybersecurity", "security engineer", "system administrator",
        "network engineer", "it support",
    ]),
    "data_ai": ("Data & AI", [
        "data scientist", "data analyst", "data engineer", "machine learning", "ml engineer",
        "ai engineer", "business intelligence", "bi analyst", "analytics", "nlp", "computer vision",
    ]),
    "design": ("Design", [
        "designer", "ui/ux", "ux", "graphic", "illustrator", "animator", "art director", "motion",
        "video editor",
    ]),
    "product": ("Product & Projects", [
        "product manager", "product owner", "program manager", "project manager", "scrum master",
        "business analyst", "project coordinator",
    ]),
    "marketing": ("Marketing", [
        "marketing", "seo", "social media", "growth", "brand", "performance marketing",
        "digital marketing", "campaign", "community manager",
    ]),
    "content": ("Content & Media", [
        "content writer", "copywriter", "editor", "journalist", "content strategist",
        "technical writer", "translator", "content creator",
    ]),
    "sales": ("Sales & Business Dev", [
        "sales", "business development", "account executive", "account manager", "sdr", "bdr",
        "inside sales", "relationship manager", "telecaller",
    ]),
    "finance": ("Finance & Accounting", [
        "accountant", "accounting", "finance", "auditor", "audit", "tax", "banking", "investment",
        "financial analyst", "payroll", "bookkeeper", "chartered accountant", "credit analyst",
    ]),
    "hr": ("HR & Recruiting", [
        "recruiter", "talent acquisition", "hr", "human resources", "people operations",
        "hr executive", "hr manager",
    ]),
    "operations": ("Operations & Admin", [
        "operations", "supply chain", "logistics", "procurement", "warehouse", "store manager",
        "admin", "administrative", "executive assistant", "office manager", "front office",
        "data entry",
    ]),
    "support": ("Customer Support", [
        "customer support", "customer service", "customer success", "call center", "bpo",
        "help desk", "support executive",
    ]),
    "healthcare": ("Healthcare", [
        "nurse", "doctor", "physician", "pharmacist", "clinical", "medical", "healthcare",
        "therapist", "dentist", "lab technician", "radiologist",
    ]),
    "education": ("Education", [
        "teacher", "tutor", "lecturer", "professor", "trainer", "instructor", "academic",
        "curriculum", "counsellor",
    ]),
    "engineering": ("Core Engineering", [
        "mechanical", "civil", "electrical", "electronics", "structural", "manufacturing",
        "chemical engineer", "site engineer", "production engineer", "quality engineer",
        "autocad", "cad", "plant",
    ]),
    "legal": ("Legal & Compliance", [
        "lawyer", "legal", "advocate", "paralegal", "compliance", "counsel", "company secretary",
    ]),
}

CATEGORY_KEYS = [*CATEGORIES, "other"]
CATEGORY_OPTIONS = [{"value": k, "label": v[0]} for k, v in CATEGORIES.items()] + [
    {"value": "other", "label": "Other"}
]

_PATTERNS = {
    k: re.compile(r"(?<![a-z0-9])(?:" + "|".join(re.escape(w) for w in words) + r")(?![a-z0-9])")
    for k, (_, words) in CATEGORIES.items()
}


def classify(title: str | None, description: str | None = None) -> str:
    """Title hits count 3x. A description alone needs 3+ hits. Otherwise 'other'."""
    t = (title or "").lower()
    d = (description or "")[:1500].lower()
    best, best_score = "other", 0
    for key, pat in _PATTERNS.items():
        score = 3 * len(pat.findall(t)) + min(len(pat.findall(d)), 3)
        if score > best_score:
            best, best_score = key, score
    return best if best_score >= 3 else "other"