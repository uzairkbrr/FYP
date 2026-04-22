import os
import tempfile
from openai import OpenAI
from .settings import _k1, model_stt

# Whisper's auto-detect often labels spoken Urdu as Hindi (hi) or Punjabi (pa)
# because they share phonetics. When that happens, the transcript comes back in
# Devanagari/Gurmukhi with different word choices, which hurts.
# We re-run Whisper with language forced to Urdu for these cases.
_HINDI_FAMILY_MISLABEL = {"hi", "pa", "hindi", "punjabi"}
_URDU_DIRECT = {"ur", "urdu"}


def transcribe_audio(audio_bytes: bytes, mimetype: str = "audio/webm") -> dict:
    """
    Transcribe audio with Whisper.

    Pipeline:
      1. Auto-detect language.
      2. If Whisper mislabels Urdu as Hindi/Punjabi, re-run with language='ur'
         forced so we get Arabic script and consistent vocabulary.
      3. Collapse every non-English result to "ur" so the rest of the pipeline
         always sees just {"en", "ur"}.

    Returns: {"transcript": str, "language": "en" | "ur"}
    """
    client = OpenAI(api_key=_k1)

    suffix = ".ogg" if "ogg" in mimetype else ".webm" if "webm" in mimetype else ".mp3"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        # Pass 1: auto-detect
        with open(tmp_path, "rb") as f:
            result = client.audio.transcriptions.create(
                model=model_stt,
                file=f,
                response_format="verbose_json",
            )
        transcript = result.text.strip()
        detected = (getattr(result, "language", "en") or "en").lower()

        # Pass 2: if detection was Hindi/Punjabi but it's actually Urdu, re-run.
        if detected in _HINDI_FAMILY_MISLABEL:
            with open(tmp_path, "rb") as f:
                result = client.audio.transcriptions.create(
                    model=model_stt,
                    file=f,
                    language="ur",
                    response_format="verbose_json",
                )
            transcript = result.text.strip()
            detected = "ur"

        language = "ur" if detected in _URDU_DIRECT else "en"
        return {"transcript": transcript, "language": language}
    finally:
        os.unlink(tmp_path)
