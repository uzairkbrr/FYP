import io
import json
import secrets
import sqlite3
import traceback
from contextlib import contextmanager
from datetime import datetime, timezone

import httpx
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel

from .stt import transcribe_audio
from .transliterate import urdu_to_roman
from .rag import generate_response, ingest_text, get_collection_stats
from .tts import synthesize_speech
from .config import ADMIN_USERNAME, ADMIN_PASSWORD, MODERATOR_DB_PATH

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


class TextQueryRequest(BaseModel):
    query: str
    history: list = []


@app.post("/text-query", response_model=VoiceQueryResponse)
def text_query(body: TextQueryRequest):
    """Process a text query: skip STT, run RAG -> TTS."""
    try:
        text = (body.query or "").strip()
        if not text:
            raise HTTPException(status_code=400, detail="Empty query.")

        # Detect language: any Arabic-script char => Urdu
        is_urdu = any("\u0600" <= c <= "\u06FF" for c in text)
        language = "ur" if is_urdu else "en"
        print(f"[text-query] lang={language}, text={text[:80]!r}")

        # For Urdu script input, convert to Roman Urdu so RAG matches the KB
        if is_urdu:
            display_transcript = urdu_to_roman(text)
            rag_query = display_transcript
        else:
            display_transcript = text
            rag_query = text

        history = body.history if isinstance(body.history, list) else []
        rag_result = generate_response(rag_query, language, history)
        audio_url = synthesize_speech(rag_result["tts_text"])

        return VoiceQueryResponse(
            transcript=display_transcript,
            response_text=rag_result["response_text"],
            audio_url=audio_url,
        )

    except HTTPException:
        raise
    except httpx.HTTPStatusError as e:
        body_text = e.response.text[:500]
        print(f"[text-query] HTTP ERROR {e.response.status_code} from {e.request.url}: {body_text}")
        raise HTTPException(
            status_code=502,
            detail=f"External API error ({e.response.status_code}): {body_text}",
        )
    except Exception as e:
        print(f"[text-query] UNEXPECTED ERROR: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")


@app.get("/health")
def health():
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Admin endpoints
# ---------------------------------------------------------------------------

_security = HTTPBasic()

MAX_UPLOAD_SIZE_TEXT = 2 * 1024 * 1024   # 2 MB for .txt / .docx
MAX_UPLOAD_SIZE_PDF = 10 * 1024 * 1024   # 10 MB for .pdf
SUPPORTED_EXTENSIONS = (".txt", ".pdf", ".docx")


def _extract_pdf_text(pdf_bytes: bytes) -> str:
    import PyPDF2  # lazy import so dev without pypdf2 still boots the rest

    reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
    parts = []
    for page in reader.pages:
        try:
            parts.append(page.extract_text() or "")
        except Exception:
            parts.append("")
    return "\n\n".join(parts).strip()


def _extract_docx_text(docx_bytes: bytes) -> str:
    import docx  # lazy import

    doc = docx.Document(io.BytesIO(docx_bytes))
    return "\n\n".join(p.text for p in doc.paragraphs if p.text.strip()).strip()


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
    """Upload a .txt, .pdf, or .docx file to chunk, embed, and add to the KB."""
    filename = file.filename or ""
    lower = filename.lower()

    if not any(lower.endswith(ext) for ext in SUPPORTED_EXTENSIONS):
        raise HTTPException(
            status_code=400,
            detail="Only .txt, .pdf, and .docx files are supported",
        )

    content_bytes = file.file.read()

    # Size limits — PDFs get 10 MB, text formats keep 2 MB
    if lower.endswith(".pdf"):
        if len(content_bytes) > MAX_UPLOAD_SIZE_PDF:
            raise HTTPException(status_code=400, detail="PDF exceeds 10 MB limit.")
    else:
        if len(content_bytes) > MAX_UPLOAD_SIZE_TEXT:
            raise HTTPException(status_code=400, detail="File exceeds 2 MB limit.")

    # Extract plain text in memory — pipeline downstream is unchanged.
    try:
        if lower.endswith(".txt"):
            try:
                text = content_bytes.decode("utf-8")
            except UnicodeDecodeError:
                raise HTTPException(status_code=400, detail="File must be valid UTF-8 text.")
        elif lower.endswith(".pdf"):
            text = _extract_pdf_text(content_bytes)
            if not text:
                raise HTTPException(
                    status_code=400,
                    detail="Could not extract text from PDF. Try a text-based PDF rather than a scanned image.",
                )
        else:  # .docx
            text = _extract_docx_text(content_bytes)
    except HTTPException:
        raise
    except Exception as e:
        print(f"[admin/ingest] extraction error: {e}")
        raise HTTPException(status_code=400, detail="Could not read file content.")

    if not text.strip():
        raise HTTPException(status_code=400, detail="File is empty.")

    source_label = filename
    print(f"[admin/ingest] Ingesting {source_label} ({len(text)} chars)...")
    result = ingest_text(text, source_label)
    print(f"[admin/ingest] Done — {result['chunks_added']} chunks added")

    return {"success": True, **result}


@app.get("/admin/stats")
def admin_stats(_user: str = Depends(_verify_admin)):
    """Return knowledge base statistics."""
    return get_collection_stats()


# ---------------------------------------------------------------------------
# Moderator messages (SQLite)
# ---------------------------------------------------------------------------


@contextmanager
def _db():
    conn = sqlite3.connect(MODERATOR_DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


def _init_moderator_db():
    with _db() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS moderator_messages (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                email      TEXT NOT NULL,
                phone      TEXT NOT NULL,
                message    TEXT NOT NULL,
                timestamp  TEXT NOT NULL,
                is_read    INTEGER NOT NULL DEFAULT 0
            )
            """
        )
        conn.commit()


_init_moderator_db()


class ContactModeratorRequest(BaseModel):
    email: str
    phone: str
    message: str
    timestamp: str | None = None


@app.post("/contact-moderator")
def contact_moderator(body: ContactModeratorRequest):
    email = (body.email or "").strip()
    phone = (body.phone or "").strip()
    message = (body.message or "").strip()

    if not email or not phone or not message:
        raise HTTPException(status_code=400, detail="All fields are required.")

    ts = (body.timestamp or "").strip()
    if not ts:
        ts = datetime.now(timezone.utc).isoformat()

    try:
        with _db() as conn:
            conn.execute(
                "INSERT INTO moderator_messages (email, phone, message, timestamp) VALUES (?, ?, ?, ?)",
                (email, phone, message, ts),
            )
            conn.commit()
    except Exception as e:
        print(f"[contact-moderator] DB error: {e}")
        raise HTTPException(status_code=500, detail="Could not save message.")

    return {"success": True}


@app.get("/admin/messages")
def admin_messages(_user: str = Depends(_verify_admin)):
    with _db() as conn:
        rows = conn.execute(
            "SELECT id, email, phone, message, timestamp, is_read "
            "FROM moderator_messages ORDER BY id DESC"
        ).fetchall()

    return {
        "messages": [
            {
                "id": r["id"],
                "email": r["email"],
                "phone": r["phone"],
                "message": r["message"],
                "timestamp": r["timestamp"],
                "is_read": bool(r["is_read"]),
            }
            for r in rows
        ]
    }


@app.post("/admin/messages/{message_id}/read")
def admin_mark_read(message_id: int, _user: str = Depends(_verify_admin)):
    with _db() as conn:
        cur = conn.execute(
            "UPDATE moderator_messages SET is_read = 1 WHERE id = ?",
            (message_id,),
        )
        conn.commit()
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Message not found.")
    return {"success": True}
