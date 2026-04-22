import io
import json
import secrets
import threading
import traceback
import uuid
from datetime import datetime, timezone
from pathlib import Path

import httpx
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel, Field

from .stt import transcribe_audio
from .transliterate import urdu_to_roman
from .knowledge_base import generate_response, ingest_text, get_collection_stats
from .tts import synthesize_speech
from .settings import ADMIN_USERNAME, _k4, MESSAGES_FILE

app = FastAPI(title="MahirConnect API")

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
    """Process a voice query: (STT -> Generate Response -> TTS) pipeline."""
    try:
        audio_bytes = audio.file.read()
        mimetype = audio.content_type or "audio/webm"
        print(f"[voice-query] Received {len(audio_bytes)} bytes, mimetype={mimetype}")

        # Parse conversation history
        try:
            conversation_history = json.loads(history)
            if not isinstance(conversation_history, list):
                conversation_history = []
        except Exception:
            conversation_history = []
        print(f"History: {len(conversation_history)} prior turns")

        # Step 1: Speech-to-Text with language detection (Whisper)
        print("Step 1: Whisper STT...")
        stt_result = transcribe_audio(audio_bytes, mimetype)
        raw_transcript = stt_result["transcript"]
        language = stt_result["language"]
        print(f"STT result: lang={language}, transcript={raw_transcript[:80]!r}")

        if not raw_transcript.strip():
            raise HTTPException(
                status_code=400,
                detail="Could not detect any speech. Please try again.",
            )

        # Step 2: Language handling
        if language == "ur":
            print("Step 2: Urdu detected, converting to Roman Urdu...")
            display_transcript = urdu_to_roman(raw_transcript)
            rag_query = display_transcript
        else:
            print("Step 2: English detected, using transcript as-is")
            display_transcript = raw_transcript
            rag_query = raw_transcript
        print(f"[voice-query] Query for RAG: {rag_query[:80]!r}")

        # Step 3:  Retrieval from knowledge Base + response generation
        print("Step 3: RAG generation...")
        rag_result = generate_response(rag_query, language, conversation_history)
        print(f"Response: {rag_result['response_text'][:80]!r}")

        # Step 4: Text-to-Speech
        print(f"Step 4: TTS ({len(rag_result['tts_text'])} chars)...")
        audio_url = synthesize_speech(rag_result["tts_text"])
        print(f"TTS done, audio_url length={len(audio_url)}")

        return VoiceQueryResponse(
            transcript=display_transcript,
            response_text=rag_result["response_text"],
            audio_url=audio_url,
        )

    except HTTPException:
        raise
    except httpx.HTTPStatusError as e:
        body = e.response.text[:500]
        print(f"HTTP ERROR {e.response.status_code} from {e.request.url}: {body}")
        raise HTTPException(
            status_code=502,
            detail=f"External API error ({e.response.status_code}): {body}",
        )
    except Exception as e:
        print(f"UNEXPECTED ERROR: {traceback.format_exc()}")
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

        # For Urdu script input, convert to Roman Urdu so knowledgeBase matches the text
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


# Contact-form inbox (JSON-file backed)
_messages_lock = threading.Lock()

def _load_messages() -> list:
    path = Path(MESSAGES_FILE)
    if not path.exists():
        return []
    try:
        with path.open("r", encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, list) else []
    except Exception:
        return []


def _save_messages(messages: list) -> None:
    path = Path(MESSAGES_FILE)
    with path.open("w", encoding="utf-8") as f:
        json.dump(messages, f, ensure_ascii=False, indent=2)


class ContactMessageRequest(BaseModel):
    email: str = Field(..., min_length=1, max_length=200)
    contact: str = Field(..., min_length=1, max_length=40)
    message: str = Field(..., min_length=1, max_length=2000)


# Allowed values for how an admin responded to a message.
# Empty string means "no action recorded yet".
ALLOWED_ACTIONS = {"", "call", "email", "whatsapp"}


@app.post("/contact-message")
def submit_contact_message(body: ContactMessageRequest):
    """Accept a contact-form submission from the chat widget."""
    email = body.email.strip()
    contact = body.contact.strip()
    message = body.message.strip()

    if "@" not in email or "." not in email.split("@")[-1]:
        raise HTTPException(status_code=400, detail="Invalid email address.")

    entry = {
        "id": uuid.uuid4().hex,
        "email": email,
        "contact": contact,
        "message": message,
        "read": False,
        "action": "",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    with _messages_lock:
        messages = _load_messages()
        messages.append(entry)
        _save_messages(messages)

    return {"success": True, "id": entry["id"]}


# Admin endpoints
_security = HTTPBasic()

MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10 MB — PDFs and DOCX are often bigger than plain text
SUPPORTED_EXTENSIONS = (".txt", ".pdf", ".docx")


def _verify_admin(credentials: HTTPBasicCredentials = Depends(_security)):
    correct_user = secrets.compare_digest(credentials.username, ADMIN_USERNAME)
    correct_pass = secrets.compare_digest(credentials.password, _k4)
    if not (correct_user and correct_pass):
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username


def _extract_text(filename: str, content_bytes: bytes) -> str:
    """Extract plain text from a supported file type.

    Raises HTTPException(400) with a readable message if extraction fails.
    """
    name = filename.lower()

    if name.endswith(".txt"):
        try:
            return content_bytes.decode("utf-8")
        except UnicodeDecodeError:
            raise HTTPException(
                status_code=400,
                detail="File must be valid UTF-8 text.",
            )

    if name.endswith(".pdf"):
        try:
            from PyPDF2 import PdfReader
            reader = PdfReader(io.BytesIO(content_bytes))
            pages = [(p.extract_text() or "") for p in reader.pages]
            return "\n\n".join(pages)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Could not read PDF: {e}",
            )

    if name.endswith(".docx"):
        try:
            from docx import Document
            doc = Document(io.BytesIO(content_bytes))
            return "\n".join(p.text for p in doc.paragraphs if p.text)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Could not read DOCX: {e}",
            )

    raise HTTPException(
        status_code=400,
        detail=f"Unsupported file type. Accepted: {', '.join(SUPPORTED_EXTENSIONS)}",
    )


@app.post("/admin/ingest")
def admin_ingest(
    file: UploadFile = File(...),
    _user: str = Depends(_verify_admin),
):
    """Upload a supported file, extract text, chunk, embed, and add to the KB."""
    if not file.filename or not file.filename.lower().endswith(SUPPORTED_EXTENSIONS):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Accepted: {', '.join(SUPPORTED_EXTENSIONS)}",
        )

    content_bytes = file.file.read()
    if len(content_bytes) > MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=400, detail="File exceeds 10 MB limit.")

    text = _extract_text(file.filename, content_bytes)

    if not text.strip():
        raise HTTPException(status_code=400, detail="File contains no extractable text.")

    source_label = file.filename
    print(f"[admin/ingest] Ingesting {source_label} ({len(text)} chars)...")
    result = ingest_text(text, source_label)
    print(f"[admin/ingest] Done — {result['chunks_added']} chunks added")

    return {"success": True, **result}


@app.get("/admin/stats")
def admin_stats(_user: str = Depends(_verify_admin)):
    """Return knowledge base statistics."""
    return get_collection_stats()


@app.get("/admin/messages")
def admin_list_messages(_user: str = Depends(_verify_admin)):
    """Return all contact-form submissions, newest first."""
    with _messages_lock:
        messages = _load_messages()
    # Backfill the "action" field for messages stored before it existed.
    for m in messages:
        m.setdefault("action", "")
    # Newest first
    messages.sort(key=lambda m: m.get("created_at", ""), reverse=True)
    return {"messages": messages}


class ReadToggleRequest(BaseModel):
    read: bool = True


@app.post("/admin/messages/{message_id}/read")
def admin_mark_message(
    message_id: str,
    body: ReadToggleRequest,
    _user: str = Depends(_verify_admin),
):
    """Mark a message read/unread."""
    with _messages_lock:
        messages = _load_messages()
        found = False
        for m in messages:
            if m.get("id") == message_id:
                m["read"] = bool(body.read)
                found = True
                break
        if not found:
            raise HTTPException(status_code=404, detail="Message not found.")
        _save_messages(messages)

    return {"success": True, "id": message_id, "read": body.read}


class ActionUpdateRequest(BaseModel):
    action: str = ""


@app.post("/admin/messages/{message_id}/action")
def admin_set_message_action(
    message_id: str,
    body: ActionUpdateRequest,
    _user: str = Depends(_verify_admin),
):
    """Record how the admin responded to a message (call / email / whatsapp / none)."""
    action = (body.action or "").strip().lower()
    if action not in ALLOWED_ACTIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid action. Allowed: {sorted(ALLOWED_ACTIONS)}",
        )

    with _messages_lock:
        messages = _load_messages()
        found = False
        for m in messages:
            if m.get("id") == message_id:
                m["action"] = action
                found = True
                break
        if not found:
            raise HTTPException(status_code=404, detail="Message not found.")
        _save_messages(messages)

    return {"success": True, "id": message_id, "action": action}
