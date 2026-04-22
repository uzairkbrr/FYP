import base64
import re
import httpx
from .settings import _k3, _e2, model_tts, _v1, _v2

# Ordered longest-first so "FAST-NUCES" matches before "NUCES", "CGPA" before "GPA", etc.
_PRONUNCIATION_MAP = [
    ("FAST-NUCES", "Fast Nuces"),
    ("NU-Test", "NU Test"),
    ("FAST NUCES", "Fast Nuces"),
    ("NUCES",      "Nuces"),
    ("NUST",       "Nust"),
    ("LUMS",       "Lums"),
    ("HEC",        "Hec"),
    ("PEEF",       "Peef"),
    ("CGPA",       "C G P A"),
    ("GPA",        "G P A"),
    ("PhD",        "P H D"),
    ("OAT",        "Oat"),
    ("NTS",        "N T S"),
    ("HOD",        "H O D"),
    ("DSA",        "D S A"),
    ("BBA",        "B B A"),
    ("MBA",        "M B A"),
    ("CSS",        "C S S"),
    ("BS",         "B S"),
    ("MS",         "M S"),
    ("IT",         "I T"),
    ("CS",         "C S"),
    ("SE",         "S E"),
    ("EE",         "E E"),
    ("AI",         "A I"),
]


def preprocess_for_tts(text: str) -> str:
    """Clean up ALL-CAPS words so ElevenLabs pronounces them naturally."""

    # Step 0 — handle links for TTS
    text = re.sub(r'\[([^\]]+)\]\(https?://[^\)]+\)', 'Link.', text)
    text = re.sub(r'\[([^\]]+)\]\(www\.[^\)]+\)', 'Link.', text)
    text = re.sub(r'https?://\S+', 'Link.', text)
    text = re.sub(r'www\.\S+', 'Link.', text)
    text = re.sub(r' {2,}', ' ', text).strip()

    # Step 1 — hardcoded pronunciation dictionary (whole-word, case-sensitive)
    replaced = set()
    for term, phonetic in _PRONUNCIATION_MAP:
        escaped = re.escape(term)
        pattern = rf"\b{escaped}\b" if "-" not in term else escaped
        if re.search(pattern, text):
            text = re.sub(pattern, phonetic, text)
            replaced.add(term)

    # Step 2 — general fallback: any remaining ALL-CAPS word (4+ chars) → Title Case
    text = re.sub(r"\b[A-Z]{4,}\b", lambda m: m.group().title(), text)

    # Step 3 — strip thousands-separator commas so TTS reads 167500 not "167, 500".
    text = re.sub(r"(?<=\d),(?=\d)", "", text)

    # Step 4 — spell out large numbers using the Indian numbering system
    # (lakh / crore) so ElevenLabs doesn't slur "thousand" and produce
    # mis-reads like "two hundred five hundred" for 200500.
    text = re.sub(r"\d{5,}", lambda m: _indian_number_words(int(m.group())), text)

    return text


# ── Number → Indian-English words (for TTS clarity) ─────────────────────────
_ONES = [
    "", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
    "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
    "seventeen", "eighteen", "nineteen",
]
_TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"]


def _under_100(n: int) -> str:
    if n < 20:
        return _ONES[n]
    t, o = divmod(n, 10)
    return _TENS[t] if o == 0 else f"{_TENS[t]} {_ONES[o]}"


def _under_1000(n: int) -> str:
    if n < 100:
        return _under_100(n)
    h, rest = divmod(n, 100)
    return f"{_ONES[h]} hundred" if rest == 0 else f"{_ONES[h]} hundred {_under_100(rest)}"


def _indian_number_words(n: int) -> str:
    """Convert an integer to Indian-English words (crore / lakh / thousand / hundred)."""
    if n == 0:
        return "zero"
    parts = []
    crore, n = divmod(n, 10_000_000)
    lakh, n = divmod(n, 100_000)
    thousand, rest = divmod(n, 1000)
    if crore > 0:
        parts.append(f"{_indian_number_words(crore)} crore")
    if lakh > 0:
        parts.append(f"{_under_1000(lakh)} lakh")
    if thousand > 0:
        parts.append(f"{_under_1000(thousand)} thousand")
    if rest > 0:
        parts.append(_under_1000(rest))
    return " ".join(parts).strip()


def synthesize_speech(text: str) -> str:
    """
    Synthesize text to speech using ElevenLabs multilingual model.

    Returns a base64-encoded data URL (audio/mpeg).
    """
    text = preprocess_for_tts(text)

    resp = httpx.post(
        f"{_e2}{_v1}",
        headers={
            "xi-api-key": _k3,
            "Content-Type": "application/json",
        },
        json={
            "text": text,
            "model_id": model_tts,
            "voice_settings": _v2,
        },
        timeout=30.0,
    )
    resp.raise_for_status()

    b64 = base64.b64encode(resp.content).decode("utf-8")
    return f"data:audio/mpeg;base64,{b64}"
