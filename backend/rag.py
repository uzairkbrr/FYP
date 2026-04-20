import hashlib
import json
import openai
from langchain_openai import OpenAIEmbeddings
from langchain_chroma import Chroma
from langchain_text_splitters import RecursiveCharacterTextSplitter
from .config import OPENAI_API_KEY, CHROMA_PERSIST_DIR, CHROMA_COLLECTION, RAG_TOP_K, GPT_MODEL

_client = openai.OpenAI(api_key=OPENAI_API_KEY)

# Initialize ChromaDB once at module load
_embeddings = OpenAIEmbeddings(api_key=OPENAI_API_KEY)
_vectorstore = Chroma(
    embedding_function=_embeddings,
    persist_directory=CHROMA_PERSIST_DIR,
    collection_name=CHROMA_COLLECTION,
)


# ---------------------------------------------------------------------------
# Ingestion
# ---------------------------------------------------------------------------

def _generate_description(text: str) -> str:
    """Call GPT-4o-mini once to generate a short description of the text."""
    try:
        resp = _client.chat.completions.create(
            model=GPT_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a helpful assistant. Read the following text and write a "
                        "single short sentence (max 12 words) describing what topics it covers. "
                        "Be specific. Do not start with 'This file' or 'This document'. "
                        "Just state the topics directly."
                    ),
                },
                {"role": "user", "content": text[:3000]},
            ],
            temperature=0.0,
        )
        return resp.choices[0].message.content.strip()
    except Exception:
        return ""


def ingest_text(text: str, source_label: str) -> dict:
    """
    Chunk, embed, and upsert new text into the existing ChromaDB collection.

    Uses deterministic IDs so re-uploading the same content is idempotent.
    Existing documents are never deleted. This is purely additive.

    Returns: {"chunks_added": int, "source": source_label, "description": str}
    """
    description = _generate_description(text)

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50,
    )
    chunks = splitter.split_text(text)

    ids = []
    metadatas = []
    for idx, chunk in enumerate(chunks):
        raw = f"{source_label}::{idx}::{chunk[:40]}"
        doc_id = hashlib.md5(raw.encode("utf-8")).hexdigest()
        ids.append(doc_id)
        metadatas.append({"source": source_label, "description": description})

    _vectorstore.add_texts(texts=chunks, ids=ids, metadatas=metadatas)

    return {"chunks_added": len(chunks), "source": source_label, "description": description}


def get_collection_stats() -> dict:
    """Return total chunk count and per-source breakdown with descriptions."""
    col = _vectorstore._collection
    result = col.get(include=["metadatas"])

    total = len(result["ids"])
    source_info: dict[str, dict] = {}
    for meta in result["metadatas"]:
        src = meta.get("source", "unknown")
        if src not in source_info:
            source_info[src] = {"chunks": 0, "description": meta.get("description", "")}
        source_info[src]["chunks"] += 1

    sources = [
        {"source": s, "chunks": info["chunks"], "description": info["description"]}
        for s, info in sorted(source_info.items())
    ]
    return {"total_chunks": total, "sources": sources}


# ---------------------------------------------------------------------------
# Greeting detection
# ---------------------------------------------------------------------------

GREETING_TOKENS = [
    "salam", "salaam", "assalam", "assalamualaikum",
    "walaikum", "hi", "hello", "hey", "good morning",
    "good afternoon", "good evening", "helo", "aoa",
    "aslam", "greetings", "namaste", "adaab",
]

_URDU_GREETING_ROMAN = (
    "Assalam o Alaikum! Main Mahir hoon, FAST-NUCES Peshawar ka voice assistant. "
    "Admissions, fees, scholarships, ya kisi bhi university se related sawal ke liye "
    "main haazir hoon. Batayein, main aapki kya madad kar sakta hoon?"
)

_ENGLISH_GREETING = (
    "Hello! I'm Mahir, the voice assistant for FAST-NUCES Peshawar. I'm here to help "
    "you with admissions, fees, scholarships, programs, and anything else related to "
    "the university. What would you like to know?"
)


def _is_pure_greeting(query: str) -> bool:
    """True if the query is a short greeting without a real question attached."""
    text = (query or "").strip().lower()
    if not text:
        return False
    # A trailing question or a long utterance means it isn't a pure greeting.
    if "?" in text:
        return False
    if len(text.split()) >= 12:
        return False
    return any(tok in text for tok in GREETING_TOKENS)


def _translate_roman_to_arabic(roman: str) -> str:
    """Use GPT-4o-mini to produce the Arabic-script version of a Roman Urdu phrase."""
    try:
        resp = _client.chat.completions.create(
            model=GPT_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Convert the following Roman Urdu sentence to Arabic script Urdu. "
                        "Preserve meaning exactly. Output only the Arabic script, no quotes, "
                        "no explanations."
                    ),
                },
                {"role": "user", "content": roman},
            ],
            temperature=0.0,
        )
        return resp.choices[0].message.content.strip()
    except Exception:
        return roman


# ---------------------------------------------------------------------------
# RAG query
# ---------------------------------------------------------------------------

def generate_response(query: str, language: str, conversation_history: list = []) -> dict:
    """
    Retrieve context from ChromaDB and generate a response via GPT-4o-mini.

    Pure greetings short-circuit the retrieval step and return a warm welcome.
    Off-topic queries are handled at the prompt level.

    Returns:
        {"response_text": str, "tts_text": str}
    """
    # Short-circuit: pure greeting -> warm welcome, skip retrieval.
    if _is_pure_greeting(query):
        if language == "ur":
            return {
                "response_text": _URDU_GREETING_ROMAN,
                "tts_text": _translate_roman_to_arabic(_URDU_GREETING_ROMAN),
            }
        return {"response_text": _ENGLISH_GREETING, "tts_text": _ENGLISH_GREETING}

    retrieved = _vectorstore.similarity_search(query, k=RAG_TOP_K)

    pieces = []
    for i, doc in enumerate(retrieved):
        cat = doc.metadata.get("category", "N/A")
        pieces.append(f"[{i + 1}] Category: {cat}\n{doc.page_content}")
    context = "\n\n".join(pieces)

    # Bound token usage: keep only the last 6 turns (3 user + 3 assistant)
    history = (conversation_history or [])[-6:]

    if language == "ur":
        return _generate_urdu_response(query, context, history)
    else:
        return _generate_english_response(query, context, history)


# Shared preamble for both language paths: off-topic guardrail + language policy.
_PRIORITY_RULES = """PRIORITY RULES (these override every other instruction below):

You are an assistant exclusively for FAST-NUCES Peshawar. You only answer questions related to FAST-NUCES Peshawar, including admissions, fees, scholarships, programs, academic policies, campus facilities, faculty, and hostel information. If the user asks about ANYTHING else (such as general knowledge, current events, prices, other universities, recipes, or any topic not directly related to FAST-NUCES Peshawar), do NOT attempt to answer. Instead, respond with exactly:
English: "I don't have information about that. If you have any questions related to FAST Peshawar, feel free to ask!"
Urdu (Roman): "Mujhe is bare mein maloomat nahi hai. Agar aapka koi sawal FAST Peshawar se related ho toh zaroor poochein!"
Do not use the retrieved context for off-topic queries. Do not attempt a partial answer. Respond with the above message only.

LANGUAGE POLICY. Your default response language is Urdu (Roman script for display, Arabic script for TTS). Always respond in Urdu unless the user's message is written or spoken entirely in English, in which case respond in English. If the user writes in a mix of Urdu and English (code-switching, which is common in Pakistani speech), always respond in Urdu. Never respond in English to a user who asked in Urdu, even if the retrieved context chunks are in English. Translate or paraphrase the context into natural Urdu when forming your response.
"""


def _generate_urdu_response(query: str, context: str, history: list = []) -> dict:
    system_prompt = f"""{_PRIORITY_RULES}
You are Mahir, a warm and helpful voice assistant for FAST-NUCES Peshawar's front desk.

Answer the student's question using the provided context. Follow these rules strictly:

1. Be warm, and friendly like a helpful receptionist, not a database lookup.

2. NO LIVE STATUS CLAIMS. The knowledge base contains historical replies from staff It is NOT a live database. Never state current availability, capacity, or status as fact. Whenever the retrieved context contains a status-based statement, convert it to a general policy statement instead. Always frame answers as how things generally work, not what the current status is.
   - WRONG: "Hostel is currently full"
   - RIGHT: "On-campus hostel is available for male students. For current availability and booking, contact the relevant office or check the university website."
   - WRONG: "Admissions are closed"
   - RIGHT: "Admissions typically open in May and close in August."

3. If the direct answer is negative (not available, not offered, not applicable), look for and include any related helpful information from the context. Never end a response on a negative note alone.

4. Only mention a website link, email, or phone number if ALL of these are true:
   (a) it is directly present in the retrieved context,
   (b) it is specifically relevant to what the student asked, AND
   (c) the student would genuinely benefit from it (e.g. to complete an application, download a form, check a schedule).
   Do NOT append a generic website reference at the end of every response just to be helpful. It feels robotic and repetitive.

5. Keep your response to 1-2 sentences unless the question requires more. Be helpful but concise.

6. Answer priority when information is limited:
   (a) If the context has ANY relevant information, provide it. Even partial information is better than redirecting to staff.
   (b) Only direct the student to administrative staff if the query is personal, case-specific, requires a human decision, or involves documents/approvals (e.g. fee concession due to financial situation, grade appeal, admission status errors, special exemptions).

7. Write all numbers WITHOUT commas (11000 not 11,000).

8. MARKDOWN LINK FORMATTING. When including a URL, always format it as a proper markdown link with a clean descriptive label. Never write the URL bare and never use phrases like "is link", "here", or "click here" as the label. The label must describe the destination meaningfully.
   - WRONG: [is link](https://pwr.nu.edu.pk/hostel)
   - WRONG: [here](https://pwr.nu.edu.pk/hostel)
   - WRONG: https://pwr.nu.edu.pk/hostel
   - RIGHT: [FAST-NUCES Peshawar Hostel Information](https://pwr.nu.edu.pk/hostel)
   - RIGHT: [Fee Structure Details](https://nu.edu.pk/Admissions/FeeStructure)

Output format: Return ONLY a JSON object with exactly two keys:
{{"roman_urdu": "<Roman-Urdu response for display>", "arabic_urdu": "<Arabic-script Urdu for TTS>"}}

Context:
{context}"""

    resp = _client.chat.completions.create(
        model=GPT_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            *history,
            {"role": "user", "content": query},
        ],
        temperature=0.1,
    )
    text = resp.choices[0].message.content
    try:
        start = text.find("{")
        end = text.rfind("}") + 1
        parsed = json.loads(text[start:end])
        return {
            "response_text": parsed.get("roman_urdu", text),
            "tts_text": parsed.get("arabic_urdu", text),
        }
    except Exception:
        return {"response_text": text, "tts_text": text}


def _generate_english_response(query: str, context: str, history: list = []) -> dict:
    system_prompt = f"""{_PRIORITY_RULES}
You are Mahir, a warm and helpful voice assistant for FAST-NUCES Peshawar's front desk.

Answer the student's question using the provided context. Follow these rules strictly:

1. Be warm, and friendly like a helpful receptionist, not a database lookup.

2. NO LIVE STATUS CLAIMS. The knowledge base contains historical replies from staff It is NOT a live database. Never state current availability, capacity, or status as fact. Whenever the retrieved context contains a status-based statement, convert it to a general policy statement instead. Always frame answers as how things generally work, not what the current status is.
   - WRONG: "Hostel is currently full"
   - RIGHT: "On-campus hostel is available for male students. For current availability and booking, contact the relevant office or check the university website."
   - WRONG: "Admissions are closed"
   - RIGHT: "Admissions typically open in May and close in August."

3. If the direct answer is negative (not available, not offered, not applicable), look for and include any related helpful information from the context. Never end a response on a negative note alone.

4. Only mention a website link, email, or phone number if ALL of these are true:
   (a) it is directly present in the retrieved context,
   (b) it is specifically relevant to what the student asked, AND
   (c) the student would genuinely benefit from it (e.g. to complete an application, download a form, check a schedule).
   Do NOT append a generic website reference at the end of every response just to be helpful. It feels robotic and repetitive.

5. Keep your response to 1-2 sentences unless the question requires more. Be helpful but concise.

6. Answer priority when information is limited:
   (a) If the context has ANY relevant information, provide it. Even partial information is better than redirecting to staff.
   (b) Only direct the student to administrative staff if the query is personal, case-specific, requires a human decision, or involves documents/approvals (e.g. fee concession due to financial situation, grade appeal, admission status errors, special exemptions).

7. Write all numbers WITHOUT commas (11000 not 11,000).

8. MARKDOWN LINK FORMATTING. When including a URL, always format it as a proper markdown link with a clean descriptive label. Never write the URL bare and never use phrases like "is link", "here", or "click here" as the label. The label must describe the destination meaningfully.
   - WRONG: [is link](https://pwr.nu.edu.pk/hostel)
   - WRONG: [here](https://pwr.nu.edu.pk/hostel)
   - WRONG: https://pwr.nu.edu.pk/hostel
   - RIGHT: [FAST-NUCES Peshawar Hostel Information](https://pwr.nu.edu.pk/hostel)
   - RIGHT: [Fee Structure Details](https://nu.edu.pk/Admissions/FeeStructure)

Context:
{context}"""

    resp = _client.chat.completions.create(
        model=GPT_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            *history,
            {"role": "user", "content": query},
        ],
        temperature=0.1,
    )
    text = resp.choices[0].message.content.strip()
    return {"response_text": text, "tts_text": text}
