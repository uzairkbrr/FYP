import json
import secrets
import traceback
import httpx
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel

from .stt import transcribe_audio
from .transliterate import urdu_to_roman
from .rag import generate_response, ingest_text, get_collection_stats
from .tts import synthesize_speech
from .config import ADMIN_USERNAME, ADMIN_PASSWORD

app = FastAPI(title="Mahir on Call API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class VoiceQueryResponse(BaseModel):
    transcript: str
    response_text: str
    audio_url: str


@app.post("/voice-query", response_model=VoiceQueryResponse)
def voice_query(
    audio: UploadFile = File(...),
    history: str = Form(default="[]"),
):
    """Process a voice query: STT -> RAG -> TTS pipeline."""
    try:
        audio_bytes = audio.file.read()
        mimetype = audio.content_type or "audio/webm"
        print(f"[voice-query] Received {len(audio_bytes)} bytes, mimetype={mimetype}")

        # Parse conversation history (optional, defaults to empty on any issue)
        try:
            conversation_history = json.loads(history)
            if not isinstance(conversation_history, list):
                conversation_history = []
        except Exception:
            conversation_history = []
        print(f"[voice-query] History: {len(conversation_history)} prior turns")

        # Step 1: Speech-to-Text with language detection (Deepgram)
        print("[voice-query] Step 1: Deepgram STT...")
        stt_result = transcribe_audio(audio_bytes, mimetype)
        raw_transcript = stt_result["transcript"]
        language = stt_result["language"]
        print(f"[voice-query] STT result: lang={language}, transcript={raw_transcript[:80]!r}")

        if not raw_transcript.strip():
            raise HTTPException(
                status_code=400,
                detail="Could not detect any speech. Please try again.",
            )

        # Step 2: Language handling
        if language == "ur":
            print("[voice-query] Step 2: Urdu detected, converting to Roman Urdu...")
            display_transcript = urdu_to_roman(raw_transcript)
            rag_query = display_transcript
        else:
            print("[voice-query] Step 2: English detected, using transcript as-is")
            display_transcript = raw_transcript
            rag_query = raw_transcript
        print(f"[voice-query] Query for RAG: {rag_query[:80]!r}")

        # Step 3: RAG retrieval + response generation
        print("[voice-query] Step 3: RAG generation...")
        rag_result = generate_response(rag_query, language, conversation_history)
        print(f"[voice-query] RAG response: {rag_result['response_text'][:80]!r}")

        # Step 4: Text-to-Speech (ElevenLabs)
        print(f"[voice-query] Step 4: ElevenLabs TTS ({len(rag_result['tts_text'])} chars)...")
        audio_url = synthesize_speech(rag_result["tts_text"])
        print(f"[voice-query] TTS done, audio_url length={len(audio_url)}")

        return VoiceQueryResponse(
            transcript=display_transcript,
            response_text=rag_result["response_text"],
            audio_url=audio_url,
        )

    except HTTPException:
        raise
    except httpx.HTTPStatusError as e:
        body = e.response.text[:500]
        print(f"[voice-query] HTTP ERROR {e.response.status_code} from {e.request.url}: {body}")
        raise HTTPException(
            status_code=502,
            detail=f"External API error ({e.response.status_code}): {body}",
        )
    except Exception as e:
        print(f"[voice-query] UNEXPECTED ERROR: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")


@app.get("/health")
def health():
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Admin endpoints
# ---------------------------------------------------------------------------

_security = HTTPBasic()

MAX_UPLOAD_SIZE = 2 * 1024 * 1024  # 2 MB


def _verify_admin(credentials: HTTPBasicCredentials = Depends(_security)):
    correct_user = secrets.compare_digest(credentials.username, ADMIN_USERNAME)
    correct_pass = secrets.compare_digest(credentials.password, ADMIN_PASSWORD)
    if not (correct_user and correct_pass):
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username


@app.post("/admin/ingest")
def admin_ingest(
    file: UploadFile = File(...),
    _user: str = Depends(_verify_admin),
):
    """Upload a .txt file to chunk, embed, and add to the knowledge base."""
    if not file.filename or not file.filename.lower().endswith(".txt"):
        raise HTTPException(status_code=400, detail="Only .txt files are accepted.")

    content_bytes = file.file.read()
    if len(content_bytes) > MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=400, detail="File exceeds 2 MB limit.")

    try:
        text = content_bytes.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File must be valid UTF-8 text.")

    if not text.strip():
        raise HTTPException(status_code=400, detail="File is empty.")

    source_label = file.filename
    print(f"[admin/ingest] Ingesting {source_label} ({len(text)} chars)...")
    result = ingest_text(text, source_label)
    print(f"[admin/ingest] Done — {result['chunks_added']} chunks added")

    return {"success": True, **result}


@app.get("/admin/stats")
def admin_stats(_user: str = Depends(_verify_admin)):
    """Return knowledge base statistics."""
    return get_collection_stats()
