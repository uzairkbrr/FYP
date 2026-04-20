import base64
import re
import httpx
from .config import ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID, ELEVENLABS_MODEL, UPLIFTAI_API_KEY

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
    # First, convert markdown links [label](url) to just "Link." — the label
    # is visual-only; for audio we just say "Link." (otherwise the label gets
    # read out followed by the URL scheme letter-by-letter).
    text = re.sub(r'\[([^\]]+)\]\(https?://[^\)]+\)', 'Link.', text)
    text = re.sub(r'\[([^\]]+)\]\(www\.[^\)]+\)', 'Link.', text)

    # Then catch any remaining bare URLs
    text = re.sub(r'https?://\S+', 'Link.', text)
    text = re.sub(r'www\.\S+', 'Link.', text)

    # Clean up double spaces left behind
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

    return text


# UPLIFT AI IMPLEMENTATION — kept for reference, replaced by ElevenLabs below
# def synthesize_speech(text: str) -> str:
#     """Synthesize text to speech using Uplift AI (optimized for natural Urdu)."""
#     processed_text = preprocess_for_tts(text)
#     url = "https://api.upliftai.org/v1/synthesis/text-to-speech"
#     headers = {
#         "Authorization": f"Bearer {UPLIFTAI_API_KEY}",
#         "Content-Type": "application/json",
#     }
#     payload = {
#         # v_meklc281  — Urdu female (default)
#         # v_30s70t3a  — News/broadcaster voice
#         # v_yypgzenx  — Dada Jee storytelling voice
#         # v_8eelc901  — General purpose voice
#         "voiceId": "v_8eelc901",
#         "text": processed_text,
#         "outputFormat": "MP3_22050_32",
#     }
#     resp = httpx.post(url, json=payload, headers=headers, timeout=30.0)
#     resp.raise_for_status()
#     mp3_bytes = resp.content
#     audio_base64 = base64.b64encode(mp3_bytes).decode("utf-8")
#     return f"data:audio/mpeg;base64,{audio_base64}"


# ELEVENLABS IMPLEMENTATION — high-quality natural voice, paid tier
def synthesize_speech(text: str) -> str:
    """
    Synthesize text to speech using ElevenLabs' multilingual v2 model with
    Rachel — the flagship natural voice. Returns a base64-encoded data URL
    (audio/mpeg). Same shape as the Uplift AI path, so no downstream changes
    required.
    """
    processed_text = preprocess_for_tts(text)

    resp = httpx.post(
        f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}",
        headers={
            "xi-api-key": ELEVENLABS_API_KEY,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
        },
        json={
            "text": processed_text,
            "model_id": ELEVENLABS_MODEL,
            # Tuned for "high natural voice": stable but expressive, strong
            # similarity to the source voice, and speaker boost for clarity.
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.85,
                "style": 0.35,
                "use_speaker_boost": True,
            },
        },
        timeout=30.0,
    )
    resp.raise_for_status()

    b64 = base64.b64encode(resp.content).decode("utf-8")
    return f"data:audio/mpeg;base64,{b64}"
