import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BASE_DIR.parent

load_dotenv(dotenv_path=str(PROJECT_DIR / ".env"))

# API Keys
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")

# ChromaDB
CHROMA_PERSIST_DIR = str(PROJECT_DIR / "chroma_db")
CHROMA_COLLECTION = "sample"

# LLM
GPT_MODEL = "gpt-4o-mini"
RAG_TOP_K = 15

# ElevenLabs
ELEVENLABS_VOICE_ID = "EXAVITQu4vr4xnSDxMaL"  # Sarah - female, mature, reassuring (premade)
ELEVENLABS_MODEL = "eleven_multilingual_v2"
