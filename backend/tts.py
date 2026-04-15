import base64
import httpx
from .config import ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID, ELEVENLABS_MODEL


def synthesize_speech(text: str) -> str:
    """
    Synthesize text to speech using ElevenLabs multilingual model.

    Returns a base64-encoded data URL (audio/mpeg).
    """
    resp = httpx.post(
        f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}",
        headers={
            "xi-api-key": ELEVENLABS_API_KEY,
            "Content-Type": "application/json",
        },
        json={
            "text": text,
            "model_id": ELEVENLABS_MODEL,
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75,
            },
        },
        timeout=30.0,
    )
    resp.raise_for_status()

    b64 = base64.b64encode(resp.content).decode("utf-8")
    return f"data:audio/mpeg;base64,{b64}"
