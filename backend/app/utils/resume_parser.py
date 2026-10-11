"""Turns the user's default resume PDF into a small structured profile, using the AI fallback chain."""
import io

from pypdf import PdfReader
from utils.categories import CATEGORY_KEYS, classify
from utils.llm import LLMError
from utils.llm_router import complete_json_with_fallback, has_provider

MAX_CHARS = 12_000

SYSTEM = (
    "You extract facts from resumes of people in ANY profession. Use only what the resume says. "
    "Never invent skills, employers, numbers or dates. Reply with JSON only."
)

PROMPT = """Read this resume and return JSON with exactly these keys:
- "name": full name or null
- "headline": one line, e.g. "Staff Nurse, 4 years" or "Full Stack Developer, 3 years"
- "domain": the ONE field this person works in, exactly one of: {domains}
- "titles": up to 5 job titles this person should apply for, most relevant first (strings)
- "skills": up to 40 skills, tools, software, certifications or methods used in THEIR field, as short lowercase strings
- "years_experience": number or null
- "location": city/country or null
- "summary": 2 sentences describing the strongest experience, using only resume facts
- "highlights": up to 4 concrete achievements or projects from the resume in your own short words

RESUME:
{text}"""


def extract_text(pdf_bytes: bytes) -> str:
    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        text = "\n".join((page.extract_text() or "") for page in reader.pages[:6])
    except Exception:
        raise LLMError("Couldn't read this PDF.")
    text = "\n".join(line.strip() for line in text.splitlines() if line.strip())
    if len(text) < 200:
        raise LLMError("This PDF has almost no text (it may be a scanned image). Upload a text-based PDF.")
    return text[:MAX_CHARS]


def parse_resume(text: str, user_id=None) -> dict:
    prompt = PROMPT.format(text=text, domains=", ".join(CATEGORY_KEYS))
    data = complete_json_with_fallback(SYSTEM, prompt, purpose="resume_parse", user_id=user_id)

    def strs(v, n):
        return [str(x).strip()[:80] for x in (v if isinstance(v, list) else []) if str(x).strip()][:n]

    titles = strs(data.get("titles"), 5)
    skills = [s.lower() for s in strs(data.get("skills"), 40)]

    domain = data.get("domain")
    if domain not in CATEGORY_KEYS or domain == "other":
        # the model gave nothing useful, so decide from titles and skills ourselves
        domain = classify(" ".join(titles), " ".join(skills))

    return {
        "name": data.get("name") if isinstance(data.get("name"), str) else None,
        "headline": str(data.get("headline") or "")[:160],
        "domain": domain,
        "titles": titles,
        "skills": skills,
        "years_experience": data.get("years_experience") if isinstance(data.get("years_experience"), (int, float)) else None,
        "location": data.get("location") if isinstance(data.get("location"), str) else None,
        "summary": str(data.get("summary") or "")[:500],
        "highlights": strs(data.get("highlights"), 4),
    }


def heuristic_profile(text: str) -> dict:
    """No-LLM fallback: guess the field from the top of the resume (where the role usually is)."""
    return {
        "name": None, "headline": "", "domain": classify(text[:400], text[:3000]),
        "titles": [], "skills": [], "years_experience": None, "location": None,
        "summary": "", "highlights": [],
    }


def parse_resume_server(pdf_bytes: bytes, user_id=None) -> dict:
    text = extract_text(pdf_bytes)          # raises LLMError for scanned PDFs
    if has_provider():
        try:
            return parse_resume(text, user_id)
        except Exception as e:              # every provider failed, or the reply was unusable: still give a profile
            print("parse_resume_server: AI parse failed, using fallback:", repr(e))
    return heuristic_profile(text)