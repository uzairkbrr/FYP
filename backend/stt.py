import httpx
from .config import DEEPGRAM_API_KEY


def transcribe_audio(audio_bytes: bytes, mimetype: str = "audio/webm") -> dict:
    """
    Transcribe audio using Deepgram Nova-2 with automatic language detection.

    Returns: {"transcript": str, "language": "en" | "ur"}
    """
    resp = httpx.post(
        "https://api.deepgram.com/v1/listen",
        params={
            "model": "nova-2",
            "smart_format": "true",
            "detect_language": "true",
        },
        headers={
            "Authorization": f"Token {DEEPGRAM_API_KEY}",
            "Content-Type": mimetype,
        },
        content=audio_bytes,
        timeout=30.0,
    )
    resp.raise_for_status()
    data = resp.json()

    channel = data["results"]["channels"][0]
    transcript = channel["alternatives"][0]["transcript"]
    detected_lang = channel.get("detected_language", "en")

    lang = "ur" if detected_lang.startswith("ur") or detected_lang.startswith("hi") else "en"

    return {"transcript": transcript, "language": lang}
