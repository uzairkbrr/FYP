# MahirConnect

Every admission season, thousands of students call the same numbers, ask the same questions, and wait. Mahir on Call changes that an Urdu voice assistant built as an FYP for FAST-NUCES Peshawar that listens, understands, and responds instantly.

## Features

- Urdu voice input recognition
- Knowledge-based intelligent response generation
- Natural Urdu voice output
- Web-based conversational interface
- Automated testing and validation

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
   cd frontend && npm install
   ```

4. Configure environment variables in `.env` file.

## Usage

1. Start the backend:
   ```
   python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
   ```

2. Start the frontend:
   ```
   cd frontend && npm run dev
   ```

3. Open http://localhost:5173 and interact via voice commands.

## Technologies

- Backend: Python, FastAPI, LangChain, ChromaDB
- Frontend: React, Vite, Tailwind CSS
- APIs: Whisper v3 large(STT), Coqui (TTS)
- Other: python-dotenv, httpx

## Contributors

- Uzair Ahmad
- Arsalan Mateen
- Muhammad Sohaib

## License

This project is for educational purposes as part of FAST-NUCES Peshawar Campus FYP.
