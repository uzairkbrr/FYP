import traceback
import httpx
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .stt import transcribe_audio
from .transliterate import urdu_to_roman
from .rag import generate_response
from .tts import synthesize_speech

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
def voice_query(audio: UploadFile = File(...)):
    """Process a voice query: STT -> RAG -> TTS pipeline."""
    try:
        audio_bytes = audio.file.read()
        mimetype = audio.content_type or "audio/webm"
        print(f"[voice-query] Received {len(audio_bytes)} bytes, mimetype={mimetype}")

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
        rag_result = generate_response(rag_query, language)
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
