import os
import tempfile
import httpx
from openai import OpenAI
from .config import DEEPGRAM_API_KEY, OPENAI_API_KEY


# DEEPGRAM IMPLEMENTATION — kept for reference, replaced by Whisper below
# def transcribe_audio(audio_bytes: bytes, mimetype: str = "audio/webm") -> dict:
#     """
#     Transcribe audio using Deepgram Nova-2 with automatic language detection.
#
#     Returns: {"transcript": str, "language": "en" | "ur"}
#     """
#     resp = httpx.post(
#         "https://api.deepgram.com/v1/listen",
#         params={
#             "model": "nova-3",
#             "smart_format": "true",
#             "detect_language": "true",
#         },
#         headers={
#             "Authorization": f"Token {DEEPGRAM_API_KEY}",
#             "Content-Type": mimetype,
#         },
#         content=audio_bytes,
#         timeout=30.0,
#     )
#     resp.raise_for_status()
#     data = resp.json()
#
#     channel = data["results"]["channels"][0]
#     transcript = channel["alternatives"][0]["transcript"]
#     detected_lang = channel.get("detected_language", "en")
#
#     lang = "ur" if detected_lang.startswith("ur") or detected_lang.startswith("hi") else "en"
#
#     return {"transcript": transcript, "language": lang}


def transcribe_audio(audio_bytes: bytes, mimetype: str = "audio/webm") -> dict:
    """
    Transcribe audio using OpenAI Whisper large-v3 with automatic language detection.

    Returns: {"transcript": str, "language": "en" | "ur"}
    """
    client = OpenAI(api_key=OPENAI_API_KEY)

    suffix = ".ogg" if "ogg" in mimetype else ".webm" if "webm" in mimetype else ".mp3"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        with open(tmp_path, "rb") as f:
            result = client.audio.transcriptions.create(
                model="whisper-1",
                file=f,
                response_format="verbose_json",
            )
        transcript = result.text.strip()
        detected_language = getattr(result, "language", "en")
        language = "ur" if detected_language in ("ur", "hi", "pa", "urdu", "hindi", "punjabi") else "en"
        return {"transcript": transcript, "language": language}
    finally:
        os.unlink(tmp_path)
