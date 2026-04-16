# Mahir on Call

A voice assistant for Urdu-based queries, designed as a final year project (FYP) for FAST-NUCES. It processes voice inputs using speech-to-text, retrieves relevant information via retrieval-augmented generation (RAG), and responds with synthesized speech.

## Features

- Speech-to-text conversion for Urdu audio
- Retrieval-augmented generation for accurate responses
- Text-to-speech synthesis with voice selection
- Web-based user interface for interaction
- Comprehensive test suite for validation

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-username/mahir-on-call.git
   cd mahir-on-call
   ```

2. Set up the Python environment:
   ```
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Set up the frontend:
   ```
   cd frontend
   npm install
   ```

4. Configure environment variables in `.env` file (API keys for OpenAI, ElevenLabs, etc.).

## Usage

1. Start the backend:
   ```
   python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
   ```

2. Start the frontend:
   ```
   cd frontend
   npm run dev
   ```

3. Open http://localhost:5173 and interact via voice commands.

## Admin Panel

The admin panel allows you to manage the ChromaDB knowledge base — upload new `.txt` files that get chunked, embedded, and added to the existing collection without rebuilding it.

### Access

Navigate to http://localhost:5173/admin and log in with the credentials from `.env`:

```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=mahironcall
```

### Upload new data

1. Log in to the admin panel
2. Drag & drop a `.txt` file (or click to browse)
3. Click "Upload & Embed"
4. The file is chunked, embedded, and added to ChromaDB
5. Re-uploading the same file does not create duplicates (idempotent)

### One-time migration (existing data)

If you had data in ChromaDB before the admin panel was added, run this once to tag existing documents with source metadata:

```
python scripts/migrate_existing.py
```

### Environment variables

Add these to your `.env` file:

```
OPENAI_API_KEY=your_openai_key
DEEPGRAM_API_KEY=your_deepgram_key
ELEVENLABS_API_KEY=your_elevenlabs_key
ADMIN_USERNAME=admin
ADMIN_PASSWORD=mahironcall
```

## Technologies

- Backend: Python, FastAPI, LangChain, ChromaDB
- Frontend: React, Vite, Tailwind CSS
- APIs: Deepgram (STT), OpenAI GPT-4o-mini (RAG), ElevenLabs (TTS)
- Other: python-dotenv, httpx

## Contributors

- Uzair Ahmad
- Arsalan Mateen
- Muhammad Sohaib

## License

This project is for educational purposes as part of FAST-NUCES Peshawar Campus FYP.
