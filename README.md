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
   jupyter notebook pipeline.ipynb
   ```

2. Start the frontend:
   ```
   cd frontend
   npm run dev
   ```

3. Open the application in a web browser and interact via voice commands.

## Technologies

- Backend: Python, Jupyter Notebook, LangChain, ChromaDB
- Frontend: React, Vite
- APIs: OpenAI Whisper,
- Other: NumPy, dotenv

## Testing

Run the test suite:
```
python test_runner.py
```

Refer to `FYP_TEST_CASES.md` for detailed test procedures.

## Contributors

- Uzair Ahmad
- Arsalan Mateen
- Muhammad Sohaib

## License

This project is for educational purposes as part of FAST-NUCES Peshawar Campus FYP.
