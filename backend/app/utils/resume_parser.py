"""Turns the user's default resume PDF into a small structured profile with their own AI key."""
import io

from pypdf import PdfReader

from utils.llm import LLMError, complete_json

MAX_CHARS = 12_000

SYSTEM = (
    "You extract facts from resumes. Use only what the resume says. "
    "Never invent skills, employers, numbers or dates. Reply with JSON only."
)

PROMPT = """Read this resume and return JSON with exactly these keys:
- "name": full name or null
- "headline": one line, e.g. "Full Stack Developer, 3 years"
- "titles": up to 5 job titles this person should apply for (strings)
- "skills": up to 40 technical skills, tools and frameworks, as short lowercase strings
- "years_experience": number or null
- "location": city/country or null
- "summary": 2 sentences describing the strongest experience, using only resume facts
- "highlights": up to 4 concrete achievements or projects copied from the resume in your own short words

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


def parse_resume(pdf_bytes: bytes, provider: str, key: str, model: str) -> dict:
    data = complete_json(provider, key, model, SYSTEM, PROMPT.format(text=extract_text(pdf_bytes)))

    def strs(v, n):
        return [str(x).strip()[:80] for x in (v if isinstance(v, list) else []) if str(x).strip()][:n]

    return {
        "name": data.get("name") if isinstance(data.get("name"), str) else None,
        "headline": str(data.get("headline") or "")[:160],
        "titles": strs(data.get("titles"), 5),
        "skills": [s.lower() for s in strs(data.get("skills"), 40)],
        "years_experience": data.get("years_experience") if isinstance(data.get("years_experience"), (int, float)) else None,
        "location": data.get("location") if isinstance(data.get("location"), str) else None,
        "summary": str(data.get("summary") or "")[:500],
        "highlights": strs(data.get("highlights"), 4),
    }